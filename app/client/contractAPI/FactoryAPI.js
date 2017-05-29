//	108:"0x5f5869f9243b26e64a03c5ad336b9d29e570d8aa",
// https://www.ropsten.io/address/0x19124dbab3fcba78b8d240ed2f2eb87654e252d4
factoryAddresses = {
	108:"0x81dcc28c20494d5cf640acec5c196ba0713e8e7c",
	1:"",
	3:"",
	4:"0xb8bd4eb11e55d928a40d2e5c0b927724c7044288",
}

factoryABI = [{"constant":false,"inputs":[{"name":"_resource","type":"bytes32"}],"name":"changeResource","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"regName","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"withdraw","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"resource","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"value","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_fee","type":"uint256"}],"name":"set","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"destroy","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_value","type":"uint256"}],"name":"withdrawFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_owner","type":"address"}],"name":"changeOwner","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"withdrawFor","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_regName","type":"bytes32"},{"name":"_owner","type":"address"}],"name":"createNew","outputs":[{"name":"kAddr_","type":"address"}],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"VERSION","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"inputs":[{"name":"_creator","type":"address"},{"name":"_regName","type":"bytes32"},{"name":"_owner","type":"address"}],"payable":false,"type":"constructor"},{"payable":true,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"creator","type":"address"},{"indexed":false,"name":"regName","type":"bytes32"},{"indexed":false,"name":"addr","type":"address"}],"name":"Created","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"oldOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"ChangedOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"resource","type":"bytes32"}],"name":"ChangedResource","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"sender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Withdrawal","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"from","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"WithdrawFrom","type":"event"}];
factoryContract = web3.eth.contract(factoryABI);

currentFactory = factoryContract.at(factoryAddresses[web3.version.network] || '0x3b3d3de7a3271f0f6bea0b6b99e6f26a64dd3617');

factoryDict = {
	factoryAddress: new ReactiveVar(),
	owner: new ReactiveVar(),
	resource: new ReactiveVar(),
	regName: new ReactiveVar(),
	version: new ReactiveVar(),
	fee: new ReactiveVar(),
	events: new ReactiveVar([])
}

factoryUpdate = function() {
	factoryDict.factoryAddress.set(currentFactory.address);
	factoryDict.owner.set(currentFactory.owner());
	factoryDict.resource.set(web3.toUtf8(currentFactory.resource()));
	factoryDict.regName.set(web3.toUtf8(currentFactory.regName()));
	factoryDict.version.set(web3.toUtf8(currentFactory.VERSION()));
	factoryDict.fee.set(currentFactory.value());
}

factoryUpdate();

factoryEvents = currentFactory.allEvents({fromBlock: 0, toBlock: 'latest'},
	function(error, event){
	if (!error) {
		events = factoryDict.events.get();
		events.push(event);
		factoryDict.events.set(events);
		factoryUpdate();
	} else {
		console.log(error);
	}
}
);