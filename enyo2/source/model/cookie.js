/*global enyo, preware */

enyo.singleton({
	name: "preware.PrefCookie",
	published: {
		prefs: false
	},
	get: function(reload) {
		try {
			if (!this.prefs || reload) {
				//setup our default preferences
				this.prefs = {
					//Global Group
					theme: 'palm-default',
					
					//Startup Group
					updateInterval: 'launch',
					lastUpdate: 0, //will be updated every time update is successful
					fixUnknown: true,
					
					// Actions Group
					//rescanLauncher: true, // no longer in use
					avoidBugs: true,
					useTuckerbox: false,
					ignoreDevices: false,
					
					// Main Scene Group
					showAvailableTypes: false,
					showTypeApplication: true,
					showTypeTheme: false,
					showTypePatch: true,
					showTypeOther: true,
					
					// List Scene Group
					listSort: 'default',
					secondRow: 'version,maint',
					listInstalled: false,
					searchDesc: false,
					
					// Background Group
					backgroundUpdates: 'disabled',
					autoInstallUpdates: false,
					
					// Blacklist Group
					blackList: [],
					blackAuto: 'none',
					
					// For Resource Handler Object
					resourceHandlerCheck: true,
					
					// Hidden Advanced Group
					rodMode:		false, // haha
					browseFromRoot:	false
					//allowFlagSkip: false
				};
				
				// uncomment to delete cookie for testing
				//enyo.setCookie("preware-cookie-set", false);
				this.getAllValues();
			}
			return this.prefs;
		} catch (e) {
			enyo.error('preferenceCookie#get', e);
		}
	},
	getAllValues: function() {
		var field, value;
		if (enyo.getCookie("preware-cookie-set")) {
			for (field in this.prefs) {
				if (this.prefs.hasOwnProperty(field)) {
					value = enyo.getCookie(field);
					if (value !== undefined) {
						this.prefs[field] = value;
					}
				}
			}
		} else {
			this.setAllValues();
		}
	},
	put: function(obj, value) {
		try {
			if (value) {
				this.prefs[obj] = value;
				enyo.setCookie(obj, value); //take a shortcut here.
			} else {
				this.prefs = obj;
				this.setAllValues();
			}
		} catch (e) {
			enyo.error('preferenceCookie#put', e);
		}
	},
	setAllValues: function() {
		var field;
		for (field in this.prefs) {
			if (this.prefs.hasOwnProperty(field)) {
				enyo.setCookie(field, this.prefs[field]);
			}
		}
		enyo.setCookie("preware-cookie-set", true);
	}
});

//TODO: how to get app Version?
enyo.singleton({
	name: "preware.VersionCookie",
	isFirst: false,
	isNew: false,
	init: function() {
		var version;
		this.cookie = false;
		this.isFirst = false;
		this.isNew = false;			 
		
		version = enyo.getCookie("version");
		if (version) {
			if (version === preware.Globals.getAppVersion()) {
				//was the same version.
				enyo.log("VersionCookie: Same version.");
			} else {
				this.isNew = true;
				enyo.setCookie("version", preware.Globals.getAppVersion());
				enyo.log("VersionCookie: New version.");
			}
		} else {
			//first launch
			this.isFirst = true;
			this.isNew = true;
			enyo.setCookie("version", preware.Globals.getAppVersion());
			enyo.log("VersionCookie: First run.");
		}
	},
	showStartupScene: function() {
		if (this.isNew || this.isFirst) {
			return true;
		} 
		return false;
	}
});
