/**
	Static symkey functionality for webOS 1.x and 2.x.
	
	When the symkey on the physical keyboard is pressed, this properly opens the
	symtable within webOS.  Automatically opens on the symkey, but can also be
	manually activated from `webos.showSymTable()`.
*/

if(enyo.platform.webos && enyo.platform.webos < 3) {
	enyo.singleton({
		name: "enyo.SymKey",
		//* @protected
		kind: enyo.Component,
		components: [
			{kind:"enyo.Signals", onkeydown:"keydown", onrelaunch:"relaunch"}
		],
		//* @public
		//* Opens the webOS symtable popup.
		show: function(target) {
			this.symKeyTarget = target || document;
			this.request = new webOS.ServiceRequest({
				service: "palm://com.palm.applicationManager",
				method: "launch"
			});
			this.request.error(this, "serviceFailure");
			request.go({
				"id":"com.palm.systemui",
				"params": {
					"action":"showAltChar"
				}
			});
		},
		//* @protected
		keydown:function(inSender, inEvent) {
			if(inEvent.keyCode === 17) {
				this.show(inEvent.target);
			}
		},
		serviceFailure: function(inSender, inError) {
			enyo.error(enyo.json.stringify(inError));
		},
		relaunch: function(inSender, inEvent) {
			var altCharSelected = enyo.json.parse(PalmSystem.launchParams).altCharSelected;
			if(!altCharSelected) {
				return false;
			}

			var selection, newEvent, charCode;
			// Put the text into the editable element
			selection = window.getSelection();
			// make sure there are any available range to index as
			// getRangeAt does not protect against that
			if (selection && selection.rangeCount > 0 && selection.getRangeAt(0)) {
				document.execCommand("insertText", true, altCharSelected);
			}

			// Fire off our fake events
			charCode = altCharSelected.charCodeAt(0);
			this.sendFakeKey("keydown", charCode);
			this.sendFakeKey("keypress", charCode);
			this.sendFakeKey("keyup", charCode);
		},
		sendFakeKey: function(eventType, charCode) {
			var e = document.createEvent("Events");
			e.initEvent(type, true, true);

			e.keyCode = charCode;
			e.charCode = charCode;
			e.which = charCode;

			this.symKeyTarget.dispatchEvent(e);
			return e;
		}
	});
}

//* @public
/**
	Opens the webOS symtable popup on webOS 1.x and 2.x devices.
	
	Should rarely ever need to be manually called, as it is called by default whenever
	the symkey on the physical keyboard is pressed.
	
	The optional _target_ parameter specifies the target editable element that will
	receive the key input events. Default, if not specified, is `document`.
*/
webos.showSymTable = function(target) {
	if(enyo.platform.webos && enyo.platform.webos < 3) {
		enyo.SymKey.show(target);
	}
};
