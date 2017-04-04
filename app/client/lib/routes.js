FlowRouter.route('/', {
    name: "address",
    action: function(params, queryParams) {
		EthElements.Modal.show({
				template: 'ChangeBakt',
		});
    	console.log("Address is:", params, queryParams);
    }
});


FlowRouter.route('/:baktAddr', {
    name: "address",
    action: function(params, queryParams) {
    	baktDict.baktAddress.set(params.baktAddr);
		currentBakt = baktContract.at(params.baktAddr);
		if(currentBakt.__initFuse()) 
					EthElements.Modal.show({
				template: 'Init',
		});	
// FlowRouter.go('/:baktAddr/init');
		else
			web3.eth.filter().watch(function () {
				update();
			});
    	console.log("Address is:", params, queryParams);
    }
});

FlowRouter.route('/:baktAddr/init', {
	name: "init",
	action: function() {
		EthElements.Modal.show({
				template: 'Init',
		});	
	}
});

FlowRouter.notFound = {
	action() {
		FlowRouter.go('/');
		console.log("not found");
	}
}

FlowRouter.route('/:notFound*', {
  name: 'notFound',
  action: FlowRouter.notFound.action()
});