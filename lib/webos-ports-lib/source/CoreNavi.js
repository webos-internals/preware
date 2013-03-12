enyo.kind({
	name: "CoreNavi",
	style: "background-color: black;",
	layoutKind: "FittableColumnsLayout",
	fingerTracking: false, //Use legacy keyEvents by default, set to true to enable finger-tracking events
	components:[
		{style: "width: 33%;"},
		{kind: "Image",
		src: "$lib/webos-ports-lib/assets/lightbar.png",
		fit: true,
		style: "width: 33%; height: 24px; padding-top: 2px;",
		ondragstart: "handleDragStart",
		ondrag: "handleDrag",
		ondragfinish: "handleDragFinish"},
		{style: "width: 33%;"},
	],
	//Hide on hosts with a hardware gesture area
	create: function() {
		this.inherited(arguments);
		if(window.PalmSystem)
			this.addStyles("display: none;");
	},
	//CoreNaviDrag Event Synthesis
	handleDragStart: function(inSender, inEvent) {
		//Back Gesture
		if(this.fingerTracking == false) {
			if(inEvent.xDirection == -1) {
				//Back Gesture
				evB = document.createEvent("HTMLEvents");
				evB.initEvent("keyup", "true", "true");
				evB.keyIdentifier = "U+1200001";
				document.dispatchEvent(evB);
			}
			else {
				//Forward Gesture
			}
		}
		else {
			//Custom drag event
			enyo.Signals && enyo.Signals.send && enyo.Signals.send('onCoreNaviDragStart', inEvent);
		}
	},
	handleDrag: function(inSender, inEvent) {
		if(this.fingerTracking == true) {
			//Custom drag event
			enyo.Signals && enyo.Signals.send && enyo.Signals.send('onCoreNaviDrag', inEvent);
		}
	},
	handleDragFinish: function(inSender, inEvent) {
		if(this.fingerTracking == true) {
			//Custom drag event
			enyo.Signals && enyo.Signals.send && enyo.Signals.send('onCoreNaviDragFinish', inEvent);
		}
	},
});
