enyo.kind({
	name: "enyo.AppMenu",
	kind: onyx.Menu,
	classes: "enyo-appmenu",
	defaultKind: "enyo.AppMenuItem",
	published: {
		maxHeight: 400
	},
	components: [
		{
			kind: enyo.Signals,
			onmenubutton: "toggle"
		}
	],
	//* @public
	toggle: function() {
		// if we're visible, hide it; else, show it
		if (this.showing)
			this.hide();
		else
			this.show();
	},
	//* @public
	show: function() {
		var height = 30 * this.controls.length - 1; /* take the scroller out of the equation */
		
		if (height > this.maxHeight) {
			height = this.maxHeight;
		}
		
		this.setBounds({
			height: height
		});
		this.inherited(arguments);
	},
	//* @private
	maxHeightChanged: function() {
		// if this is currently visible, go ahead and call show() to update the height if necessary
		if (this.showing) {
			this.show();
		}
	}
});

enyo.kind({
	name: "enyo.AppMenuItem",
	kind: onyx.MenuItem,
	classes: "enyo-item"
});