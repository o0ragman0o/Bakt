import "./Holder.html"

Template.Holder.helpers({
	accounts: function () {
		return EthAccounts.findAll().fetch();
	},
	holderAddr: function() {
		return holderAddr.get();
	},

	holder: function () {
		return baktDict.holder.get();
	},

	panicked: function () {
		return baktDict.panicked.get();
	},

	inPanicked: function () {
		if (baktDict.panicked.get()) return "show";
		else return "hide";		
	},
	canPanic: function () {
		if (baktDict.holder.get().tokenBalance.gte(baktDict.totalSupply.get().div(10)) ||
			holderAddr.get() == baktDict.trustee.get())
			return "show";
		else 
			return "hide";

	},
	canCalm: function () {
		if (baktDict.panicked.get() &&
			baktDict.timeToCalm.get().toNumber() * 1000 < Date.now())
				return "show";
		else return "hide";
	},

	calmTime: function () {
		d = new Date(baktDict.timeToCalm.get().toNumber() * 1000);
		return d.toLocaleString();
	},

	notPanicked: function () {
		if (!baktDict.panicked.get()) return "show";
		else return "hide";
	},

	hasUnclaimed: function () {
		if (baktDict.hasUnclaimedDividends.get()) return "show"
			else return "hide";
	},

	hasTokens: function () {
		if (baktDict.holder.get().tokenBalance.gt(0)) return "show"
			else return "hide";		
	},

	hasEther: function () {
		if (baktDict.holder.get().etherBalance.gt(0)) return "show"
			else return "hide";		
	},

	noUnclaimed: function () {
		if (baktDict.hasUnclaimedDividends.get()) return "hide"
			else return "show";
	},
	
	isTrustee: function () {
		if(holderAddr.get() == baktDict.trustee.get()) return "show";
		else return "hide";
	},

	isHolder: function () {
		if(baktDict.holder.get().id.toNumber()) return "show";
		else return "hide";
	},
	isExpired: function () {
		if (Date.now() > baktDict.holder.get().offerExpiry * 1000) return "hide";
		else return "show";
	}

})


Template.Holder.events({
	'change .dapp-select-account select': function(e) {
	    holderAddr.set(TemplateVar.getFrom(e.currentTarget, 'value'));
	    update();
	},
	'click #btn_withdraw': function (e, template) {
		EthElements.Modal.show({
			template:'Withdraw',
		});
	},
	'click #btn_transfer': function (e, template) {
		EthElements.Modal.show({template:'Transfer'})
	},
	'click #btn_allow': function (e, template) {
		EthElements.Modal.show({template:'Allow'});
	},
	'click #btn_vote': function (e, template) {
		EthElements.Modal.show({template:'HolderList'});
	},
	'click #btn_purchase': function (e, template) {
		EthElements.Modal.show({template:'Purchase'});
	},
	'click #btn_redeem': function (e, template) {
		EthElements.Modal.show({template:'Redeem'});
	},
	'click #btn_claim': function (e, template) {
		currentBakt.updateDividendsFor(holderAddr.get(),
			{from: holderAddr.get(), gas: 300000}, cb)
	},
	'click #btn_panic': function (event, template){
		EthElements.Modal.show({template: 'Panic'});
	},
	'click #btn_calm': function (event, template) {
		currentBakt.calm({from:holderAddr.get(), gas:300000});
	},
	'click #btn_execute': function (e, template) {
		EthElements.Modal.show({template:"Execute"})
	},
	'click #btn_addHolder': function (e, template) {
		EthElements.Modal.show({template:"AddHolder"})
	},
	'click #btn_issue': function (e, template) {
		EthElements.Modal.show({template:"Issue"});
	},
	'click #btn_revoke': function (e, template) {
		EthElements.Modal.show({template:"Revoke"});
	},
	'click #btn_payDividends': function (e, template) {
		EthElements.Modal.show({template:"PayDividends"});
	},
	'click #btn_vote': function (e, template) {
		EthElements.Modal.show({template:"VoteFor"});
		// EthElements.Modal.show({template:"HolderList"})
	}
})

