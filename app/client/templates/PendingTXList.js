import "./PendingTXList.html";

Template.PendingTXList.helpers ({
	clearSend: function() {
		if(baktDict.pendingTXs.get().length)
			return baktDict.pendingTXs.get()[0].blocked ? "Clear" : "Send";
	},
	pendingTXs: function() {
		return baktDict.pendingTXs.get();
	},
	show: function() {
		return baktDict.pendingTXs.get().length && baktDict.holder.get().id.toNumber() > 0 
				? "show" : "hide";
	},
	unblocked: function() {
		return 
	},
})

Template.PendingTXList.events ({
	'click #btn_send': function (e, template) {
		currentBakt.sendPending({from:holderAddr.get(), gas:90000});
	},
})

Template.PendingTX.helpers ({
	'sendState': function () {
		return this.blocked ? 
			this.timeLock < Date.now() ? "clearBlocked" : "blocked" :
			this.timeLock < Date.now() ? "cleared" : "waiting";
	},
	canBlock: function() {
		if (baktDict.holder.get().tokenBalance.gte(baktDict.totalSupply.get().div(10)) ||
			holderAddr.get() == baktDict.trustee.get() ||
			holderAddr.get() == this.from)
			return "show";
		else 
			return "hide";
	}
})

Template.PendingTX.events ({
	'click #btn_block': function (e, template) {
		console.log(this);
		currentBakt.blockPendingTx(this.ptxid, {from:holderAddr.get(), gas:90000},cb);
	}
})

