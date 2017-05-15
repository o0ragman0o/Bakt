factoryAddress = "0x5f5869f9243b26e64a03c5ad336b9d29e570d8aa"; // 108 chain
factoryABI = [{"constant":false,"inputs":[{"name":"_resource","type":"bytes32"}],"name":"changeResource","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"regName","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"resource","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"withdraw","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"value","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_fee","type":"uint256"}],"name":"set","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"destroy","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_owner","type":"address"}],"name":"changeOwner","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_regName","type":"bytes32"},{"name":"_owner","type":"address"}],"name":"createNew","outputs":[{"name":"kAddr_","type":"address"}],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"VERSION","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"inputs":[{"name":"_creator","type":"address"},{"name":"_regName","type":"bytes32"},{"name":"_owner","type":"address"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_creator","type":"address"},{"indexed":false,"name":"_regName","type":"bytes32"},{"indexed":false,"name":"_address","type":"address"}],"name":"Created","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"oldOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"ChangedOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"resource","type":"bytes32"}],"name":"ChangedResource","type":"event"}];
factoryContract = web3.eth.contract(factoryABI);

currentFactory  = factoryContract.at(factoryAddress);

factoryDict = {
	factoryAddress: new ReactiveVar(),
	owner: new ReactiveVar(),
	resource: new ReactiveVar(),
	regName: new ReactiveVar(),
	version: new ReactiveVar(),
	fee: new ReactiveVar(),
	events: new ReactiveVar()
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