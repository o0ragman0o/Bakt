Template.ChangeBakt.created = function () {
	TemplateVar.set("bakts", factoryEvents.get().map(
			function(e) {
				let k = baktContract.at(e.args.addr);
				console.log(e.args);
				let evt =  {
					address: e.args.addr,
					name: web3.toUtf8(k.regName()),
					balance: k.fundBalance()
				}
				return evt;
			}
		)
	);
	if (TemplateVar.get('bakts').length)
		TemplateVar.set('baktAddr', TemplateVar.get('bakts')[0].address);
}


Template.ChangeBakt.helpers ({
	'bakts': function () {
		console.log(TemplateVar.get("bakts"));
		return TemplateVar.get("bakts");
	},
	'canCancel': function() {
		if(!history.length) return 'disabled';
	},
	'isBakt': function () {
		return !!TemplateVar.get('bakts').length ? "" : "disabled";
	}
})


Template.ChangeBakt.events ({
	'click #btn_cancel': function(event) {
		history.back();
	},
	'change .dapp-select-account select': function(event) {
		var baktAddr = event.currentTarget.value;
		TemplateVar.set("isBakt", web3.toUtf8(baktContract.at(baktAddr).VERSION()).slice(0,4) == "Bakt");
		TemplateVar.set("baktAddr", baktAddr);
	},
	'click #btn_newBakt': function(event) {
			FlowRouter.go('/create');
	},
	'click #btn_ok': function(event) {
		let addr = TemplateVar.get("baktAddr");
		EthElements.Modal.hide();
		FlowRouter.go(`/${addr}`);
	},
})


