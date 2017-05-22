import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

pending = new ReactiveVar();
holder = new ReactiveVar();
isLive = new ReactiveVar();
holderAddr = new ReactiveVar();
holderAddr.set(EthAccounts.findOne().address);
ethAccount = new ReactiveVar();
title = new ReactiveVar("Bakt");
document.title = title.get();


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

