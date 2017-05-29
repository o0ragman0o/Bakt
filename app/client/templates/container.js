import "./container.html";

Template.Container.helpers ({
		page: function() {
		return currentPage.get();
	},
})


// Template.Container.helpers ({
Template.BaktPanels.helpers ({
	pending: function() {
		return pending.get();
	},
	opState: function() {
		if (baktDict.panicked.get()) return "panicked";
	},
	hasBakt: function() {
		return baktDict.live.get();
	},

})
