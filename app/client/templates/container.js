import "./container.html";

Template.Container.helpers ({
	opState: function() {
		return ["normal","panicked"][baktDict.panicked.get()];
	},

})
