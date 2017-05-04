import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

cb = function(error, result) {
	if(!error) {
		console.log(result);
	} else {
		handleError(error);
	}
}

handleError = function(error) {
	console.log(error);
}

modalcb = function(error, result) {
	cb(error, result);
	EthElements.Modal.hide();
}

holder = new ReactiveVar();
isLive = new ReactiveVar();
holderAddr = new ReactiveVar();
holderAddr.set(EthAccounts.findOne().address);

ethAccount = new ReactiveVar();

baktDict = {
	live: new ReactiveVar(),
	baktAddress: new ReactiveVar(),
	regName: new ReactiveVar(),
	version: new ReactiveVar(),
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
	holder: new ReactiveVar(new BigNumber(0)),
	pendingTXs: new ReactiveVar(),
	events: new ReactiveVar([])
}

update = function () {
	baktDict.panicked.set(currentBakt.panicked());
	baktDict.regName.set(web3.toUtf8(currentBakt.regName()));
	baktDict.version.set(web3.toUtf8(currentBakt.VERSION()));
	baktDict.timeToCalm.set(currentBakt.timeToCalm());
	baktDict.totalSupply.set(currentBakt.totalSupply());
	baktDict.fundBalance.set(currentBakt.fundBalance());
	baktDict.committedEther.set(currentBakt.committedEther());
	baktDict.tokenPrice.set(currentBakt.tokenPrice());
	baktDict.totalSupply.set(currentBakt.totalSupply());
	baktDict.trustee.set(currentBakt.trustee());
	baktDict.holder.set(function () {
			arr = currentBakt.holders(holderAddr.get());
			return {
				id: arr[0],
				votingFor: arr[1],
		        offerExpiry:arr[2],
				lastClaimed: arr[3],
				tokenBalance: arr[4],
				etherBalance: currentBakt.etherBalanceOf(holderAddr.get()),
				votes: arr[6],
		        offerAmount:arr[7],
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

eventToString = function (event) {
	var str = "";
	console.log(event);
	keys = Object.keys(event.args);
	str += event.blockNumber + " ";
	str += "<strong>" + event.event + "</strong><br>";
	keys.forEach(function(key) {
		str += "<label class='event'><i>" + key + "</i></label>";
		str += event.args[key] + "<br>";
	})
	console.log(str);
	return str;
}

changeBakt = function (baktAddr) {
	// delete currentBakt;
	baktDict.live.set(false);
	if(baktAddr) {
		currentBakt = baktContract.at(baktAddr);
		try { currentBakt.VERSION() }
		catch(err) { 
			console.log(err);
			// delete currentBakt;
			modalcb();
			FlowRouter.go('/');			
		}
		if (web3.toUtf8(currentBakt.VERSION()).slice(0,4) == "Bakt"){
			baktDict.baktAddress.set(baktAddr);
			baktDict.live.set(true);
			localStorage.setItem("lastBakt", baktAddr);
			events = currentBakt.allEvents({fromBlock: 0, toBlock: 'latest'});
			events.watch(function(error, event){
					if (!error)
						events = baktDict.events.get();
						events.push(eventToString(event));
						baktDict.events.set(events);
						console.log(event);
				});

			modalcb();
			update();
			oneSec = Meteor.setInterval(update, 1000);
		} else {
			modalcb();
			FlowRouter.go('/');
		}
	} else {
		modalcb();
		FlowRouter.go('/');
	}

}


