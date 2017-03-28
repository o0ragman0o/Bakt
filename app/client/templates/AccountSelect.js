import "./AccountSelect.html";

Template.AccountSelect.helpers({
	accounts: function () {
		return web3.eth.accounts;
	}
})

Template.AccountSelect.events({

})