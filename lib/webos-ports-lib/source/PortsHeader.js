enyo.kind({
	name: "PortsHeader",
	kind: "onyx.Toolbar",
	classes: "ports-header",
	title: "WebOS Ports Header",
	taglines: [
		"Random Tagline Here.",
	],
	components:[
		{kind: "Image", src: "icon.png", style: "height: 100%; margin: 0;"},
		{tag: "div",
		style: "height: 100%; margin: 0 0 0 8px;",
		components: [
			{name: "Title",
			content: "",
			style: "vertical-align: top; margin: 0; font-size: 21px;"},
			{name: "Tagline",
			content: "",
			style: "display: block; margin: 0; font-size: 13px;"}
		]}
	],
	rendered: function() {
		this.inherited(arguments);
		this.$.Title.setContent(this.title);
		this.$.Tagline.setContent(this.taglines[Math.floor(Math.random() * this.taglines.length)]);
	}
});
