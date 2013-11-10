/*jslint sloppy: true, continue:true */
/*global enyo, navigator, window, device, console, preware, $L, setInterval, clearInterval, setTimeout */

enyo.singleton({
	name: "UpdateFeeds",
	// required ipkgservice
	ipkgServiceVersion: 14,
	downloaded: false,
	onlyLoad: false,
	timeouts: [],
	components: [
		{
			kind: "Signals",
			onPackagesLoadFinished: "donePackageParsing",
			onLoadFeedsFinished: "doneLoadingFeeds"
		}
	],
	
	//emited signals:
	// onUpdateFeedsFinished: {} //emitted when loading is finished.
	
	//Handlers
	//this is called from FeedsModel after we loaded the feed configuration from disk.
	//This is triggered from multiple occasions:
	//one is right before feed update
	//the other one is if we just load the feeds without update.
	doneLoadingFeeds: function (inSender, inEvent) {
		this.log("loaded feeds: " + JSON.stringify(inEvent));
		this.feeds = inEvent.feeds;
		
		if (this.downloaded || this.onlyLoad) {
			this.log("Not downloading, because onlyLoad: " + this.onlyLoad + " and alreadyDownloaded: " + this.downloaded);
			this.parseFeeds(inSender, inEvent);
		} else {
			this.log("Downloading feeds...");
			if (this.feeds.length) {
				this.log("Starting download of first feed.");
				this.downloadFeedRequest(0);
			} else {
				this.log("Not downloading feeds, length: " + this.feeds.length);
				this.downloaded = true;
				this.loadFeeds(); //let ipkg service load the feeds again.
			}
		}
	},
	donePackageParsing: function (inSender, inEvent) {
		//this is the end of the update process.. trigger parent.
		enyo.Signals.send("onUpdateFeedsFinished", {});
	},

	//Action Functions
	log: function (text) {
		console.error(text);
	},
	
	//Unused functions... ??
	versionTap: function (inSender, inEvent) {
		preware.IPKGService.version(this.gotVersion.bind(this));
		this.log("Getting Version");
	},
	gotVersion: function (version) {
		this.log("Version: " + JSON.stringify(version) + "<br>");
	},
	machineName: function () {
		preware.IPKGService.getMachineName(this.gotMachineName.bind(this));
		this.log("Requesting Machine Name");
	},
	gotMachineName: function (machineName) {
		this.log("Got Machine Name: " + machineName + " (" + JSON.stringify(machineName) + ")");
	},
	
	
	//start the update process.
	//first we need some device information.
	//we need device profile and palm profile for a call to
	//IPKGService.setAuthParams. This probably is necessary for 
	//App Catalog apps...?
	//If that does not work, we just get the machine name and are done.
	startUpdateFeeds: function (force) {
		if (window.PalmServiceBridge === undefined) {
			this.log("No PalmServiceBridge found.");
		} else {
			this.log("PalmServiceBridge found.");
		}
		
		this.log("device.version: " + (device ? device.version : "undefined"));
		this.log("device.name: " + (device ? device.name : "undefined"));
		
		this.log("================== 17");
		
		switch (preware.PrefCookie.get().updateInterval) {
		case "launch":
			this.onlyLoad = false;
			break;
		case "manual":
			this.onlyLoad = true;
			break;
		case "daily":
			var lastUpdate = preware.PrefCookie.get().lastUpdate,
				dateLastUpdate,
				dateNow = new Date();
			if (lastUpdate === 0 || lastUpdate === "0") {
				this.onlyLoad = false;
			} else {
				dateLastUpdate = new Date(lastUpdate * 1000);
				if (dateLastUpdate.getYear() === dateNow.getYear()
						&& dateLastUpdate.getMonth() === dateNow.getMonth()
						&& dateLastUpdate.getDate() === dateNow.getDate()) {
					console.error("Already updated feeds today, don't do it again. Dates: " + dateLastUpdate + " and " + dateNow);
					this.onlyLoad = true;
				} else {
					console.error("Not updated feeds today, do it again. Dates: " + dateLastUpdate + " and " + dateNow);
					this.onlyLoad = false;
				}
			}
			break;
		case "ask":
			console.error("Ask not yet implemented! Falling back to manual.");
			this.onlyLoad = true;
			break;
		default:
			this.onlyLoad = true;
			break;
		}
		
		if (force) {
			console.error("Forced to download, will download anyway.");
			this.onlyLoad = false;
		}
		
		this.log("Start Loading Feeds");
		this.downloaded = false;
		preware.DeviceProfile.getDeviceProfile(this.gotDeviceProfile.bind(this), false);
	},
	
	gotDeviceProfile: function (inSender, inEvent) {
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
	gotPalmProfile: function (inSender, inEvent) {
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
	authParamsSet: function (inResponse) {
		this.log("Got authParams: " + JSON.stringify(inResponse));
		preware.IPKGService.getMachineName(this.onDeviceType.bind(this));
		this.log("Requesting Machine Name");
	},
	
	//if we reached here, we got all the configuration stuff we needed.
	onDeviceType: function (inResponse) {
		this.log("Got machine name: " + JSON.stringify(inResponse));
		
		if (!this.onlyLoad) {
			// start by checking the internet connection
			this.log("Requesting Connection Status");
			navigator.service.Request("palm://com.palm.connectionmanager/", {
				method: "getstatus",
				onComplete: this.onConnection.bind(this)
			});
		} else {
			this.loadFeeds();
		}
	},
	//connection check happens before download. If no connection, only existing feeds will be loaded.
	onConnection: function (response) {
		var hasNet = false;
		if (response && response.returnValue === true &&
				(response.isInternetConnectionAvailable === true ||
					(response.wifi && response.wifi.state === "connected"))) {
			hasNet = true;
		}
		this.log("Got Connection Status. Connection: " + hasNet);
		this.log("Complete Response: " + JSON.stringify(response));
		
		this.log("=====================> WORK AROUND SOME BUG ON LUNA-NEXT! IGNORE CONNECTION RESULT.");
		hasNet = true;
		// run version check
		this.log("Run Version Check");
		preware.IPKGService.version(this.onVersionCheck.bind(this, hasNet));
	},
	onVersionCheck: function (hasNet, payload) {
		this.log("Version Check Returned: " + JSON.stringify(payload));
		try {
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
			} else {
				if (payload.apiVersion && payload.apiVersion < this.ipkgServiceVersion) {
					// this is if this version is too old for the version number stuff
					this.log($L("The service version is too old. First try rebooting your device, or reinstall Preware and try again."));
				} else {
					if (hasNet && !this.onlyLoad) {
						// initiate update if we have a connection
						this.log("start to download feeds");
						this.downloaded = false;
						preware.FeedsModel.loadFeeds();
						this.log("...");
					} else {
						// if not, go right to loading the pkg info
						this.loadFeeds();
					}
				}
			}
		} catch (e) {
			console.error("app#onVersionCheck: " + e);
		}
	},
	
	//trigger update of one feed:
	downloadFeedRequest: function (num) {
		// update display
		enyo.Signals.send("onPackagesStatusUpdate", {message: $L("<strong>Downloading Feed Information</strong><br>") + this.feeds[num].name});
	
		// subscribe to new feed
		preware.IPKGService.downloadFeed(this.downloadFeedResponse.bind(this, num),
										this.feeds[num].gzipped, this.feeds[num].name, this.feeds[num].url);
		
		var start = Date.now();
		function preventTimeout() {
			var checkTime = Date.now(), diffInSec = (checkTime - start) / 1000;
			console.error("Wating for result since " + diffInSec);
			if (diffInSec > 10) {
				preware.IPKGService.downloadFeed(this.downloadFeedResponse.bind(this, num),
										this.feeds[num].gzipped, this.feeds[num].name, this.feeds[num].url);
				start = checkTime;
			}
		}
		this.timeouts[num] = setInterval(preventTimeout.bind(this), 1000);
		console.error("Startet timeout check with id " + this.timeouts[num]);
	},
	downloadFeedResponse: function (num, payload) {
		function goToNextFeed(obj) {
			clearInterval(obj.timeouts[num]);
			num = num + 1;
			if (num < obj.feeds.length) {
				// start next
				obj.downloadFeedRequest(num);
			} else {
				// we're done
				var msg = "<strong>" + $L("Done Downloading!") + "</strong>";
				if (obj.error) {
					msg += "<br>" + $L("Some feeds failed to download.");
					setTimeout(obj.loadFeeds.bind(obj), 5000);
				} else {
					// well updating looks to have finished, lets log the date:
					console.error("Putting " + Math.round(Date.now() / 1000) + " as lastUpdate");
					preware.PrefCookie.put('lastUpdate', Math.round(Date.now() / 1000));
					obj.loadFeeds();
				}
				enyo.Signals.send("onPackagesStatusUpdate", {message: msg});
					
				obj.downloaded = true;
			}
		}
		
		this.log("DownloadFeedResponse: " + num + ", payload: " + JSON.stringify(payload));
		if (!payload.returnValue || payload.stage === "failed") {
			this.log(payload.errorText + '<br>' + (payload.stdErr ? payload.stdErr.join("<br>") : ""));
			this.error = true;
			
			goToNextFeed(this);
		} else if (payload.stage === "status") {
			enyo.Signals.send("onPackagesStatusUpdate", {message: $L("<strong>Downloading Feed Information</strong><br>") + this.feeds[num].name + "<br><br>" + payload.status});
		} else if (payload.stage === "completed") {
			goToNextFeed(this);
		}
	},
	loadFeeds: function () {
		// lets call the function to update the global list of pkgs
		enyo.Signals.send("onPackagesStatusUpdate", {message: $L("<strong>Loading Package Information</strong><br>")});
		preware.FeedsModel.loadFeeds();
	},
	parseFeeds: function (inSender, inEvent) {
		this.log("Starting PackagesModel.loadFeeds");
		preware.PackagesModel.loadFeeds(inEvent.feeds, this.onlyLoad);
	}
});
