import "./Events.html";

Template.Events.helpers ({
	baktEvents: function () {
		return baktDict.events.get();
	},
})
