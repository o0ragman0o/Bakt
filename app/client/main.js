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

cb = function(error, result) {
	if(!error) {
		console.log(result);
	} else {
		handleError(error);
	}
}

handleError = function(error) {
	console.log(error);
	EthElements.Modal.question({
		text: error,
		ok: EthElements.Modal.hide
	})
}

modalcb = function(error, result) {
	if(!error) {
		console.log(result);
		pending.set('pending');
		itvlId = setInterval(
			function (){
				console.log('tick');
				if(web3.eth.getTransactionReceipt(result)) {
					clearInterval(itvlId);
					pending.set();
					EthElements.Modal.hide();
				}
			},
			1000);
	} else {
		handleError(error);
	}
}

eventToString = function (event) {
	var str = "";
	console.log(event);
	keys = Object.keys(event.args);
	str += `${event.blockNumber} <strong> ${event.event} </strong><br>`;
	keys.forEach(function(key) {
		str += `<label class='event'><i>${key}</i></label>${event.args[key]}<br>`;
	})
	console.log(str);
	return str;
}

