FlowRouter.route('/', {
    name: "root",
    action: function(params) {
		EthElements.Modal.show({
				template: 'ChangeBakt',
		});
    }
});

FlowRouter.route('/create', {
    name: "create",
    action: function() {
        EthElements.Modal.show({
                template:'Factory',
        });
    }
});

FlowRouter.route('/:baktAddr', {
    name: "address",
    action: function(params) {
    	changeBakt(params.baktAddr);
   }
});

            // EthElements.Modal.show({template:'Factory'});

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

// FlowRouter.route('/:notFound*', {
//   name: 'notFound',
//   action: FlowRouter.notFound.action()
// });