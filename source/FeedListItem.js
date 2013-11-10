
enyo.kind({
	name: "FeedListItem",
	classes: "list-item",
	//ontap: "feedItemTapped",
	content: "Feed Name",
	icon: false,
	handlers: {
		onmousedown: "pressed",
		ondragstart: "released",
		onmouseup: "released"
	},
	components:[
		//TODO: someone needs to style this.. :(
		
		{name: "FeedName", style: "display: inline-block; position: absolute; margin-top: 6px;"},
		{tag: "br"},
		{name: "FeedURL", style: "display: inline-block; position: absolute; margin-top: 6px;"},
		{tag: "br"},
		{name: "FeedActive", kind: "onyx.ToggleButton", onChange: "toggleFeed" }
	],
	create:	function() {
		this.inherited(arguments);
		this.$.ItemTitle.setContent(this.content);
	},
	rendered: function() {
		if(this.icon) {
			this.$.ItemIcon.addStyles("display: inline-block;");
		}
	},
	pressed: function() {
		this.addClass("onyx-selected");
	},
	released: function() {
		this.removeClass("onyx-selected");
	},
	toggleFeed: function(inSender, inEvent) {
		console.error("Feed toggle tapped.");
		console.error(JSON.stringify(inEvent));
	}
});
