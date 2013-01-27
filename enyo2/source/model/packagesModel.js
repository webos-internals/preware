/*global enyo, preware, IPKGService, $H, $L, device */

enyo.singleton({
	name: "preware.Packages",
	// for storing assistants when we get one for certain functions, TODO: those won't work anymore..
	assistant: false,
	onlyLoad: false, //moved here from updateAssistant.
	// for storing action information when we're in a multi-action
	multiPkg: false,
	multiPkgs: false,
	doMyApps: false,
	
	// stores if packages are loaded or not
	loaded: false,
	
	// for storing all the package information
	packages: [],
	packagesReversed: $H(),
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
	subscription: false,
	rawData: '',
	unknownCount: 0,
	unknownFixed: 0,
	
	//typeConditions moved to own kind and file.
		
	//emited signals:
	// onPackagesLoadStatusUpdate: { //emited during load to allow status output.
	//																 msg: "some status message", 
	//																 progress: true/false => show progress meter true/false
	//																 progValue: [1-100]		=> progress value
	//																 error: true/false		=> true if an error occured.
	//														 }
	// onPackagesLoadFinished: {} //emited when loading is finished.
		
	//methods:
	//this replaces link to updateAssistant with a signal.
	doDisplayStatus: function(content) {
		enyo.Signals.send("onPackagesStatusUpdate", content);
	},
	
	doneUpdating: function() {
		enyo.Signals.send("onPackagesLoadFinished", {});
	},
	
	//called to parse feeds.
	loadFeeds: function(feeds, onlyLoad) {
		var i;
		try {
			// clear out our current data (incase this is a re-update)
			this.loaded = false;
			this.packages = [];
			this.packagesReversed = $H();
			this.hasPrices = false;
			this.feeds = [];
			this.urls = [];

			for (i = 0; i < feeds.length; i += 1) {
				this.feeds.push(feeds[i].name);
				this.urls.push(feeds[i].url);
			}

			this.onlyLoad = onlyLoad;
			
			// set title and show progress
			this.doDisplayStatus({msg: $L("<strong>Loading Package Information</strong>"), progress: true, progValue: 0});
			
			// initiate status request
			this.infoStatusRequest();
		} catch (e) {
			enyo.error('packagesModel#loadFeeds', e);
		}
	},
	
	//request package information from IPGKService.
	infoStatusRequest: function() {
		// update display
		this.doDisplayStatus({	msg: $L("<strong>Loading Package Information</strong><br>Status"), 
														progress: true, 
														progValue: Math.round((1/(this.feeds.length+1)) * 100)});

		// request the rawdata
		this.subscription = preware.IPKGService.getStatusFile(this.infoResponse.bind(this, -1));
	},
	
	//request more package information from IPKGService, i.e. next feed.
	infoListRequest: function(num) {		
		// update display
		this.doDisplayStatus({ msg: $L("<strong>Loading Package Information</strong><br>") + this.feeds[num],
													 progress: true, progValue: Math.round(((num+2)/(this.feeds.length+1)) * 100) });
		this.feedNum += 1;
	
		// subscribe to new feed
		this.subscription = preware.IPKGService.getListFile(this.infoResponse.bind(this, num), this.feeds[num]);
	},
	
	//parses the response from the IPKGService.
	infoResponse: function(num, payload) {
		var doneLoading = false, position;
		
		try {
			// log payload for display
			//preware.IPKGService.logPayload(payload);
			
			if (!payload || payload.errorCode !== undefined) {
				// we probably dont need to check this stuff here,
				// it would have already been checked and errored out of this process
				if (payload.errorText === "org.webosinternals.ipkgservice is not running.") {
					this.doDisplayStatus({ error: true, msg: $L("The Package Manager Service is not running. Did you remember to install it? If you did, first try restarting Preware, then try rebooting your device and not launching Preware until you have a stable network connection available.") });
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
			enyo.error('packagesModel#infoResponse', e);
		}
		
		if (doneLoading) {
			if (this.feeds[(num + 1)]) {
				// start next
				this.infoListRequest((num + 1));
			} else {
				// we're done
				this.doDisplayStatus({msg: $L("<strong>Done Loading!</strong>"), 
															progress: false, progValue: 0});
				if (preware.PrefCookie.get().fixUnknown) {
					this.fixUnknown();
				} else {
					this.loadSaved();
				}
			}
		}
	},
	
	//parses package data received from IPKGService.
	parsePackages: function(rawData, url) {
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
							curPkg = 
							{
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
			enyo.error('packagesModel#parsePackages', e);
		}
	},
	
	loadPackage: function(infoObj, url) {
		var newPkg, pkgNum, pkgUpd;
		// Skip packages that are in the status file, but are not actually installed
		if (infoObj.Status &&
				(infoObj.Status.include('not-installed') || infoObj.Status.include('deinstall'))) {
			//alert('+ 1');
			return;
		}

		// load the package from the info
		newPkg = new preware.PackageModel(infoObj);
		
		//TODO: how to get the installed OS version?? :(
		//I think device.version should replace Mojo.Environment.DeviceInfo.platformVersion, because we are using cordova now.
		if (device && device.version && device.verion.match(/^[0-9:.-]+$/)) {
			// Filter out apps with a minimum webos version that is greater then current
			if (this.versionNewer(device.version, newPkg.minWebOSVersion)) {
				//alert('+ 2');
				return;
			}
			
			// Filter out apps with a maximum webos version that is less then current
			if (this.versionNewer(newPkg.maxWebOSVersion, device.version)) {
				//alert('+ 3');
				return;
			}
		} else {
			enyo.error("Could not get OS version, so packges did not get filtered.");
		}
		
		//TODO: replaced Mojo.Environment.DeviceInfo.modelNameAscii with device.name. Test!
		// Filter out apps with a specified devices that dont match the current
		if (!preware.PrefCookie.get().ignoreDevices && newPkg.devices && newPkg.devices.length > 0 &&
			!newPkg.devices.include(device.name)) {
			//alert('+ 4');
			return;
		}
		
		// Filter out paid apps if desired
		if ((preware.PrefCookie.get().onlyShowFree) && (newPkg.price !== undefined) &&
				(newPkg.price !== "0") && (newPkg.price !== "0.00")) {
			//alert('+ 5');
			return;
		}

		// Filter out non-english apps if desired
		if ((preware.PrefCookie.get().onlyShowEnglish) &&
			newPkg.languages && newPkg.languages.length &&
			!newPkg.inLanguage("en")) {
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
			this.packagesReversed.set(newPkg.pkg, this.packages.length);

			return newPkg;
		} else {
			// run package update function of the old package with the new package
			pkgUpd = this.packages[pkgNum].infoUpdate(newPkg);
			if (pkgUpd !== false) {
				// if the new package is to replace the old one, do it
				this.packages[pkgNum] = pkgUpd;
				return pkgUpd;
			} else {
				return newPkg;
			}
		}
	},
	
	//called from loadFeeds => infoResponse, i.e. connected to loading packages.
	fixUnknown: function() {		
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
				this.doDisplayStatus({ msg: $L("<strong>Scanning Unknown Packages</strong><br />") + this.packages[this.unknown[0]].pkg.substr(-32),
																progress: true, progValue: 0});
				this.packages[this.unknown[0]].loadAppinfoFile(this.fixUnknownDone.bind(this));
			} else {
				this.loadSaved();
			}
		} else {
			this.loadSaved();
		}
	},
	
	fixUnknownDone: function() {
		this.unknownFixed += 1;
		
		if (this.unknownFixed === this.unknownCount) {
			this.doDisplayStatus({ msg: $L("<strong>Done Fixing!</strong>"), progress: false, progValue: 0});
			this.loadSaved();
		} else {
			this.doDisplayStatus({ msg: $L("<strong>Scanning Unknown Packages</strong><br />") + this.packages[this.unknown[this.unknownFixed]].pkg.substr(-32),
														 progValue: Math.round((this.unknownFixed/this.unknownCount) * 100), progress: true});
			this.packages[this.unknown[this.unknownFixed]].loadAppinfoFile(this.fixUnknownDone.bind(this));
		}
	},
	
	//the all paths from loadFeeds lead here
	loadSaved: function() {
		preware.SavedPacketlist.load(this.doneLoading.bind(this));
	},
	
	doneLoading: function() {
		var p, f, i, justTypeObjs, sortLowerCase, plattformMajor;
		try {			
			// feeds are no longer dirty and packages are no longer soiled
			this.dirtyFeeds = false;
			this.soiledPackages = false;
			
			// now that we're loaded, lets set this to true
			this.loaded = true;

			// clear out our current data (incase this is a re-update)
			this.packagesReversed = $H(); // reset this again so we can rebuild it in alphabetical order
			this.categories = [];
			this.feeds = [];
			this.rawData = ''; // and clear this so its not sitting around full of data
			
			// sort the packages
			if (this.packages.length > 0) {
				this.packages.sort(function(a, b) {
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
					this.packagesReversed.set(this.packages[p].pkg, p + 1);
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
			enyo.error('packagesModel#doneLoading', e);
		}
		
		sortLowerCase = function(a, b) {
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
		if(this.onlyLoad === false) { 
			justTypeObjs = [];
			for (i = 0; i < this.packages.length; i += 1) {
				if (this.packages[i].blacklisted === false) {
					justTypeObjs.push({_kind: "org.webosinternals.preware.justType:1", id: this.packages[i].pkg, display: this.packages[i].title, secondary: this.packages[i].type + " - " + this.packages[i].category});
				}
			}
			preware.db8Storage.deleteAll(function() {
				preware.db8Storage.putArray(justTypeObjs);
			});
		}
		
		// tell the main scene we're done updating
		this.doneUpdating();
	},
	
	
});
