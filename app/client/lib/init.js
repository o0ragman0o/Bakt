var ENS = require('ethereum-ens');
uts46 = require('idna-uts46');

if(typeof web3 === 'undefined')
	web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
	// web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8546'));

ens = new ENS(web3);

EthAccounts.init();
EthBlocks.init();


networkName = ["","","morden.","ropsten.","rinkeby."][web3.version.network] || "Private";

cb = function(err, txHash) {
	if(!err) {
		console.log(txHash);
		$("body").addClass("wait");
		itvlId = setInterval(
			function (err){
				console.log('tick');
				if(web3.eth.getTransactionReceipt(txHash)) {
					clearInterval(itvlId);
					$("body").removeClass("wait");
					update();
					EthElements.Modal.hide();
				}
			},
			1000);
	} else {
		handleError(err);
	}
}
