import "./Bakt.html"

Template.Bakt.helpers ({
	baktAddr: function () {
		return baktDict.baktAddress.get();
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
})

Template.Bakt.events ({
	'click #btn_bakt': function (e, template) {
		EthElements.Modal.show({
			template: 'ChangeBakt',
		});
	},
	'click #btn_payInto': function (e, template) {
		EthElements.Modal.show({
			template: 'PayInto',
		});
	},
})