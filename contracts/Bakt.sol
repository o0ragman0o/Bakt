/*
file:   Bakt.sol
ver:    0.2.1
updated:29-March-2017
author: Darryl Morris
email:  o0ragman0o AT gmail.com

Copyright is retained by the author.  Copying or running this software is only
by express permissions.

This software is provided WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. The author
cannot be held liable for damage or loss.

Design Notes:

This contract DOES NOT offer trust to its holders. Holders instead elect a
Trustee from among the holders.

The Trustee has unilateral powers to:
    - remove funds
    - use the contract to execute code on another contract
    - set the token price
    - pay dividends
    - add holders
    - selfdestruct the contract, on condition of 0 supply and 0 ether balance

Holders have the power to:
    - vote for a preferred Trustee
    - veto a transaction
    - purchase tokens with ether at the token price.
    - redeem tokens for ether at the token price or a price proportional to
      the fund.
    - withdraw their balance of ether.
    - Cause a panic state in the contract

This contract uses integer tokens so ERC20 `decimalPlaces` is 0.

Maximum number of holders is limited to 254 to prevent potential OOG loops
during elections.
Perpetual election of the `Trustee` runs in O(254) time to discover a winner.

*/

import "https://github.com/o0ragman0o/SandalStraps/contracts/RegBase.sol";
import "https://github.com/o0ragman0o/SandalStraps/contracts/Factory.sol";

pragma solidity ^0.4.10;


contract BaktInterface
{

/* Structs */

    struct Holder {
        uint8 id;
        uint80 lastClaimed;
        address votingFor;
        uint tokenBalance;
        uint etherBalance;
        uint votes;
        mapping (address => uint) allowances;
    }
    
    struct Dividend {
        uint supply;
        uint dividend;
    }
    
    struct TX {
        bool blocked;
        uint40 timeLock;
        address from;
        address to;
        uint value;
        bytes data;
    }
    

/* Constants */

    uint8 public constant decimalPlaces = 0;
    uint constant MINGAS = 10000;
    string public constant name = "Bakt";
    string public constant symbol = "";

/* State Valiables */

    // Blows once _init() is called to prevent further changes to panic and
    // pending timeLocks
    bool public __initFuse = true;

    // A mutex used for reentry protection
    bool __reMutex;

    // The period for which a panic will prevent functionality to the contract
    uint40 PANICPERIOD;
    
    // The period for which a pending transaction must wait before being sent 
    uint40 TXDELAY;
    
    /// @return The Panic flag state. false == calm, true == panicked
    bool public panicked;
    
    /// @return The pending transaction queue head pointer
    uint8 public ptxHead;
    
    /// @return The pending transaction queue tail pointer
    uint8 public ptxTail;
    
    /// @return The `PANIC` timelock expiry date/time
    uint40 public timeToCalm;
    
    /// @return The Address of the current elected trustee
    address public trustee;

    /// @return Total count of tokens
    uint public totalSupply;
    
    /// @return The price at which to purchase tokens
    uint public tokenPrice = 1000000000000;

    /// @return The combined balance of ether committed to holder accounts, 
    /// unclaimed dividends and values in pending transactions.
    uint public committedEther;

    // `regName` A static identifier, set in the constructor and used by
    // registrars
    bytes32 public regName;

    // `resource` A informational resource. Can be a sha3 of a string to lookup
    // in a StringsMap
    bytes32 public resource;

    /// @param address The address of a holder.
    /// @return Holder data cast from struct Holder to an array
    mapping (address => Holder) public holders;
    
    /// @param uint8 The index of a holder
    /// @return An address of a holder
    address[256] public holderIndex;
    
    /// @param uint8 The index of a pending transaction
    /// @return Transaction details cast from struct TX to array
    TX[256] public pendingTxs;

    /// @param uint The index of a dividend payment
    /// @return Dividend data cast from struct Dividend to array
    Dividend[] public dividendsTable;


/* Events */

    // Triggered when contract recieved a payment
    event Deposit(address indexed sender, uint value);

    // Triggered when a ether is sent from the contract
    event Withdrawal(address indexed sender, address indexed recipient,
        uint value);

    // Triggered when a transaction is ordered
    event TransactionPending(uint indexed pTX, address indexed sender, 
        address indexed recipient, uint value, uint timeLock);

    // Triggered when a pending transaction is blocked by a holder
    event TransactionBlocked(address indexed by, uint indexed pTX);

    // Triggered when a transaction fails either by being blocked or failure of 
    // recipt
    event TransactionFailed(address indexed sender, address indexed recipient,
        uint value);

    // Triggered when the trustee pays dividends
    event DividendsPaid(uint supply, uint value);
    
    // ERC20 transfer notification
    event Transfer(address indexed from, address indexed to, uint value);
    
    // ERC20 approval notification
    event Approval(address indexed owner, address indexed spender, uint value);
        
    // Triggered on change of trustee
    event Trustee(address indexed trustee);
    
    // Trigger when a new holder is added
    event NewHolder(address indexed holder);
    
    // Triggered when a holder vacates
    event HolderVacated(address indexed holder);
    
    // Triggered when tokens are created during a funding round
    event TokensCreated(address indexed holder, uint amount);
    
    // Triggered when tokes are destroyed during a redeeming round
    event TokensDestroyed(address indexed holder, uint amount);
    
    // Triggered when a hold causes a panic
    event Panicked(address indexed by);
    
    // Triggered when a holder calms a panic
    event Calm();

//
// Bakt Functions
//

    /// @dev Accept payment to the default function
    function() payable;

    /// @notice This will set the panic and pending periods.
    /// This action is a one off and is irrevocable! 
    /// @param _panicDelayInSeconds The panic delay period in seconds
    /// @param _pendingDelayInSeconds The pending period in seconds
    function _init(uint40 _panicDelayInSeconds, uint40 _pendingDelayInSeconds)
        returns (bool);

    /// @return The balance of uncommitted ether funds.
    function fundBalance() constant returns (uint);

//
// ERC20 API functions
//

    /// @param _addr The address of a holder
    /// @return The ERC20 token balance of the holder
    function balanceOf(address _addr) constant returns (uint);

    /// @notice Transfer `_amount` of tokens to `_to`
    /// @param _to the recipient holder's address
    /// @param _amount the number of tokens to transfer
    /// @return success state
    /// @dev `_to` must be an existing holder
    function transfer(address _to, uint _amount) returns (bool);

    /// @notice Transfer `_amount` of tokens from `_from` to `_to`
    /// @param _from The holder address from which to take tokens
    /// @param _to the recipient holder's address
    /// @param _amount the number of tokens to transfer
    /// @return success state
    /// @dev `_from` and `_to` must be an existing holders
    function transferFrom(address _from, address _to, uint256 _amount)
        returns (bool);

    /// @notice Approve `_spender` to transfer `_amount` of tokens
    /// @param _spender the approved spender address. Does not have to be an
    /// existing holder.
    /// @param _amount the number of tokens to transfer
    function approve(address _spender, uint256 _amount) returns (bool);

    /// @param _owner The adddress of the holder owning tokens
    /// @param _spender The address of the account able to transfer tokens
    /// @return Amount of remaining token that the _spender can transfer
    function allowance(address _owner, address _spender) 
        constant returns (uint256);

//
// Security Functions
//

    /// @notice Cause the contract to Panic. This will block most state changing
    /// functions for a set delay.
    /// Exceptions are `vote()`, `blockPendingTx(uint _txIdx)` and `PANIC()`.
    function PANIC();

    /// @notice Release the contract from a Panic after the panic period has 
    /// expired.
    function calm();

    /// @notice Execute the first TX in the pendingTxs queue. Values will
    /// revert if the transaction is blocked or fails.
    function sendPending() returns (bool);

    /// @notice Block a pending transaction with id `_txIdx`. Pending
    /// transactions can be blocked by any holder at any time but must
    /// still be cleared from the pending transactions queue once the timelock
    /// is cleared.
    /// @param _txIdx Index of the transaction in the pending transactions
    /// table
    function blockPendingTx(uint _txIdx);

//
// Trustee functions
//

    /// @notice Send a transaction to `_to` containing `_value` with
    ///     arguments of `_data`
    /// @param _to The recipient address
    /// @param _value value of ether to send
    /// @param _data data to send with the transaction
    /// @dev Allows the trustee to initiate a transaction as the DAO. It must be
    /// followed by sendPending() after the timeLock expires.
    function execute(address _to, uint _value, bytes _data) returns (uint8);

    /// @notice Pay dividends of `_value`
    /// @param _value a value of ether upto the fund balance
    /// @dev Allows the trustee to commit a portion of `fundBalance` to dividends.
    function payDividends(uint _value) returns (bool);

    /// @notice Create new holder accounts
    /// @param _addrs And array of addresses to create accounts for.
    function addHolders(address[] _addrs) returns (bool);

//
// Holder Functions
//

    /// @return Returns the array of holder addresses.
    // function getHolders() constant returns(address[256]);

    /// @param _addr The address of a holder
    /// @return Returns the holder's withdrawable balance of ether
    function etherBalanceOf(address _addr) constant returns (uint);

    /// @notice Initiate a withdrawal of `_value`
    /// Follow up with sendPending() once the timelock has expired
    function withdraw(uint _value) returns(uint8);

    /// @notice Vacate holder `_addr`
    /// @param _addr The address of a holder with empty balances.
    function vacate(address _addr) returns (bool);

//
// Token Creation/Destruction Functions
//

    /// @notice Create tokens to the value of `msg.value` +
    /// `holder.etherBalance`
    /// @return success state
    /// @dev The amount of tokens created is:
    ///     tokens = floor((`etherBalance` + `msg.value`)/`tokenPrice`)
    ///     Any remainder of ether is credited to the holder's `etherBalance`
    function purchase() payable returns (bool);

    /// @notice Redeem `_amount` tokens back to the contract
    /// @param _amount The amount of tokens to redeem
    /// @dev ether = `_amount` * `fundBalance()` / `totalSupply`
    /// @return success state
    function redeem(uint _amount) returns (bool);

//
// Dividend Functions
//

    /// @return True if holder at `_addr` has unclaimed dividends
    /// @param _addr The holder address to check
    function hasUnclaimedDividends(address _addr) constant returns (bool);

    /// @notice Returns the total or partial value of unpaid dividends.
    /// @param owed_ the amount owed.
    /// @param at_ dividend table index upto.
    /// @return The amount owed from last claim upto an index in the dividends
    /// table
    function claimableDividends() constant returns (uint owed_, uint at_);

    /// @notice Claim dividends for `_addr`
    /// @param _addr The address of the holder to claim for
    /// @return Whether the claim is complete (May need to claim again on false)
    function updateDividendsFor(address _addr) returns (bool);

//
// Ballot functions
//

    /// @notice Vote for `_candidate` as preferred Trustee.
    /// @param _candidate The address of the preferred holder
    function vote(address _candidate) returns (bool);
}

contract Bakt is BaktInterface
{
    bytes10 constant public version = "Bakt 0.2.1";

//
// Bakt Functions
//

    // SandalStraps complant constructor
    function Bakt(address _creator, bytes32 _regName, address _trustee)
    {
        regName = _regName;
        trustee = _trustee != 0x0 ? _trustee : 
                _creator != 0x0 ? _creator : msg.sender;
        join(trustee);
    }

    // Accept payment to the default function
    function() 
        payable
    {
        require(msg.value > 0);
        Deposit(msg.sender, msg.value);
    }
    
    // Destructor
    function destroy()
        public
        canEnter
        onlyTrustee
    {
        require(totalSupply == 0 && committedEther == 0); 
        
        delete holders[trustee];
        selfdestruct(msg.sender);
    }
    
    // One Time Programable shot to set the panic and pending periods.
    // 86400 == 1 day
    function _init(uint40 _panicPeriodInSeconds,
        uint40 _pendingPeriodInSeconds)
        onlyTrustee
        returns (bool)
    {
        require(__initFuse);
        PANICPERIOD = _panicPeriodInSeconds;
        TXDELAY = _pendingPeriodInSeconds;
        delete __initFuse;
        return true;
    }

    // Returns calculated fund balance
    function fundBalance()
        public
        constant
        returns (uint)
    {
        return this.balance - committedEther;
    }

    function changeResource(bytes32 _resource)
        public
        onlyTrustee
    {
        resource = _resource;
    }

//
// ERC20 API functions
//

    // Returns holder token balance
    function balanceOf(address _addr) 
        public
        constant
        returns (uint)
    {
        return holders[_addr].tokenBalance;
    }

    // To transfer tokens
    function transfer(address _to, uint _amount)
        public
        canEnter
        isHolder(_to)
        returns (bool)
    {
        Holder from = holders[msg.sender];
        Holder to = holders[_to];

        Transfer(msg.sender, _to, _amount);
        return xfer(from, to, _amount);
    }

    // To transfer tokens by proxy
    function transferFrom(address _from, address _to, uint256 _amount)
        public
        canEnter
        isHolder(_to)
        returns (bool)
    {
        require(_amount <= holders[_from].allowances[msg.sender]);

        Holder from = holders[_from];
        Holder to = holders[_to];

        from.allowances[msg.sender] -= _amount; 
        Transfer(_from, _to, _amount);
        return xfer(from, to, _amount);
    }

    // To approve a proxy for token transfers
    function approve(address _spender, uint256 _amount)
        public
        canEnter
        returns (bool)
    {
        holders[msg.sender].allowances[_spender] = _amount;
        Approval(msg.sender, _spender, _amount);
        return true;
    }

    // Return the alloance of a proxy
    function allowance(address _owner, address _spender)
        constant
        returns (uint256)
    {
        return holders[_owner].allowances[_spender];
    }
    
    // Processes token transfers and subsequent change in voting power
    function xfer(Holder storage _from, Holder storage _to, uint _amount)
        internal
        returns (bool)
    {
        uint __check;
        // Ensure holders dividends are up to date
        require(_from.lastClaimed == dividendsTable.length);
        require(_to.lastClaimed == dividendsTable.length);

        // Remove existing votes
        revoke(_from);
        revoke(_to);

        // Transfer tokens
        __check = _from.tokenBalance;
            _from.tokenBalance -= _amount;
        assert(_from.tokenBalance < __check);
        
        __check = _to.tokenBalance;
            _to.tokenBalance += _amount;
        assert(_to.tokenBalance > __check);

        // Revote accoring to changed token balances
        revote(_from);
        revote(_to);

        // Force election
        election();
        return true;
    }

//
// Security Functions
//

    // Cause the contract to Panic. This will block most state changing
    // functions for a set delay.
    function PANIC()
        public
        isHolder(msg.sender)
    {
        panicked = true;
        timeToCalm = uint40(now + PANICPERIOD);
        Panicked(msg.sender);
    }
    
    // Release the contract from a Panic after the panic period has expired.
    function calm()
        public
        isHolder(msg.sender)
    {
        require(uint40(now) > timeToCalm && panicked);
        
        panicked = false;
        Calm();
    }

    // Queues a pending transaction 
    function timeLockSend(address _from, address _to, uint _value, bytes _data)
        internal
        returns (uint8)
    {
        // Check that queue is not full
        require(ptxHead + 1 != ptxTail);

        TX memory tx = TX({
            from: _from,
            to: _to,
            value: _value,
            data: _data,
            blocked: false,
            timeLock: uint40(now + TXDELAY)
        });
        TransactionPending(ptxHead, _from, _to, _value, now + TXDELAY);
        pendingTxs[ptxHead++] = tx;
        return  ptxHead - 1;
    }

    // Execute the first TX in the pendingTxs queue. Values will
    // revert if the transaction is blocked or fails.
    function sendPending()
        public
        preventReentry
        isHolder(msg.sender)
        returns (bool)
    {
        uint __check;
        if (ptxTail == ptxHead) return;
        
        TX memory tx = pendingTxs[ptxTail];
        
        if(now < tx.timeLock) return;
        delete pendingTxs[ptxTail++];
        
        if(!tx.blocked) {
            if(tx.to.call.value(tx.value)(tx.data)) {
                __check = committedEther;
                    committedEther -= tx.value;
                assert(committedEther < __check);
                
                Withdrawal(tx.from, tx.to, tx.value);
                return true;
            }
        }
        // Blocked or failed so revert balances
        if (tx.from == address(this)) {
            // Was sent from contract balance;
            __check = committedEther;
                committedEther -= tx.value;
            assert(committedEther < __check);
        } else {
            // Was sent from holder ether balance
            __check = holders[tx.from].etherBalance;
                holders[tx.from].etherBalance += tx.value;
            assert(holders[tx.from].etherBalance > __check);
        }

        TransactionFailed(tx.from, tx.to, tx.value);
    }

    // To block a pending transaction
    function blockPendingTx(uint _txIdx)
        public
        isHolder(msg.sender)
    {
        // Only prevent reentry not entry during panic
        require(!__reMutex);
        
        pendingTxs[_txIdx].blocked = true;
        TransactionBlocked(msg.sender, _txIdx);
    }
    
//
// Trustee functions
//

    // For the trustee to send a transaction as the contract
    function execute(address _to, uint _value, bytes _data)
        public
        canEnter
        onlyTrustee
        returns (uint8)
    {
        uint __check;
        require(_value <= fundBalance());

        __check= committedEther;
            committedEther += _value;
        assert(committedEther >= __check && committedEther <= this.balance);
        
        return timeLockSend(address(this), _to, _value, _data);
    }

    // For the trustee to pay an amount of the fund balance to dividends
    function payDividends(uint _value)
        public
        canEnter
        onlyTrustee
        returns (bool)
    {
        require(_value <= fundBalance());

        logDividends(_value);
        DividendsPaid(totalSupply, _value);
        return true;
    }

    function setTokenPrice(uint _tokenPrice)
        public
        canEnter
        onlyTrustee
        returns (bool)
    {
        require(_tokenPrice >= tokenPrice);
        tokenPrice = _tokenPrice;
        return true;
    }
    
    // To add holders to the contract
    function addHolders(address[] _addrs)
        public
        canEnter
        onlyTrustee
        returns (bool)
    {
        require(!__initFuse);
        // limit the number of additions to 20 to prevent OOG
        require(_addrs.length < 21);
        
        for (uint i = 0; i < _addrs.length; i++) join(_addrs[i]);
        return true;
    }

    // Creates holder accounts.  Called by addHolders()
    function join(address _addr)
        internal
    {
        // return not throw on invalid join so as not to break `addholders` loop
        if (0 != holders[_addr].id || _addr == address(this)) return;

        uint8 id;
        // Search for the first available slot. 
        while (holderIndex[++id] != 0) {}

        // if `id` is 0 then there has been a array full overflow.
        if(id == 0) revert();

        holders[_addr] = Holder ({
            id : id,
            lastClaimed : uint80(dividendsTable.length),
            votingFor : trustee,
            tokenBalance : 0,
            etherBalance : 0,
            votes : 0
        });
        holderIndex[holders[_addr].id] = _addr;
        NewHolder(_addr);
    }

//
// Holder Functions
//

    // Returns the array of holder addresses.
    function getHolders()
        public
        constant
        returns(address[256])
    {
        return holderIndex;
    }

    // Returns the holder's withdrawable balance of ether
    function etherBalanceOf(address _addr) 
        public
        constant
        returns (uint)
    {
        return holders[_addr].etherBalance;
    }

    // For a holder to initiate a withdrawal from theit ether balance
    function withdraw(uint _value)
        public
        canEnter
        returns(uint8 pTxId_)
    {
        uint __check;
        Holder holder = holders[msg.sender];
        // no unclaimed dividends
        require(holder.lastClaimed == dividendsTable.length);
        // has sufficient ether balance
        require(holder.etherBalance >= _value);
        
        __check = holder.etherBalance;
          holder.etherBalance -= _value;
        assert(holder.etherBalance < __check);
        
        pTxId_ = timeLockSend(msg.sender, msg.sender, _value, "");
    }

    // To close a holder account
    function vacate(address _addr)
        public
        canEnter
        isHolder(msg.sender)
        isHolder(_addr)
        returns (bool)
    {
        Holder holder = holders[_addr];
        // Ensure holder account is empty, not the trustee an no pending
        // transactions or dividends
        require(_addr != trustee);
        require(holder.tokenBalance == 0);
        require(holder.etherBalance == 0);
        require(holder.lastClaimed == dividendsTable.length);
        require(ptxHead == ptxTail);

        delete holderIndex[holder.id];
        delete holders[_addr];
        // NB can't garbage collect holder.allowances mapping
        return (true);
    }
    
//
// Token Creation/Destruction Functions
//

    // For holders to create tokens during a funding round
    function purchase()
        payable
        canEnter
        isHolder(msg.sender)
        returns (bool)
    {
        uint __check;
        Holder holder = holders[msg.sender];
        // no unclaimed dividends
        require(holder.lastClaimed == dividendsTable.length);
        
        revoke(holder);

        uint value = holder.etherBalance + msg.value;        
        uint tokens = value / tokenPrice;
        uint refund = value - tokens * tokenPrice;

        __check = holder.tokenBalance;
            holder.tokenBalance += tokens;
        assert(holder.tokenBalance > __check);
    
        committedEther = (committedEther - holder.etherBalance) + refund;
        assert(committedEther <= this.balance);
        
        holder.etherBalance = refund;
        
        __check = totalSupply;
            totalSupply += tokens;
        assert(totalSupply > __check);
        logDividends(0);

        TokensCreated(msg.sender, tokens);
        revote(holder);
        election();
        return true;
    }

    // For holders to destroy tokens in return for ether during a redeeming
    // round
    function redeem(uint _amount)
        public
        canEnter
        isHolder(msg.sender)
        returns (bool)
    {
        uint __check;
        uint price;
        uint eth;
        
        Holder holder = holders[msg.sender];
        // no unclaimed dividends
        require(holder.lastClaimed == dividendsTable.length);
        require(_amount <= holder.tokenBalance);

        revoke(holder);

        price = fundBalance() / totalSupply;
        // prevent redeeming above token price which would allow a recyclic 
        // arbitrage attack (buy back in at a lower price and redeem again)
        price = price < tokenPrice ? price : tokenPrice;
        require(price > 0);
        eth = _amount * price;
        
        // uint eth = _amount * fundBalance() / totalSupply;
        
        __check = totalSupply;
            totalSupply -= _amount;
        assert(totalSupply < __check);
        
        __check = holder.tokenBalance;
            holder.tokenBalance -= _amount;
        assert(holder.tokenBalance < __check);

        __check = holder.etherBalance;
            holder.etherBalance += eth;
        assert(holder.etherBalance > __check);
        
        __check = committedEther;
            committedEther += eth;
        assert(committedEther > __check);
        logDividends(0);
        
        TokensDestroyed(msg.sender, _amount);
        revote(holder);
        election();
        return true;
    }

//
// Dividend Functions
//

    // Return whether a holder has unclaimed dividends
    function hasUnclaimedDividends(address _addr)
        public
        constant
        returns (bool)
    {
        return holders[_addr].lastClaimed != dividendsTable.length;
    }
    
    // Return the value of the callers unclaimed dividends
    function claimableDividends()
        public
        constant
        returns (uint owed_, uint at_)
    {
        return dividendsOwing(holders[msg.sender]);
    }
    
    // To claim dividends for a holder
    function updateDividendsFor(address _addr)
        public
        canEnter
        isHolder(_addr)
        returns (bool)
    {
        return claimDividends(holders[_addr]);
    }
    
    // Awards the holder any outstanding value of paid dividends since their
    // last claim.  It must be called before any change to their token balance
    // Returns false on incomplete claim (see `dividendsOwing`)
    function claimDividends(Holder storage _holder) 
        internal
        returns (bool)
    {
        uint __check;
        uint owed;
        uint upto;
        (owed, upto) = dividendsOwing(_holder);

        _holder.lastClaimed = uint80(upto);
        
        __check = _holder.etherBalance;
            _holder.etherBalance += owed;
        assert(_holder.etherBalance >= __check);
        return dividendsTable.length == upto;
    }

    // Calculates the value of dividends owed to the holder since their last 
    // claim.  There is an OOG potential for calculating and claiming dividends
    // so the function will exit gracefully on low gas and return only the
    // partial tally of dividends. 
    function dividendsOwing(Holder _holder)
        internal
        constant
        returns (uint owed_, uint at_)
    {
        uint upto = dividendsTable.length;
        uint tokens = _holder.tokenBalance;
        at_ = _holder.lastClaimed;

        while (at_ < upto && msg.gas > MINGAS) {
            if (0 != dividendsTable[at_].supply)
                owed_ += (dividendsTable[at_].dividend * tokens) / 
                    dividendsTable[at_].supply;
            at_++;
        }
        return;
    }

    // Creates a new entry in dividends table.
    // A dividend entry records the current totalSupply and a dividend amount.
    // The dividends table is updated after every change in totalSupply or
    // dividend payment.
    function logDividends(uint _value)
        internal
    {
        uint __check;
        if(_value > 0) require(totalSupply > 0);

        dividendsTable.push(Dividend({dividend: _value, supply: totalSupply}));
        
        __check = committedEther;
            committedEther += _value;
        assert(committedEther >= __check && committedEther <= this.balance);
    }
    
//
// Ballot functions
//

    // To vote for a preferred Trustee.
    function vote(address _candidate)
        public
        isHolder(msg.sender)
        isHolder(_candidate)
        returns (bool)
    {
        // Only prevent reentry not entry during panic
        require(!__reMutex);
        
        Holder holder = holders[msg.sender];
        revoke(holder);
        holder.votingFor = _candidate;
        revote(holder);
        election();
        return true;
    }
    
    // Loops through holders to find the holder with most votes and declares
    // them to be the Executive;
    function election()
        internal
        returns(bool)
    {
        uint max;
        uint winner;
        uint8 i;
        address addr;

        if (0 == totalSupply) return;
        
        while(++i != 0)
        {
            addr = holderIndex[i];
            if (addr != 0x0 && holders[addr].votes > max) {
                max = holders[addr].votes;
                winner = i;
            }
        }
        trustee = holderIndex[winner];
        Trustee(trustee);
    }

    // Pulls votes from the preferred candidate
    // required before any adjustments to `tokenBalance` or vote preference.
    function revoke(Holder _holder)
        internal
    {
        holders[_holder.votingFor].votes -= _holder.tokenBalance;
    }
    
    // Places votes with preferred candidate
    // required after any adjustments to `tokenBalance` or vote preference.
    function revote(Holder _holder)
        internal
    {
        holders[_holder.votingFor].votes += _holder.tokenBalance;
    }
    
//
// Modifiers
//

    // Blocks if reentry mutex or panicked is true or sets rentry mutex to true
    modifier preventReentry() {
        require(!(__reMutex || panicked || __initFuse));
        __reMutex = true;
        _;
        __reMutex = false;
        return;
    }

    // Blocks if reentry mutex or panicked is true
    modifier canEnter() {
        require(!(__reMutex || panicked || __initFuse));
        _;
    }
        
    // Blocks if '_addr' is not a holder
    modifier isHolder(address _addr) {
        require(0 != holders[_addr].id);
        _;
    }

    // Block non-trustee holders
    modifier onlyTrustee() {
        require(msg.sender == trustee);
        _;
    }
} 


// SandalStraps compliant factory for Bakt
contract BaktFactory is Factory
{
    
/* Constants */

    bytes32 constant public regName = "Bakts";
    bytes32 constant public VERSION = "Bakt_Factory v0.2.1";
    

/* Constructor Destructor*/

    function BaktFactory(address _creator, bytes32 _regName, address _owner)
        Factory(_creator, _regName, _owner)
    {
        // nothing to contruct
    }

/* Public Functions */


    function createNew(bytes32 _regName, address _owner)
        payable
        feePaid
    {
        last = new Bakt(owner, _regName, msg.sender);
        Created(msg.sender, _regName, last);
    }
}