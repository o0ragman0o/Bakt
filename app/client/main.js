import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

currentPage = new ReactiveVar();
pending = new ReactiveVar();
holder = new ReactiveVar();
isLive = new ReactiveVar();
holderAddr = new ReactiveVar();
holderAddr.set(EthAccounts.findOne().address);
ethAccount = new ReactiveVar();
title = new ReactiveVar("Bakt");
pendingTX = 0;
document.title = title.get();


cb = function(err, txHash) {
	if(!err) {
		console.log(txHash);
		$("body").addClass("wait");
		pendingTX++;
		EthElements.Modal.hide();
		itvlId = setInterval(
			function (err){
				console.log('tick', itvlId);
				if(web3.eth.getTransactionReceipt(txHash)) {
					clearInterval(itvlId);
					pendingTX--;
					if(!pendingTX) $("body").removeClass("wait");
					update();
				}
			},
			1000);
	} else {
		handleError(err);
	}
}

handleError = function(error) {
	console.log(error);
	EthElements.Modal.question({
		text: error,
		ok: EthElements.Modal.hide
	})
}

eventToString = function (event) {
	var str = "";
	keys = Object.keys(event.args);
	str += `${event.blockNumber} <strong> ${event.event} </strong><br>`;
	keys.forEach(function(key) {
		str += `<label class='event'><i>${key}</i></label>${event.args[key]}<br>`;
	})
	return str;
}

