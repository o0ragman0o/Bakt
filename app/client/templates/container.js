import "./container.html";

Template.Container.helpers ({
	opState: function() {
		if (baktDict.panicked.get()) return "panicked";
	},
	hasBakt: function() {
		return baktDict.live.get();
	},

})
