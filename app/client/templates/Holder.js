import "./Holder.html"

Template.Holder.rendered= function (){
	this.$('select')[0].value = holderAddr.get();
	update();
}

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
			return "";
		else 
			return "disabled";

	},
	canCalm: function () {
		if (baktDict.panicked.get() &&
			baktDict.timeToCalm.get().toNumber() * 1000 < Date.now())
				return "";
		else return "disabled";
	},

	calmTime: function () {
		d = new Date(baktDict.timeToCalm.get().toNumber() * 1000);
		return d.toLocaleString();
	},

	notPanicked: function () {
		if (!baktDict.panicked.get()) return "show";
		else return "hide";
	},

	hasTokens: function () {
		if (baktDict.holder.get().tokenBalance.gt(0)) return ""
			else return "disabled";		
	},

	hasEther: function () {
		if (baktDict.holder.get().etherBalance.gt(0)) return ""
			else return "disabled";		
	},

	showTrustee: function () {
		if(holderAddr.get() == baktDict.trustee.get()) return "show";
		else return "hide";
	},

	isHolder: function () {
		if(baktDict.holder.get().id.toNumber()) return true;
		else return false;
	},

	showHolder: function () {
		if(baktDict.holder.get().id.toNumber()) return "show";
		else return "hide";
	},

	isExpired: function () {
		if (Date.now() > baktDict.holder.get().offerExpiry * 1000) return "disabled";
	},

	canDestroy: function () {
		if (baktDict.totalSupply.get().toNumber() || baktDict.committedEther.get().gt(1000000000))
			return "hide";
		else
			return "show";
	},
	canVacate: function () {
		holder = baktDict.holder.get();
		if (holder.etherBalance.eq(0) &&
			holder.tokenBalance.eq(0) &&
			holderAddr.get() != baktDict.trustee.get() &&
			baktDict.pendingTXs.get().length == 0)
			return "";
		else
			return "disabled";
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
	'click #btn_transferFrom': function (e, template) {
		EthElements.Modal.show({template:'TransferFrom'})
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
	'click #btn_vacate': function (event, template) {
		EthElements.Modal.show({template:'Vacate'});
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
	},
	'click #btn_destroy': function (e, template) {
		EthElements.Modal.show({template:"Destroy"});
	},

})

