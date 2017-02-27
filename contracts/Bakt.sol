/*
file:   BaktDAO.sol
ver:    0.0.1
updated:27-Feb-2017
author: Darryl Morris
email:  o0ragman0o AT gmail.com

Copyright is retained by the author.  Copying or running this software is only
by express permissions.

This software is written and tested in accordance to a specification. But it is
provided WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. The author cannot be held
liable for damage or loss.
*/

pragma solidity ^0.4.0;

contract BaktInterface
{

/* Structs */
    struct Holder {
        uint holderId;
        uint tokenBalance;
        uint dividendsBalance;
        uint votes;
        address votingFor;
        uint lastClaimIdx;
        mapping (address => uint) allowances;
    }
    
    struct Dividends {
        uint supply;
        uint dividends;
    }
    

/* Constants */
    bytes32 public constant VERSION = "Bakt v0.0.1";

    string public constant name = "Bakt";
    string public constant symbol = "BKT";
    uint8 public constant decimalPlaces = 0;
    uint public constant MAXHOLDERS = 1000;

/* State Valiables */
    uint public totalSupply;
    uint public tokenPrice;
    uint public dividendsBalance;
    uint public dividendsToDate;
    address public executive;
    bool public acceptingPayments;
    bool public funding;
    bool mutex;

    mapping (address => Holder) public holders;
    address[] holderIds;
    
    // Holds history of changes to token supply and dividend payments from which
    // dividend claims are calculated
    Dividends[] public dividendsTable;


/* Events */

    event AcceptingPayments(bool acceptingPayments);
    event Deposit(address indexed sender, uint amount);
    event Withdrawal(address indexed recipient, uint amount);
    event DividendsPaid(uint _amount);
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, 
            uint256 _value);
}

contract Bakt is BaktInterface
{
    string constant public VERSION = "Bakt 0.0.1";

    modifier preventReentry() {
        if (mutex) throw;
        else mutex = true;
        _;
        delete mutex;
        return;
    }

    // Blocks if mutex is set
    modifier canEnter() {
        if (mutex) throw;
        _;
    }
    
    modifier isFunding {
        if (!funding) throw;
        _;
    }
    
    modifier notFunding {
        if (funding) throw;
        _;
    }

    modifier fundsAvailable(uint _amount) {
        if(_amount > fundBalance()) throw;
        _;
    }
    
    modifier isAvailable(uint _amount) {
        if (_amount > holders[msg.sender].tokenBalance) throw;
        _;
    }

    modifier isAllowed(address _from, uint _amount) {
        if (_amount > holders[_from].allowances[msg.sender] ||
           _amount > holders[_from].tokenBalance) throw;
        _;        
    }
    
    modifier onlyHolders() {
        if (holders[msg.sender].holderId != 0) throw;
        _;
    }

    modifier isHolder(address _addr) {
        if (holders[_addr].holderId != 0) throw;
        _;
    }

    modifier onlyExecutive() {
        if (msg.sender != executive) throw;
        _;
    }

//
// Bakt Functions
//
    function Bakt()
    {
        holderIds.push(0);
        join();
        executive = msg.sender;
    }

    function() 
        payable
    {
        if (msg.value > 0) Deposit(msg.sender, msg.value);
    }
    
    function startFunding(uint _tokenPrice)
        public
        notFunding
        onlyExecutive
    {
        // price of new funding rounds must be >= last round
        if (_tokenPrice < tokenPrice) throw;
        funding = true;
        tokenPrice = _tokenPrice;
    }
    
    function stopFunding()
        public
        onlyExecutive
    {
        funding = false;
        winner();
    }
    
    function buyToken()
        payable
        isFunding
    {
        Holder holder = holders[msg.sender];
        if(holder.holderId == 0) join();
        uint tokens = 10**decimalPlaces * msg.value / tokenPrice;
        uint refund = msg.value - tokens * tokenPrice; // calc rounding error
        holder.tokenBalance += tokens;
        totalSupply += tokens;
        revote(holder);
        // refund rounding error
        if(!msg.sender.call.value(refund)()) throw;
    }
    
    function join()
        internal
    {
        if (holderIds.length >= MAXHOLDERS) throw;
        Holder memory holder;
        holder.lastClaimIdx = dividendsTable.length;
        holder.holderId = holderIds.push(msg.sender);
        holder.votingFor = msg.sender;
        holders[msg.sender] = holder;
    }

    function fundBalance()
        public
        constant
        returns (uint)
    {
        return this.balance - dividendsBalance;
    }
    
//
// ERC20 API functions
//

    function balanceOf(address _addr) 
        public
        constant
        returns (uint)
    {
        return holders[_addr].tokenBalance;
    }

    function transfer(address _to, uint _value)
        public
        canEnter
        isAvailable(_value)
    {
        Holder from = holders[msg.sender];
        Holder to = holders[_to];
        
        claimDividends(msg.sender);
        claimDividends(_to);

        revoke(from);
        revoke(to);

        from.tokenBalance -= _value;
        to.tokenBalance += _value;
        
        revote(from);
        revote(to);

        Transfer(msg.sender, _to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value)
        external
        canEnter
        isAllowed(_from, _value)
    {
        Holder from = holders[msg.sender];
        Holder to = holders[_to];

        claimDividends(_from);
        claimDividends(_to);
        
        from.tokenBalance -= _value;
        to.tokenBalance += _value;
        from.allowances[msg.sender] -= _value; 

        Transfer(msg.sender, _to, _value);
    }

    function approve(address _spender, uint256 _value)
        external
        canEnter
        isAvailable(_value)
    {
        holders[msg.sender].allowances[_spender] = _value;
        Approval(msg.sender, _spender, _value);
    }

//
// Executive functions
//

    address public executive;
    
    // function acceptPayments(bool _accepting)
    //     external
    //     onlyExecutive
    //     canEnter
    // {
    //     acceptingPayments = _accepting;
    //     AcceptingPayments(acceptingPayments);
    // }

    function sendTo(address _recipient, uint _amount, bytes _data)
        external
        onlyExecutive
        fundsAvailable(_amount)
        preventReentry
    {
        if(!_recipient.call.value(_amount)(_data)) throw;
        Withdrawal(_recipient, _amount);
    }

    function payDividends(uint _amount)
        external
        canEnter
        onlyExecutive
        notFunding
        fundsAvailable(_amount)
    {
        Dividends memory divSlot;
        divSlot.dividends = _amount;
        divSlot.supply = totalSupply;
        
        dividendsTable.push(divSlot);  // Save to history
        dividendsBalance += _amount;
        dividendsToDate += _amount;
        DividendsPaid(_amount);
    }

//
// Dividends Processing functions
//

    function dividendsBalanceOf(address _addr) 
        public
        constant
        returns (uint)
    {
        Holder holder = holders[_addr];
        return holder.dividendsBalance + claimableDividends(_addr);
    }

    function claimableDividends(address _addr)
        internal
        constant
        returns (uint)
    {
        uint owed;
        uint share;
        Holder holder = holders[_addr];
        if (dividendsTable.length == holder.lastClaimIdx) return 0;
        Dividends divSlot = dividendsTable[holder.lastClaimIdx];

        for (uint i = holder.lastClaimIdx; i < dividendsTable.length; i++) {
            divSlot = dividendsTable[i];
            share += (divSlot.dividends * holder.tokenBalance) /
                divSlot.supply;
        }
        
        return share;
    }
        
    function claimDividends(address _addr) 
        internal
    {
        Holder holder = holders[_addr];
        uint divBal = claimableDividends(_addr);
        if (divBal > 0) {
            holder.lastClaimIdx = dividendsTable.length;
            holder.dividendsBalance += divBal;
        }
    }

    function withdrawDividends(uint _ether)
        external
        preventReentry
    {
        Holder holder = holders[msg.sender];
        claimDividends(msg.sender);
        if (holder.dividendsBalance < _ether) throw;
        
        holder.dividendsBalance -= _ether;
        if(!msg.sender.call.value(_ether)()) throw;
    }

//
// Ballot State and Functions
//

    function vote(address _candidate)
        public
        notFunding
        canEnter
        onlyHolders
        isHolder(_candidate)
    {
        if(holders[_candidate].holderId == 0) throw;
        Holder holder = holders[msg.sender];
        revoke(holder);
        holder.votingFor = _candidate;
        revote(holder);
        winner();
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
    
    function winner()
        internal
    {
        uint max = 0;
        address winner;
        for(uint i = 1; i < holderIds.length; i ++)
        {
            if (holders[holderIds[i]].votes > max) {
                max = holders[holderIds[i]].votes;
                winner = holderIds[i];
            }
        }
        if (holders[winner].holderId != 0) executive = winner;
    }
} 