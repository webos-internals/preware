enyo.kind({
	name: "PortsSearch",
	kind: "PortsHeader",
	title: "WebOS Ports Search",
	instant: false,
	submitCloses: true,
	taglines: [
		"Shiny search button, PRESS IT!",
	],
	events:{
		onSearch: ""
	},
	components:[
		{name: "SearchAnimator", kind: "Animator", onStep: "animatorStep", onStop: "animatorStop", value: 0, endValue: 0},
		{name: "Icon", kind: "Image", src: "icon.png", style: "height: 100%; margin: 0;"},
		{name: "TextDiv",
		tag: "div",
		style: "height: 100%; margin: 0;",
		components: [
			{name: "Title",
			content: "",
			style: "vertical-align: top; margin: 0; font-size: 21px;"},
			{name: "Tagline",
			content: "",
			style: "display: block; margin: 0; font-size: 13px;"}
		]},
		{name: "SearchDecorator",
		kind: "onyx.InputDecorator",
		style: "position: absolute; top: 10px; right: 8px; width: 32px; height: 32px; padding: 0; max-width: 100%; border-radius: 16px;",
		components:[
			{name: "SearchInput",
			id: "searchBox",
			kind: "onyx.Input",
			style: "width: 0; height: 30px; margin-left: 8px;",
			oninput: "inputChanged",
			onchange: "searchSubmitted"}
		]},
		{kind: "onyx.Button",
		src: "$lib/webos-ports-lib/assets/search-input-search.png",
		style: "position: absolute; width: 30px; height: 30px; right: 6px; top: 12px; padding: 0; border-radius: 24px;",
		ontap: "toggleSearch",
		components:[
			{kind: "Image",
			src: "$lib/webos-ports-lib/assets/search-input-search.png", style: "margin-top: -1px; padding: 0;"}
		]}
	],
	toggleSearch: function(inSender, inEvent) {
		this.$.SearchAnimator.setStartValue(this.$.SearchAnimator.value);
		this.$.SearchAnimator.setEndValue(this.$.SearchAnimator.endValue == 0 ? 1 : 0);
		this.$.SearchAnimator.play();
	},
	animatorStep: function(inSender, inEvent) {
		this.$.SearchInput.applyStyle("width", (this.hasNode().offsetWidth  * inSender.value) - 52 + "px");
		this.$.SearchDecorator.applyStyle("width", this.$.SearchInput.hasNode().offsetWidth + 32 + "px");
		enyo.Arranger.opacifyControl(this.$.Icon, 1.0 - inSender.value);
		enyo.Arranger.opacifyControl(this.$.TextDiv, 1.0 - inSender.value);
		
		if(this.$.SearchAnimator.endValue == 1) {
			this.$.SearchInput.hasNode().focus();
		}
	},
	animatorStop: function(inSender, inEvent) {
	},
	inputChanged: function(inSender, inEvent) {
		if(this.instant) {
			this.doSearch({value: this.$.SearchInput.getValue()});
		}
	},
	searchSubmitted: function(inSender, inEvent) {
		if(!this.instant) {
			this.doSearch({value: this.$.SearchInput.getValue()});
		}
		
		if(this.submitCloses) {
			this.toggleSearch();
			this.$.SearchInput.hasNode().blur();
		}
	},
	searchActive: function() {
		return this.$.SearchInput.getValue() != "";
	}
});
