/**
	Binds LunaSysMgr application events to <a href="#enyo.Signals">enyo.Signals</a>.
	
	_"onactivate"_: When the window is activated
	_"ondeactivate"_: When the window is deactivated
	_"onmenubutton"_: When the app menu is toggled
	_"onrelaunch"_: When the app is relaunched
	_"onlowmemory"_: Used to monitor an app's memory uasage
*/

if (window.PalmSystem) {
	Mojo = window.Mojo || {};

	// LunaSysMgr calls this when the windows is maximized or opened.
	Mojo.stageActivated = function() {
		enyo.Signals.send("onactivate");
	};

	// LunaSysMgr calls this when the windows is minimized or closed.
	Mojo.stageDeactivated = function() {
		enyo.Signals.send("ondeactivate");
	};

	// LunaSysMgr calls this whenever an app is "launched;" 
	Mojo.relaunch = function() {
		var param = webos.launchParams();
		if(param["palm-command"] == "open-app-menu") {
			enyo.Signals.send("onmenubutton");
		} else {
			enyo.Signals.send("onrelaunch", param);
		}
		// Need to return true to tell sysmgr the relaunch succeeded.
		// otherwise, it'll try to focus the app, which will focus the first
		// opened window of an app with multiple windows.
		return true;
	};
	
	// LunaSysMgr calls this when a KeepAlive app's window is shown
	// Only used by webOS builtin system apps
	Mojo.show = function() {
		enyo.Signals.send("onappshown");
	};
	
	// LunaSysMgr calls this when a KeepAlive app's window is hidden
	// Only used by webOS builtin system apps
	Mojo.hide = function() {
		enyo.Signals.send("onapphide");
	};
	
	// Applications that use significant memory can watch for this event and try to reduce
	// their memory usage when they see a non-normal state. This has a `state` property
	// with the value "low", "critical", or "normal".
	Mojo.lowMemoryNotification = function(params) {
		enyo.Signals.send("onlowmemory", {type: "lowmemory", state: params.state});
	};
}
