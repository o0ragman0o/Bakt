import "./Bakt.html"

Template.Bakt.helpers ({
	baktAddr: function () {
		return web3.toChecksumAddress(baktDict.baktAddress.get());
	},
	kBalance: function() {
		return web3.eth.getBalance(baktDict.address);
	},
	fundBalance: function() {
		return baktDict.fundBalance.get();
	},
	committedEther: function() {
		return baktDict.committedEther.get();
	},
	trustee: function() {
		return baktDict.trustee.get();
	},
	panicked: function() {
		return baktDict.panicked.get();
	},
	totalSupply: function() {
		return baktDict.totalSupply.get();
	},
	regName: function() {
		return baktDict.regName.get();
	},
	version: function() {
		return baktDict.version.get();
	},
	resource: function() {
		return baktDict.resource.get();
	}
})

Template.Bakt.events ({
	'click #btn_bakt': function (e, template) {
		FlowRouter.go('/');
		// EthElements.Modal.show({
		// 	template: 'ChangeBakt',
		// });
	},
	'click #btn_payInto': function (e, template) {
		EthElements.Modal.show({
			template: 'PayInto',
		});
	},
})