import "./PendingTXList.html";

Template.PendingTXList.helpers ({
	pendingTXs: function() {
		return baktDict.pendingTXs.get();
	},
	show: function() {
		return baktDict.pendingTXs.get().length ? "show" : "hide";
	},
	unblocked: function() {
		return 
	}
})

Template.PendingTXList.events ({
	'click #btn_send': function (e, template) {
		currentBakt.sendPending({from:ethAccount.get().address, gas:90000});
	},
})

Template.PendingTX.helpers ({
	'sendState': function () {
		return this.blocked ? "blocked" :
			this.timeLock < Date.now() ? "cleared" : "waiting";
	},
})

Template.PendingTX.events ({
	'click #btn_block': function (e, template) {
		console.log(this);
		currentBakt.blockPendingTx(this.ptxid, {from:ethAccount.get().address, gas:90000},
			function() {
				EthElements.Modal.show({
					template: "Waiting"
				})
				console.log("Blocked: ", this.ptxid)});
	}
})

