if(typeof web3 === 'undefined')
	web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

EthAccounts.init();
EthBlocks.init();

