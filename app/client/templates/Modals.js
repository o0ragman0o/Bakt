import "./Modals.html";

Template.ChangeHolder.helpers ({
	accounts: function () {
		return EthAccounts.findAll().fetch();
	}
})

Template.ChangeHolder.events ({
	'click button' (event, template) {
		console.log(event);
	}
})

Template.PayInto.helpers({
	etherBalance: function () {
		return web3.eth.getBalance(holderAddr.get());
	}
})

Template.PayInto.events({
	'submit form' (event, template) {
		event.preventDefault();
		var value = new BigNumber(event.target.children.ethValue.value * 10**18);
		web3.eth.sendTransaction({to:baktAddr, value: value, from:holderAddr.get()}, modalcb);
	}
})

Template.Withdraw.helpers({
	etherBalance: function () {
		return baktDict.holder.get().etherBalance.toNumber();
	}
})

Template.Withdraw.events({
	'submit form' (event, tempate) {
		event.preventDefault();
		var value = new BigNumber(event.target.children.withdraw.value * 10**18);
		currentBakt.withdraw(value, {from:holderAddr.get(), gas:300000}, modalcb);
	}
})

Template.Transfer.helpers({
	tokenBalance: function () {
		return baktDict.holder.get().tokenBalance;
	}
})

Template.Transfer.events({
	'submit form' (event, template) {
		event.preventDefault();
		var amount = event.target.children.amount.value;
		var to = event.target.children[1].children[0].value;
		var batch = web3.createBatch();
		// currentBakt.claimDividendsFor(holderAddr.get(),{from:holderAddr.get(), gas:300000});
		batch.add(currentBakt.claimDividendsFor.request(holderAddr.get(),{from:holderAddr.get(), gas:300000}, function(e, result){console.log(1, e, result);}));
		batch.add(currentBakt.claimDividendsFor.request(to,{from:holderAddr.get(), gas:300000},function(e, result){console.log(2, e, result);}));
		batch.add(currentBakt.transfer.request(to, amount,{from:holderAddr.get(), gas:300000},function(e, result){console.log(3, e, result);}));
		batch.execute();
	}

})

Template.Allow.helpers({
	tokenBalance: function () {
		return baktDict.holder.get().tokenBalance;
	}
})

Template.Allow.events({
	'submit form' (events, template) {
		event.preventDefault();
		sender = event.target.children[1].children[0].value;
		amount = event.target.amount.value;
		currentBakt.approve(sender, amount,{from:holderAddr.get(), gas:90000}, modalcb);
	}
})

Template.Purchase.helpers({
	price: function () {
		return currentBakt.tokenPrice();
	}
})

Template.Purchase.events({
	'submit form' (event, template) {
		event.preventDefault();
		amount = event.target.amount.value;
		spend = (amount * currentBakt.tokenPrice()) - currentBakt.etherBalanceOf(holderAddr.get()).toNumber();
		currentBakt.purchase({from:holderAddr.get(), value:spend, gas:300000}, modalcb);
	}
}),

Template.Redeem.helpers({
	rPrice: function () {
		p = currentBakt.fundBalance().div(baktDict.totalSupply.get());
		if (p.gt(baktDict.tokenPrice.get())) p = baktDict.tokenPrice.get();
		return p;
	},
	tokenBalance: function () {
		return baktDict.holder.get().tokenBalance;
	}	
})

Template.Redeem.events({
	'submit form' (event, template) {
		event.preventDefault();
		amount = event.target.rAmount.value;
		currentBakt.redeem(amount, {from:holderAddr.get(), gas:300000}, modalcb);
	}
})

Template.Panic.events({
		'submit form': function (event, template){
		event.preventDefault();
		if (event.target.children.validation.checked) {
			currentBakt.PANIC({from:holderAddr.get()}, modalcb);
		} else {
			modalcb();
		}
	}
})

Template.PayDividends.helpers({
	fundBalance: function () {
		return baktDict.fundBalance.get();
	},
})

Template.PayDividends.events({
	'submit form' (e, template) {
		e.preventDefault();
		dividend = e.target.children.dividends.value * 10**18;
		console.log(dividend);
		currentBakt.payDividends(dividend,{from:holderAddr.get(), gas:200000}, modalcb)
	}
})

Template.SetPrice.helpers({
	tokenPrice: function () {
		return currentBakt.tokenPrice();
	}
})

Template.SetPrice.events({
	'submit form' (e, template) {
		e.preventDefault();
		price = e.target.children.tokenPrice.value;
		console.log(price, holder);
		currentBakt.setTokenPrice(price,{from:holderAddr.get()}, modalcb);		
	}
})

Template.AddHolders.events({
	'submit form' (e, template) {
		e.preventDefault();
		t = e.target.children[0].children[0];
		holder = t.value;
		console.log(t.value, holder);
		currentBakt.addHolders([holder],{from:holderAddr.get()}, modalcb);
	}
})

Template.Execute.helpers({
	fundBalance: function () {
		return baktDict.fundBalance.get();
	}
})

Template.Execute.events({
	'submit form' (e, template) {
		e.preventDefault();		
		to = e.target.children[1].children[0].value;
		sendValue = e.target.children.sendValue.value * 10**18;
		data = e.target.children[5].value;
		console.log(to, sendValue, data);
		currentBakt.execute(to, sendValue, data,{from:holderAddr.get(), gas:300000}, modalcb);
	}

})

Template.HolderList.helpers ({
	addrList: function () {
		holders = currentBakt.getHolders();
		l = [];
		var i = 1;
		while(i < 256 &&
			holders[i] != "0x0000000000000000000000000000000000000000")
			l.push(holders[i++]);
		return l;
	}
})

Template.HolderList.events({
	'click button': function (e, template) {
		voteFor = e.target.innerText;
		console.log(voteFor);
		currentBakt.vote(voteFor,{from:holderAddr.get(), gas:1000000}, modalcb)
	},
})
