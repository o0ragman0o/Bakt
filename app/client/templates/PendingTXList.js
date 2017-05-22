import "./PendingTXList.html";

Template.PendingTXList.helpers ({
	pendingTXs: function() {
		return baktDict.pendingTXs.get();
	},
	show: function() {
		return baktDict.pendingTXs.get().length && baktDict.holder.get().id.toNumber() > 0 
				? "show" : "hide";
	},
})

Template.PendingTXList.events ({
})

Template.PendingTX.helpers ({
	'sendState': function () {
		return this.blocked ? 
			this.timeLock < Date.now() ? "clearBlocked" : "blocked" :
			this.timeLock < Date.now() ? "cleared" : "waiting";
	},
	canBlock: function() {
		if (!this.blocked &&
			(baktDict.holder.get().tokenBalance.gte(baktDict.totalSupply.get().div(10)) ||
			holderAddr.get() == baktDict.trustee.get() ||
			holderAddr.get() == this.from))
			return "show";
		else 
			return "hide";
	},
	canSend: function() {
		if (
			this.ptxid == baktDict.pendingTXs.get()[0].ptxid
			&& 
			this.timeLock < Date.now()
			)
			return "show";
		else
			return "hide";
	},
	clearSend: function() {
		return this.blocked ? "Clear" : "Send";
	},
})

Template.PendingTX.events ({
	'click #btn_send': function (event, template) {
		currentBakt.sendPending({from:holderAddr.get(), gas:90000}, cb);
	},
	'click #btn_block': function (event, template) {
		currentBakt.blockPendingTx(this.ptxid, {from:holderAddr.get(), gas:90000}, cb);
	}
})

