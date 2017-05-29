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