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

