import "./Modals.html";

var hideModal = function () { EthElements.Modal.hide(); }

/**
Template Controllers
@module Templates
*/

/**
The select account template
@class [template] dapp_selectAccount
@constructor
*/

// Template['dapp_selectAddress'].onCreated(function(){
Template['dapp_selectAddress'].rendered = function(){
	baktDict.holders.set(currentBakt.getHolders().filter(e=>e!="0x0000000000000000000000000000000000000000"));
    if(this.data ) {
        if(this.data.value) {
            TemplateVar.set('value', this.data.value);
        } else if(this.data.accounts && this.data.accounts[0]) {
            TemplateVar.set('value', this.data.accounts[0]);
        }
    }
}
// );


Template['dapp_selectAddress'].helpers({
    /**
    Return the selected attribute if its selected
    @method (selected)
    */
	addresses: function () {
		return baktDict.holders.get();

		// return currentBakt.getHolders().filter(e=>e!="0x0000000000000000000000000000000000000000");
	},
    selected: function(){
        return (TemplateVar.get('value') === this.address)
            ? {selected: true}
            : {};
    },
    /**
    Check if the current selected unit is not ether
    @method (isNotEtherUnit)
    */
    isAddress: function() {
        return web3.isAddress(TemplateVar.get('value'));
    }
});

Template['dapp_selectAddress'].events({
    /**
    Set the selected address.
    
    @event change select
    */
    'change select': function(event){
        TemplateVar.set('value', event.currentTarget.value);
    }
});

Template.Factory.helpers ({

	accounts: function () {
		return EthAccounts.findAll().fetch();
	},
	address: function () {
		return currentFactory.address;
	},
	fee: function () {
		return currentFactory.owner() == holderAddr.get() ?
			0 :	currentFactory.value();
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
	},
	network: function() {
		return networkName;
	},
	validName: function() {
		return TemplateVar.get('regName') ? "" : "disabled";
	}
})

Template.Factory.events ({
	'click #btn_cancel': function () {history.back()},
	'change .dapp-select-account select': function(event) {
	    holderAddr.set(TemplateVar.getFrom(event.currentTarget, 'value'));
	},
	'input [name=regName]': function (event) {
		TemplateVar.set('regName', event.currentTarget.value);
	},
	'click #btn_ok': function(event) {
		if(!TemplateVar.get('regName')) return;
		// The fee is not paid by the factory owner
		let fee = currentFactory.owner() == holderAddr.get() ?
			0 :	currentFactory.value();

		currentFactory.createNew(
			TemplateVar.get('regName'),
			holderAddr.get(),
			{from: holderAddr.get(), value:fee, gas: 3652256},
			function (err, txId) {
				$("body").addClass("wait");
				console.log(err, txId);
				currentFactory.Created().watch(
					function (err, log) {
						console.log('tick');
						if(txId == log.transactionHash) {
							console.log(err, txId, log);
							currentFactory.Created().stopWatching();
							$("body").removeClass("wait");
							FlowRouter.go(`/${log.args.addr}`);
						}
					}
				);
			}
		);
	}
})


Template.Init.rendered = function (){
		TemplateVar.set('pending', 172800);
		TemplateVar.set('panic', 172800);
}

Template.Init.helpers ({
	isTrustee: function () {
		accounts = web3.eth.accounts;
		trustee = currentBakt.trustee();
		for (a in accounts) {
			if (accounts[a] == trustee) return true;
		}
	},
	pending: function () {
		return 	TemplateVar.get('pending');

	},
	panic: function () {
		return 	TemplateVar.get('panic');
	},
})

Template.Init.events ({
	'input [name=pending]': function(event) {
		TemplateVar.set('pending', event.currentTarget.value);
	},
	'input [name=panic]': function(event) {
		TemplateVar.set('panic', event.currentTarget.value);
	},
	'click #btn_ok' (event) {
		var trustee = currentBakt.trustee();
		currentBakt._init(
			TemplateVar.get('pending'),
			TemplateVar.get('panic'),
			{from:trustee, gas:90000}, 
			function (err, tx) {
				$("body").addClass("wait");
				console.log(err, tx);
				itvlId = setInterval(
					function (){
						console.log('tick');
						if(web3.eth.getTransactionReceipt(tx)) {
							clearInterval(itvlId);
							$("body").removeClass("wait");
							FlowRouter.go(`/${currentBakt.address}`);
						}
					},
					1000);
				console.log(itvlId);
			}
		);
	}
})


Template.PayInto.helpers({
	etherBalance: function () {
		return web3.eth.getBalance(holderAddr.get());
	}
})

Template.PayInto.events({
	'click #btn_cancel': hideModal,
	'input [name=value]': function (event) {
		TemplateVar.set('value',new BigNumber(event.currentTarget.value * Math.pow(10,18)));
	},
	'click #btn_ok' (event) {
		web3.eth.sendTransaction({to:baktDict.baktAddress.get(), 
			value: TemplateVar.get('value'), from:holderAddr.get()}, cb);
	}
})


Template.Withdraw.helpers({
	etherBalance: function () {
		return baktDict.holder.get().etherBalance.toNumber();
	}
})

Template.Withdraw.events({
	'click #btn_cancel': hideModal,
	'click #btn_ok' (event) {
		currentBakt.withdraw(
			baktDict.holder.get().etherBalance,	{from:holderAddr.get(), gas:300000}, cb);
	}
})


Template.AddHolder.events({
	'click #btn_cancel': hideModal,
	'input [name=addr]': function (event) {
		TemplateVar.set('addr',event.currentTarget.value);
	},
	'click #btn_ok': function (event) {
		currentBakt.addHolder(TemplateVar.get('addr'), {from:holderAddr.get(), gas:100000}, cb);
	}
})


Template.Transfer.rendered = function (){
	TemplateVar.set('toAddr', this.$('select')[0].value);
}

Template.Transfer.helpers({
	tokenBalance: function () {
		return baktDict.holder.get().tokenBalance;
	},
	toAddr: function () {
		return TemplateVar.get('toAddr');
	}
})

Template.Transfer.events({
	'click #btn_cancel': hideModal,
	'input [name=amount]': function (event) {
		TemplateVar.set('amount', event.currentTarget.value);
	},
	'change select' (event) {
		TemplateVar.set('toAddr', event.currentTarget.value);
	},
	'click #btn_ok' (event) {
		var amount = TemplateVar.get('amount');
		var to = TemplateVar.get('toAddr');
		currentBakt.transfer(to, amount, {from:holderAddr.get(), gas:300000}, cb);
	}
})


Template.TransferFrom.rendered = function (){
	TemplateVar.set('fromAddr', this.$('select')[0].value);
	TemplateVar.set('toAddr', this.$('select')[1].value);
	TemplateVar.set('allowance', currentBakt.allowance(TemplateVar.get('fromAddr'), holderAddr.get()));
}

Template.TransferFrom.helpers({
	allowance: function () {
		return TemplateVar.get('allowance');
	},
	fromAddr: function () {
		return TemplateVar.get('fromAddr');
	},
	toAddr: function () {
		return TemplateVar.get('toAddr');
	}
})

Template.TransferFrom.events({
	'click #btn_cancel': hideModal,
	'change select[name=fromAddr]': function(event) {
		TemplateVar.set('fromAddr', event.currentTarget.value);
		TemplateVar.set('allowance', currentBakt.allowance(event.currentTarget.value, holderAddr.get()));
	},
	'change select[name=toAddr]': function(event) {
		TemplateVar.set('toAddr', event.currentTarget.value);
	},
	'input [name=amount]': function(event) {
		TemplateVar.set('amount', event.currentTarget.value);
	},
	'click #btn_ok' (event) {
		fromAddr = TemplateVar.get("fromAddr");
		toAddr = TemplateVar.get("toAddr");
		amount = TemplateVar.get("amount");
		currentBakt.transferFrom(fromAddr, toAddr, amount, {from:holderAddr.get(), gas:300000}, cb);
	}
})


Template.Allow.helpers({
	tokenBalance: function () {
		return baktDict.holder.get().tokenBalance;
	}
})

Template.Allow.events({
	'click #btn_cancel': hideModal,
	'input [name=sender]': function(event) {
		TemplateVar.set('sender', event.currentTarget.value);
	},
	'input [name=amount]': function (event) {
		TemplateVar.set('amount', event.currentTarget.value);
	},
	'click #btn_ok': function (event) {
		sender = TemplateVar.get('sender');
		amount = TemplateVar.get('amount');
		currentBakt.approve(sender, amount, {from:holderAddr.get(), gas:100000}, cb);
	}
})


Template.Issue.rendered = function () {
	TemplateVar.set("amount", new BigNumber(0));
}

Template.Issue.helpers({
	tokenPrice: function () {
		return baktDict.tokenPrice.get();
	},
	expiry: function () {
		exp = new Date(Date.now() + 7 * 24 * 3600000)
		return exp.toLocaleString();
	},
	address: function () {
		return TemplateVar.get('address');
	},
	lotPrice: function () {
		return baktDict.tokenPrice.get().mul(TemplateVar.get("amount"));
	}
})

Template.Issue.events({
	'click #btn_cancel': hideModal,
	'input [name=address]': function(event) {
		TemplateVar.set("address", event.currentTarget.value);
	},
	'input [name=amount]': function(event) {
		TemplateVar.set("amount", new BigNumber(event.currentTarget.value));
	},
	'click #btn_ok' (event) {
		address = TemplateVar.get("address");
		amount = TemplateVar.get("amount");
		currentBakt.issue(address, amount, {from:holderAddr.get(), gas:300000}, cb);
	}
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

Template.Revoke.helpers({
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
	price: function () {
		return baktDict.tokenPrice.get().mul(TemplateVar.get("rHolder").offerAmount);
	}
})

Template.Revoke.events({
	'click #btn_cancel': hideModal,
	'input select': function(event) {
		TemplateVar.set('addr',event.currentTarget.value)
		TemplateVar.set("rHolder",
			function () {
				arr = currentBakt.holders(event.currentTarget.value);
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
	'click #btn_ok' (event) {
		currentBakt.revokeOffer(TemplateVar.get('addr'), {from:holderAddr.get(), gas:300000}, cb);		
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
	'click #btn_cancel': hideModal,
	'click #btn_ok' (event) {
		spend = baktDict.holder.get().offerAmount.mul(baktDict.tokenPrice.get());
		currentBakt.purchase({from:holderAddr.get(), value:spend, gas:300000}, cb);
	}
})


Template.Redeem.rendered = function () {
	let price = currentBakt.fundBalance().div(currentBakt.totalSupply());
	if (price.gt(currentBakt.tokenPrice())) price = currentBakt.tokenPrice();
	TemplateVar.set('price', price);
}

Template.Redeem.helpers({
	price: function () {
		return TemplateVar.get('price');
	},
	tokenBalance: function () {
		return baktDict.holder.get().tokenBalance;
	},
	value: function () {
		return TemplateVar.get('value');
	}	
})

Template.Redeem.events({
	'input [name=amount]': function (event) {
		amount = event.currentTarget.value || 0;
		value = new BigNumber(amount);
		value = value.mul(TemplateVar.get('price'));
		TemplateVar.set('value', value);
		TemplateVar.set('amount', amount)
	},
	'click #btn_cancel': hideModal,
	'click #btn_ok' (event) {
		currentBakt.redeem(TemplateVar.get('amount'), {from:holderAddr.get(), gas:300000}, cb);
	}
})


Template.Panic.helpers({
	'period': function () {
		return currentBakt.PANICPERIOD().toNumber();
	},
})

Template.Panic.events({
	'click #btn_cancel': hideModal,
	'click #btn_ok' (event) {
		if (event.target.children.validation.checked) {
			currentBakt.PANIC({from:holderAddr.get()}, cb);
		} else {
			cb();
		}
	}
})


Template.Vacate.helpers({
	address: function () {
		return holderAddr.get();
	}
})

Template.Vacate.events({
	'click #btn_cancel': hideModal,
	'click #btn_ok' (event) {
		currentBakt.vacate(holderAddr.get(), {from:holderAddr.get()}, cb);
	}	
})


Template.PayDividends.rendered = function () {
	TemplateVar.set('value',baktDict.fundBalance.get());
}

Template.PayDividends.helpers({
	fundBalance: function () {
		return baktDict.fundBalance.get();
	},
})

Template.PayDividends.events({
	'click #btn_cancel': hideModal,
	'input [name=value]': function(event) {
		TemplateVar.set('value', new BigNumber(event.currentTarget.value * Math.pow(10,18)));
	},
	'click #btn_ok' (event) {
		currentBakt.payDividends(TemplateVar.get('value'),
			{from:holderAddr.get(), gas:200000}, cb)
	}
})


Template.Execute.helpers({
	fundBalance: function () {
		return baktDict.fundBalance.get().toNumber();
	},
	funcs: function () {
		return TemplateVar.get("funcs");
	},
	callData: function () {
		return TemplateVar.get("callData");
	}
})

Template.Execute.events({
	'click #btn_cancel': hideModal,
	'change .dapp-address-input input': function(event) {
		TemplateVar.set("to", TemplateVar.getFrom(event.currentTarget, 'value'));
	},
	'input #sendValue' (event, template) {
		TemplateVar.set("sendValue", event.target.value * Math.pow(10,18));
	},
	'click #btn_ok' (event) {
		currentBakt.execute(
			TemplateVar.get("to"),
			TemplateVar.get("sendValue"),
			TemplateVar.get("callData") || "",
			{from:holderAddr.get(), gas:300000}, cb);
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
	'click #btn_cancel': hideModal,
	'input [name=addrList]': function(event) {
		TemplateVar.set('addr', event.currentTarget.value);
	},
	'click #btn_ok' (event) {
		currentBakt.vote(TemplateVar.get('addr'), {from:holderAddr.get(), gas:300000}, cb); 	
	}
})


Template.Destroy.helpers({
})

Template.Destroy.events({
	'click #btn_cancel': hideModal,
	'change [name=checked]': function (event) {
		TemplateVar.set('checked', event.currentTarget.checked);
	},
	'click #btn_ok' (event) {
		if (TemplateVar.get('checked')) {
			currentBakt.destroy({from:holderAddr.get()}, cb);
		}
	}
})
