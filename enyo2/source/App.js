// Preware App kind and main window.
/*global enyo, onyx, preware, $L, navigator, device, PalmServiceBridge */

//to reload changes on device: luna-send -n 1 palm://com.palm.applicationManager/rescan {}

enyo.kind({
	name: "GrabberToolbar",
	kind: "onyx.Toolbar",
	components:[
		{kind: "onyx.Grabber"}
	],
	reflow: function() {
		this.children[0].applyStyle('visibility', enyo.Panels.isScreenNarrow() ? 'hidden' : 'visible');
	}
});

enyo.kind({
	name: "EmptyPanel",
	kind: "FittableRows",
	components: [
		{kind: "onyx.Toolbar"},
		{fit: true, style: "background-image: url('assets/bg.png')"},
		{kind: "onyx.Toolbar"}
	]
	
});

enyo.kind({
	name: "ListItem",
	classes: "list-item",
	ontap: "menuItemTapped",
	content: "List Item",
	icon: false,
	handlers: {
		onmousedown: "pressed",
		ondragstart: "released",
		onmouseup: "released"
	},
	components:[
		{name: "ItemIcon", kind: "Image", style: "display: none; height: 100%; margin-right: 8px;"},
		{name: "ItemTitle", style: "display: inline-block; position: absolute; margin-top: 6px;"}
	],
	create:	function() {
		this.inherited(arguments);
		this.$.ItemTitle.setContent(this.content);
	},
	rendered: function() {
		if(this.icon) {
			this.$.ItemIcon.addStyles("display: inline-block;");
		}
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
	// filtered category/package lists
	currentType: "",
	availableCategories: [],
	currentCategory: "",
	availablePackages: [],
	currentPackage: {},
	components:[
		{kind: "Signals",
		onPackagesStatusUpdate: "processStatusUpdate",
		onPackagesLoadFinished: "doneLoading",
		ondeviceready: "handleDeviceReady"},
		
		//Menu
		{name: "MenuPanel",
		layoutKind: "FittableRowsLayout",
		style: "width: 33.3%",
		components:[
			{kind: "PortsSearch",
			title: "Preware",
			taglines:[
				"I live... again...",
				"Miss me?",
				"Installing packages, with a penguin!",
				"How many Ports could a webOS Ports Port?",
				"Not just for Apps anymore.",
				"Now with 100% more Enyo2!"
			]},
			{name: "ScrollerPanel",
			kind: "Panels",
			arrangerKind: "CardArranger",
			fit: true,
			draggable: false,
			components: [
				{kind: "FittableRows",
				style: "width: 100%; height: 100%; text-align: center;",
				components:[
					{kind: "onyx.Spinner"},
					{name: "SpinnerText",
					style: "color: white;",
					allowHtml: true}
				]},
				{kind: "Scroller",
				horizontal: "hidden",
				classes: "enyo-fill",
				style: "background-image:url('assets/bg.png')",
				touch: true,
				ontap: "showTypeList",
				components:[
					{kind: "ListItem", content: "Package Updates"},
					{kind: "ListItem", content: "Available Packages"},
					{kind: "ListItem", content: "Installed Packages"},
					{kind: "ListItem", content: "List of Everything"}
				]},
			]},
			{kind: "onyx.Toolbar"}
		]},
		
		//Types
		{name: "TypePanels",
		kind: "Panels",
		arrangerKind: "CardArranger",
		draggable: false,
		style: "width: 33.3%;",
		components: [
			{kind: "EmptyPanel"},
			{kind: "FittableRows",
			components: [
			{kind: "onyx.Toolbar", components:[
				{style: "display: inline-block; position: absolute;", content: "Types"}
			]},
				{kind: "Scroller",
				horizontal: "hidden",
				classes: "enyo-fill",
				style: "background-image:url('assets/bg.png')",
				touch: true,
				fit: true,
				components:[
					{name: "TypeRepeater", kind: "Repeater", onSetupItem: "setupTypeItem", count: 0, components: [
						{kind: "ListItem", content: "Type", ontap: "typeTapped"}
					]}
				]},
				{kind: "GrabberToolbar"},
			]}
		]},
		
		//Categories
		{name: "CategoryPanels",
		kind: "Panels",
		arrangerKind: "CardArranger",
		draggable: false,
		style: "width: 33.3%;",
		components: [
			{kind: "EmptyPanel"},
			{kind: "FittableRows",
			components: [
				{kind: "onyx.Toolbar", components:[
					{style: "display: inline-block; position: absolute;", content: "Categories"}
				]},
				{kind: "Scroller",
				horizontal: "hidden",
				classes: "enyo-fill",
				style: "background-image:url('assets/bg.png')",
				touch: true,
				fit: true,
				components:[
					{name: "CategoryRepeater", kind: "Repeater", onSetupItem: "setupCategoryItem", count: 0, components: [
						{kind: "ListItem", content: "Category", ontap: "categoryTapped"}
					]}
				]},
				{kind: "GrabberToolbar"},
			]}
		]},	

		//Packages
		{name: "PackagePanels",
		kind: "Panels",
		arrangerKind: "CardArranger",
		draggable: false,
		style: "width: 33.3%;",
		components: [
			{kind: "EmptyPanel"},
			{kind: "FittableRows",
			components: [
				{kind: "onyx.Toolbar", components:[
					{style: "display: inline-block; position: absolute;", content: "Packages"}
				]},
				{kind: "Scroller",
				horizontal: "hidden",
				classes: "enyo-fill",
				style: "background-image:url('assets/bg.png')",
				touch: true,
				fit: true,
				ontap: "showPackage",
				components:[
					{name: "PackageRepeater", kind: "Repeater", onSetupItem: "setupPackageItem", count: 0, components: [
						{kind: "ListItem", content: "Package", icon: true, ontap: "packageTapped"}
					]}
				]},
				{kind: "GrabberToolbar"},
			]}
		]},

		//Package Display
		{name: "PackageDisplayPanels",
		kind: "Panels",
		arrangerKind: "CardArranger",
		draggable: false,
		style: "width: 33.3%;",
		components: [
			{kind: "EmptyPanel"},
			{kind: "FittableRows",
			components: [
				{kind: "onyx.Toolbar", components:[
					{name: "PackageIcon", kind: "Image", style: "height: 100%; margin-right: 8px;"},
					{name: "PackageTitle", style: "display: inline-block; position: absolute;", content: "Package"}
				]},
				{kind: "Scroller",
				horizontal: "hidden",
				classes: "enyo-fill",
				touch: true,
				fit: true,
				ontap: "showPackage",
				components:[
					{style: "padding: 15px;", components: [
						{kind: "onyx.Groupbox", components: [
							{kind: "onyx.GroupboxHeader", content: "Description"},
							{name: "PackageDescription",
							style: "padding: 15px; color: white;",
							allowHtml: true},

							{kind: "onyx.GroupboxHeader", content: "Homepage"},
							{name: "PackageHomepage",
							style: "padding: 15px; color: white;"},

							{kind: "onyx.GroupboxHeader", content: "Maintainter"},
							{name: "PackageMaintainer",
							style: "padding: 15px; color: white;"},

							{kind: "onyx.GroupboxHeader", content: "Version"},
							{name: "PackageVersion",
							style: "padding: 15px; color: white;"},

							{kind: "onyx.GroupboxHeader", content: "Last Updated"},
							{name: "PackageLastUpdated",
							style: "padding: 15px; color: white;"},

							{kind: "onyx.GroupboxHeader", content: "Download Size"},
							{name: "PackageDownloadSize",
							style: "padding: 15px; color: white;"},

							{kind: "onyx.GroupboxHeader", content: "Installed Version"},
							{name: "PackageInstalledVersion",
							style: "padding: 15px; color: white;"},

							{kind: "onyx.GroupboxHeader", content: "Installed"},
							{name: "PackageInstalledDate",
							style: "padding: 15px; color: white;"},

							{kind: "onyx.GroupboxHeader", content: "Installed Size"},
							{name: "PackageInstalledSize",
							style: "padding: 15px; color: white;"},

							{kind: "onyx.GroupboxHeader", content: "ID"},
							{name: "PackageID",
							style: "padding: 15px; color: white;"},

							{kind: "onyx.GroupboxHeader", content: "License"},
							{name: "PackageLicense",
							style: "padding: 15px; color: white;"},

							{kind: "onyx.GroupboxHeader", content: "Type"},
							{name: "PackageType",
							style: "padding: 15px; color: white;"},

							{kind: "onyx.GroupboxHeader", content: "Category"},
							{name: "PackageCategory",
							style: "padding: 15px; color: white;"},

							{kind: "onyx.GroupboxHeader", content: "Feed"},
							{name: "PackageFeed",
							style: "padding: 15px; color: white;"},
						]},
					]}
				]},
				{kind: "GrabberToolbar", components:[
					{name: "InstallButton", kind: "onyx.Button", content: "Install", ontap: "installTapped"},
					{name: "UpdateButton", kind: "onyx.Button", content: "Update", ontap: "updateTapped"},
					{name: "RemoveButton", kind: "onyx.Button", content: "Remove", ontap: "removeTapped"},
					{name: "LaunchButton", kind: "onyx.Button", content: "Launch", ontap: "launchTapped"}
				]},
			]},
		]},
	],
	//Handlers
	create: function(inSender, inEvent) {
		this.inherited(arguments);
		if(window.PalmServiceBridge == undefined) {
			this.log("No PalmServiceBridge found.");
			this.$.ScrollerPanel.setIndex(1);
		} else {
			this.log("PalmServiceBridge found.");
		}
	},
	handleDeviceReady: function(inSender, inEvent) {
		this.log("device.version: " + device && device.version);
		this.log("device.name: " + device && device.name);
		
		this.startLoadFeeds();
	},
	reflow: function(inSender) {
		this.inherited(arguments);
		if(enyo.Panels.isScreenNarrow()) {
			this.setArrangerKind("CoreNaviArranger");
			this.setDraggable(false);
			this.$.CategoryPanels.addStyles("box-shadow: 0");
			this.$.SubcategoryPanels.addStyles("box-shadow: 0");
			this.$.PackagePanels.addStyles("box-shadow: 0");
			this.$.PackageDisplayPanels.addStyles("box-shadow: 0");
		}
		else {
			this.setArrangerKind("CollapsingArranger");
			this.setDraggable(true);
			this.$.TypePanels.addStyles("box-shadow: -4px 0px 4px rgba(0,0,0,0.3)");
			this.$.CategoryPanels.addStyles("box-shadow: -4px 0px 4px rgba(0,0,0,0.3)");
			this.$.PackagePanels.addStyles("box-shadow: -4px 0px 4px rgba(0,0,0,0.3)");
			this.$.PackageDisplayPanels.addStyles("box-shadow: -4px 0px 4px rgba(0,0,0,0.3)");
		}
	},
	//Action Functions
	log: function(text) {
		this.inherited(arguments);
		this.$.SpinnerText.setContent(text);
	},
	showTypeList: function() {
		this.$.TypePanels.setIndex(1);
		this.setIndex(1);
	},
	typeTapped: function(inSender) {
		this.currentType = inSender.$.ItemTitle.content;
		this.availableCategories = [];

		for(var i = 0; i < preware.PackagesModel.packages.length; i++) {
			var package = preware.PackagesModel.packages[i];
			if(package.type == inSender.$.ItemTitle.content) {
				if(this.availableCategories.indexOf(package.category) == -1) {
					this.availableCategories.push(package.category);
				}
			}	
		}

		this.$.CategoryRepeater.setCount(this.availableCategories.length);
		this.$.CategoryPanels.setIndex(1);
		this.setIndex(2);
	},
	categoryTapped: function(inSender) {
		this.currentCategory = inSender.$.ItemTitle.content;
		this.availablePackages = [];

		for(var i = 0; i < preware.PackagesModel.packages.length; i++) {
			var package = preware.PackagesModel.packages[i];
			if(package.type == this.currentType && package.category == this.currentCategory) {
				if(this.availablePackages.indexOf(package) == -1) {
					this.availablePackages.push(package);
				}
			}	
		}

		this.$.PackageRepeater.setCount(this.availablePackages.length);
		this.$.PackagePanels.setIndex(1);
		this.setIndex(3);
	},
	packageTapped: function(inSender) {
		for(var i = 0; i < preware.PackagesModel.packages.length; i++) {
			var package = preware.PackagesModel.packages[i];
			if(package.title == inSender.$.ItemTitle.content) {
				this.currentPackage = package;

				this.$.PackageTitle.setContent(package.title);
				this.$.PackageIcon.setSrc(package.icon);
				this.$.PackageDescription.setContent(package.description);
				this.$.PackageHomepage.setContent(package.homepage);
				this.$.PackageMaintainer.setContent(package.maintainer);
				this.$.PackageVersion.setContent(package.version);
				this.$.PackageLastUpdated.setContent(package.date);
				this.$.PackageDownloadSize.setContent(package.size);
				this.$.PackageInstalledVersion.setContent(package.versionInstalled);
				this.$.PackageInstalledDate.setContent(package.dateInstalled);
				this.$.PackageInstalledSize.setContent(package.sizeInstalled);
				this.$.PackageID.setContent(package.pkg);
				this.$.PackageLicense.setContent(package.license);
				this.$.PackageType.setContent(package.type);
				this.$.PackageCategory.setContent(package.category);
				this.$.PackageFeed.setContent(package.feedString);

				this.$.InstallButton.setDisabled(package.isInstalled);
				this.$.UpdateButton.setDisabled(!package.isInstalled || !package.hasUpdate);
				this.$.RemoveButton.setDisabled(!package.isInstalled);
				this.$.LaunchButton.setDisabled(!package.isInstalled);

				break;
			}	
		}

		this.$.PackageDisplayPanels.setIndex(1);
		this.setIndex(4);
	},
	launchTapped: function() {
		this.currentPackage.launch();
	},
	installTapped: function() {
		this.currentPackage.doInstall(true);
	},
	updateTapped: function() {
		this.currentPackage.doUpdate(true);
	},
	removeTapped: function() {
		this.currentPackage.doRemove(true);
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
		this.log("Requesting Machine Name");
	},
	gotMachineName: function(machineName) {
		this.log("Got Machine Name: " + machineName + " (" + JSON.stringify(machineName) + ")");
	},
	startLoadFeeds: function() {
		this.log("Start Loading Feeds");
		preware.DeviceProfile.getDeviceProfile(this.gotDeviceProfile.bind(this), false);
	},
	gotDeviceProfile: function(inSender, inEvent) {
		this.log("Got Device Profile: " + (inEvent ? inEvent.success : ""));
		if (!inEvent.success || !inEvent.deviceProfile) {
			this.log("Failed to get device profile.");
			preware.IPKGService.getMachineName(this.onDeviceType.bind(this));
			this.log("Requesting Machine Name.");
		} else {
			this.log("Got deviceProfile: " + JSON.stringify(inEvent.deviceProfile));
			this.deviceProfile = inEvent.deviceProfile;
			preware.PalmProfile.getPalmProfile(this.gotPalmProfile.bind(this), false);
		}
	},
	gotPalmProfile: function(inSender, inEvent) {
		if (!inEvent.success || !inEvent.palmProfile) {
			this.log("failed to get palm profile");
			preware.IPKGService.getMachineName(this.onDeviceType.bind(this));
			this.log("Requesting Machine Name");
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
		this.log("Requesting Machine Name");
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
			console.log("Failure, response="+JSON.stringify(response));
	},
	onConnection: function(response) {
		var hasNet = false;
		if (response && response.returnValue === true && (response.isInternetConnectionAvailable === true || response.wifi.state === "connected"))	{
			hasNet = true;
		}
		this.log("Got Connection Status. Connection: " + hasNet);
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
			} else if (payload.errorCode !== undefined) {
				if (payload.errorText === "org.webosinternals.ipkgservice is not running.") {
					this.log($L("The service is not running. First try restarting Preware, or reboot your device and try again."));
				} else {
					this.log(payload.errorText);
				}
			}	else {
				if (payload.apiVersion && payload.apiVersion < this.ipkgServiceVersion) {
					// this is if this version is too old for the version number stuff
					this.log($L("The service version is too old. First try rebooting your device, or reinstall Preware and try again."));
				}
				else {
					if (hasNet && !this.onlyLoad) {
						// initiate update if we have a connection
						this.log("start to download feeds");
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
			this.log("Exception Caught: " + e);
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
		this.processStatusUpdate(this, {message: $L("<strong>Downloading Feed Information</strong><br>") + this.feeds[num].name});
	
		// subscribe to new feed
		preware.IPKGService.downloadFeed(this.downloadFeedResponse.bind(this, num),
												 this.feeds[num].gzipped, this.feeds[num].name, this.feeds[num].url);
	},
	downloadFeedResponse: function(num, payload) {
		if ((payload.returnValue === false) || (payload.stage === "failed")) {
			this.log(payload.errorText + '<br>' + payload.stdErr.join("<br>"));
		} else if (payload.stage === "status") {
			this.processStatusUpdate(this, {message: $L("<strong>Downloading Feed Information</strong><br>") + this.feeds[num].name + "<br><br>" + payload.status});
		} else if (payload.stage === "completed") {
			num = num + 1;
			if (num < this.feeds.length) {
				// start next
				this.downloadFeedRequest(num);
			} else {
				// we're done
				this.processStatusUpdate(this, {message: $L("<strong>Done Downoading!</strong>")});
				
				// well updating looks to have finished, lets log the date:
				preware.PrefCookie.put('lastUpdate', Math.round(new Date().getTime()/1000.0));
				
				this.loadFeeds();
			}
		}
	},
	loadFeeds: function(){	
		// lets call the function to update the global list of pkgs
		this.processStatusUpdate(this, {message: $L("<strong>Loading Package Information</strong><br>")});
		preware.FeedsModel.loadFeeds(this.parseFeeds.bind(this));
	},
	parseFeeds: function(feeds) {
		preware.PackagesModel.loadFeeds(feeds, this.onlyLoad); //TODO: how did old preware set/unset onlyload?
	},
	processStatusUpdate: function(inSender, inEvent) {
		this.log(inEvent.message);
	},
	doneLoading: function() {
		// so if we're inactive we know to push a scene when we return
		//this.isLoading = false;
	
		// show that we're done (while the pushed scene is going)
		this.processStatusUpdate(this, {message: $L("<strong>Done!</strong>")});
		//this.hideProgress();
	
		// we're done loading so let the device sleep if it needs to
		// TODO: convert stayAwake.js to enyo, implement stayAwake.start() etc
		//this.stayAwake.end();
	
		//alert(packages.packages.length);
	
		if ((!this.isActive || !this.isVisible)) {	
			// if we're not the active scene, let them know via banner:
			if (this.onlyLoad) {
				navigator.notification.showBanner($L("Preware: Done Loading Feeds"), {source:'updateNotification'}, 'miniicon.png');
			} else {
				navigator.notification.showBanner($L("Preware: Done Updating Feeds"), {source:'updateNotification'}, 'miniicon.png');
			}
		}
	
		// show the menu
		var storedThis = this;
		setTimeout(function() {
			storedThis.$.ScrollerPanel.setIndex(1);
		}, 500);

		this.$.TypeRepeater.setCount(preware.PackagesModel.types.length);
		this.$.CategoryRepeater.setCount(preware.PackagesModel.categories.length);
		this.$.PackageRepeater.setCount(preware.PackagesModel.packages.length);
	},
	setupTypeItem: function(inSender, inEvent) {
		inEvent.item.$.listItem.$.ItemTitle.setContent(preware.PackagesModel.types[inEvent.index]);	
		return true;
	},	
	setupCategoryItem: function(inSender, inEvent) {
		inEvent.item.$.listItem.$.ItemTitle.setContent(this.availableCategories[inEvent.index]);	
		return true;
	},
	setupPackageItem: function(inSender, inEvent) {
		var package = this.availablePackages[inEvent.index];
		if(package && package.title) {
			enyo.log(package.title);
			inEvent.item.$.listItem.$.ItemTitle.setContent(package.title);
			//FIXME: This throws 'not allowed to load local resource' errors, how did Mojo get around it?
			inEvent.item.$.listItem.$.ItemIcon.setSrc(package.icon);	
		}

		return true;
	}
});

enyo.kind({
	name: "App",
	layoutKind: "FittableRowsLayout",
	components: [
		{kind: "Signals",
		onbackbutton: "handleBackGesture",
		onCoreNaviDragStart: "handleCoreNaviDragStart",
		onCoreNaviDrag: "handleCoreNaviDrag",
		onCoreNaviDragFinish: "handleCoreNaviDragFinish"},
		{name: "AppPanels", kind: "AppPanels", fit: true},
		{kind: "CoreNavi", fingerTracking: true}
	],
	//Handlers
	handleBackGesture: function(inSender, inEvent) {
		this.$.AppPanels.setIndex(0);
	},
	handleCoreNaviDragStart: function(inSender, inEvent) {
		this.$.AppPanels.dragstartTransition(this.$.AppPanels.draggable === false ? this.reverseDrag(inEvent) : inEvent);
	},
	handleCoreNaviDrag: function(inSender, inEvent) {
		this.$.AppPanels.dragTransition(this.$.AppPanels.draggable === false ? this.reverseDrag(inEvent) : inEvent);
	},
	handleCoreNaviDragFinish: function(inSender, inEvent) {
		this.$.AppPanels.dragfinishTransition(this.$.AppPanels.draggable === false ? this.reverseDrag(inEvent) : inEvent);
	},
	//Utility Functions
	reverseDrag: function(inEvent) {
		inEvent.dx = -inEvent.dx;
		inEvent.ddx = -inEvent.ddx;
		inEvent.xDirection = -inEvent.xDirection;
		return inEvent;
	}
});
