
enyo.kind({
	name: "Toast",
	kind: "enyo.Slideable",
	style: "position: absolute;\
		bottom: 54px;\
		width: 90%;\
		margin-left: -45%;\
		left: 50%;\
		height: 33%;\
		color: black;\
		background-color: lightgrey;\
		border: 1px grey;\
		border-radius: 16px 16px 0 0;\
		text-align: center;",
	classes: "onyx-toolbar",
	min: 0,
	max: 100,
	value: 100,
	unit: "%",
	axis: "v",
	draggable: false,
});
