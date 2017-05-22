//	108:"0x5f5869f9243b26e64a03c5ad336b9d29e570d8aa",
// https://www.ropsten.io/address/0x19124dbab3fcba78b8d240ed2f2eb87654e252d4
factoryAddresses = {
	108:"0x3fd2fb9db92d647c473c4361f868b033d743f1b0",
	1:"0xc7c11eb6983787f7aa0c20abeeac8101cf621e47",
	3:"0x19124dbab3fcba78b8d240ed2f2eb87654e252d4",
	4:"0xd0198D2a9C2E4474bCbE5514b196cb367D5DA790",
}

factoryABI = [{"constant":false,"inputs":[{"name":"_resource","type":"bytes32"}],"name":"changeResource","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"regName","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"resource","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"withdraw","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"value","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_fee","type":"uint256"}],"name":"set","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"destroy","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_owner","type":"address"}],"name":"changeOwner","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_regName","type":"bytes32"},{"name":"_owner","type":"address"}],"name":"createNew","outputs":[{"name":"kAddr_","type":"address"}],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"VERSION","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"inputs":[{"name":"_creator","type":"address"},{"name":"_regName","type":"bytes32"},{"name":"_owner","type":"address"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_creator","type":"address"},{"indexed":false,"name":"_regName","type":"bytes32"},{"indexed":false,"name":"_address","type":"address"}],"name":"Created","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"oldOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"ChangedOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"resource","type":"bytes32"}],"name":"ChangedResource","type":"event"}];
factoryContract = web3.eth.contract(factoryABI);

currentFactory = factoryContract.at(factoryAddresses[web3.version.network] || '0x3b3d3de7a3271f0f6bea0b6b99e6f26a64dd3617');

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