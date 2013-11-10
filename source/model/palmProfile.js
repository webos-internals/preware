/*global enyo, preware */

//some IPKGService calls only working for Mojo.Environment.DeviceInfo.platformVersionMajor > 1.
//this is for two reasons:
//1. I don't know how to test for webOS 2.x without Mojo...
//2. It won't make any sense to use enyo2 preware on older devices..
//see original preware => app => model => palmProfile.js for differences in the IPKGCalls for platformVersionMajor = 1.


enyo.singleton({
	name: "preware.PalmProfile",
	palmProfile: false,
	callback: false,
	getPalmProfile: function(callback, reload) {
		this.callback = callback;
	
		if (this.palmProfile && !reload) { //just send what we already have
			this.doPalmProfileReady({success: true, palmProfile: this.palmProfile, message: ""});
		} else { //need to load palm profile..
		
			//some cleanup
			this.palmProfile = false;
			preware.IPKGService.impersonate(this._gotPalmProfile.bind(this),
					"com.palm.configurator",
					"com.palm.db",
					"get", {"ids":["com.palm.palmprofile.token"]});
			
		}
	},
	_gotPalmProfile: function(payload) {		
		if (payload.returnValue === true) {
			this.palmProfile = payload.results[0];
		}
		
		this.doPalmProfileReady({success: payload.returnValue, palmProfile: this.palmProfile, message: ""});
	},
	doPalmProfileReady: function(payload) {
		if (this.callback) {
			this.callback(null, payload);
		}
	}
});


