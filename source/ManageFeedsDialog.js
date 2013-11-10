/*jslint sloppy: true */
/*global enyo, onyx, preware, $L, console */
//shows a dialog that allows the user to change feed settings.

//TODO: AppMenu can open over this PopUp.. urgs.. :(

enyo.kind({
	name: "ManageFeedsDialog",
	classes: "enyo-popup",
	//TODO: someone with more design skills than me should optimize that... :(
	style: "padding: 30px; width: 90%; height: 90%;",
	kind: "onyx.Popup",
	//kind: "enyo.Control",
	centered: true,
	modal: true,
	floating: true,
	autoDismiss: false,
	scrim: true,
	scrimWhenModal: false,
	components: [
		{kind: "Signals", onLoadFeedsFinished: "onFeeds" },
		{
			kind: "enyo.Scroller",
			horizontal: "hidden",
			classes: "enyo-fill",
			style: "background-image:url('assets/bg.png')",
			touch: true,
			fit: true,
			components: [
				{name: "CategoryRepeater", kind: "Repeater", onSetupItem: "setupCategoryItem", count: 0, components: [
					{kind: "ListItem", content: "Category", ontap: "categoryTapped"}
				]},
				{kind: "onyx.Groupbox", components: [
					{kind: "onyx.GroupboxHeader", content: $L("New Feed")},
					{kind: "onyx.InputDecorator", components: [
						{kind: "onyx.TextArea", name: "newFeedName", hint: $L("Name") }
					]},
					{kind: "onyx.InputDecorator", components: [
						{kind: "onyx.TextArea", name: "newFeedURL", hint: $L("URL"), content: "http://" }
					]},
					{kind: "enyo.FittableColumns", components: [
						{tag: "div", content: $L("Compressed"), fit: true},
						{kind: "onyx.ToggleButton", name: "newFeedCompressedToggle"}
					]},
					{kind: "onyx.Button", style: "margin:5px;font-size:24px;float:center;", content: $L("Add Feed"), ontap: "addNewFeed"}
				]}, //end of action group
				{kind: "onyx.Button", style: "margin:5px;font-size:24px;float:center;", content: $L("Close"), ontap: "closePopup"}
			]
		}
	],
	create: function (inSender, inEvent) {
		this.inherited(arguments);
	},
	//handlers
	onFeeds: function (inSender, inEvent) {
		var i;
		console.error("MANAGEFEEDS: Got " + inEvent.feeds.length + " feeds. :)");
		this.feeds = inEvent.feeds;
		for (i = 0; i < this.feeds.length; i += 1) {
			console.error("Feed " + i + ": " + JSON.stringify(this.feeds[i]));
		}
	},
	closePopup: function (inSender, inEvent) {
		this.hide();
	},
	addNewFeed: function (inSender, inEvent) {
		var feed = {
			config: this.$.newFeedName.getValue() + ".conf",
			name: this.$.newFeedName.getValue(),
			url: this.$.newFeedURL.getValue(),
			gzipped: this.$.newFeedCompressedToggle.getValue()
		};
		//TODO: what to do with new feed? urgs..
	}
});