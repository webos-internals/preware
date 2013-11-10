// Preware App kind and main window.
/*jslint sloppy: true */
/*global enyo, onyx, preware, $L, navigator, device, PalmServiceBridge */

//to reload changes on device: luna-send -n 1 palm://com.palm.applicationManager/rescan {}

enyo.kind({
	name: "App",
	layoutKind: "FittableRowsLayout",
	components: [
		{
			kind: "Signals",
			onbackbutton: "handleBackGesture",
			onCoreNaviDragStart: "handleCoreNaviDragStart",
			onCoreNaviDrag: "handleCoreNaviDrag",
			onCoreNaviDragFinish: "handleCoreNaviDragFinish"
		},
		{name: "AppPanels", kind: "AppPanels", fit: true, onSettings: "showSettingsDialog", onManageFeeds: "showManageFeedsDialog"},
		{kind: "CoreNavi", fingerTracking: true},
		{name: "SettingsDialog", kind: "SettingsDialog"},
		{name: "ManageFeedsDialog", kind: "ManageFeedsDialog"},
		{
			kind: "AppMenu", //onSelect: "appMenuItemSelected", 
			components: [
				//{ content:"Install Package", ontap: "showInstallDialog" },
				{ content: $L("Preferences"), ontap: "showSettingsDialog" },
				{ content: $L("Manage Feeds"), ontap: "showManageFeedsDialog" }
			]
		}
	],
	//Handlers
	handleBackGesture: function (inSender, inEvent) {
		this.$.AppPanels.setIndex(0);
		inEvent.preventDefault();
	},
	handleCoreNaviDragStart: function (inSender, inEvent) {
		this.$.AppPanels.dragstartTransition(this.$.AppPanels.draggable === false ? this.reverseDrag(inEvent) : inEvent);
	},
	handleCoreNaviDrag: function (inSender, inEvent) {
		this.$.AppPanels.dragTransition(this.$.AppPanels.draggable === false ? this.reverseDrag(inEvent) : inEvent);
	},
	handleCoreNaviDragFinish: function (inSender, inEvent) {
		this.$.AppPanels.dragfinishTransition(this.$.AppPanels.draggable === false ? this.reverseDrag(inEvent) : inEvent);
	},
	showSettingsDialog: function (inSender, inEvent) {
		this.$.SettingsDialog.updateValues();
		this.$.SettingsDialog.show();
	},
	showManageFeedsDialog: function (inSender, inEvent) {
		this.$.ManageFeedsDialog.show();
	},
	//Utility Functions
	reverseDrag: function (inEvent) {
		inEvent.dx = -inEvent.dx;
		inEvent.ddx = -inEvent.ddx;
		inEvent.xDirection = -inEvent.xDirection;
		return inEvent;
	}
});
