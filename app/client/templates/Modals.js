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
	'click #btn_newBakt': function(event) {
			FlowRouter.go('/create');
	},
	'submit form' (event, template) {
		event.preventDefault();
		var addr = TemplateVar.get("baktAddr");
		EthElements.Modal.hide();
		if (TemplateVar.get("isBakt")) FlowRouter.go(`/${addr}`);
		else FlowRouter.go('/');
	}
})

Template.Factory.helpers ({

	accounts: function () {
		return EthAccounts.findAll().fetch();
	},
	address: function () {
		return currentFactory.address;
	},
	fee: function () {
		return factoryDict.owner.get() == holderAddr.get() ?
			0 :
			factoryDict.fee.get();
	},
	version: function () {
		return factoryDict.version.get();
	},
	resource: function () {
		return factoryDict.resource.get();
	},
	regName: function () {
		return factoryDict.regName.get();
	},
	holderAddr: function() {
		return holderAddr.get();
	},
	isOwner: function() {
		return factoryDict.owner.get() == holderAddr.get();
	},
	kBalance: function() {
		return web3.eth.getBalanceOf(currentFactory.address);
	},
	hasFunds: function() {
		return web3.eth.getBalance(holderAddr.get()) > factoryDict.fee.get().plus(web3.eth.gasPrice.mul(3652256)).toNumber();
	}
})

Template.Factory.events ({
	'change .dapp-select-account select': function(e) {
	    holderAddr.set(TemplateVar.getFrom(e.currentTarget, 'value'));
	},
	'submit form': function(e) {
		event.preventDefault();
		let name = e.currentTarget.children.regName.value;

		currentFactory.createNew(name, holderAddr.get(), {from: holderAddr.get(), gas: 3652256},
			function (e, tx) {
				pending.set('pending');
				console.log(e,tx);
				// tx = web3.eth.getTransaction(tx);
				currentFactory.Created().watch(
					function (e, log) {
						if(!e) {
							console.log(e,log);
							currentFactory.Created().stopWatching();
							address = log.args._address;
							pending.set();
							FlowRouter.go(`/${address}`);
						} else {
							console.log(e);
						}
					}
				);
			}
		);
	}
})

Template.Init.helpers ({
	isTrustee: function () {
		accounts = web3.eth.accounts;
		trustee = currentBakt.trustee();
		for (a in accounts) {
			if (accounts[a] == trustee) return true;
		}
	}
})
Template.Init.events ({
	'submit form' (event) {
		event.preventDefault();
		var txp = event.target.children.pending.value;
		var panic = event.target.children.panic.value;
		var trustee = currentBakt.trustee();
		console.log(txp,panic);
		currentBakt._init(txp, panic,{from:trustee, gas:90000}, 
			function (e, tx) {
				pending.set('pending');
				console.log(e,tx);
				itvlId = setInterval(
					function (){
						console.log('tick');
						if(web3.eth.getTransactionReceipt(tx)) {
							clearInterval(itvlId);
							pending.set();
							FlowRouter.go(`/${currentBakt.address}`);
						}
					},
					1000);
				console.log(itvlId);
			}
		);
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
		currentBakt.transfer(to, amount, {from:holderAddr.get(), gas:300000}, modalcb);
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
		currentBakt.approve(sender, amount,{from:holderAddr.get(), gas:10000}, modalcb);
	}
})

Template.AddHolder.events({
	'submit form' (e, template) {
		e.preventDefault();
		t = e.target.children[0].children[0];
		holder = t.value;
		console.log(t.value, holder);

		currentBakt.addHolder(holder,{from:holderAddr.get(), gas:100000}, modalcb);
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
				votingFor: arr[1],
		        offerExpiry:arr[2],
				lastClaimed: arr[3],
				tokenBalance: arr[4],
				etherBalance: arr[5],
				votes: arr[6],
		        offerAmount:arr[7],
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
					votingFor: arr[1],
			        offerExpiry:arr[2],
					lastClaimed: arr[3],
					tokenBalance: arr[4],
					etherBalance: arr[5],
					votes: arr[6],
			        offerAmount:arr[7],
				};
			}()
		);
	},
	'submit form' (event, template) {
		event.preventDefault();
		address = event.target.children.holders.value
		currentBakt.revokeOffer(address, {from:holderAddr.get(), gas:300000}, modalcb);		
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
