// Preware App kind and main window.
/*global enyo, onyx, preware, $L, navigator */

//to reload changes on device: luna-send -n 1 palm://com.palm.applicationManager/rescan {}

enyo.kind({
	name: "ListItem",
	classes: "list-item",
	ontap: "menuItemTapped",
	content: "List Item",
	handlers: {
		onmousedown: "pressed",
		ondragstart: "released",
		onmouseup: "released"
	},
	components:[
		{name: "ItemTitle", style: "position: absolute; margin-top: 6px;"},
	],
	create:  function() {
		this.inherited(arguments);
		this.$.ItemTitle.setContent(this.content);
	},
	pressed: function() {
		this.addClass("onyx-selected");
	},
	released: function() {
		this.removeClass("onyx-selected");
	}
});

enyo.kind({
	name: "AppPanels",
	kind: "Panels",
	fit: true,
	realtimeFit: true,
	arrangerKind: "CollapsingArranger",
	classes: "app-panels",
	// required ipkgservice
	ipkgServiceVersion: 14,
	components:[
		//Menu
		{name: "MenuPanel",
		layoutKind: "FittableRowsLayout",
		style: "width: 33%",
		components:[
			{kind: "PortsSearch",
			taglines:[
				"I live... again...",
				"*badly digitized 8-bit voice* RIIIISE FROM YOUR GRAAAVE!",
				"Installing packages, with a penguin!",
				"How many Ports could a webOS Ports Port?",
				"Not just for Apps anymore.",
				"Preware, now with 100% more Enyo2!"
			]},
			{kind: "Scroller",
			horizontal: "hidden",
			classes: "enyo-fill",
			fit: true,
			touch: true,
			ontap: "showDebug",
			components:[
				{kind: "ListItem", content: "Package Updates"},
				{kind: "ListItem", content: "Available Packages"},
				{kind: "ListItem", content: "Installed Packages"},
				{kind: "ListItem", content: "List of Everything"}
			]},
			{kind: "onyx.Toolbar"}
		]},
		//Content
		{name: "ContentPanels",
		kind: enyo.FittableRows, components: [
			{kind: "onyx.Toolbar", content: "Debug", components:[
				{content: "Debug"},
			]},
			{kind: enyo.Scroller, style: "color: white;", touch: true, fit: true, components: [
				{style: "padding: 20px;", components:[
					{name: "out", content: "press button...<br>", allowHtml: true, fit: true}
				]}
			]},
			{kind: "onyx.Toolbar", components:[
				{name: "Grabber", kind: "onyx.Grabber"},
				{kind: onyx.Button, content: "getVersion", ontap: "versionTap" },
				{kind: onyx.Button, content: "getMachineName", ontap: "machineName" },
				{kind: onyx.Button, content: "loadFeeds", ontap: "startLoadFeeds" },
			]},
		]},
	],
	//Handlers
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
	//Action Functions
	showDebug: function() {
		if(enyo.Panels.isScreenNarrow())
			this.setIndex(1);
	},
	//Unsorted Functions
	versionTap: function(inSender, inEvent) {
		preware.IPKGService.version(this.gotVersion.bind(this));
		this.log("Getting Version");
	},
	gotVersion: function(version) {
		this.log("Version: " + JSON.stringify(version) + "<br>");
	},
	machineName: function() {
		preware.IPKGService.getMachineName(this.gotMachineName.bind(this));
		this.log("Getting Machine Name");
	},
	gotMachineName: function(machineName) {
		this.log("Got Machine Name: " + machineName + " (" + JSON.stringify(machineName) + ")");
	},
	startLoadFeeds: function() {
		this.log("starting to load feeds.");
		preware.DeviceProfile.getDeviceProfile(this.gotDeviceProfile.bind(this), false);
		this.log("...");
	},
	gotDeviceProfile: function(inSender, inEvent) {
		this.log("Got Device Profile: " + inEvent && inEvent.success);
		if (!inEvent.success || !inEvent.deviceProfile) {
			this.log("Failure...");
			preware.IPKGService.getMachineName(this.onDeviceType.bind(this));
			this.log("Getting Machine Name.");
		} else {
			this.log("Got deviceProfile: " + JSON.stringify(inEvent.deviceProfile));
			this.deviceProfile = inEvent.deviceProfile;
			preware.PalmProfile.getPalmProfile(this.gotPalmProfile.bind(this), false);
		}
	},
	gotPalmProfile: function(inSender, inEvent) {
		if (!inEvent.success || !inEvent.palmProfile) {
			this.log("Failure...");
			preware.IPKGService.getMachineName(this.onDeviceType.bind(this));
			this.log("getting machine name.");
		} else {
			this.log("Got palmProfile.");
			this.palmProfile = inEvent.palmProfile;
			preware.IPKGService.setAuthParams(this.authParamsSet.bind(this),
					this.deviceProfile.deviceId,
					this.palmProfile.token);
		}
	},
	authParamsSet: function(inResponse) {
		this.log("Got authParams: " + JSON.stringify(inResponse));
		preware.IPKGService.getMachineName(this.onDeviceType.bind(this));
		this.log("Getting machine name");
	},
	onDeviceType: function(inEvent) {
		// start by checking the internet connection
		this.log("Requesting Connection Status");
		
		navigator.service.Request("palm://com.palm.connectionmanager",{
			method: "getstatus",
			onSuccess: this.onConnection.bind(this),
			onFailure: this.onConnectionFailure.bind(this)
		});
	},
	onConnectionFailure: function(response) {
			console.log("Failure:response="+JSON.stringify(response));
	},
	onConnection: function(response) {
		var hasNet = false;
		if (response && response.returnValue === true && (response.isInternetConnectionAvailable === true || response.wifi.state === "connected"))	{
			hasNet = true;
		}
		this.log("got connection status. connection: " + hasNet);
		//this.log("Response: " + JSON.stringify(response));
		// run version check
		this.log("Run Version Check");
		preware.IPKGService.version(this.onVersionCheck.bind(this, hasNet));
	},
	onVersionCheck: function(hasNet, payload)
	{
		this.log("Version Check Returned: " + JSON.stringify(payload));
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

enyo.kind({
	name: "App",
	layoutKind: "FittableRowsLayout",
	components: [
		{kind: "Signals",
		ondeviceready: "deviceready",
		onbackbutton: "handleBackGesture",
		onCoreNaviDragStart: "handleCoreNaviDragStart",
		onCoreNaviDrag: "handleCoreNaviDrag",
		onCoreNaviDragFinish: "handleCoreNaviDragFinish",},
		{name: "AppPanels", kind: "AppPanels", fit: true},
		{kind: "CoreNavi", fingerTracking: true}
	],
	//Handlers
	reflow: function(inSender) {
		this.inherited(arguments);
		if(enyo.Panels.isScreenNarrow()) {
			this.$.AppPanels.setArrangerKind("CoreNaviArranger");
			this.$.AppPanels.setDraggable(false);
			this.$.AppPanels.$.ContentPanels.addStyles("box-shadow: 0");
			this.$.AppPanels.$.Grabber.applyStyle("visibility", "hidden");
		}
		else {
			this.$.AppPanels.setArrangerKind("CollapsingArranger");
			this.$.AppPanels.setDraggable(true);
			this.$.AppPanels.$.ContentPanels.addStyles("box-shadow: -4px 0px 4px rgba(0,0,0,0.3)");
			this.$.AppPanels.$.Grabber.applyStyle("visibility", "visible");
		}
	},
	handleBackGesture: function(inSender, inEvent) {
		this.$.AppPanels.setIndex(0);
	},
	handleCoreNaviDragStart: function(inSender, inEvent) {
		this.$.AppPanels.dragstartTransition(this.$.AppPanels.draggable == false ? this.reverseDrag(inEvent) : inEvent);
	},
	handleCoreNaviDrag: function(inSender, inEvent) {
		this.$.AppPanels.dragTransition(this.$.AppPanels.draggable == false ? this.reverseDrag(inEvent) : inEvent);
	},
	handleCoreNaviDragFinish: function(inSender, inEvent) {
		this.$.AppPanels.dragfinishTransition(this.$.AppPanels.draggable == false ? this.reverseDrag(inEvent) : inEvent);
	},
	//Utility Functions
	reverseDrag: function(inEvent) {
		inEvent.dx = -inEvent.dx;
		inEvent.ddx = -inEvent.ddx;
		inEvent.xDirection = -inEvent.xDirection;
		return inEvent;
	}
});
