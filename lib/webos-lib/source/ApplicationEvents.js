/**
	A convenient kind that is simply an <a href="#enyo.Signals">enyo.Signals</a> with all the various
	webOS-specific events outline.
	
	Admittedly this mostly helps with webOS event documentation and keeping
	track of what's available to listen for.
*/

enyo.kind({
	name: "enyo.ApplicationEvents",
	kind: enyo.Signals,
	/**
		Sent when the back gesture is performed or the ESC key is pressed.
		
		The originating keyup event data is passed for potential `preventDefault()`
		usage.
	*/
	onbackbutton: "",
	//* Sent when the window is activated.
	onactivate: "",
	//* Sent when the window is deactivated.
	ondeactivate: "",
	//* Sent when the app menu is toggled.
	onmenubutton: "",
	/**
		Sent when the app is relaunched (when the app is running but app attempts
		to be launched again).  The event data will contain `webos.launchParams()`.
	*/
	onrelaunch: "",
	/**
		Sent periodically and can be used to watch for significant memory usage by
		the application. Event data includes a _"state"_ property with the value
		_"low"_, _"critical"_, or _"normal"_.
	*/
	onlowmemory: "",
	/**
		Sent when the webOS virtual keyboard is opened or closed. Event data includes
		a _"showing"_ property that will be either _true_ or _false_.
	*/
	onvirtualkeyboard: ""
});
