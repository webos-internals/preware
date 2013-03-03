/* *** Info ***
 * information on package standard is:
 * http://www.webos-internals.org/wiki/Packaging_Standards
 */
/*global enyo, preware, IPKGService, navigator */
 
enyo.kind({
	name: "preware.PackageModel",
	kind: "enyo.Control",
	subscription: false, // for when we're doing a subscription of some service TODO: this won't work.
	assistant: false,		 // for storing an assistant when we get one for certain functions TODO: this won't work..
		
	// onPackageStatusUpdate: { //emited during install to allow status output.
	//																 msg: "some status message", 
	//																 progress: true/false => show progress meter true/false
	//																 progValue: [1-100]		=> progress value
	//																 error: true/false		=> true if an error occured.
	//														 }
	
	doDisplayStatus: function(obj) {
		var msg = "";
		if (obj.error) {
			msg = "ERROR: ";
		}
		msg += obj.msg;
		if (obj.progress) {
			msg += " - Progress: " + obj.progValue;
		}
		console.error("STATUS UPDATE: " + msg);
		enyo.Signals.send("onPackagesStatusUpdate", obj);
	},
		
	// initialize function which loads all the data from the info object
	constructor: function(infoObj) {
		this.inherited(arguments);
		
		try {
			// load up some default items incase the package has no sourceObj (like installed applications not in any feeds)
			this.pkg =								(infoObj && infoObj.pkg ? infoObj.pkg : false);
			this.type =								(infoObj && infoObj.type ? infoObj.type : false);
			this.category =						false;
			this.version =						false;
			this.maintainer =					false;
			this.title =							(infoObj && infoObj.title ? infoObj.title : false);
			this.size =								false;
			this.filename =						(infoObj && infoObj.filename ? infoObj.filename : false);
			this.location =						(infoObj && infoObj.location ? infoObj.location : false);
			this.hasUpdate =					false;
			this.icon =								false;
			this.iconImg =						{object: false, loading: false, loaded: false, target: false, local: false};
			this.date =								false;
			this.price =							false;
			this.feeds =							['Unknown'];
			this.feedString =					'Unknown';
			this.countries =					[];
			this.countryString =			false;
			this.languages =					[];
			this.languageString =			false;
			this.homepage =						false;
			this.license =						false;
			this.description =				false;
			this.changelog =					false;
			this.screenshots =				[];
			this.depends =						[];
			this.flags =							{install:	{RestartLuna:false, RestartJava:false, RestartDevice:false},
																				update:	{RestartLuna:false, RestartJava:false, RestartDevice:false},
																				remove:	{RestartLuna:false, RestartJava:false, RestartDevice:false}};
			this.isInstalled =				false;
			this.dateInstalled =			false;
			this.sizeInstalled =			false;
			this.appCatalog =					false;
			this.isInSavedList =			false;
			this.minWebOSVersion =		'1.0.0';
			this.maxWebOSVersion =		'99.9.9';
			this.devices =						[];
			this.deviceString =				false;
			this.preInstallMessage =	false;
			this.preUpdateMessage =		false;
			this.preRemoveMessage =		false;
			this.blacklisted =				false;
			
			// load the info
			this.infoLoad(infoObj);
			
			// check up on what we've loaded to make sure stuff thats needed isn't blank
			if (!this.category || this.category === 'misc') {
				this.category = 'Unsorted';
			}
			if (!this.type) {
				this.type = 'Unknown';
			}
		} catch (e) {
			enyo.error('PackageModel#create', e);
		}
	},
	
	infoUpdate: function(newPackage) {
		try {
			// check if its newer
			var newer = preware.Packages.versionNewer(this.version, newPackage.version);
			
			if (!newPackage.isInstalled && !this.isInstalled && newer) {
				// Package in multiple feeds, with different versions
				//alert('Replace Type: 1');
				// Fill in any missing information from the older version
				newPackage.infoLoadFromPkg(this);
				return newPackage;
			}
			
			if (newPackage.isInstalled && !this.isInstalled && !newer) {
				// Package in multiple feeds, older version installed from later feed
				// (why wasn't it found in the status file?)
				//alert('Replace Type: 2');
				this.isInstalled = true;
				this.hasUpdate = true; // comment when status is last?
				this.versionInstalled = newPackage.version;
				this.infoLoadFromPkg(newPackage);
				return false;
			}
			
			if (!newPackage.isInstalled && this.isInstalled && !newer) {
				// Package loaded from status, and same or older version in a feed
				//alert('Replace Type: 3');
				this.isInstalled = true;
				//this.hasUpdate = false; // this fixes the not update thing?
				//this.versionInstalled = newPackage.version; // don't override the newer version
				this.infoLoadFromPkg(newPackage);
				return false;
			}
			
			if (newPackage.isInstalled && !this.isInstalled && newer) {
				// Package in multiple feeds, installed from later version
				//alert('Replace Type: 4');
				newPackage.isInstalled = true;
				//newPackage.hasUpdate = false; // this fixes the not update thing?
				newPackage.versionInstalled = this.version;
				newPackage.infoLoadFromPkg(this);
				return newPackage;
			}
			
			if (!newPackage.isInstalled && this.isInstalled && newer) {
				// Package in multiple feeds, installed from earlier version
				//alert('Replace Type: 5');
				newPackage.isInstalled = true;
				newPackage.hasUpdate = true;
				newPackage.versionInstalled = this.version;
				newPackage.infoLoadFromPkg(this);
				return newPackage;
			}
			
			// Neither package is installed, and the versions are the same.
			//alert('Replace Type: 6');
			// Just use the information from the first package found
			// this.infoLoadFromPkg(newPackage);
			return false;
		} catch (e) {
			enyo.error('PackageModel#infoUpdate', e);
		}
	},
	
	infoLoad: function(info) {
		var splitRes, i, r, match, tmp, sourceJson = {}, blacklist, b, m;
		try {
			// load data
			this.pkg =			this.pkg			|| info.Package;
			this.version =	this.version	|| info.version;
			this.size =			info.size			|| info.Size;
			this.filename = this.filename || info.Filename;

			// check if is installed
			if (info.Status && !info.Status.include('not-installed') && !info.Status.include('deinstall')) {
				this.isInstalled = true;
				this.dateInstalled = (info['Installed-Time'] && isNumeric(info['Installed-Time']) ? info['Installed-Time'] : false);
				this.sizeInstalled = info['Installed-Size'];
			}

			// parse package dependencies
			if ((!this.depends || this.depends.length === 0) && info.Depends) {
				//alert(info.Depends);
				splitRes = info.Depends.split(',');
				for (i = 0; i < splitRes.length; i += 1) {
					//var r = new RegExp(/(.*)\((.*)\)/); // this regex sucks
					r = new RegExp("^([^\(]*)[\s]*[\(]?([^0-9]*)[\s]*([0-9.]*)[\)]?"); // this one is win
					match = splitRes[i].match(r);
					if (match) {
						//for(var m = 0; m < match.length; m++) alert(m + ' [' + match[m] + ']');
						if (match[2]) {
							match[2] = trim(match[2]);
						} else {
							match[2] = false;
						}
						if (match[3]) {
							match[3] = trim(match[3]);
						} else {
						match[3] = false;
						}

						this.depends.push({pkg: trim(match[1]), match: match[2], version: match[3]});
					}
				}
			}

			// check if Source is json object
			// basically, if it has a { in it, we'll assume its json data
			if (info.Source && info.Source.include('{')) {
				// parse json to object
				try {
					//alert('parsing source '+this.pkg);
					sourceJson = JSON.parse(info.Source.replace(/\\'/g, "'")); //"
				} catch (e) {
					enyo.error('PackageModel#infoLoad#parse(' + this.pkg + '): ' + info.Source, e);
					sourceJson = {};
				}

				// check if the object has data we can load or overwrite the defaults with
				if ((!this.type || this.type === 'Unknown') && sourceJson.Type) {
					this.type = sourceJson.Type;
				}
				// override the type
				if (sourceJson.Type === "AppCatalog") {
					this.type = "Application";
					this.appCatalog = true;
				}

				this.category =						this.category						|| sourceJson.Category;
				this.title =							this.title							|| sourceJson.Title;				
				this.icon =								this.icon								|| sourceJson.Icon;
				this.homepage =						this.homepage						|| sourceJson.Homepage;
				this.filename =						this.filename						|| sourceJson.Filename;
				this.location =						this.location						|| sourceJson.Location;
				this.license =						this.license						|| sourceJson.License;
				this.description =				this.description				|| sourceJson.FullDescription;
				this.changelog =					this.changelog					|| sourceJson.Changelog;
				this.preInstallMessage =	this.preInstallMessage	|| sourceJson.PreInstallMessage;
				this.preUpdateMessage =		this.preUpdateMessage		|| sourceJson.PreUpdateMessage;
				this.preRemoveMessage =		this.preRemoveMessage		|| sourceJson.PreRemoveMessage;
				this.date = this.date || isNumeric(sourceJson.LastUpdate) ? sourceJson.LastUpdate : undefined;
				if ((!this.screenshots || this.screenshots.length === 0) && sourceJson.Screenshots) {
					this.screenshots = sourceJson.Screenshots;
				}

				if (!this.price && sourceJson.Price) {
					this.price = sourceJson.Price;
					preware.Packages.hasPrices = true;
				}

				if (sourceJson.MinWebOSVersion) {
					this.minWebOSVersion = sourceJson.MinWebOSVersion;
				}
				if (sourceJson.MaxWebOSVersion) {
					this.maxWebOSVersion = sourceJson.MaxWebOSVersion;
				}

				if (sourceJson.DeviceCompatibility) {
					this.devices = sourceJson.DeviceCompatibility;
					this.deviceString = sourceJson.DeviceCompatibility.join(", ");
				}

				if (sourceJson.Feed) {
					this.feeds = [sourceJson.Feed];
					this.feedString = sourceJson.Feed;
				}

				if (sourceJson.Countries) {
					this.countries = sourceJson.Countries;
					this.countryString = sourceJson.Countries.join(", ");
				}

				if (sourceJson.Languages) {
					this.languages = sourceJson.Languages;
					this.languageString = sourceJson.Languages.join(", ");
				}
			
				if (sourceJson.PostInstallFlags)	{
					this.flags.install.RestartLuna		= sourceJson.PostInstallFlags.include('RestartLuna');
					this.flags.install.RestartJava		= sourceJson.PostInstallFlags.include('RestartJava');
					this.flags.install.RestartDevice	= sourceJson.PostInstallFlags.include('RestartDevice');
				}
				if (sourceJson.PostUpdateFlags) {
					this.flags.update.RestartLuna		= sourceJson.PostUpdateFlags.include('RestartLuna');
					this.flags.update.RestartJava		= sourceJson.PostUpdateFlags.include('RestartJava');
					this.flags.update.RestartDevice = sourceJson.PostUpdateFlags.include('RestartDevice');
				}
				if (sourceJson.PostRemoveFlags) {
					this.flags.remove.RestartLuna		= sourceJson.PostRemoveFlags.include('RestartLuna');
					this.flags.remove.RestartJava		= sourceJson.PostRemoveFlags.include('RestartJava');
					this.flags.remove.RestartDevice = sourceJson.PostRemoveFlags.include('RestartDevice');
				}			
			}

			// load info that may not be in source object
			if (!this.category &&	info.Section) { 
				this.category =	info.Section;
			}
			if (!this.title && info.Description) {
				this.title = info.Description;
			}
		
			// parse maintainer
			if ((!this.maintainer || this.maintainer.length === 0) && info.Maintainer) {
				this.maintainer = [];
				splitRes = info.Maintainer.split(',');
				r = new RegExp("^([^<]*)<([^>]*)>?"); // this one is win
				for (i = 0; i < splitRes.length; i += 1) {
					match = trim(splitRes[i]).match(r);
					if (match) {
						tmp = {name: trim(match[1]), url: match[2]};
						if (tmp.url.include('@')) {
							// remove stupid default palm address for palm-package'd apps
							if (tmp.url === 'palm@palm.com' ||		// v1.1 style
										tmp.url === 'nobody@example.com') {// v1.2 style
								tmp.url = false;
							} else {
								tmp.url = 'mailto:' + tmp.url + '?subject=' + this.title;
							}
						}
						this.maintainer.push(tmp);
					} else {
						this.maintainer.push({name: trim(splitRes[i]), url: false});
					}
				}
			}
		
			// check blacklist
			blacklist = preware.PrefCookie.get().blackList;
			if (!this.blacklisted && blacklist.length > 0 && !this.isInstalled && !this.isInSavedList) {
				for (b = 0; b < blacklist.length; b += 1) {
					if (!this.blacklisted) {
						if (blacklist[b].field === 'title' && this.title && this.title.toLowerCase().include(blacklist[b].search.toLowerCase())) {
							this.blacklisted = true;
						} else if (blacklist[b].field === 'maintainer' && this.maintainer.length > 0) {
							for (m = 0; m < this.maintainer.length; m += 1) {
								if (this.maintainer[m].name.toLowerCase().include(blacklist[b].search.toLowerCase())) {
									this.blacklisted = true;
								}
							}
						} else if (blacklist[b].field === 'id' && this.pkg.toLowerCase().include(blacklist[b].search.toLowerCase())) {
							this.blacklisted = true;
						} else if (blacklist[b].field === 'desc' && this.description && this.description.toLowerCase().include(blacklist[b].search.toLowerCase())) {
							this.blacklisted = true;
						} else if (blacklist[b].field === 'category' && this.category && this.category.toLowerCase().include(blacklist[b].search.toLowerCase())) {
							this.blacklisted = true;
						}
					}
				}
			}		

		} catch (error) {
			enyo.error('PackageModel#infoLoad', error);
		}
	},
	
	infoLoadFromPkg: function(pkg) {
		try {
			if ((!this.type || this.type === 'Unknown') && pkg.type) {
				this.type = pkg.type;
			}
			// override the type
			if (this.appCatalog || (this.type === "AppCatalog") ||
							pkg.appCatalog || (pkg.type === "AppCatalog")) {
				this.type = "Application";
				this.appCatalog = true;
			} else {
				this.appCatalog = false;
			}
			
			// check blacklist
			if (pkg.blacklisted === true) {
				this.blacklisted = true;
			}

			if (!this.title || this.title === 'This is a webOS application.') {
				this.title = pkg.title;
			}
			if (this.category === 'Unsorted') {
				this.category =	pkg.category;
			}
			if (!this.maintainer || this.maintainer.length === 0
						|| (this.maintainer.length === 1 && this.maintainer[0].name === 'N/A')) {
				this.maintainer = pkg.maintainer;
			}
			this.date = this.date || isNumeric(pkg.date) ? pkg.date : undefined;
			this.dateInstalled = this.dateInstalled || isNumeric(pkg.dateInstalled) ? pkg.dateInstalled : undefined;
			
			this.maintUrl						=	this.maintUrl						|| pkg.maintUrl;
			this.size								=	this.size								|| pkg.size;
			this.filename						=	this.filename						|| pkg.filename;
			this.location						=	this.location						|| pkg.location;
			this.price							=	this.price							|| pkg.price;
			this.homepage						=	this.homepage						|| pkg.homepage;
			this.license						= this.license						|| pkg.license;
			this.description				= this.description				|| pkg.description;
			this.changelog					= this.changelog					|| pkg.changelog;
			this.isInstalled				= this.isInstalled				|| pkg.isInstalled;
			this.hasUpdate					= this.hasUpdate					|| pkg.hasUpdate;
			this.sizeInstalled			= this.sizeInstalled			|| pkg.sizeInstalled;
			this.isInSavedList			= this.isInSavedList			|| pkg.isInSavedList;
			this.preInstallMessage	= this.preInstallMessage	|| pkg.preInstallMessage;
			this.preUpdateMessage		= this.preUpdateMesssage	|| pkg.preUpdateMessage;
			this.preRemoveMessage		= this.preRemoveMessage		|| pkg.preRemoveMessage;
			
			if (!this.icon) {
				this.icon = pkg.icon;
				this.iconImg.local = false;
			}
			
			// join feeds
			if (this.feeds[0] === 'Unknown') {
				this.feeds = pkg.feeds;
				this.feedString = pkg.feedString;
			}
			
			// join devices
			if (this.devices.length === 0) {
				this.devices = pkg.devices;
				this.deviceString = pkg.deviceString;
			}

			// join countries
			if (this.countries.length === 0) {
				this.countries = pkg.countries;
				this.countryString = pkg.countryString;
			}
			
			// join languages
			if (this.languages.length === 0) {
				this.languages = pkg.languages;
				this.languageString = pkg.languageString;
			}
		 
			// join deps
			if (this.depends.length === 0 && pkg.depends.length > 0) {
				this.depends = pkg.depends;
			}

			// join screenshots
			if (this.screenshots.length === 0 && pkg.screenshots.length > 0) {
				this.screenshots = pkg.screenshots;
			}

			// join flags
			this.flags.install.RestartLuna		= this.flags.install.RestartLuna		|| pkg.flags.install.RestartLuna;
			this.flags.install.RestartJava		= this.flags.install.RestartJava		|| pkg.flags.install.RestartJava;
			this.flags.install.RestartDevice	= this.flags.install.RestartDevice	|| pkg.flags.install.RestartDevice;
			this.flags.update.RestartLuna			= this.flags.update.RestartLuna			|| pkg.flags.update.RestartLuna;
			this.flags.update.RestartJava			= this.flags.update.RestartJava			|| pkg.flags.update.RestartJava;
			this.flags.update.RestartDevice		= this.flags.update.RestartDevice		|| pkg.flags.update.RestartDevice;
			this.flags.remove.RestartLuna			= this.flags.remove.RestartLuna			|| pkg.flags.remove.RestartLuna;
			this.flags.remove.RestartJava			= this.flags.remove.RestartJava			|| pkg.flags.remove.RestartJava;
			this.flags.remove.RestartDevice		= this.flags.remove.RestartDevice		|| pkg.flags.remove.RestartDevice;
		} catch (e) {
			enyo.error('PackageModel#infoLoadFromPkg (' + this.pkg + ')', e);
		}
	},
	
	infoSave: function() {
		var info = {}, fields = [];

		try {
			// load data
			info.Package = this.pkg;
			//alert('info.Package: ' + info.Package);
			if (this.version) {
				info.Version = this.version;
			}
			//alert('info.Version: ' + info.Version);
			if (this.size) {
				info.Size = this.size;
			}
			//alert('info.Size: ' + info.Size);
			if (this.filename) {
				info.Filename = this.filename;
			}
			//alert('info.Filename: ' + info.Filename);
			if (this.title) {
				info.Description = this.title;
			}
			//alert('info.Description: ' + info.Description);
		
			// %%% Missing information below: %%%
			// this.screenshots = sourceJson.Screenshots;
			// this.devices = sourceJson.DeviceCompatibility;
			// this.deviceString = sourceJson.DeviceCompatibility.join(",");
			// this.countries = sourceJson.Countries;
			// this.countryString = sourceJson.Countries.join(",");
			// this.languages = sourceJson.Languages;
			// this.languageString = sourceJson.Languages.join(",");
			// this.maintainer = info.Maintainer.split(',');

			if (this.appCatalog) {
				fields.push('"Type": "AppCatalog"');
			} else {
				fields.push('"Type": "' + this.type + '"');
			}
			if (this.category) {
				fields.push('"Category": "' + this.category + '"');
			}
			if (this.title) {
				fields.push('"Title": "' + this.title + '"');
			}
			if (this.icon) {
				fields.push('"Icon": "' + this.icon + '"');
			}
			if (this.date) {
				fields.push('"LastUpdated": "' + this.date + '"');
			}
			if (this.homepage) {
				fields.push('"Homepage": "' + this.homepage + '"');
			}
			if (this.license) {
				fields.push('"License": "' + this.license + '"');
			}
			if (this.description) {
				fields.push('"FullDescription": "' + this.description + '"');
			}
			if (this.changelog) {
				fields.push('"Changelog": "' + this.changelog + '"');
			}
			info.Source = '{ ' + fields.join(", ") + ' }';
			//alert('info.Source: ' + info.Source);

		} catch (e) {
			enyo.error('PackageModel#infoSave', e);
		}
		
		return info;
	},
	
	loadAppinfoFile: function(callback) {
		this.subscription = preware.IPKGService.getAppinfoFile(this.loadAppinfoFileResponse.bind(this, callback), this.pkg);
	},
	
	loadAppinfoFileResponse: function(callback, payload) {
		if (payload.returnValue === false) {
			// hit control file
			this.loadControlFile(callback);
			return;
		}

		if (payload.stage === 'start') {
			// at start we clear the old data to make sure its empty
			this.rawData = '';
		} else if (payload.stage === 'middle') {
			// in the middle, we append the data
			if (payload.contents) {
				this.rawData += payload.contents;
			}
		} else if (payload.stage === 'end') {
			// at end, we parse the data we've received this whole time
			if (this.rawData !== '') {
				var appInfo = {};
				try {
					//alert("parsing appinfo "+this.pkg);
					appInfo = JSON.parse(this.rawData);
				} catch (e1) {
					//alert("error in appinfo "+this.pkg);
					enyo.error('PackageModel#loadAppinfoFileResponse#parse' + this.rawData, e1);
				}
		
				if ((!this.type || this.type === '' || this.type === 'Unknown') && this.title === 'This is a webOS application.') {
					// assume application if its unknown and has an appinfo
					this.type = 'Application';
				}
				if ((!this.title || this.title === '' || this.title === 'This is a webOS application.') && appInfo.title) {
					this.title = appInfo.title;
				}
				if (!this.icon || this.icon === '') {
					this.iconImg.local = true;
					if (appInfo.icon) {
						this.icon = '../' + this.pkg + '/' + appInfo.icon;
					} else {
						this.icon = '../' + this.pkg + '/icon.png';
					}
				}
				if ((!this.maintainer || this.maintainer.length === 0
									|| (this.maintainer.length === 1 && this.maintainer[0].name === 'N/A'))
							 && appInfo.vendor) {
					this.maintainer = [{name: appInfo.vendor, url: false}];
				}
			}
	
			// hit control file
			this.loadControlFile(callback);
		}
	},
	
	loadControlFile: function(callback) {
		this.subscription = preware.IPKGService.getControlFile(this.loadControlFileResponse.bind(this, callback), this.pkg);
	},
	loadControlFileResponse: function(callback, payload) {
		if (payload.returnValue === false) {
			if (callback) {
				callback();
			}
			return;
		}

		var data, lineRegExp, info, match, x;
		if (payload.stage === 'start') {
			// at start we clear the old data to make sure its empty
			this.rawData = '';
		} else if (payload.stage === 'middle') {
			// in the middle, we append the data
			if (payload.contents) {
				this.rawData += payload.contents;
			}
		} else if (payload.stage === 'end') {
			// at end, we parse the data we've received this whole time
			if (this.rawData !== '') {
				data = this.rawData.split(/\n/);
				lineRegExp = new RegExp(/[\s]*([^:]*):[\s]*(.*)[\s]*$/);
				info = {	// blank information
					Architecture: '',
					Section: '',
					Package: '',
					Depends: '',
					Maintainer: '',
					Version: '',
					Description: '',
					Source: ''
				};

				for (x = 0; x < data.length; x += 1) {
					match = lineRegExp.exec(data[x]);
					if (match) {
						if (match[1] && match[2]) {
							info[match[1]] = match[2];
						}
					}
				}

				try {
					//alert("parsing control "+this.pkg);
					this.infoLoad(info);
				}
				catch (e) {
					//alert("error in control "+this.pkg);
					enyo.error('PackageModel#loadControlFileResponse#infoLoad' + this.rawData, e);
				}
			}

			if (callback) {
				callback();
			}
		}
	},
	
	// checks if this package is in the feed
	inFeed: function(feed) {
		var f;
		for (f = 0; f < this.feeds.length; f += 1) {
			if (this.feeds[f] === feed) {
				return true;
			}
		}
		return false;
	},
	
	// checks if this package is in the country
	inCountry: function(country) {
		var f;
		for (f = 0; f < this.countries.length; f += 1) {
			if (this.countries[f] === country) {
				return true;
			}
		}
		return false;
	},
	
	// checks if this package is in the language
	inLanguage: function(language) {
		var f;
		for (f = 0; f < this.languages.length; f += 1) {
			if (this.languages[f] === language) {
				return true;
			}
		}
		return false;
	},

	getDependencies: function(justNeeded) {
		var returnArray = [], d, p;

		if (this.depends.length > 0) {
			for (d = 0; d < this.depends.length; d += 1) {
			
				if (preware.Packages.packages.length > 0) {
					for (p = 0; p < preware.Packages.packages.length; p += 1) {
						if (preware.Packages.packages[p].pkg === this.depends[d].pkg) {
							//alert(preware.Packages.packages[p].title);
							//for (var t in this.depends[d]) alert(t + ': ' + this.depends[d][t]);
							
							if (!justNeeded) {
								returnArray.push(p);
							} else { // if we want just whats needed, check for updates
								if (preware.Packages.packages[p].isInstalled) {
									// if it has an update, it's a dependency
									if (preware.Packages.packages[p].hasUpdate) {
										returnArray.push(p);
									}
								} else { // if its not installed then we'll assume we need
									returnArray.push(p);
								}
							}
						}
					}
				}
			}
		}
		return returnArray;
	},
	
	getDependenciesRecursive: function(justNeeded) {
		// setup our return array
		var deps = [],	
			// get all recursive dependencies
			rawDeps = this.getDependenciesRecursiveFunction(justNeeded, 0),
			n, r, pushIt; //loop variables
	
		if (rawDeps.length > 0) {
			// sort them by depth
			rawDeps.sort(function(a, b) {
				return b.d - a.d;
			});
		
			// remove dups while adding to the final list
			for (n = 0; n < rawDeps.length; n += 1) {
				pushIt = true;
				if (deps.length > 0) {
					for (r = 0; r < deps.length; r += 1) {
						if (rawDeps[n].id === deps[r]) {
							pushIt = false;
						}
					}
				}
				if (pushIt) {
					deps.push(rawDeps[n].id);
				}
			}
		}
		return deps;
	},

	getDependenciesRecursiveFunction: function(justNeeded, depth) {
		if (!depth && depth !== 0) {
			depth = 0;
		}
		var returnArray = [],
			depTest = this.getDependencies(justNeeded),
			p, r, recTest;

		if (depTest.length > 0) {
			for (p = 0; p < depTest.length; p += 1) {
				returnArray.push({d:depth, id:depTest[p]});

				recTest = preware.Packages.packages[depTest[p]].getDependenciesRecursiveFunction(justNeeded, depth+1);
				if (recTest.length > 0) {
					for (r = 0; r < recTest.length; r += 1) {
						returnArray.push({d:recTest[r].d, id:recTest[r].id});
					}
				}
			}
		}
		return returnArray;
	},
	
	getDependent: function(justInstalled, installedFirst) {
		var packageArray = [],
			returnArray = [], p, d;
			
		for (p = 0; p < preware.Packages.packages.length; p += 1) {
			// this is for real
			for (d = 0; d < preware.Packages.packages[p].depends.length; d += 1) {
				if (preware.Packages.packages[p].depends[d].pkg === this.pkg) {
					//alert(preware.Packages.packages[p].title);
					
					if (!justInstalled) {
						packageArray.push(p);
					} else {
						if (preware.Packages.packages[p].isInstalled) {
							packageArray.push(p);
						}
					}
				}
			}
		}

		if (packageArray.length > 0 && installedFirst) {
			for (p = 0; p < packageArray.length; p += 1) {
				if (preware.Packages.packages[packageArray[p]].isInstalled) {
					returnArray.push(packageArray[p]);
				}
			}
			for (p = 0; p < packageArray.length; p += 1) {
				if (!preware.Packages.packages[packageArray[p]].isInstalled) {
					returnArray.push(packageArray[p]);
				}
			}
		} else {
			returnArray = packageArray;
		}
		return returnArray;
	},

	matchItem: function(item) {
		var matchIt = false;

		// check blacklist
		if (this.blacklisted) {
			return false;
		}

		// push packages that meet the listing
		if ((item.pkgList === 'all') 
						 || (item.pkgList === 'other' 
									 && this.type !== 'Application' 
									 && this.type !== 'Theme' 
									 && this.type !== 'Patch')) {
			matchIt = true;
			// if is installed and installed is not to be shown, dont push it
			if (this.isInstalled && !preware.PrefCookie.get().listInstalled) {
				matchIt = false;
				// if it is installed and is not to be shown but its the "list of everything", push it anyways
				if (item.pkgType === 'all' && item.pkgFeed === 'all' && item.pkgCat === 'all') {
					matchIt = true;
				}
			}
			// if it is not installed, but is in the saved list and not in a feed, then dont push it
			if (!this.isInstalled && this.isInSavedList && (this.feeds[0] === 'Unknown')) {
				matchIt = false;
			}
		} else if (item.pkgList === 'updates' && this.hasUpdate) {
			matchIt = true;
		} else if (item.pkgList === 'installed' && this.isInstalled) {
			matchIt = true;
		}	else if (item.pkgList === 'saved' && this.isInSavedList 
									 && (!this.appCatalog || preware.PrefCookie.get().useTuckerbox)) {
			matchIt = true;
		}

		// check type and dont push if not right
		if (item.pkgType !== 'all' && item.pkgType !== '' && item.pkgType !== this.type) {
			matchIt = false;
		}

		// check feed and dont push if not right
		if (item.pkgFeed !== 'all' && item.pkgFeed !== '' && !this.inFeed(item.pkgFeed)) {
			matchIt = false;
		}
	
		// check category and dont push if not right
		if (item.pkgCat !== 'all' && item.pkgCat !== '' && item.pkgCat !== this.category) {
			matchIt = false;
		}

		// return if it matches!
		return matchIt;
	},

	/* ------- below are for package actions -------- */
	launch: function() {
		enyo.log("Installed? " + this.isInstalled + " Type: " + this.type);
		if (this.isInstalled && this.type === 'Application') {
			enyo.log("Launching " + this.pkg);
			var request = navigator.service.Request("palm://com.palm.applicationManager/",
			{
				method: 'launch',
				parameters: {id: this.pkg},
				//onSuccess: enyo.bind(this, "handleGetPreferencesResponse")
			});
		}
	},
	doRedirect: function() {
		navigator.Service.Request('palm://com.palm.applicationManager', 
			{
				method: 'open',
				parameters: 
				{
					target: "http://developer.palm.com/appredirect/?packageid="+this.pkg
				}
			});
	},
	doInstall: function(skipDeps, multi) {
		try {
			
			// check dependencies and do multi-install
			if (!skipDeps) {
				this.doDisplayStatus({msg: $L("Checking Dependencies")});
				var deps = this.getDependenciesRecursive(true); // true to get "just needed" packages
				if (deps.length > 0) {
					preware.PackagesModel.checkMultiInstall(this, deps); //TODO!
					return;
				}
			}
			
			// start action
			if (multi !== undefined) {
				this.doDisplayStatus({msg: $L("Downloading / Installing<br />") + this.title});
				
				// call install service
				preware.IPKGService.install(this.onInstall.bind(this, multi), this.filename, this.location.replace(/ /g, "%20"));
			} else {
				this.doDisplayStatus({msg: $L("Downloading / Installing")});
				
				//TODO: what is that: this.assistant.startAction();
				enyo.error("this.assistant.startAction() not yet replaced.");
				
				// call install service
				preware.IPKGService.install(this.onInstall.bind(this), this.filename, this.location.replace(/ /g, "%20"));
			}
		} catch (e) {
			enyo.error('packageModel#doInstall', e);
		}
	},
	doUpdate: function(skipDeps, multi)	{
		try {
		
			// check dependencies and do multi-install
			if (!skipDeps) {
				this.doDisplayStatus({msg: $L("Checking Dependencies")});
				var deps = this.getDependenciesRecursive(true); // true to get "just needed" packages
				if (deps.length > 0) {
					preware.PackagesModel.checkMultiInstall(this, deps);
					return;
				}
			}
			
			// start action
			if (multi !== undefined) {
				this.doDisplayStatus({msg: $L("Downloading / Updating<br />") + this.title});

				if (packages.can(this.type, 'updateAsReplace')) { //TODO!
					preware.IPKGService.replace(this.onUpdate.bind(this, multi), this.pkg, this.filename, this.location.replace(/ /g, "%20"));
					this.doDisplayStatus({msg: 'Downloading / Replacing<br />' + this.title});
				} else {
					preware.IPKGService.install(this.onUpdate.bind(this, multi), this.filename, this.location.replace(/ /g, "%20"));
				}
			}	else {
				this.doDisplayStatus({msg: $L("Downloading / Updating")});

				//TODO: replace!! :(
				//this.assistant.startAction();
				enyo.error("this.assistant.startAction() not yet replaced.");
			
				if (packages.can(this.type, 'updateAsReplace')) {
					preware.IPKGService.replace(this.onUpdate.bind(this), this.pkg, this.filename, this.location.replace(/ /g, "%20"));
					this.doDisplayStatus({msg: $L("Downloading / Replacing")});
				} else {
					preware.IPKGService.install(this.onUpdate.bind(this), this.filename, this.location.replace(/ /g, "%20"));
				}
			}
		} catch (e) {
			enyo.error('packageModel#doUpdate', e);
		}
	},
	doRemove: function(skipDeps) {
		try {			
			// check dependencies and do multi-install
			if (!skipDeps) {
				this.doDisplayStatus({msg: $L("Checking Dependencies")});
				var deps = this.getDependent(true); // true to get "just installed" packages
				if (deps.length > 0) {
					preware.PackagesModel.checkMultiRemove(this, deps, assistant); //TODO!
					return;
				}
			}
			
			// start action
			this.doDisplayStatus({msg: $L("Removing")});
			//TODO: replace this with something..
			//this.assistant.startAction();
			enyo.error("this.assistant.startAction() not yet replaced.");
			
			// call remove service
			preware.IPKGService.remove(this.onRemove.bind(this), this.pkg);
		} catch (e) {
			enyo.error('packageModel#doRemove', e);
		}
	},
	
	onInstall: function(payload, multi) {
		try {
			// log payload for display
			preware.IPKGService.logPayload(payload);
			
			if (!payload) {
				var msg = $L("Error Installing: Communication Error");
				var msgError = true;
			}	else {
				if (!payload.returnValue) {
					var msg = $L("Error Installing: No Further Information");
					var msgError = true;
				}
				if (payload.stage == "failed") {
					var msg = $L("Error Installing: See IPKG Log");
					var msgError = true;
				}	else if (payload.stage == "status") {
					this.doDisplayStatus({msg: $L("Downloading / Installing<br />") + payload.status});
					return;
				} else if (payload.stage == "completed") {
					// update info
					this.isInstalled = true;
										
					// message
					var msg = this.type + $L(" installed");
					
					// do finishing stuff
					if (multi !== undefined) {
						preware.PackagesModel.doMultiInstall(multi+1); //TODO!
						return;
					}	else {
						if (this.hasFlags('install')) { //TODO!
							enyo.error("assistant.actionMessage not yet replaced, logging instead");
							enyo.log(
								msg + ':<br /><br />' + this.actionMessage('install'),
								[{label:$L("Ok"), value:'ok'}, {label:$L("Later"), value:'skip'}],
								this.actionFunction.bindAsEventListener(this, 'install')
							);
							return;
						}	else {
							// we run this anyways to get the rescan
							this.runFlags('install');
						}
					}
				}
				// we keep this around for services without flags that have a javarestart in their scripts
				// of course, it might get here on accident, but thats a risk we'll have to take for now [2]
				else if (payload.errorText === "org.webosinternals.ipkgservice is not running.")
				{
					// update info
					this.isInstalled = true;
					
					// message
					var msg = this.type + $L(" installed");
					var msgError = true;
					
					if (multi !== undefined) {
						preware.PackagesModel.doMultiInstall(multi + 1);
						return;
					}
				}	else {
					return;
				}
			}
			
			if (msgError) {
				enyo.error("assistant.actionMessage not yet replaced, logging instead");
				enyo.log(
					msg,
					[{label:$L("Ok"), value:'ok'}, {label:$L("IPKG Log"), value:'view-log'}],
					this.errorLogFunction.bindAsEventListener(this)
				);
			} else {
				enyo.error("assistant.simpleMessage not yet replaced, logging instead");
				enyo.log(msg);
			}
			
			//TODO:
			//this.assistant.endAction();
			enyo.error("assistant.endAction not yet replaced");
		} catch (e) {
			enyo.error('packageModel#onInstall', e);
		}
	},
	onUpdate: function(multi, payload) {
		try {
			// log payload for display
			preware.IPKGService.logPayload(payload);
			
			if (!payload) {
				var msg = $L("Error Updating: Communication Error");
				var msgError = true;
			} else {
				if (!payload.returnValue) {
					var msg = $L("Error Updating: No Further Information");
					var msgError = true;
				}
				if (payload.stage == "failed") {
					var msg = $L("Error Updating: See IPKG Log");
					var msgError = true;
				} else if (payload.stage == "status") {
					this.doDisplayStatus({msg: $L("Downloading / Updating<br />") + payload.status});
					return;
				} else if (payload.stage == "completed") {
					// update info
					this.hasUpdate = false;
										
					// message
					var msg = this.type + $L(" updated");
					
					// do finishing stuff
					if (multi !== undefined) {
						preware.PackagesModel.doMultiInstall(multi + 1);
						return;
					}	else {
						if (this.hasFlags('update')) {
							enyo.error("assistant.actionMessage not yet replaced, logging instead");
							enyo.log(
								msg + ':<br /><br />' + this.actionMessage('update'),
								[{label:$L("Ok"), value:'ok'}, {label:$L("Later"), value:'skip'}],
								this.actionFunction.bindAsEventListener(this, 'update')
							);
							return;
						}	else {
							// we run this anyways to get the rescan
							this.runFlags('update');
						}
					}
				}
				// we keep this around for services without flags that have a javarestart in their scripts
				// of course, it might get here on accident, but thats a risk we'll have to take for now
				else if (payload.errorText === "org.webosinternals.ipkgservice is not running.")
				{
					// update info
					this.hasUpdate = false;
										
					// message
					var msg = this.type + $L(" updated");
					var msgError = true;
					
					if (multi !== undefined) {
						preware.PackagesModel.doMultiInstall(multi + 1);
						return;
					}
				}
				else {
					return;
				}
			}
			
			if (msgError) {
				enyo.error("assistant.actionMessage not yet replaced, logging instead");
				enyo.log(
					msg,
					[{label:$L("Ok"), value:'ok'}, {label:$L("IPKG Log"), value:'view-log'}],
					this.errorLogFunction.bindAsEventListener(this)
				);
			} else {
				enyo.error("assistant.simpleMessage not yet replaced, logging instead");
				enyo.log(msg);
			}
			
			//TODO: this.assistant.endAction();
			enyo.error("assistant.endAction not yet replaced.");
		}	catch (e) {
			enyo.error('packageModel#onUpdate', e);
		}
	},
	onRemove: function(payload) {
		try 
		{
			// log payload for display
			preware.IPKGService.logPayload(payload);
		
			if (!payload) 
			{
				var msg = $L("Error Removing: Communication Error");
				var msgError = true;
			}
			else
			{
				if (!payload.returnValue)
				{
					var msg = $L("Error Removing: No Further Information");
					var msgError = true;
				}
				if (payload.stage == "failed")
				{
					var msg = $L("Error Removing: See IPKG Log");
					var msgError = true;
				}
				else if (payload.stage == "status")
				{
					enyo.error("assistant.displayAction not yet replaced, logging instead");
					enyo.log($L("Removing<br />") + payload.status);
					return;
				}
				else if (payload.stage == "completed")
				{
					// update info
					this.hasUpdate = false;
					this.isInstalled = false;
				
					// cancel the subscription
					//this.subscription.cancel();
				
					// message
					var msg = this.type + $L(" removed");
				
					// do finishing stuff
					if (this.hasFlags('remove')) 
					{
						//TODO: Hook into UI
						enyo.error("assistant.actionMessage not yet replaced, logging instead");
						enyo.log(
							msg + ':<br /><br />' + this.actionMessage('remove'),
							[{label:$L("Ok"), value:'ok'}, {label:$L("Later"), value:'skip'}],
							this.actionFunction.bindAsEventListener(this, 'remove')
						);
						return;
					}
					else
					{
						// we run this anyways to get the rescan
						this.runFlags('remove');
					}
				}
				// we keep this around for services without flags that have a javarestart in their scripts
				// of course, it might get here on accident, but thats a risk we'll have to take for now
				else if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
				{
					// update info
					//this.hasUpdate = false;
					//this.isInstalled = false;
				
					// cancel the subscription
					//this.subscription.cancel();
				
					// message
					var msg = this.type + $L(" removal probably failed");
					var msgError = true;
				}
				else return;
			}
		
			if (msgError)
			{
				enyo.error("assistant.actionMessage not yet replaced, logging instead");
				enyo.log(
					msg,
					[{label:$L("Ok"), value:'ok'}, {label:$L("IPKG Log"), value:'view-log'}],
					this.actionFunction.bindAsEventListener(this, 'remove')
				);
			}
			else
			{
				enyo.error("assistant.simpleMessage not yet replaced, logging instead");
				enyo.log(msg);
			}
		
			//this.assistant.endAction();
		}
		catch (e) 
		{
			enyo.error(e, 'packageModel#onRemove');
		}
	},

	hasFlags: function(type)
	{
		if (this.flags[type].RestartLuna || this.flags[type].RestartJava || this.flags[type].RestartDevice) 
		{
			return true;
		}
		return false;
	},
	runFlags: function(type)
	{
		try 
		{
			if ((this.flags[type].RestartJava && this.flags[type].RestartLuna) || this.flags[type].RestartDevice) 
			{
				this.subscription = IPKGService.restartdevice(function(){});
			}
			if (this.flags[type].RestartJava) 
			{
				this.subscription = IPKGService.restartjava(function(){});
			}
			if (this.flags[type].RestartLuna) 
			{
				this.subscription = IPKGService.restartluna(function(){});
			}
			// this is always ran...
			if (!preware.PrefCookie.get().avoidBugs && type != 'remove')
			{
				this.subscription = IPKGService.rescan(function(){});
			}
		}
		catch (e) 
		{
			enyo.error(e, 'packageModel#runFlags');
		}
	},
});
