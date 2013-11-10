enyo.kind({
	name: "enyo.Pie",
	published: {
		angle: 0,
	},
	style: "width: 90%; height: 90%;",
	components:[
		{name: "PieBackground",
		tag: "div",
		classes: "pie pie-background"},
		{name: "LeftMask", classes: "pie", components:[
			{name: "PieLeftHalf",
			classes: "pie pie-foreground"},
		]},
		{name: "RightMask", classes: "pie", components:[
			{name: "PieRightHalf",
			classes: "pie pie-foreground"},
		]}
	],
	rendered: function() {
		this.setupClipping();
		this.applyRotation();
	},
	angleChanged: function() {
		this.applyRotation();
	},
	setupClipping: function() {
		var size = this.hasNode().clientWidth;
		
		this.$.LeftMask.addStyles("clip: rect(0, " + size/2 + "px, " + size + "px, 0);");
		this.$.PieLeftHalf.addStyles("clip: rect(0," + size/2 + "px" + "," + size + "px" + ",0);");
		
		this.$.RightMask.addStyles("clip: rect(0," + size + "px" + "," + size + "px" + "," + size/2 + "px" + ");");
		this.$.PieRightHalf.addStyles("clip: rect(0," + size + "px" + "," + size + "px" + "," + size/2 + "px" + ");");
	},
	applyRotation: function() {
		this.$.PieRightHalf.addStyles("-webkit-transform: rotateZ(" + Math.min(this.angle - 180, 0) + "deg);");
		this.$.PieLeftHalf.addStyles("-webkit-transform: rotateZ(" + Math.max(this.angle, 180) + "deg);");
	},
});

enyo.kind({
	name: "enyo.ProgressOrb",
	fit: true,
	published: {
		value: 0,
		min: 0,
		max: 1000
	},
	style: "position: absolute; width: 48px; height: 48px;",
	events: {
		onButtonTap: ""
	},
	components:[
		{name: "ProgressAnimator", kind: "Animator", duration: 500, onStep: "animatorStep"},
		{name: "OuterRing", style: "width: 90%; height: 90%; padding: 5%; background-color: #000; border-radius: 50%;", components:[
			{name: "Pie", kind: "Pie", style: "position: absolute;"},
			{name: "CenterButton",
			kind: "onyx.Button",
			classes: "onyx-toolbar",
			style: "position: absolute; width:65%; height: 65%; margin: 12.5%; padding: 0; border-radius: 50%;",
			ontap: "buttonTapped"}
		]}
	],
	rendered: function() {
		this.inherited(arguments);
		this.$.CenterButton.applyStyle("font-size", this.$.CenterButton.hasNode().clientHeight/2 + "px");
		this.$.CenterButton.setContent(this.content);
	},
	buttonTapped: function() {
		this.doButtonTap();
	},
	valueChanged: function() {
		var val = this.$.ProgressAnimator.value;
		this.$.ProgressAnimator.setStartValue(val != undefined ? val : 0);
		this.$.ProgressAnimator.setEndValue(this.value);
		this.$.ProgressAnimator.play();
	},
	animatorStep: function(inSender) {
		var scaleMin = 0;
		var scaleMax = 1;

		var valueMax = this.max;
		var valueMin = this.min;
		var valueRange = valueMax - valueMin;
		var scaleRange = scaleMax - scaleMin;
	
		var scalar = ((scaleRange * (inSender.value - valueMin)) / valueRange) + scaleMin;
	
		//Clamp
		var scalar = Math.max(Math.min(scalar, scaleMax), scaleMin);
		var angle = 360 * scalar
	
		this.$.Pie.setAngle(angle);
	}
});
