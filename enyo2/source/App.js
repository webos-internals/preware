// Preware App kind and main window.
/*global enyo, onyx, preware, $L, navigator */

//to reload changes on device: luna-send -n 1 palm://com.palm.applicationManager/rescan {}

enyo.kind({
	name: "preware.App",
	//fit: true,
	kind: enyo.Control,
	layoutKind: "FittableRowsLayout",
	classes: "onyx enyo-fit", 
	// required ipkgservice
	ipkgServiceVersion: 14,
	components:[
		//catch phonegap device ready signal.
		{ kind: "Signals", ondeviceready: "deviceready" },
		//initialize preware toolbare with preware in it and a search field + button.
			{kind: "onyx.MoreToolbar", components: [
				{content: "Preware" },
				{kind: "onyx.InputDecorator", style: "position:absolute; right:0px", components: [
		 		{kind: "onyx.Input", name: "searchTerm", placeholder: "Search packet", onkeydown: "searchOnEnter"},
		 		{kind: "Image", src: "assets/search-input-search.png", ontap: "search"}
			]}
		 ]},
		//want to have Panels that are "cards" on phones (<800px width) and sliding stuff otherwise.
		{kind: "Panels", draggable: true, wrap: false, 
		narrowFit: true, fit: true, 
		arrangerKind: "CollapsingArranger", 
		classes: "app-panels", 
		components: [
			{kind: enyo.FittableRows, components: [
				{kind: onyx.Button, content: "getVersion", ontap: "versionTap" },
				{kind: onyx.Button, content: "getMachineName", ontap: "machineName" },
				{kind: onyx.Button, content: "loadFeeds", ontap: "startLoadFeeds" },
				{kind: enyo.Scroller, fit: true, components: [
					{name: "out", content: "press button...<br>", allowHtml: true, fit: true}
				]}
			]}
		]}
	],
	log: function(msg) {
		this.$.out.addContent(msg + "<br>");
	},
	deviceready: function(inSender, inEvent) {
		this.log("device ready received, yeah. :)");
		if(!PalmServiceBridge) {
			this.log("No PalmServiceBridge... not running on device?? :(");
		} else {
			this.log("PalmServiceBridge seems to exist.");
		}
		this.log("Mojo.Environment.DeviceInfo.platformVersion: " + Mojo.Environment.DeviceInfo.platformVersion);
		this.log("device.version: " + device && device.version);

		this.log("Mojo.Environment.DeviceInfo.modelNameAscii: " + Mojo.Environment.DeviceInfo.modelNameAscii);
		this.log("device.name: " + device && device.name);
	},
	versionTap: function(inSender, inEvent) {
		preware.IPKGService.version(this.gotVersion.bind(this));
		this.log("getting version");
	},
	gotVersion: function(version) {
		this.log("version: " + JSON.stringify(version) + "<br>");
	},
	machineName: function() {
		preware.IPKGService.getMachineName(this.gotMachineName.bind(this));
		this.log("getting machine name.");
	},
	gotMachineName: function(machineName) {
		this.log("Got machinename: " + machineName + " (" + JSON.stringify(machineName) + ")");
	},
	startLoadFeeds: function() {
		this.log("starting to load feeds.");
		preware.DeviceProfile.getDeviceProfile(this.gotDeviceProfile.bind(this), false);
		this.log("...");
	},
	gotDeviceProfile: function(inSender, inEvent) {
		this.log("got device profile: " + inEvent && inEvent.success);
		if (!inEvent.success || !inEvent.deviceProfile) {
			this.log("failure...");
			preware.IPKGService.getMachineName(this.onDeviceType.bind(this));
			this.log("getting machine name.");
		} else {
			this.log("got deviceProfile: " + JSON.stringify(inEvent.deviceProfile));
			this.deviceProfile = inEvent.deviceProfile;
			preware.PalmProfile.getPalmProfile(this.gotPalmProfile.bind(this), false);
		}
	},
	gotPalmProfile: function(inSender, inEvent) {
		if (!inEvent.success || !inEvent.palmProfile) {
			this.log("failure...");
			preware.IPKGService.getMachineName(this.onDeviceType.bind(this));
			this.log("getting machine name.");
		} else {
			this.log("got palmProfile.");
			this.palmProfile = inEvent.palmProfile;
			preware.IPKGService.setAuthParams(this.authParamsSet.bind(this),
					this.deviceProfile.deviceId,
					this.palmProfile.token);
		}
	},
	authParamsSet: function(inResponse) {
		this.log("got authParams: " + JSON.stringify(inResponse));
		preware.IPKGService.getMachineName(this.onDeviceType.bind(this));
		this.log("getting machine name.");
	},
	onDeviceType: function(inEvent) {
		// start with checking the internet connection
		this.log("request connection status.");
		
		navigator.service.Request("palm://com.palm.connectionmanager",{
			method: "getstatus",
			onSuccess: this.onConnection.bind(this),
			onFailure: this.onConnectionFailure.bind(this)
		});
	},
	onConnectionFailure: function(response) {
			console.log("failure:response="+JSON.stringify(response));
	},
	onConnection: function(response) {
		var hasNet = false;
		if (response && response.returnValue === true && (response.isInternetConnectionAvailable === true || response.wifi.state === "connected"))	{
			hasNet = true;
		}
		this.log("got connection status. connection: " + hasNet);
		//this.log("Response: " + JSON.stringify(response));
		// run version check
		this.log("Run version check");
		preware.IPKGService.version(this.onVersionCheck.bind(this, hasNet));
	},
	onVersionCheck: function(hasNet, payload)
	{
		this.log("version check returned: " + JSON.stringify(payload));
		try
		{
			// log payload for display
			preware.IPKGService.logPayload(payload, 'VersionCheck');

			if (!payload) {
				// i dont know if this will ever happen, but hey, it might
				this.log($L("Cannot access the service. First try restarting Preware, or reboot your device and try again."));
			}
			else if (payload.errorCode !== undefined) {
				if (payload.errorText === "org.webosinternals.ipkgservice is not running.") {
					this.log($L("The service is not running. First try restarting Preware, or reboot your device and try again."));
				} else {
					this.log(payload.errorText);
				}
			}
			else {
				if (payload.apiVersion && payload.apiVersion < this.ipkgServiceVersion) {
					// this is if this version is too old for the version number stuff
					this.log($L("The service version is too old. First try rebooting your device, or reinstall Preware and try again."));
				}
				else {
					if (hasNet && !this.onlyLoad) {
						// initiate update if we have a connection
						this.log("start loading feeds.");
						preware.FeedsModel.loadFeeds(this.downLoadFeeds.bind(this));
						this.log("...");
					}
					else {
						// if not, go right to loading the pkg info
						this.loadFeeds();
					}
				}
			}
		}
		catch (e) {
			enyo.error("feedsModel#loadFeeds", e);
			this.log("exception caught: " + e);
		}
	},
	downLoadFeeds: function(inSender, inEvent) {
		this.log("loaded feeds: " + JSON.stringify(inEvent));
		this.feeds = inEvent;
		
		if (this.feeds.length) {
			this.downloadFeedRequest(0);
		}
	},
	downloadFeedRequest: function(num) {	
		// update display
		this.log($L("<strong>Downloading Feed Information</strong><br>") + this.feeds[num].name);
	
		// subscribe to new feed
		preware.IPKGService.downloadFeed(this.downloadFeedResponse.bind(this, num),
			this.feeds[num].gzipped, this.feeds[num].name, this.feeds[num].url);
	},
	downloadFeedResponse: function(num, payload) {
		if ((payload.returnValue === false) || (payload.stage === "failed")) {
			this.log(payload.errorText + '<br>' + payload.stdErr.join("<br>"));
		}
		else if (payload.stage === "status") {
			this.log($L("<strong>Downloading Feed Information</strong><br>") + this.feeds[num].name + "<br><br>" + payload.status);
		}
		else if (payload.stage === "completed") {
			num = num + 1;
			if (num < this.feeds.length) {
				// start next
				this.downloadFeedRequest(num);
			}
			else {
				// we're done
				this.log($L("<strong>Done Downoading!</strong>"));
	
				// well updating looks to have finished, lets log the date:
				preware.PrefCookie.put('lastUpdate', Math.round(new Date().getTime()/1000.0));
	
				this.loadFeeds();
			}
		}
	},
	loadFeeds: function(){	
		// lets call the function to update the global list of pkgs
		this.log($L("<strong>Loading Package Information</strong><br>"));
		preware.FeedsModel.loadFeeds(this, this.parseFeeds.bind(this));
	},
	parseFeeds: function(feeds) {
		packages.loadFeeds(feeds, this);
	}
});
