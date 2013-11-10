/*jslint sloppy: true, regexp: true, nomen: true */
/*global enyo, preware, IPKGService, $L, device, navigator, Mojo, console */

enyo.singleton({
	name: "preware.PackagesModel",
	onlyLoad: false, //moved here from updateAssistant.
	// for storing action information when we're in a multi-action
	multiPkg: false,
	multiPkgs: false,
	doMyApps: false,
	
	// stores if packages are loaded or not
	loaded: false,
	
	// for storing all the package information
	packages: [],
	packagesReversed: {},
	categories: [],
	feeds: [],
	urls: [],
	types: [],
	unknown: [],

	savedDB: false,
	
	// stores if there are packages with prices or not
	hasPrices: false,
	
	// holds flag for when feeds are changed
	dirtyFeeds: false,
	
	// holds flag for when blacklists are changed
	soiledPackages: false,
	
	// stores packages staged by a multi-install option
	stagedPkgs: false,
	
	// we'll need these for the subscription based calls
	rawData: '',
	unknownCount: 0,
	unknownFixed: 0,
	
	//emited signals:
	// onPackagesStatusUpdate: { //emitted during load to allow status output.
	//																 message: "some status message", 
	//																 progress: true/false => show progress meter true/false
	//																 progValue: [1-100]		=> progress value
	//																 error: true/false		=> true if an error occured.
	//														 }
	// onPackagesLoadFinished: {} //emitted when loading is finished.
		
	//methods:
	//this replaces link to updateAssistant with a signal.
	displayStatus: function (obj) {
		var msg = "";
		if (obj.error === true) {
			msg = "ERROR: ";
		}
		if (obj.msg !== undefined) {
			msg += obj.msg;
		}
		if (obj.progress === true) {
			msg += " - Progress: " + obj.progValue;
		}
		enyo.Signals.send("onPackagesStatusUpdate", {message: msg});
	},
	doSimpleMessage: function (msg) {
		enyo.Signals.send("onBackendSimpleMessage", msg);
	},
	
	doneUpdating: function () {
		enyo.Signals.send("onPackagesLoadFinished", {});
	},
	
	//called to parse feeds.
	loadFeeds: function (feeds, onlyLoad) {
		var i;
		try {
			// clear out our current data (incase this is a re-update)
			this.loaded = false;
			this.packages = [];
			this.packagesReversed = {};
			this.hasPrices = false;
			this.feeds = [];
			this.urls = [];

			for (i = 0; i < feeds.length; i += 1) {
				this.feeds.push(feeds[i].name);
				this.urls.push(feeds[i].url);
			}

			this.onlyLoad = onlyLoad;
			
			// set title and show progress
			this.displayStatus({message: $L("<strong>Loading Package Information</strong>"), progress: true, progValue: 0});
			
			// initiate status request
			this.infoStatusRequest();
		} catch (e) {
			console.error('error in packagesModel#loadFeeds: ' + e);
		}
	},
	
	//request package information from IPGKService.
	infoStatusRequest: function () {
		// update display
		this.displayStatus({
			message: $L("<strong>Loading Package Information</strong><br>Status"),
			progress: true,
			progValue: Math.round((1 / (this.feeds.length + 1)) * 100)
		});

		// request the rawdata
		preware.IPKGService.getStatusFile(this.infoResponse.bind(this, -1));
	},
	
	//request more package information from IPKGService, i.e. next feed.
	infoListRequest: function (num) {
		// update display
		this.displayStatus({
			message: $L("<strong>Loading Package Information</strong><br>") + this.feeds[num],
			progress: true,
			progValue: Math.round(((num + 2) / (this.feeds.length + 1)) * 100)
		});
		this.feedNum += 1;
	
		// subscribe to new feed
		preware.IPKGService.getListFile(this.infoResponse.bind(this, num), this.feeds[num]);
	},
	
	//parses the response from the IPKGService.
	infoResponse: function (num, payload) {
		var doneLoading = false, position;
		
		try {
			// log payload for display
			//preware.IPKGService.logPayload(payload);
			
			if (!payload || payload.errorCode !== undefined) {
				// we probably dont need to check this stuff here,
				// it would have already been checked and errored out of this process
				if (payload.errorText === "org.webosinternals.ipkgservice is not running.") {
					this.displayStatus({
						error: true,
						message: $L("The Package Manager Service is not running. Did you remember to install it? If you did, first try restarting Preware, then try rebooting your device and not launching Preware until you have a stable network connection available.")
					});
					this.doneUpdating();
					return;
				} else {
					// Do not do this until we work out how to handle multiple errors.
					// this.updateAssistant.errorMessage('Preware', payload.errorText, this.updateAssistant.doneUpdating);
					doneLoading = true;
				}
			}
			
			// no stage means its not a subscription, and we should have all the contents right now
			if (!payload.stage) {
				if (payload.contents) {
					this.parsePackages(payload.contents, this.urls[num]);
				}
				
				// flag so the end of this function knows to move on to the next feed
				doneLoading = true;
			} else {
				//alert('--- ' + num + ' ---');
				//for (p in payload) alert(p);
				//alert('stage: ' + payload.stage);
				//alert('filesize: ' + payload.filesize);
				//alert('chunksize: ' + payload.chunksize);
				//alert('datasize: ' + payload.datasize);
				
				if (payload.stage === 'start') {
					// at start we clear the old data to make sure its empty
					this.rawData = '';
				} else if (payload.stage === 'middle') {
					// in the middle, we append the data
					if (payload.contents) {
						this.rawData += payload.contents;
						position = this.rawData.lastIndexOf("\n\n");
						if (position !== -1) {
							this.parsePackages(this.rawData.substr(0, position), this.urls[num]);
							this.rawData = this.rawData.substr(position);
						}
					}
				} else if (payload.stage === 'end') {
					// at end, we parse the data we've recieved this whole time
					if (this.rawData !== '') {
						this.parsePackages(this.rawData, this.urls[num]);
					}
					
					// flag so the end of this function knows to move on to the next feed
					doneLoading = true;
				}
			}
		} catch (e) {
			console.error('error in packagesModel#infoResponse: ' + e);
		}
		
		if (doneLoading) {
			if (this.feeds[(num + 1)]) {
				// start next
				this.infoListRequest((num + 1));
			} else {
				// we're done
				this.displayStatus({
					message: $L("<strong>Done Loading!</strong>"),
					progress: false,
					progValue: 0
				});
				if (preware.PrefCookie.get().fixUnknown) {
					this.fixUnknown();
				} else {
					this.loadSaved();
				}
			}
		}
	},
	
	//parses package data received from IPKGService.
	parsePackages: function (rawData, url) {
		var test, lineRegExp, curPkg, x, match;
		try {
			if (rawData) {
				test = rawData.split(/\n/);
				lineRegExp = new RegExp(/[\s]*([^:]*):[\s]*(.*)[\s]*$/);
				curPkg = false;
				
				for (x = 0; x < test.length; x += 1) {
				
					match = lineRegExp.exec(test[x]);
					if (match) {
						if (match[1] === 'Package' && !curPkg) {
							curPkg = {
								Size: 0,
								Status: '',
								Architecture: '',
								Section: '',
								Package: '',
								Filename: '',
								Depends: '',
								Maintainer: '',
								Version: '',
								Description: '',
								MD5Sum: '',
								'Installed-Time': 0,
								'Installed-Size': 0,
								Source: ''
							};
						}
						if (match[1] && match[2]) {
							curPkg[match[1]] = match[2];
						}
					} else {
						if (curPkg) {
							this.loadPackage(curPkg, url);
							curPkg = false;
						}
					}
				}
				
				if (curPkg) {
					this.loadPackage(curPkg, url);
					curPkg = false;
				}
			}
		} catch (e) {
			console.error('error in packagesModel#parsePackages: ' + e);
		}
	},
	
	loadPackage: function (infoObj, url) {
		var newPkg, pkgNum, pkgUpd;
		// Skip packages that are in the status file, but are not actually installed
		if (infoObj.Status &&
				(infoObj.Status.include('not-installed') || infoObj.Status.include('deinstall'))) {
			//alert('+ 1');
			return;
		}

		// load the package from the info
		//device.version looks like 3.0.5 SDK, cut away part after the space.
		if (!this.deviceVersion) {
			if (device.version.indexOf(" ") >= 0) {
				this.deviceVersion = device.version.substring(0, device.version.indexOf(" "));
			} else {
				this.deviceVersion = device.version;
			}
		}
		//console.error("device.version: " + this.deviceVersion);
		
		newPkg = new preware.PackageModel(infoObj);
		if (this.deviceVersion && this.deviceVersion.match(/^[0-9:.\-]+$/)) {
			// Filter out apps with a minimum webos version that is greater then current
			if (this.versionNewer(this.deviceVersion, newPkg.minWebOSVersion)) {
				//alert('+ 2');
				return;
			}
			
			// Filter out apps with a maximum webos version that is less then current
			if (this.versionNewer(newPkg.maxWebOSVersion, this.deviceVersion)) {
				//alert('+ 3');
				return;
			}
		} else {
			console.error("Could not get OS version, so packges did not get filtered.");
		}
		
		// Filter out apps that don't match the host device
		if (!preware.PrefCookie.get().ignoreDevices && newPkg.devices && newPkg.devices.length > 0 &&
				newPkg.devices.indexOf(device.name) === -1) {
			//alert('+ 4');
			console.error("Ignoring package because of wrong device name...");
			return;
		}
		
		// Filter out paid apps if desired
		if ((preware.PrefCookie.get().onlyShowFree) && (newPkg.price !== undefined) &&
				(newPkg.price !== "0") && (newPkg.price !== "0.00")) {
			//console.error("Ignoring package because of price tag...");
			return;
		}

		// Filter out non-english apps if desired
		if ((preware.PrefCookie.get().onlyShowEnglish) &&
				newPkg.languages && newPkg.languages.length &&
				!newPkg.inLanguage("en")) {
			//console.error("Ignoring package because of wrong language.");
			//alert('+ 6');
			return;
		}

		// default location is none is set
		if (!newPkg.location && newPkg.filename && url) {
			//alert('+ 7');
			newPkg.location = url + '/' + newPkg.filename;
		}

		// look for a previous package with the same name
		pkgNum = this.packageInList(newPkg.pkg);
		if (pkgNum === false) {
			// add this package to global app list
			this.packages.push(newPkg);
			
			// save to temp reverse lookup list
			this.packagesReversed[newPkg.pkg] = this.packages.length;
			
			return newPkg;
		} else {
			// run package update function of the old package with the new package
			pkgUpd = this.packages[pkgNum].infoUpdate(newPkg);
			if (pkgUpd) {
				// if the new package is to replace the old one, do it
				this.packages[pkgNum] = pkgUpd;
				return pkgUpd;
			} else {
				return newPkg;
			}
		}
	},
	
	//called from loadFeeds => infoResponse, i.e. connected to loading packages.
	fixUnknown: function () {
		this.unknownCount = 0;
		this.unknownFixed = 0;
		this.unknown = [];
		var p;
		
		if (this.packages.length > 0) {
			for (p = 0; p < this.packages.length; p += 1) {
				if (this.packages[p].title === 'This is a webOS application.' || this.packages[p].type === 'Unknown') {
					this.unknown[this.unknownCount] = p;
					this.unknownCount += 1;
				}
			}
			
			if (this.unknownCount > 0) {
				this.displayStatus({
					message: $L("<strong>Scanning Unknown Packages</strong><br />")
						+ this.packages[this.unknown[0]].pkg.substr(-32),
					progress: true,
					progValue: 0
				});
				this.packages[this.unknown[0]].loadAppinfoFile(this.fixUnknownDone.bind(this));
			} else {
				this.loadSaved();
			}
		} else {
			this.loadSaved();
		}
	},
	
	fixUnknownDone: function () {
		this.unknownFixed += 1;
		
		if (this.unknownFixed === this.unknownCount) {
			this.displayStatus({message: $L("<strong>Done Fixing!</strong>"), progress: false, progValue: 0});
			this.loadSaved();
		} else {
			this.displayStatus({
				message: $L("<strong>Scanning Unknown Packages</strong><br />")
					+ this.packages[this.unknown[this.unknownFixed]].pkg.substr(-32),
				progValue: Math.round((this.unknownFixed / this.unknownCount) * 100),
				progress: true
			});
			this.packages[this.unknown[this.unknownFixed]].loadAppinfoFile(this.fixUnknownDone.bind(this));
		}
	},
	
	//the all paths from loadFeeds lead here
	loadSaved: function () {
		preware.SavedPacketlist.load(this.doneLoading.bind(this));
	},
	
	doneLoading: function () {
		var p, f, i, justTypeObjs, sortLowerCase;
		try {
			// feeds are no longer dirty and packages are no longer soiled
			this.dirtyFeeds = false;
			this.soiledPackages = false;
			
			// now that we're loaded, lets set this to true
			this.loaded = true;

			// clear out our current data (incase this is a re-update)
			this.packagesReversed = {}; // reset this again so we can rebuild it in alphabetical order
			this.categories = [];
			this.feeds = [];
			this.rawData = ''; // and clear this so its not sitting around full of data
			
			// sort the packages
			if (this.packages.length > 0) {
				this.packages.sort(function (a, b) {
					var strA, strB;
					if (a.title && b.title) {
						strA = a.title.toLowerCase();
						strB = b.title.toLowerCase();
						return ((strA < strB) ? -1 : ((strA > strB) ? 1 : 0));
					} else {
						return -1;
					}
				});
				
				// build reverse-lookup list
				for (p = 0; p < this.packages.length; p += 1) {
					this.packagesReversed[this.packages[p].pkg] = p + 1;
				}
			}
			
			// add package categorys to global category list
			for (p = 0; p < this.packages.length; p += 1) {
				// build categories list
				if (this.categories.indexOf(this.packages[p].category) === -1) {
					// push new category
					this.categories.push(this.packages[p].category);
				}
				
				// build feeds list
				for (f = 0; f < this.packages[p].feeds.length; f += 1) {
					if (this.feeds.indexOf(this.packages[p].feeds[f]) === -1) {
						// push new category
						this.feeds.push(this.packages[p].feeds[f]);
					}
				}
				
				// build types list
				if (this.types.indexOf(this.packages[p].type) === -1) {
					// push new feed
					this.types.push(this.packages[p].type);
				}
			}
		} catch (e) {
			console.error('error in packagesModel#doneLoading: ' + e);
		}
		
		sortLowerCase = function (a, b) {
			var strA, strB;
			// this needs to be lowercase for sorting.
			if (a && b) {
				strA = a.toLowerCase();
				strB = b.toLowerCase();
				return ((strA < strB) ? -1 : ((strA > strB) ? 1 : 0));
			} else {
				return -1;
			}
		};
		
		// sort categories
		if (this.categories.length > 0) {
			this.categories.sort(sortLowerCase);
		}
		
		// sort feeds
		if (this.feeds.length > 0) {
			this.feeds.sort(sortLowerCase);
		}
		
		// sort types
		if (this.types.length > 0) {
			this.types.sort(sortLowerCase);
		}
		
		//check against plattform major gone here.. thing about something in the db8Storage wrapper..
		if (this.onlyLoad === false) {
			justTypeObjs = [];
			for (i = 0; i < this.packages.length; i += 1) {
				if (this.packages[i].blacklisted === false) {
					justTypeObjs.push({_kind: "org.webosinternals.preware.justType:1", id: this.packages[i].pkg, display: this.packages[i].title, secondary: this.packages[i].type + " - " + this.packages[i].category});
				}
			}
			preware.db8Storage.deleteAll(function () {
				preware.db8Storage.putArray(justTypeObjs);
			});
		}
		
		// tell the main scene we're done updating
		this.doneUpdating();
	},
	
	//============================= multi package operations
	//checks restart flags from multiple packages.
	getMultiFlags: function () {
		try {
			var mFlags = {RestartLuna: false, RestartJava: false, RestartDevice: false}, tmpType, d,
				checkFlags = function (flags) {
					if (flags.RestartLuna) {
						mFlags.RestartLuna = true;
					}
					if (flags.RestartJava) {
						mFlags.RestartJava = true;
					}
					if (flags.RestartDevice) {
						mFlags.RestartDevice = true;
					}
				};
			
			// check base package first if there is one
			if (this.multiPkg) {
				if (this.multiPkg.isInstalled) {
					tmpType = 'update';
				} else {
					tmpType = 'install';
				}
				checkFlags(this.multiPkg.flags[tmpType]);
			}

			// check all deps
			for (d = 0; d < this.multiPkgs.length; d += 1) {
				if (this.packages[this.multiPkgs[d]].isInstalled) {
					tmpType = 'update';
				} else {
					tmpType = 'install';
				}
				checkFlags(this.packages[this.multiPkgs[d]].flags[tmpType]);
			}
		
			// return them
			return mFlags;
		} catch (e) {
			console.error('error in packagesModel#getMultiFlags: ' + e);
		}
	},
	
	//asks user if it should install multiple packages. If so, calls testMultiInstall.
	checkMultiInstall: function (pkg, pkgs) {
		try {
			this.multiPkg	= pkg;
			this.multiPkgs	= pkgs;
			this.multiFlags	= this.getMultiFlags();
		
			// see what they want to do:
			//TODO!!! 
			//this.assistant.actionMessage(
				//$L("This package depends on <b>") + this.multiPkgs.length + $L("</b> other package") + (this.multiPkgs.length>1?'s':'') + $L(" to be installed or updated."),
			//[
				//{label:$L("Install / Update ") + (this.multiPkgs.length>1?$L("Them"):$L("It")), value:'ok'},
				//{label:$L("View ") + (this.multiPkgs.length>1?$L("Them"):$L("It")), value:'view'},
				//{label:$L("Cancel"), value:'cancel'}
			//],
			//this.testMultiInstall.bindAsEventListener(this)
			//);
			this.testMultiInstall("ok");
		} catch (e) {
			console.error('error in packagesModel#checkMultiInstall: ' + e);
		}
	},
	
	//this was used to react to the question towards the user and either install or show the packages to be installed.
	testMultiInstall: function (value) {
		switch (value) {
		case 'ok':
			//this.assistant.displayAction($L("Installing / Updating"));
			//this.assistant.startAction();
			console.error("MultiPkg: " + this.multiPkg.pkg);
			console.error("Pushing: " + this.packagesReversed[this.multiPkg.pkg] - 1);
			this.multiPkgs.push(this.packagesReversed[this.multiPkg.pkg] - 1); //add package with dependencies to be list of packages to be installed as last one.
			this.doMultiInstall(0);
			break;
		
		case 'view': //TODO!!!! 
			//this.assistant.controller.stageController.pushScene('pkg-connected', 'install', this.multiPkg, this.multiPkgs);
			this.multiPkg	= false;
			this.multiPkgs = false;
			this.multiFlags	= false;
			break;
		}
		return;
	},
	
	doMultiInstall: function (number) {
		var pkg = this.packages[this.multiPkgs[number]];
		console.error("in doMultiInstall, number: " + number);
		try {
			// call install for dependencies
			if (number < this.multiPkgs.length) {
				console.error("package: " + JSON.stringify(this.multiPkgs[number]));
				if (pkg) {
					console.error("packages List: " + pkg.title + " appcat: " + pkg.appCatalog + " installed: " + pkg.isInstalled);
				} else {
					console.error("Package not in pkg list??");
				}
				//package is from appCatalog (?)
				if (pkg.appCatalog && preware.PrefCookie.get().useTuckerbox) {
					this.doMyApps = true;
					this.doMultiInstall(number + 1);
				} else if (pkg.isInstalled) {
					if (!pkg.location) {
						console.error('No location');
						// see note above about this skipping if the type can't be updated
						this.doMultiInstall(number + 1);
					} else if (preware.typeConditions.can(pkg.type, 'update')) {
						pkg.doUpdate(true, number);
					} else {
						// it can't be updated, so we will just skip it
						// we should probably message or something that this has been skipped
						// or really, we should notify the user before we even get this far
						this.doMultiInstall(number + 1);
					}
				} else {
					if (!pkg.location) {
						console.error('No location');
						// see note above about this skipping if the type can't be updated
						this.doMultiInstall(number + 1);
					} else {
						pkg.doInstall(true, number);
					}
				}
			} else { // end actions!
				console.error("Last app installed. Ending actions.");
				if (this.doMyApps) {
					console.error("Trying to launch software manager.");
					this.dirtyFeeds = true;
					if (Mojo && Mojo.Environment && Mojo.Environment.DeviceInfo && Mojo.Environment.DeviceInfo.platformVersionMajor === 1) {
						navigator.Service.Request('palm://com.palm.applicationManager', {
							method: 'launch',
							parameters: {
								id: "com.palm.app.findapps",
								params: { myapps: '' }
							}
						});
					} else {
						navigator.Service.Request('palm://com.palm.applicationManager', {
							method: 'launch',
							parameters: {
								id: "com.palm.app.swmanager",
								params: { launchType: "updates" }
							}
						});
					}
				}

				if (this.multiFlags.RestartLuna || this.multiFlags.RestartJava || this.multiFlags.RestartDevice) {
					console.error("assistant.actionMessage not yet replaced, logging instead");
					console.error(
						$L("Packages installed:<br /><br />") + this.multiActionMessage(this.multiFlags)
						//[{label:$L("Ok"), value:'ok'}, {label:$L("Later"), value:'skip'}],
						//this.multiActionFunction.bindAsEventListener(this, this.multiFlags)
					);
					return;
				} else {
					// we run this anyways to get the rescan
					this.multiRunFlags(this.multiFlags);
				}
				this.doSimpleMessage($L("Packages installed"));
				this.multiPkg	= false;
				this.multiPkgs	= false;
				this.multiFlags	= false;
				this.doMyApps		= false;
			}
		} catch (e) {
			console.error('error in packagesModel#doMultiInstall: ' + e);
		}
	},
	
	checkMultiRemove: function (pkg, pkgs) {
		var i, msg;
		try {
			this.multiPkg	= pkg;
			this.multiPkgs	= pkgs;
			this.multiFlags	= this.getMultiFlags();
		
			//did not find a replacement for interpolate, yet.. what?
			//var localizedText=$L("This package has <b>#{num}</b> other installed #{package} that #{depend} on it. <br /><br />Removing this package may cause #{them} to no longer function.").interpolate({num: this.multiPkgs.length, package: (this.multiPkgs.length>1 ? $L("packages") : $L("package")), depend: (this.multiPkgs.length>1 ? $L("depend") : $L("depends")), them: (this.multiPkgs.length>1 ? $L("them") : $L("it"))})

			// see what they want to do:
			//this.assistant.actionMessage(
			//	localizedText,
			//	[
					// uncomment to allow removing of itself
					//{label:$L('Remove Anyways'), value:'ok'},
			//		{label:$L("View ") + (this.multiPkgs.length>1?$L("Them"):$L("It")), value:'view'},
			//		{label:$L("Cancel"), value:'cancel'}
			//	],
			//	this.testMultiRemove.bind(this)
			//);
			msg = $L("This package has other installed packages that depend on it. Can't remove it. Depending packages: ");
			for (i = 0; i < this.multiPkgs.length; i += 1) {
				msg += this.packages[this.multiPkgs[i]].title;
				if (i !== this.multiPkgs.length - 1) {
					msg += ", ";
				}
			}
			this.doSimpleMessage(msg);
			this.testMultiRemove("cancel");
		} catch (e) {
			console.error('packagesModel#checkMultiRemove: ' + e);
		}
	},
	
	testMultiRemove: function (value) {
		switch (value) {
		case 'ok':
			this.multiPkg.doRemove(true);
			this.multiPkg	= false;
			this.multiPkgs	= false;
			this.multiFlags	= false;
			break;
		case 'view':
			console.error("View not yet implemented...");
			//this.assistant.controller.stageController.pushScene('pkg-connected', 'remove', this.multiPkg, this.multiPkgs);
			this.multiPkg	= false;
			this.multiPkgs	= false;
			this.multiFlags	= false;
			break;
		}
		return;
	},
	
	//utility function to generate install messages
	multiActionMessage: function (flags) {
		try {
			var msg = '';
			if (flags.RestartJava) {
				msg = $L("<b>Java Restart Is Required</b><br /><i>Once you press Ok your device will lose network connection and be unresponsive until it is done restarting.</i><br />");
			}
			if (flags.RestartLuna) {
				msg = $L("<b>Luna Restart Is Required</b><br /><i>Once you press Ok all your open applications will be closed while luna restarts.</i><br />");
			}
			if ((flags.RestartLuna && flags.RestartJava) || flags.RestartDevice) {
				msg = $L("<b>Device Restart Is Required</b><br /><i>You will need to restart your device to be able to use the packages that were just installed.</i><br />");
			}
			return msg;
		} catch (e) {
			console.error('error in packagesModel#multiActionMessage: ' + e);
		}
	},
	
	//called in the end of an action. Triggers restarts and so on and also a rescann.
	multiRunFlags: function (flags) {
		try {
			if ((flags.RestartLuna && flags.RestartJava) || flags.RestartDevice) {
				IPKGService.restartdevice(function () {});
			}
			if (flags.RestartJava && !flags.RestartLuna) {
				IPKGService.restartjava(function () {});
			}
			if (flags.RestartLuna && !flags.RestartJava) {
				IPKGService.restartluna(function () {});
			}
			// this is always ran...
			if (!preware.PrefCookie.get().avoidBugs) {
				IPKGService.rescan(function () {});
			}
		} catch (e) {
			console.error('packagesModel#multiRunFlags: ' + e);
		}
	},
	
	// Utility stuff if following.
	versionNewer: function (one, two) {
		if (!one) {
			return true;
		}
		if (!two) {
			return false;
		}

		// if one >= two returns false
		// if one < two returns true
		var e1 = one.split(':'),
			e2 = two.split(':'),
			v1 = e1[e1.length > 1 ? 1 : 0].split('.'),
			v2 = e2[e2.length > 1 ? 1 : 0].split('.'),
			diff,
			j,
			prefix1,
			prefix2,
			i1 = [],
			i2 = [],
			last,
			suffix1,
			suffix2;

		if (e1.length > 1 || e2.length > 1) {
			prefix1 = e1.length > 1 ? parseInt(e1[0], 10) : 0;
			prefix2 = e2.length > 1 ? parseInt(e2[0], 10) : 0;
			diff = prefix2 - prefix1;
			if (diff !== 0) {
				return (diff > 0) ? true : false;
			}
		}

		last = v1.length > v2.length ? v1.length : v2.length;		//	use the larger buffer
		for (j = 0; j < last; j += 1) {
			i1[j] = v1.length > j ? parseInt(v1[j], 10) : 0;
			i2[j] = v2.length > j ? parseInt(v2[j], 10) : 0;
		}
		suffix1 = v1.length > 0 ? v1[v1.length - 1].split('-') : [];
		suffix2 = v2.length > 0 ? v2[v2.length - 1].split('-') : [];
		if (suffix1.length > 1 || suffix2.length > 1) {
			last += 1;		//	we're using one more digit
			i1[j] = (suffix1.length > 1) ? parseInt(suffix1[1], 10) : 0;
			i2[j] = (suffix2.length > 1) ? parseInt(suffix2[1], 10) : 0;
		}
		for (j = 0; j < last; j += 1) {
			diff = i2[j] - i1[j];
			if (diff !== 0) {
				return (diff > 0) ? true : false;
			}
		}
		return false;
	},
	
	packageInList: function (pkg) {
		var pkgNum = this.packagesReversed[pkg];
		if (pkgNum !== undefined) {
			return pkgNum - 1;
		} else {
			return false;
		}
	}
});
