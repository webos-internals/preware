
enyo.kind({
	name: "ListItem",
	classes: "list-item",
	ontap: "menuItemTapped",
	content: "List Item",
	icon: false,
	handlers: {
		onmousedown: "pressed",
		ondragstart: "released",
		onmouseup: "released"
	},
	components:[
		{name: "ItemIcon", kind: "Image", style: "display: none; height: 100%; margin-right: 8px;"},
		{name: "ItemTitle", style: "display: inline-block; position: absolute; margin-top: 6px;"}
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
	}
});
