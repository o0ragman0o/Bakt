# BAKT
## Exclusive Share Holder Fund Contract

**Bakt** is a *payable* and *dividends paying* Ethereum contract in which token holders elect a single holder as *Trustee* to manage the fund.  It may be suitable for private investor groups of up to 255 members who have *pre-established trust arrangements*.

## Bakt:
* Holds a fund of *Ether*
* Can accept payments to its default function
* Maintains a balance of committed and uncommitted *ether*
* Records *Holders'* proportional investments in the form of transferable ERC20 *tokens*
* Allows *token* transfer only to another registered *Holder*
* Records *Holders'* balance of *ether*
* Creates new *tokens* upon a *Holder purchasing* with *ether*
* Destroys token upon a *Holder redeeming* tokens for *ether* proportional to their share of the fund upto the *token price*
* Allows continuous *Purchasing* and *Redeeming*
* Allows *Holders* to *vote* for a *Trustee* in proportion to their holdings.
* Allows the *Trustee* to add new holders
* Allows the *Trustee* to pay dividends to the *Holder* 
* Allows the *Trustee* to unilaterally order the withdrawal of uncommitted funds.
* Allows *Holders* to order the withdrawal of their balance of *ether*
* Prevents *pending transactions* from being sent for 1 day
* Allows any holder to *block* a *pending transaction*
* Allows any holder to execute a transaction past its pending timestamp
* Allows any holder to cause a **panic**
* Prevents all actions during a panic except for *voting*, *blocking*, receiving payments and *calming*.
* Allows any holder to *calm* after an elapsed period of two(2) days after a *panic*.

## Architecture
### Governance Model
The primary requirement of this contract is to provide a perpetual and liquid mechanism to elect a trustee of the fund.  Given that a vote count must be conducted across the entire membership of holders in O(N) time after every change to a single holder's preference or balance of tokens, a necessary bounding limit upon holder numbers is required to prevent Out Of Gas errors.  This has been set at 255 and so forces the election loop to O(255) time regardless of the actual number of Holders registered.

This limit impacts upon the freedom to transfer tokens and limits the recipients of such transfers to registered holder only.  It is this behaviour which limits the usage to private organisations with limited numbers.

Holders are explicitly added to the contract by the Trustee and a new holder's voting preference defaults to the current Trustee until they explicitly change it by calling `vote()`.

### Token Model
The token model used is a variable supply in which tokens are created upon `purchase()` and destroyed upon `redeem()` (I have avoided the terms `buy` and `sell` which I use to indicate in other contracts the invariable supply *trading* of tokens).  This allows a holder to invest and divest whenever they wish.

A `purchase()` creates tokens to the value of:
```
tokenPrice * (msg.value + etherBalanceOf(msg.sender))
```
with any fractional remainder of token price being deposited in the holders `etherBalance`.

A `redeem(amount)` destroys the `amount` of tokens and commits a value of ether to the holder's `etherBalance` being the lesser of:
```
fundBalance * balanceOf(holder) / totalSupply
or
amount * tokenPrice
```
### Fund Model
The contract manages its balance of ether in a number of sub-balances which it tracks through a the metric `committedEther` which is subtracted from the contract balance to derive `fundBalance()`:
```
fundBalance = this.balance - committedEther;
```
The Trustee has full use of the `fundBalance` and may order it's withdrawal at any time or commit an amount of it to dividends.

`committedEther` is the total ether held in all holder `etherBalance`'s, pending transactions and unclaimed dividends.
```
committedEther = etherBalances[1..255] + unclaimed dividends + pending transactions
``` 
A holder can order the withdrawal of their `etherBalance` at any time.

### Security Model
Given the potential for the trustee to unilaterally steal the `fundBalance`, a time delay of 1 day has been set for `withdraw()` (by holders) and `execute()` (by the trustee).  During this period, any holder can inspect the transaction and unilaterally block it.

A followup call to `sendPending()` will execute the oldest transaction in the pending queue if its time lock has expired or revert the transaction if it was blocked.

An additional `PANIC()` mechanism can be enacted to block most state mutating functions of the contract for two(2) days with the exception of `vote()` `block()` and `PANIC()`. This should only be called if there is serious behavioural problems with the contract or the trustee.  Its intent is to allow time for the holders to be notified and vote for a different trustee.
 
## Deployment

Deployment is by way of calling the `createNew()` function of the pre-deployed Bakt factory contracts with the required fee `fee()` at addresses:
Live: 
Ropsten:
(NB, Ropsten contract has 1 minute delay for pending transactions and 2 minute delay for panic)
	 
The address of the new Bakt contract is accessed from the Event log or by calling the function `last()` of the factory contract.

## Setup
The Bakt contract can be operated from an Ethereum wallet such as *Parity* or *Mist* by selecting 
`Watch Contracts`
 and filling in the details and ABI.

In a freshly created contract, the address of the creating account is the *Trustee* and can add new holders with a call to `addHolders([array of up to 20 addresses])`


## Bakt Functions
### *Constructor*
```
function Bakt(address _creator, bytes32 _regName, address _trustee)
```
A SandalStraps compliant constructor
`_creator` The address of the creating contract or account (used by a SandalStraps factory)
`_regName` A unique name in the scope of a SandalStraps registrar
`_trustee` The address of the initial holder (will be msg.sender if blank) 
### *default*
```
function() payable;
```
Accepts payment to the default function

### destroy
```
function destroy();
```
Destroy the contract and transfer remaining ether to the trustee address on the conditions that:

* all tokens have been destroyed
* committed ether is 0
### fundBalance
```
function fundBalance() constant returns (uint);
```
Returns the balance of uncommitted ether funds.
### commitedEther
```
function committedEther();
```
Returns the combined balance of ether committed to holder accounts, unclaimed dividends and values in pending transactions.
### trustee
```
function trustee()
```
Returns the address of the currently elected trustee
### tokenPrice
```
function tokenPrice();
```
Returns the ether price at which to buy tokens
### regName
```
function regName()
```
A unique name within the scope of a SandalStraps Registrar
### holders
```
function holders(address);
```
Returns Holder data cast from struct Holder to an array
`address` The address of a holder.
### holderIndex
```
function holderIndex(uint);
```
Returns an address of a holder at an index from 1 to 255
`uint8` The index of a holder
### pendingTxs
```
function pendingTxs(uint);
```
Returns transaction details cast from struct TX to array
`uint8` The index of a pending transaction
### ptxHead
```
function ptxHead();
```
Return the pending transaction index of the youngest pending transaction
### ptxTail
```
function ptxTail();
```
Returns the pending transaction index of the oldest pending transaction
### ERC20 Functions

### totalSupply    
```
function totalSupply();
```
Return total count of tokens
### balanceOf
```
function balanceOf(address _addr) constant returns (uint);
```
Returns the ERC20 token balance of the holder
`_addr` The address of a holder
### transfer
Transfers an amount of tokens from one registered holder to another
```
function transfer(address _to, uint _amount) returns (bool);
```
`_to` the address of a Holder to transfer token to
`_amount` Amount of tokens to transfer

### transferFrom
```
function transferFrom(address _from, address _to, uint256 _amount) returns (bool);
```
Transfers tokens from one registered holder to another by an allowed third-party 
`_from` The addres of a holder from which to transfer
`_to` The address of a holder to transfer to
`_amount` The amount of tokens to transfer
### approve
```
function approve(address _spender, uint256 _amount) returns (bool);
```
Approves a third-party account to transfer an amount of tokens on behalf of the Holder
`_spender` The address of the approved third-party (not restricted to registered holders)
`_amount` The amount which is allowed to be transfered
### allowance
```
function allowance(address _owner, address _spender) constant returns (uint256);
```
Returns the amount of remaining tokens that an approved thrid-party can send
`_owner` The adddress of the holder owning tokens
`_spender` The address of the account approved to transfer tokens
## Security Functions
### PANIC
```
function PANIC();
```
Allows a Holder to cause the contract to Panic. This will block most state changing functions for a delay of 2 days. Exceptions are `vote()`, `blockPendingTx(uint _txIdx)` and `PANIC()`
### calm
```
function calm();
```
Allows a Holder to release the contract from a Panicked state after the panic period has expired.
### panicked
```
function panicked();
```
Returns the Panic flag state. false == calm, true == panicked
### timeToCalm    
```
function timeToCalm();
```
Returns the time-stamp after which a Panic can be released by `calm()`
### sendPending
```
function sendPending() returns (bool);
```
Execute the first transaction in the pendingTxs queue after it's pending time lock has expired.  The transaction will be reverted if it has been blocked or fails.
### blockPending
```
function blockPendingTx(uint _txIdx);
```
Block a pending transaction with the given index.  Transactions can be blocked by any holder at any time but must still be cleared from the pending transactions queue once the time lock has expired.
`_txIdx`  _txIdx Index of the transaction in the pending transactions table.
## Holder Functions
### vote
```
function vote(address _candidate) returns (bool);
```
Allows a Holder to vote for a preferred Trustee
`_candidate` The address of the preferred holder
### etherBalanceOf
```
function etherBalanceOf(address _addr) constant returns (uint);
```
Returns a holder's withdrawable balance of ether
`_addr` The address of a holder
### withdraw
```
function withdraw(uint _value) returns(uint8);
```
Initiate a withdrawal from the Holder's account. It must be followed up with `sendPending()` once the time lock has expired.
`_value` The value of ether to withdraw
### purchase
```
function purchase() payable returns (bool);
```
Create tokens to the value of `floor((msg.value + holder.etherBalance)/tokenPrice)` Any remainder of ether is credited to the holder's `etherBalance`
### redeem
```
function redeem(uint _amount) returns (bool);
```
Destructively redeems token for their ether value being the lesser of `_amount * fundBalance()/totalSupply` or `_amount / tokenPrice()`
`_amount` The amount of tokens to redeem
### vacate
```
function vacate(address _addr) returns (bool);
```
To vacate and deregister a Holder on the conditions that:

* their token balance is 0
* their ether balance is 0
* there are no pending transactions
* the account is up to date with the dividends table

`_addr` The address of a holder to vacate.
### hasUnclaimedDividends
```
function hasUnclaimedDividends(address _addr) constant returns (bool);
```
Returns True if the holder account is out of synchronisation with the dividends table. 
`_addr` The holder address to check
### claimableDividends
```
function claimableDividends() constant returns (uint owed_, uint at_);
```
Returns the total or partial value of unpaid dividends. The dividends table is updated every time a dividend is paid, and also upon a holder purchasing or redeeming tokens (which will only update the total supply entry of the table).
`owed_` the amount owed.
`at_` dividend table index calculated upto (may not be the most recent entry).
### updateDividendsFor
```
function updateDividendsFor(address _addr) returns (bool);
```
To synchronise a Holder account with the dividends table.  This is required before any manipulations to token balances such as `purchase()` `redeem()` `transfer()` and `transferFrom()`.  If the account has not been updated for some time then this function may need to be called repeatedly until it is fully synchronised again
`_addr` The address of a holder to update
## Trustee Functions
### execute
```
function execute(address _to, uint _value, bytes _data) returns (uint8);
```
Allows the trustee to unilaterally order a transaction *as the contract* and potentially withdraw the entire `fundBalance()`.  Such transactions are held in the pending transactions queue for a period of 1 day during which they may be blocked by any holder.
`_to` The recipient address
`_value` value of ether to send upto a maximum of `fundBalance()`
`_data` the call data to be sent with the transaction.
### payDividends
```
function payDividends(uint _value) returns (bool);
```
Allows the Trustee to commit an amount of ether from `fundBalance()` to be collected by the holders in proportion to their token holdings.
`_value` An amount of ether to be distributed to holders
### addHolders
```
function addHolders(address[] _addrs) returns (bool);
```
Allows the Trustee to register new holder accounts by providing an array of addresses
`_addrs` and array of upto 20 addresses
## Events 
```
Deposit(sender, value);
```
Triggered when contract recieved a payment
```
Withdrawal(sender, recipient, value);
```
Triggered when a ether is sent from the contract
```
TransactionPending(pTX, sender, recipient, value, timeLock);
```
Triggered when a transaction is ordered
```
TransactionBlocked(by, pTX);
```
Triggered when a pending transaction is blocked by a holder
```
TransactionFailed(sender, recipient, value);
```
Triggered when a transaction fails either by being blocked or failure of receipt
```
DividendsPaid(supply, value);
```
Triggered when the trustee pays dividends
```
Transfer(from, to, value);
```
ERC20 transfer notification
```
Approval(owner,  spender, value);
```
ERC20 approval notification
```
Trustee(trustee);
```
Triggered on change of trustee
```
NewHolder(holder);
```
Trigger when a new holder is added
```
HolderVacated(holder);
```
Triggered when a holder vacates
```
TokensCreated(holder, amount);
```
Triggered when tokens are created during a funding round
```
TokensDestroyed(holder, amount);
```
Triggered when tokes are destroyed during a redeeming round
```
Panicked(by);
```
Triggered when a hold causes a panic
```
Calm();
```
Triggered when a holder calms a panic

