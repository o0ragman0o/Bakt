import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

modalcb = function(e) {
	console.log(e);
	EthElements.Modal.hide();
}

handleError = function(e) {
	console.log(e);
}


// baktAddr = "0x3b3d3de7a3271f0f6bea0b6b99e6f26a64dd3617";
// baktAddr = "0x0c49a7bd2cf4db5c00258a79e0561b854f4b61fd";
// baktAddr = "0x0580c4e173ffce2d6547c697399f1da9bac08fff";
// baktAddr = "0x544aaef4577ac8fae471240de83497b1fb1a586b";
// baktAddr = "0x4fc2eed0f68115079d29cbbe3c6f1c9bd6b51805";
// baktAddr = "0x76278fee9d8051311b9adf6f2b017cb802e34ec5";
baktAddr ="";
// currentBakt = "";
holder = new ReactiveVar();
holderAddr = new ReactiveVar();
holderAddr.set(EthAccounts.findOne().address);

ethAccount = new ReactiveVar();

baktDict = {
	baktAddress: new ReactiveVar(),
	panicked: new ReactiveVar(),
	timeLock: new ReactiveVar(new BigNumber(0)),
	timeToCalm: new ReactiveVar(new BigNumber(0)),
	holderAddr: new ReactiveVar(),
	holder: new ReactiveVar(),
	totalSupply: new ReactiveVar(new BigNumber(0)),
	fundBalance: new ReactiveVar(new BigNumber(0)),
	committedEther: new ReactiveVar(new BigNumber(0)),
	tokenPrice: new ReactiveVar(new BigNumber(0)),
	dividend: new ReactiveVar(new BigNumber(0)),
	trustee: new ReactiveVar(),
	hasUnclaimedDividends: new ReactiveVar(),
	holder: new ReactiveVar(new BigNumber(0)),
	pendingTXs: new ReactiveVar(),
}

update = function () {
	baktDict.panicked.set(currentBakt.panicked());
	baktDict.timeToCalm.set(currentBakt.timeToCalm());
	baktDict.totalSupply.set(currentBakt.totalSupply());
	baktDict.fundBalance.set(currentBakt.fundBalance());
	baktDict.committedEther.set(currentBakt.committedEther());
	baktDict.tokenPrice.set(currentBakt.tokenPrice());
	baktDict.totalSupply.set(currentBakt.totalSupply());
	baktDict.trustee.set(currentBakt.trustee());
	baktDict.hasUnclaimedDividends.set(currentBakt.hasUnclaimedDividends(ethAccount.get().address));
	baktDict.holder.set(function () {
			arr = currentBakt.holders(holderAddr.get());
			return {
				id: arr[0],
				lastClaimed: arr[1],
				votingFor: arr[2],
				tokenBalance: arr[3],
				etherBalance: arr[4],
				votes: arr[5],
			};
		}()
	);
	baktDict.pendingTXs.set(function () {
			ptxs = [];
			ptxObj = {};
			ptxArr = [];
			head = currentBakt.ptxHead().toNumber();
			tail = currentBakt.ptxTail().toNumber();
			while(tail != head) {
				var ptxObj = {};
				var ptxArr = currentBakt.pendingTxs(tail);
				ptxObj.ptxid = tail;
				ptxObj.blocked = ptxArr[0];
				ptxObj.timeLock = new Date(ptxArr[1] * 1000);
				ptxObj.from = ptxArr[2];
				ptxObj.to = ptxArr[3];
				ptxObj.value = ptxArr[4];
				ptxObj.data = ptxArr[5];
				ptxObj.state = ptxArr[0] ? "blocked" :
					(ptxArr[1] * 1000) > Date.now() ?
						"cleared" : "waiting";
				ptxs.push(ptxObj);
				++tail % 256;
			}
			return ptxs;
		}()
	);
}

ethAccount.set(EthAccounts.findOne());

// if (baktAddr != "") {
// 	currentBakt = baktContract.at(baktAddr);
// 	update()
// } else {
// 	EthElements.Modal.show({
// 			template: 'ChangeBakt',
// 	});
// }

web3.eth.filter().watch(function () {
	// update();
});


// update();