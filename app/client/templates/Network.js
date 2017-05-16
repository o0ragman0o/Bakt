import "./Network.html";

Template.Network.helpers({
	liveStatus: function () {
		return web3.isConnected();
	},
	blockNumber: function () {
		return EthBlocks.latest.number;
		// return web3.eth.blockNumber;
	},
	network: function () {
		return ["Olympic","Main","Morden","Ropsten","Rinkeby"]
			[(web3.version.network < 5)?web3.version.network:"Private"];
	},
	provider: function () {
		return web3.currentProvider.host;
	},
	baktAddr: function () {
		return baktDict.baktAddress.get();
	},
	holderAddr: function () {
		return holderAddr.get();
	}
})