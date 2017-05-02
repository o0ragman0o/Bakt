import "./Modals.html";

// Template.ChangeBakt.helpers ({
// 	isBakt: function () {
// 		return TemplateVar.get("isBakt");
// 	}
// })

Template.ChangeBakt.events ({
	'change .dapp-address-input input': function(event) {
	var baktAddr = event.currentTarget.value;
		TemplateVar.set("isBakt", web3.toUtf8(baktContract.at(baktAddr).VERSION()).slice(0,4) == "Bakt");
		TemplateVar.set("baktAddr", baktAddr);
	},
	'submit form' (event, template) {
		event.preventDefault();
		var addr = TemplateVar.get("baktAddr");
		modalcb();
		if (TemplateVar.get("isBakt")) FlowRouter.go('/' + addr);
		else FlowRouter.go('/');
	}
})

Template.Init.events ({
	'submit form' (event, template) {
		var pending = event.target.children.pending.value;
		var panic = event.target.children.panic.value;
		console.log(pending,panic);
		currentBakt.__init(pending, panic,{from:holderAddr.get(), gas:90000}, modalcb);
	}
})

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
		var value = new BigNumber(event.target.children.ethValue.value * Math.pow(10,18));
		web3.eth.sendTransaction({to:baktDict.baktAddress.get(), value: value, from:holderAddr.get()}, modalcb);
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
		currentBakt.withdraw(baktDict.holder.get().etherBalance, {from:holderAddr.get(), gas:300000}, modalcb);
	}
})

Template.Transfer.helpers({
	tokenBalance: function () {
		return baktDict.holder.get().tokenBalance;
	},
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

Template.Transfer.events({
	'submit form' (event, template) {
		event.preventDefault();
		var amount = event.target.children.amount.value;
		var to = event.target.children.addr.value;
		console.log(to);
		if (currentBakt.hasUnclaimedDividends(to))
			currentBakt.updateDividendsFor(to, {from:holderAddr.get(), gas:300000}, cb);
		currentBakt.transfer(to, amount, {from:holderAddr.get(), gas:300000}, modalcb);
		// var batch = web3.createBatch();
		// batch.add(currentBakt.updateDividendsFor.request(to,{from:holderAddr.get(), gas:300000}));
		// batch.add(currentBakt.transfer.request(to, amount,{from:holderAddr.get(), gas:300000}));
		// batch.execute();
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

Template.AddHolder.events({
	'submit form' (e, template) {
		e.preventDefault();
		t = e.target.children[0].children[0];
		holder = t.value;
		console.log(t.value, holder);

		currentBakt.addHolder(holder,{from:holderAddr.get()}, modalcb);
	}
})

Template.Issue.rendered = function () {
	TemplateVar.set("offerAmount", 0);
}

Template.Issue.helpers({
	tokenPrice: function () {
		return baktDict.tokenPrice.get();
	},
	expiry: function () {
		exp = new Date(Date.now() + 7 * 24 * 3600000)
		return exp.toLocaleString();
	},
})

Template.Issue.events({
	'change .dapp-address-input input': function(event) {
		TemplateVar.set("account", event.currentTarget.value);
	},
	'change .amount input': function(event) {
		TemplateVar.set("offerAmount", this.value);
	},
	'submit form' (event, template) {
		event.preventDefault();
		address = TemplateVar.get("account");
		amount = event.target.amount.value;
		currentBakt.issue(address, amount, {from:holderAddr.get(), gas:300000}, modalcb);
	}
})

Template.Revoke.helpers({
	addrList: function () {
		holders = currentBakt.getHolders();
		l = [];
		var i = 1;
		while(i < 256 &&
			holders[i] != "0x0000000000000000000000000000000000000000")
			l.push(holders[i++]);
		return l;
	},
	amount: function () {
		return TemplateVar.get("rHolder").offerAmount;
	},
	expiry: function () {
		d = TemplateVar.get("rHolder").offerExpiry * 1000
		if (d) {
			d = new Date(d);
			d = d.toLocaleString();
		} else {
			d = "--/--/--";
		}
		return d;
	},
})

Template.Revoke.rendered = function (){
	addr = this.find('select').value;
	TemplateVar.set("rHolder",
		function () {
			arr = currentBakt.holders(addr);
			return {
				id: arr[0],
				lastClaimed: arr[1],
				votingFor: arr[2],
				tokenBalance: arr[3],
				etherBalance: arr[4],
				votes: arr[5],
		        offerAmount:arr[6],
		        offerExpiry:arr[7],
			};
		}()
	);
}

Template.Revoke.events({
	'change select': function (e, template) {
		addr = event.target.value;
		TemplateVar.set("rHolder",
			function () {
				arr = currentBakt.holders(addr);
				return {
					id: arr[0],
					lastClaimed: arr[1],
					votingFor: arr[2],
					tokenBalance: arr[3],
					etherBalance: arr[4],
					votes: arr[5],
			        offerAmount:arr[6],
			        offerExpiry:arr[7],
				};
			}()
		);
	},
	'submit form' (event, template) {
		event.preventDefault();
		address = event.target.children.holders.value
		currentBakt.revoke(address, {from:holderAddr.get(), gas:300000}, modalcb);		
	}
})

Template.Purchase.helpers({
	amount: function () {
		return baktDict.holder.get().offerAmount;
	},
	price: function () {
		return baktDict.holder.get().offerAmount * baktDict.tokenPrice.get();
	},
	expiry: function () {
		d = new Date(baktDict.holder.get().offerExpiry * 1000);
		if (d) {
			d = new Date(d);
			d = d.toLocaleString();
		} else {
			d = "--/--/--";
		}
		return d;
	},
})

Template.Purchase.events({
	'submit form' (event, template) {
		event.preventDefault();
		spend = baktDict.holder.get().offerAmount.mul(baktDict.tokenPrice.get());
		currentBakt.purchase({from:holderAddr.get(), value:spend, gas:300000}, modalcb);
	}
})

Template.Redeem.helpers({
	rPrice: function () {
		p = currentBakt.fundBalance().div(currentBakt.totalSupply());
		if (p.gt(currentBakt.tokenPrice())) p = currentBakt.tokenPrice();
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

Template.Panic.helpers({
	'period': function () {
		return currentBakt.PANICPERIOD().toNumber();
	},
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
		dividend = e.target.children.dividends.value * Math.pow(10,18);
		console.log(dividend);
		currentBakt.payDividends(dividend,{from:holderAddr.get(), gas:200000}, modalcb)
	}
})

Template.Execute.helpers({
	fundBalance: function () {
		return baktDict.fundBalance.get();
	},
	funcs: function () {
		return TemplateVar.get("funcs");
	},
	callData: function () {
		return TemplateVar.get("callData");
	}
})

Template.Execute.events({
	'change .dapp-address-input input': function(e) {
		TemplateVar.set("to", TemplateVar.getFrom(e.currentTarget, 'value'));
	},
	'input #sendValue' (e, template) {
		TemplateVar.set("sendValue", e.target.value * Math.pow(10,18));
	},
	'input #abi' (e, template) {

		abi = JSON.parse(e.target.value);
		arr = [];
		abi.forEach(function(json) {
			if(json.type === "function" && !json.constant) arr.push(json.name);
			}
		);
		TemplateVar.set("abi", e.target.value);
		TemplateVar.set("toK", web3.eth.contract(abi).at(TemplateVar.get("to")));
		TemplateVar.set("funcs", arr);
	},
	'change #functName' (e, template) {
		TemplateVar.set("functName", e.target.value);
		TemplateVar.set("callData", TemplateVar.get("toK")[TemplateVar.get("functName")].getData(TemplateVar.get("arguments")));
		console.log(TemplateVar.get("functName"));
	},
	'input #arguments' (e, trmplate) {
		TemplateVar.set("arguments", e.target.value);
		TemplateVar.set("callData", TemplateVar.get("toK")[TemplateVar.get("functName")].getData(TemplateVar.get("arguments")));
	},
	'submit form' (e, template) {
		e.preventDefault();		
		currentBakt.execute(
			TemplateVar.get("to"),
			TemplateVar.get("sendValue"),
			TemplateVar.get("callData") || "",
			{from:holderAddr.get(), gas:300000}, modalcb);
	}
})

Template.VoteFor.helpers ({
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

Template.VoteFor.events({
	'submit form' (event) {
		event.preventDefault();	
		currentBakt.vote(event.target.children.preference.value, {from:holderAddr.get(), gas:300000}, modalcb); 	
	}
})
