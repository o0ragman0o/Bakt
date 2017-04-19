FlowRouter.route('/', {
    name: "address",
    action: function(params) {
		EthElements.Modal.show({
				template: 'ChangeBakt',
		});
    }
});

FlowRouter.route('/:baktAddr', {
    name: "address",
    action: function(params) {

    	changeBakt(params.baktAddr);
   }
});

// FlowRouter.route('/:baktAddr/init', {
// 	name: "init",
// 	action: function() {
// 		EthElements.Modal.show({
// 				template: 'Init',
// 		});	
// 	}
// });

// FlowRouter.notFound = {
// 	action() {
// 		FlowRouter.go('/');
// 		console.log("not found");
// 	}
// }

// FlowRouter.route('/:notFound*', {
//   name: 'notFound',
//   action: FlowRouter.notFound.action()
// });