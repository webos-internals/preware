enyo.kind({
	name: "NumberPad",
	layoutKind: "FittableRowsLayout",
	events: {
		onKeyTapped: ""
	},
	defaultKind: enyo.kind({kind: "onyx.Button",
				classes: "onyx-toolbar",
				style: "width: 33.3%; height: 25%; font-size: 32pt; font-weight: bold;",
				ontap: "keyTapped"}),
	components:[
		{content: "1", style: "border-radius: 16px 0 0 0;"},
		{content: "2", style: "border-radius: 0;"},
		{content: "3", style: "border-radius: 0 16px 0 0;"},
		{content: "4", style: "border-radius: 0;"},
		{content: "5", style: "border-radius: 0;"},
		{content: "6", style: "border-radius: 0;"},
		{content: "7", style: "border-radius: 0;"},
		{content: "8", style: "border-radius: 0;"},
		{content: "9", style: "border-radius: 0;"},
		{content: "*", style: "border-radius: 0 0 0 16px;"},
		{content: "0", style: "border-radius: 0;"},
		{content: "#", style: "border-radius: 0 0 16px 0;"},
	],
	keyTapped: function(inSender) {
		this.doKeyTapped({value: inSender.content});
	}
});
