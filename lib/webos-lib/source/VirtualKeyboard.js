/**
	Collection of static webOS virtual keyboard functions and constants.
	
	Sends an _"onvirtualkeyboard"_ signal that you can listen for like:
		
	`{kind: "enyo.Signals", onvirtualkeyboard: "handleVirtualKeyboard"}`
*/

webos.keyboard = {
	//* The `webos.keyboard.types` object is a collection of keyboard type constants.
	types: {
		text: 0,
		password: 1,
		search: 2,
		range: 3,
		email: 4,
		number: 5,
		phone: 6,
		url: 7,
		color: 8
	},
	//* Returns _true_ or _false_ depending if the virtual keyboard is showing.
	isShowing: function() {
		return webos.keyboard._isShowing || false;
	},
	/**
		Shows the virtual keyboard of a given type from 'webos.keyboard.types'.
		Defaults to `webos.keyboard.types.text`.
	*/
	show: function(type){
		if(webos.keyboard.isManualMode()) {
			PalmSystem.keyboardShow(type || 0);
		}
	},
	//* Hides the virtual keyboard.
	hide: function(){
		if(webos.keyboard.isManualMode()) {
			PalmSystem.keyboardHide();
		}
	},
	/**
		Enables/disables manual mode, which requires you to programmably show/hide
		the virtual keyboard.
	*/
	setManualMode: function(mode){
		webos.keyboard._manual = mode;
		PalmSystem.setManualKeyboardEnabled(mode);
	},
	//* Returns _true_ or _false_ depending if the virtual keyboard is in manual mode.
	isManualMode: function(){
		return enyo.webOS.keyboard._manual || false;
	},
	//* Force the virtual keyboard to open.
	forceShow: function(type){
		webos.keyboard.setManualMode(true);
		PalmSystem.keyboardShow(inType || 0);
	},
	//* Force the virtual keyboard to close.
	forceHide: function(){
		webos.keyboard.setManualMode(true);
		PalmSystem.keyboardHide();
	}
};


if(window.PalmSystem && enyo.platform.webos && enyo.platform.webos >= 3) {
	//if device has a virtual keyboard, add functions
	Mojo = window.Mojo || {};
	Mojo.keyboardShown = function (inKeyboardShowing) {
		webos.keyboard._isShowing = inKeyboardShowing;
		enyo.Signals.send("onvirtualkeyboard", {type:"virtualkeyboard", showing: inKeyboardShowing});
	}
} else {
	webos.keyboard = undefined;
}