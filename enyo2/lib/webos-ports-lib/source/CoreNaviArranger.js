enyo.kind({
	name: "enyo.CoreNaviArranger",
	kind: "Arranger",
	layoutClass: "enyo-arranger enyo-arranger-fit",
	calcArrangementDifference: function(inI0, inA0, inI1, inA1) {
		return this.containerBounds.width * 0.5;
	},
	destroy: function() {
		var c$ = this.container.children;
		for (var i=0, c; c=c$[i]; i++) {
			this.pushPopControl(c, 0, 1);
			c.setShowing(true);
			c.resized();
		}
		this.inherited(arguments);
	},
	arrange: function(inC, inName) {
		for (var i=0, c, s, o; c=inC[i]; i++) {
			o = (i == 0) ? 1 : 0;
			switch(i) {
				case 0:
					s = 1;
					break;
				case 1:
					s = 0.66;
					break;
				case inC.length - 1:
					s = 1.33;
					break;
			}
			this.arrangeControl(c, {scale:s, opacity:o});
		}
	},
	start: function() {
		this.inherited(arguments);
		var c$ = this.container.children;
		for (var i=0, c; c=c$[i]; i++) {
			c.setShowing(i == this.container.fromIndex || i == (this.container.toIndex));
			if (c.showing) {
				c.resized();
			}
		}
		//FIXME: Shouldn't be doing this here, but create() never gets called
		if(!this.vendor) this.vendor = this.getVendor();
	},
	finish: function() {
		this.inherited(arguments);
		var c$ = this.container.children;
		for (var i=0, c; c=c$[i]; i++) {
			c.setShowing(i == this.container.toIndex);
		}
	},
	flowControl: function(inControl, inArrangement) {
		enyo.Arranger.positionControl(inControl, inArrangement);
		var a = inArrangement.scale;
		var o = inArrangement.opacity;
		if (a != null && o != null) {
			this.pushPopControl(inControl, a, o);
		}
	},
	pushPopControl: function(inControl, inScale, inOpacity) {
		var s = inScale;
		var o = inOpacity
		if(enyo.dom.canAccelerate) {
			inControl.applyStyle(this.vendor + "transform", "scale3d(" + s + "," + s + ",1)");
		}
		else {
			inControl.applyStyle(this.vendor + "transform", "scale(" + s + "," + s + ")");
		}
		enyo.Arranger.opacifyControl(inControl, inOpacity);
	},
	getVendor: function() {
		var prefix = '';
		var prefixes = ['transform', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform'];
		var tmp = document.createElement('div');
		for(i = 0; i < prefixes.length; i++) {
			if(typeof tmp.style[prefixes[i]] != 'undefined') {
				prefix = prefixes[i];
				break;
			}
			else {
				prefix = null;
			}
		}
		switch(prefix) {
			case 'transform':
				prefix = '';
				break;
			case 'WebkitTransform':
				prefix = '-webkit-';
				break;
			case 'MozTransform':
				prefix = '-moz-';
				break;
			case 'OTransform':
				prefix = '-o-';
				break;
			case 'msTransform':
				prefix = '-ms-';
				break;
		}
		return prefix;
	}
});
