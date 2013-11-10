
enyo.kind({
	name: "GrabberToolbar",
	kind: "onyx.Toolbar",
	components:[
		{kind: "onyx.Grabber"}
	],
	reflow: function() {
		this.children[0].applyStyle('visibility', enyo.Panels.isScreenNarrow() ? 'hidden' : 'visible');
	}
});
