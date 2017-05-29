FlowRouter.route('/', {
    name: "root",
    action: function(params) {
        currentPage.set('ChangeBakt');
		// EthElements.Modal.show({
		// 		template: 'ChangeBakt',
		// });
    }
});

FlowRouter.route('/create', {
    name: "create",
    action: function() {
        currentPage.set('Factory');

        // EthElements.Modal.show({
        //         template:'Factory',
        // });
    }
});

FlowRouter.route('/:baktAddr', {
    name: "address",
    action: function(params) {
    	changeBakt(params.baktAddr);
        currentPage.set('BaktPanels');
   }
});

            // EthElements.Modal.show({template:'Factory'});

FlowRouter.route('/:baktAddr/init', {
	name: "init",
	action: function() {
        currentPage.set('Init');

		// EthElements.Modal.show({
		// 		template: 'Init',
		// });	
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