function packagesModel()
{
	// for storing assistants when we get one for certain functions
	this.updateAssistant = false;
	this.assistant = false;
	// for storing action information when we're in a multi-action
	this.multiPkg = false;
	this.multiPkgs = false;
	this.doMyApps = false;
	
	// for storing all the package information
	this.packages = [];
	this.packagesReversed = $H();
	this.categories = [];
	this.feeds = [];
	this.urls = [];
	this.types = [];
	this.unknown = [];

	this.savedDB = false;
	
	// stores if there are packages with prices or not
	this.hasPrices = false;
	
	// holds flag for when feeds are changed
	this.dirtyFeeds = false;
	
	// stores packages staged by a multi-install option
	this.stagedPkgs = false;
	
	// we'll need these for the subscription based rawlist
	this.subscription = false;
	this.rawData = '';
	this.unknownCount = 0;
	this.unknownFixed = 0;
	
	/* *** Type Conditions ***
	 * launch			// can be launched by luna, makes the button appear in the view scene
	 * update			// can be updated (installed over the top of the old version) this also makes the button appear in the view scene
	 * updateAsReplace	// is updated by removing then reinstalling
	 * showScreenshots	// may have screenshots that should be displayed, for view scene
	 * showDependents	// may have dependent packages that should be displayed, for view scene
	 */
	this.typeConditions =
	{
		// major types
		Application:
		{
			launch: true,
			update: true,
			showScreenshots: true,
			showDependents: true
		},
		Service:
		{
			update: true,
			showDependents: true
		},
		Plugin:
		{
			update: true,
			showDependents: true
		},
		Kernel:
		{
			update: true,
			updateAsReplace: true,
			showDependents: true
		},
		"Kernel Module":
		{
			update: true,
			updateAsReplace: true,
			showDependents: true
		},
		Patch:
		{
			update: true,
			updateAsReplace: true,
			showScreenshots: true,
			showDependents: true
		},
		Theme:
		{
			update: true,
			updateAsReplace: true,
			showScreenshots: true
		},
		
		// secondary types
		Feed:
		{
			update: true,
		},
		Optware:
		{
			update: true,
			showDependents: true
		},
		'Linux Application':
		{
			update: true,
			showDependents: true
		},
		'Linux Daemon':
		{
			update: true,
			showDependents: true
		},
		'System Utilities':
		{
			update: true,
			showDependents: true
		},
		
		// unknown (used by actual unknown type, and any other type without values)
		'Unknown': {},
		// package (used by manual single-file installer)
		'Package': {}
	}
};

packagesModel.prototype.loadFeeds = function(feeds, urls, updateAssistant)
{
	try 
	{
		// clear out our current data (incase this is a re-update)
		this.packages = [];
		this.packagesReversed = $H();
		this.hasPrices = false;
		
		// get our current data
		this.feeds = feeds;
		this.urls = urls;
		this.updateAssistant = updateAssistant;
		
		// set title and show progress
		this.updateAssistant.displayAction($L("<strong>Loading Package Information</strong>"));
		this.updateAssistant.showProgress();
		
		// initiate status request
		this.infoStatusRequest();
	} 
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#loadFeeds');
	}
};

packagesModel.prototype.infoStatusRequest = function()
{
	// update display
	this.updateAssistant.displayAction($L("<strong>Loading Package Information</strong><br>Status"));
	this.updateAssistant.setProgress(Math.round((1/(this.feeds.length+1)) * 100));
	
	// request the rawdata
	this.subscription = IPKGService.rawstatus(this.infoResponse.bindAsEventListener(this, -1));
};
packagesModel.prototype.infoListRequest = function(num)
{
	// cancel the last subscription, this may not be needed
	if (this.subscription)
	{
		this.subscription.cancel();
	}
	
	// update display
	this.updateAssistant.displayAction($L("<strong>Loading Package Information</strong><br>") + this.feeds[num].substr(0, 1).toUpperCase() + this.feeds[num].substr(1));
	this.updateAssistant.setProgress(Math.round(((num+2)/(this.feeds.length+1)) * 100));
	this.feedNum++;
	
	// subscribe to new feed
	this.subscription = IPKGService.rawlist(this.infoResponse.bindAsEventListener(this, num), this.feeds[num]);
};
packagesModel.prototype.infoResponse = function(payload, num)
{
	var doneLoading = false;
	
	try
	{
		// log payload for display
		//IPKGService.logPayload(payload);
		
		if (!payload || payload.errorCode != undefined)
		{
			// we probably dont need to check this stuff here,
			// it would have already been checked and errored out of this process
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.updateAssistant.errorMessage('Preware', $L("The Package Manager Service is not running. Did you remember to install it? If you did, first try restarting Preware, then try rebooting your phone and not launching Preware until you have a stable network connection available."),
						  this.updateAssistant.doneUpdating);
				return;
			}
			else
			{
				// Do not do this until we work out how to handle multiple errors.
				// this.updateAssistant.errorMessage('Preware', payload.errorText, this.updateAssistant.doneUpdating);
				doneLoading = true;
			}
		}
		
		// no stage means its not a subscription, and we should have all the contents right now
		if (!payload.stage)
		{
			if (payload.contents) 
			{
				this.parsePackages(payload.contents, this.urls[num]);
			}
			
			// flag so the end of this function knows to move on to the next feed
			doneLoading = true;
		}
		else
		{
			//alert('--- ' + num + ' ---');
			//for (p in payload) alert(p);
			//alert('stage: ' + payload.stage);
			//alert('filesize: ' + payload.filesize);
			//alert('chunksize: ' + payload.chunksize);
			//alert('datasize: ' + payload.datasize);
			
			if (payload.stage == 'start')
			{
				// at start we clear the old data to make sure its empty
				this.rawData = '';
			}
			else if (payload.stage == 'middle')
			{
				// in the middle, we append the data
				if (payload.contents) 
				{
					this.rawData += payload.contents;
					var position = this.rawData.lastIndexOf("\n\n");
					if (position) {
						this.parsePackages(this.rawData.substr(0, position), this.urls[num]);
						this.rawData = this.rawData.substr(position);
					}
				}
			}
			else if (payload.stage == 'end')
			{
				// at end, we parse the data we've recieved this whole time
				if (this.rawData != '') 
				{
					this.parsePackages(this.rawData, this.urls[num]);
				}
				
				// flag so the end of this function knows to move on to the next feed
				doneLoading = true;
			}
			
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#infoResponse');
	}
	
	if (doneLoading)
	{
		if (this.feeds[(num + 1)]) 
		{
			// start next
			this.infoListRequest((num + 1));
		}
		else 
		{
			// we're done
			this.updateAssistant.displayAction($L("<strong>Complete!</strong>"));
			this.updateAssistant.setProgress(0);
			this.updateAssistant.hideProgress();
			if (prefs.get().fixUnknown) 
			{
				this.fixUnknown();
			}
			else
			{
				this.loadSaved();
			}
		}
	}
};

packagesModel.prototype.parsePackages = function(rawData, url)
{
	try 
	{
		if (rawData) 
		{
			var test = rawData.split(/\n/);
			var lineRegExp = new RegExp(/[\s]*([^:]*):[\s]*(.*)[\s]*$/);
			var curPkg = false;
			
			for (var x = 0; x < test.length; x++) 
			{
			
				var match = lineRegExp.exec(test[x]);
				if (match) 
				{
					if (match[1] == 'Package' && !curPkg) 
					{
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
					if (match[1] && match[2]) 
					{
						curPkg[match[1]] = match[2];
					}
				}
				else
				{
					if (curPkg) 
					{
						this.loadPackage(curPkg, url);
						curPkg = false;
					}
				}
			}
			
			if (curPkg) 
			{
				this.loadPackage(curPkg, url);
				curPkg = false;
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#parsePackages');
	}
};
packagesModel.prototype.loadPackage = function(packageObj, url)
{
	// Skip packages that are in the status file, but are not actually installed
	if (packageObj.Status &&
	    (packageObj.Status.include('not-installed') || packageObj.Status.include('deinstall'))) {
		return
	}

	// load the package from the info
	var newPkg = new packageModel(packageObj);
	
	// Filter out apps with a minimum webos version that is greater then current
	if (this.versionNewer(Mojo.Environment.DeviceInfo.platformVersion, newPkg.minWebOSVersion)) {
		return;
	}
	
	// Filter out apps with a specified devices that dont match the current
	if (newPkg.deviceCompatibility && newPkg.deviceCompatibility.length > 0 &&
		!newPkg.deviceCompatibility.include(Mojo.Environment.DeviceInfo.modelNameAscii)) {
		return;
	}
	
	// Filter out paid apps if desired
	if ((prefs.get().onlyShowFree) && (newPkg.price != undefined) &&
	    (newPkg.price != "0") && (newPkg.price != "0.00")) {
		return;
	}

	// Filter out non-english apps if desired
	if ((prefs.get().onlyShowEnglish) &&
		newPkg.languages && newPkg.languages.length &&
		!newPkg.inLanguage("en")) {
		return;
	}

	// default location is none is set
	if (!newPkg.location && newPkg.filename && url) {
		newPkg.location = url + '/' + newPkg.filename;
	}

	// look for a previous package with the same name
	var pkgNum = this.packageInList(newPkg.pkg);
	if (pkgNum === false) 
	{
		// add this package to global app list
		this.packages.push(newPkg);
		
		// save to temp reverse lookup list
		this.packagesReversed.set(newPkg.pkg, this.packages.length);

		return newPkg;
	}
	else 
	{
		// run package update function of the old package with the new package
		var pkgUpd = this.packages[pkgNum].infoUpdate(newPkg);
		if (pkgUpd !== false) 
		{
			// if the new package is to replace the old one, do it
			this.packages[pkgNum] = pkgUpd;
			return pkgUpd;
		}
		else {
			return newPkg;
		}
	}
};

packagesModel.prototype.fixUnknown = function()
{
	// cancel the last subscription, this may not be needed
	if (this.subscription) 
	{
		this.subscription.cancel();
	}
	
	this.unknownCount = 0;
	this.unknownFixed = 0;
	this.unknown = [];
	
	if (this.packages.length > 0) 
	{
		for (var p = 0; p < this.packages.length; p++)
		{
			if (this.packages[p].title == 'This is a webOS application.' || this.packages[p].type == 'Unknown') 
			{
				this.unknown[this.unknownCount] = p;
				this.unknownCount++;
			}
		}
		
		if (this.unknownCount > 0) 
		{
			this.updateAssistant.showProgress();
			this.updateAssistant.displayAction($L("<strong>Scanning Unknown Packages</strong><br />") + this.packages[this.unknown[0]].pkg.substr(-32));
			this.packages[this.unknown[0]].loadAppinfoFile(this.fixUnknownDone.bind(this));
		}
		else
		{
			this.loadSaved();
		}
	}
	else
	{
		this.loadSaved();
	}
};
packagesModel.prototype.fixUnknownDone = function()
{
	this.unknownFixed++;
	//	this.updateAssistant.displayAction($L("<strong>Fixing Unknown Packages</strong><br />") + this.unknownFixed + ' of ' + this.unknownCount);
	this.updateAssistant.setProgress(Math.round((this.unknownFixed/this.unknownCount) * 100));
	
	if (this.unknownFixed == this.unknownCount)
	{
		this.updateAssistant.displayAction($L("<strong>Complete!</strong>"));
		this.updateAssistant.hideProgress();
		this.loadSaved();
	}
	else
	{
		this.updateAssistant.displayAction($L("<strong>Scanning Unknown Packages</strong><br />") + this.packages[this.unknown[this.unknownFixed]].pkg.substr(-32));
		this.packages[this.unknown[this.unknownFixed]].loadAppinfoFile(this.fixUnknownDone.bind(this));
	}
};

packagesModel.prototype.loadSaved = function()
{
	this.savedDB = new Mojo.Depot
	({
		name:			"packageDB",
		version:		1,
		estimatedSize:	1048576,
		replace:		false
	},
		this.loadSavedOpenOK.bind(this),
		this.loadSavedError.bind(this));
	return;
};
packagesModel.prototype.loadSavedOpenOK = function()
{
	this.savedDB.get("savedPackageList",
					 this.loadSavedGetOK.bind(this),
					 this.doneLoading.bind(this));
	return;
};
packagesModel.prototype.loadSavedGetOK = function(savedPackageList)
{
	if (savedPackageList) {
		for (var p = 0; p < savedPackageList.length; p++) {
			info = savedPackageList[p];
			//alert('Loaded ' + savedPackageList[p].Package);
			//alert('info.Package: ' + info.Package);
			//alert('info.Version: ' + info.Version);
			//alert('info.Size: ' + info.Size);
			//alert('info.Filename: ' + info.Filename);
			//alert('info.Description: ' + info.Description);
			//alert('info.Source: ' + info.Source);
			var savedPkg = this.loadPackage(savedPackageList[p]);
			var pkgNum = this.packageInList(savedPkg.pkg);
			var gblPkg = this.packages[pkgNum];
			//alert("isInstalled: " + gblPkg.isInstalled);
			//alert("appCatalog: " + gblPkg.appCatalog);
			if (!gblPkg.appCatalog) {
				gblPkg.isInSavedList = true;
			}
		}
		this.doneLoading();
	}
	else {
		alert('No savedPackageList');
		this.loadSavedDefault(this.doneLoading.bind(this));
	}
};
packagesModel.prototype.loadSavedDefault = function(callback)
{
	for (var p = 0; p < this.packages.length; p++) {
		if (this.packages[p].isInstalled && !this.packages[p].appCatalog) {
			alert('Default ' + this.packages[p].pkg);
			alert("isInstalled: " + this.packages[p].isInstalled);
			alert("appCatalog: " + this.packages[p].appCatalog);
			this.packages[p].isInSavedList = true;
		}
		else {
			this.packages[p].isInSavedList = false;
		}
	}
	this.savePackageList(callback);
};
packagesModel.prototype.loadSavedError = function(result)
{
	this.updateAssistant.errorMessage('Preware', $L("Unable to open saved packages database: ") + result,
									  this.updateAssistant.doneUpdating);
	return;
};
packagesModel.prototype.savePackageList = function(callback)
{
	var savedPackageList = [];

	for (var p = 0; p < this.packages.length; p++) {
		if (this.packages[p].isInSavedList) {
			var info = this.packages[p].infoSave();
			//alert('Save ' + this.packages[p].pkg);
			//alert('info.Package: ' + info.Package);
			//alert('info.Version: ' + info.Version);
			//alert('info.Size: ' + info.Size);
			//alert('info.Filename: ' + info.Filename);
			//alert('info.Description: ' + info.Description);
			//alert('info.Source: ' + info.Source);
			savedPackageList.push(info);
		}
	}
			
	this.savedDB.add("savedPackageList", savedPackageList,
					 function() {
						 Mojo.Controller.getAppController().showBanner({
								 messageText:$L("Preware: Wrote Saved Package List"),
								 icon:'miniicon.png'
							 } , {source:'saveNotification'});
						 if (callback) callback();
					 },
					 function() {
						 Mojo.Controller.getAppController().showBanner({
								 messageText:$L("Preware: Error writing Saved Package List"),
								 icon:'miniicon.png'
							 } , {source:'saveNotification'});
						 if (callback) callback();
					 });
	return;
};

packagesModel.prototype.doneLoading = function()
{
	try
	{
		// cancel the last subscription, this may not be needed
		if (this.subscription)
		{
			this.subscription.cancel();
		}
		
		// feeds are no longer dirty
		this.dirtyFeeds = false;

		// clear out our current data (incase this is a re-update)
		this.packagesReversed = $H(); // reset this again so we can rebuild it in alphabetical order
		this.categories = [];
		this.feeds = [];
		this.rawData = ''; // and clear this so its not sitting around full of data
		
		// sort the packages
		if (this.packages.length > 0) 
		{
			this.packages.sort(function(a, b)
			{
				if (a.title && b.title)
				{
					strA = a.title.toLowerCase();
					strB = b.title.toLowerCase();
					return ((strA < strB) ? -1 : ((strA > strB) ? 1 : 0));
				}
				else
				{
					return -1;
				}
			});
			
			// build reverse-lookup list
			for (var p = 0; p < this.packages.length; p++) 
			{
				this.packagesReversed.set(this.packages[p].pkg, p+1);
			}
		}
		
		// add package categorys to global category list
		for (var p = 0; p < this.packages.length; p++)
		{
			// build categories list
			if (this.categories.indexOf(this.packages[p].category) === -1) 
			{
				// push new category
				this.categories.push(this.packages[p].category);
			}
			
			// build feeds list
			for (var f = 0; f < this.packages[p].feeds.length; f++) 
			{
				if (this.feeds.indexOf(this.packages[p].feeds[f]) === -1) 
				{
					// push new category
					this.feeds.push(this.packages[p].feeds[f]);
				}
			}
			
			// build types list
			if (this.types.indexOf(this.packages[p].type) === -1) 
			{
				// push new category
				this.types.push(this.packages[p].type);
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#doneLoading');
	}
	
	// sort categories
	if (this.categories.length > 0)
	{
		this.categories.sort(function(a, b)
		{
			// this needs to be lowercase for sorting.
			if (a && b)
			{
				strA = a.toLowerCase();
				strB = b.toLowerCase();
				return ((strA < strB) ? -1 : ((strA > strB) ? 1 : 0));
			}
			else
			{
				return -1;
			}
		});
	}
	
	// sort feeds
	if (this.feeds.length > 0)
	{
		this.feeds.sort(function(a, b)
		{
			// this needs to be lowercase for sorting.
			if (a && b)
			{
				strA = a.toLowerCase();
				strB = b.toLowerCase();
				return ((strA < strB) ? -1 : ((strA > strB) ? 1 : 0));
			}
			else
			{
				return -1;
			}
		});
	}
	
	// sort types
	if (this.types.length > 0)
	{
		this.types.sort(function(a, b)
		{
			// this needs to be lowercase for sorting.
			if (a && b)
			{
				strA = a.toLowerCase();
				strB = b.toLowerCase();
				return ((strA < strB) ? -1 : ((strA > strB) ? 1 : 0));
			}
			else
			{
				return -1;
			}
		});
	}
	
	// tell the main scene we're done updating
	this.updateAssistant.doneUpdating();
};

packagesModel.prototype.versionNewer = function(one, two)
{
	if (!one) return true;
	if (!two) return false;

	// if one >= two returns false
	// if one < two returns true
	var e1 = one.split(':');
	var e2 = two.split(':');
	var v1 = e1[e1.length > 1 ? 1 : 0].split('.');
	var v2 = e2[e2.length > 1 ? 1 : 0].split('.');

	var diff, j;
	if(e1.length > 1 || e2.length > 1)
		{
		var prefix1 = e1.length > 1 ? parseInt(e1[0], 10) : 0;
		var prefix2 = e2.length > 1 ? parseInt(e2[0], 10) : 0;
		if((diff = prefix2 - prefix1))
			{
			return (diff > 0) ? true : false;
			}
		}

	var i1 = [], i2 = [];
	//var err1 = "", err2 = "";
	var last = v1.length > v2.length ? v1.length : v2.length;		//	use the larger buffer
	for(j = 0; j < last; j++)
		{
		i1[j] = v1.length > j ? parseInt(v1[j], 10) : 0;
		i2[j] = v2.length > j ? parseInt(v2[j], 10) : 0;
		//err1 = err1 + "," + i1[j];
		//err2 = err2 + "," + i2[j];
		}
	var suffix1 = v1.length > 0 ? v1[v1.length - 1].split('-') : [];
	var suffix2 = v2.length > 0 ? v2[v2.length - 1].split('-') : [];
	if(suffix1.length > 1 || suffix2.length > 1)
		{
		last++;		//	we're using one more digit
		i1[j] = (suffix1.length > 1) ? parseInt(suffix1[1], 10) : 0;
		i2[j] = (suffix2.length > 1) ? parseInt(suffix2[1], 10) : 0;
		//err1 = err1 + "," + i1[j];
		//err2 = err2 + "," + i2[j];
		}
	//Mojo.Log.error("OLD:", err1);
	//Mojo.Log.error("NEW:", err2);
	for(j = 0; j < last; j++)
		{
		if((diff = i2[j] - i1[j]))
			{
			return (diff > 0) ? true : false;
			}
		}
	return false;
};

packagesModel.prototype.can = function(type, condition)
{
	if (this.typeConditions[type])
	{
		if (this.typeConditions[type][condition]) return true;
		else return false;
	}
	else
	{
		if (this.typeConditions['Unknown'][condition]) return true;
		else return false;
	}
};

packagesModel.prototype.packageInList = function(pkg)
{
	var pkgNum = this.packagesReversed.get(pkg);
	if (pkgNum != undefined)
	{
		return pkgNum-1;
	}
	else
	{
		return false;
	}
};

packagesModel.prototype.getGroups = function(item)
{
	var returnArray = [];
	var counts = $H();
	
	try
	{
		// temporary item for getting list counts
		var itemL =
		{
			pkgList:  item.pkgList,
			pkgType:  item.pkgType,
			pkgFeed:  item.pkgFeed,
			pkgCat:   item.pkgCat
		};
		
		for (var p = 0; p < this.packages.length; p++) 
		{
			if (item.pkgGroup[0] == 'types')
			{
				itemL.pkgType = '';
				if (this.packages[p].matchItem(itemL)) 
				{
					if (counts.get(this.packages[p].type))
						counts.set(this.packages[p].type, counts.get(this.packages[p].type)+1);
					else
						counts.set(this.packages[p].type, 1);
				}
			}
			else if (item.pkgGroup[0] == 'feeds')
			{
				itemL.pkgFeed = '';
				if (this.packages[p].matchItem(itemL)) 
				{
					for (var f = 0; f < this.packages[p].feeds.length; f++) 
					{
						if (counts.get(this.packages[p].feeds[f]))
							counts.set(this.packages[p].feeds[f], counts.get(this.packages[p].feeds[f])+1);
						else
							counts.set(this.packages[p].feeds[f], 1);
					}
				}
			}
			else if (item.pkgGroup[0] == 'categories')
			{
				itemL.pkgCat = '';
				if (this.packages[p].matchItem(itemL)) 
				{
					if (counts.get(this.packages[p].category))
						counts.set(this.packages[p].category, counts.get(this.packages[p].category)+1);
					else
						counts.set(this.packages[p].category, 1);
				}
			}
		}
		
		//alert(counts.inspect());
		var keys = counts.keys();
		
		if (keys.length > 0)
		{
			if (item.pkgGroup[0] == 'categories') 
			{
				var all = 0;
				for (var k = 0; k < keys.length; k++) 
				{
					all += counts.get(keys[k]);
				}
				returnArray.push(
				{
					// this is because its special
					style: 'all',
					
					// this is for group list
					name: 'all',
					count: all,
					
					// this is for group selector
					label: 'all',
					command: 'all'
				});
			}
			for (var k = 0; k < keys.length; k++)
			{
				returnArray.push(
				{
					// this is for group list
					name: keys[k],
					count: counts.get(keys[k]),
					
					// this is for group selector
					label: keys[k],
					command: keys[k]
				});
			}
		}
		
		if (returnArray.length > 0)
		{
			returnArray.sort(function(a, b)
			{
				// test styles so all is always on top
				if (a.style == 'all') 
				{
					return -1;
				}
				if (b.style == 'all') 
				{
					return 1;
				}
				
				// this needs to be lowercase for sorting.
				if (a.name && b.name)
				{
					strA = a.name.toLowerCase();
					strB = b.name.toLowerCase();
					return ((strA < strB) ? -1 : ((strA > strB) ? 1 : 0));
				}
				else
				{
					return -1;
				}
			});
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#getGroups');
	}
	
	return returnArray;
};
packagesModel.prototype.getPackages = function(item)
{
	var returnArray = [];
	
	try
	{
		// build list from global array
		for (var p = 0; p < this.packages.length; p++)
		{
			if (this.packages[p].matchItem(item)) 
			{
				// get object for list
				var tmpItem = this.packages[p].getForList(item);
				
				// push
				returnArray.push(tmpItem);
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#getPackages');
	}
	
	return returnArray;
};


packagesModel.prototype.stagePackage = function(pkg)
{
	
};

/* ------- below are for multiple package actions -------- */

packagesModel.prototype.startMultiInstall = function(pkg, pkgs, assistant)
{
	try 
	{
		this.assistant = assistant;
		
		this.multiPkg	= pkg;
		this.multiPkgs	= pkgs;
		this.multiFlags	= this.getMultiFlags();

		this.doMyApps = false;
		
		this.assistant.displayAction($L("Installing / Updating"));
		this.assistant.startAction();
		this.doMultiInstall(0);
		
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#startMultiInstall');
	}
};

packagesModel.prototype.checkMultiInstall = function(pkg, pkgs, assistant)
{
	try 
	{
		// save assistant
		this.assistant = assistant;
		
		this.multiPkg	= pkg;
		this.multiPkgs	= pkgs;
		this.multiFlags	= this.getMultiFlags();
		
		// see what they want to do:
		this.assistant.actionMessage(
			$L("This package depends on <b>") + this.multiPkgs.length + $L("</b> other package") + (this.multiPkgs.length>1?'s':'') + $L(" to be installed or updated."),
			[
				{label:$L("Install / Update ") + (this.multiPkgs.length>1?$L("Them"):$L("It")), value:'ok'},
				{label:$L("View ") + (this.multiPkgs.length>1?$L("Them"):$L("It")), value:'view'},
				{label:$L("Cancel"), value:'cancel'}
			],
			this.testMultiInstall.bindAsEventListener(this)
		);
		
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#checkMultiInstall');
	}
};
packagesModel.prototype.checkMultiListInstall = function(pkgs, assistant)
{
	try 
	{
		// save assistant
		this.assistant = assistant;
		
		this.multiPkg	= false;
		this.multiPkgs	= pkgs;
		this.multiFlags	= this.getMultiFlags();
		
		// see what they want to do:
		this.assistant.actionMessage(
			$L("These packages have dependencies that need to be installed or updated."),
			[
				{label:$L("Install / Update"), value:'ok'},
				{label:$L("View All"), value:'view'},
				{label:$L("Cancel"), value:'cancel'}
			],
			this.testMultiInstall.bindAsEventListener(this)
		);
		
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#checkMultiListInstall');
	}
};
packagesModel.prototype.checkMultiRemove = function(pkg, pkgs, assistant)
{
	try 
	{
		// save assistant
		this.assistant = assistant;
		
		this.multiPkg	= pkg;
		this.multiPkgs	= pkgs;
		this.multiFlags	= this.getMultiFlags();
		
		var localizedText=$L("This package has <b>#{num}</b> other installed #{package} that #{depend} on it. <br /><br />Removing this package may cause #{them} to no longer function.").interpolate({num: this.multiPkgs.length, package: (this.multiPkgs.length>1 ? $L("packages") : $L("package")), depend: (this.multiPkgs.length>1 ? $L("depend") : $L("depends")), them: (this.multiPkgs.length>1 ? $L("them") : $L("it"))})

		// see what they want to do:
		this.assistant.actionMessage(
			localizedText,
			[
				// uncomment to allow removing of itself
				//{label:$L('Remove Anyways'), value:'ok'},
				{label:$L("View ") + (this.multiPkgs.length>1?$L("Them"):$L("It")), value:'view'},
				{label:$L("Cancel"), value:'cancel'}
			],
			this.testMultiRemove.bindAsEventListener(this)
		);
		
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#checkMultiRemove');
	}
};

packagesModel.prototype.testMultiInstall = function(value)
{
	switch(value)
	{
		case 'ok':
			this.assistant.displayAction($L("Installing / Updating"));
			this.assistant.startAction();
			this.doMultiInstall(0);
			break;
			
		case 'view':
			this.assistant.controller.stageController.pushScene('pkg-connected', 'install', this.multiPkg, this.multiPkgs);
			this.multiPkg	= false;
			this.multiPkgs	= false;
			this.multiFlags	= false;
			break;
	}
	return;
};
packagesModel.prototype.testMultiRemove = function(value)
{
	switch(value)
	{
		case 'ok':
			this.multiPkg.doRemove(this.assistant, true);
			this.multiPkg	= false;
			this.multiPkgs	= false;
			this.multiFlags	= false;
			break;
			
		case 'view':
			this.assistant.controller.stageController.pushScene('pkg-connected', 'remove', this.multiPkg, this.multiPkgs);
			this.multiPkg	= false;
			this.multiPkgs	= false;
			this.multiFlags	= false;
			break;
	}
	return;
};

packagesModel.prototype.doMultiInstall = function(number)
{
	try 
	{
		// call install for dependencies
		if (number < this.multiPkgs.length) 
		{
			if (this.packages[this.multiPkgs[number]].appCatalog) {
				this.doMyApps = true;
				this.doMultiInstall(number+1);
			}
			else if (this.packages[this.multiPkgs[number]].isInstalled) 
			{
				if (this.can(this.packages[this.multiPkgs[number]].type, 'update')) 
				{
					this.packages[this.multiPkgs[number]].doUpdate(this.assistant, number, true);
				}
				else
				{
					// it can't be updated, so we will just skip it
					// we should probably message or something that this has been skipped
					// or really, we should notify the user before we even get this far
					this.doMultiInstall(number+1);
				}
			}
			else
			{
				this.packages[this.multiPkgs[number]].doInstall(this.assistant, number, true);
			}
		}
		// call install for package
		else if (number == this.multiPkgs.length && this.multiPkg) 
		{
			if (this.multiPkg.appCatalog) {
				this.doMyApps = true;
				this.doMultiInstall(number+1);
			}
			else if (this.multiPkg.isInstalled) 
			{
				if (this.can(this.multiPkg.type, 'update')) 
				{
					this.multiPkg.doUpdate(this.assistant, number, true);
				}
				else
				{
					// see note above about this skipping if the type can't be updated
					this.doMultiInstall(number+1);
				}
			}
			else
			{
				this.multiPkg.doInstall(this.assistant, number, true);
			}
		}
		// end actions!
		else
		{
			if (this.doMyApps) {
				this.dirtyFeeds = true;
				var request = new Mojo.Service.Request('palm://com.palm.applicationManager', {
						method: 'launch',
						parameters: 
						{
							id: "com.palm.app.findapps",
							params: { myapps: '' }
						}
					});
			}

			if (this.multiFlags.RestartLuna || this.multiFlags.RestartJava || this.multiFlags.RestartDevice) 
			{
				this.assistant.actionMessage(
					$L("Packages installed:<br /><br />") + this.multiActionMessage(this.multiFlags),
					[{label:$L("Ok"), value:'ok'}, {label:$L("Later"), value:'skip'}],
					this.multiActionFunction.bindAsEventListener(this, this.multiFlags)
				);
				return;
			}
			else
			{
				// we run this anyways to get the rescan
				this.multiRunFlags(this.multiFlags);
			}
			this.assistant.simpleMessage($L("Packages installed"));
			this.assistant.endAction();
			this.multiPkg	= false;
			this.multiPkgs	= false;
			this.multiFlags	= false;
			this.doMyApps   = false;
		}
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#doMultiInstall');
	}
};

packagesModel.prototype.getMultiFlags = function()
{
	try 
	{
		var mFlags = {RestartLuna: false, RestartJava: false, RestartDevice: false};
		
		// check base package first if there is one
		if (this.multiPkg) 
		{
			if (this.multiPkg.isInstalled)	var tmpType = 'update';
			else							var tmpType = 'install';
			if (this.multiPkg.flags[tmpType].RestartLuna)	mFlags.RestartLuna		= true;
			if (this.multiPkg.flags[tmpType].RestartJava)	mFlags.RestartJava		= true;
			if (this.multiPkg.flags[tmpType].RestartDevice)	mFlags.RestartDevice	= true;
		}
		
		// check all deps
		for (var d = 0; d < this.multiPkgs.length; d++)
		{
			if (this.packages[this.multiPkgs[d]].isInstalled)	var tmpType = 'update';
			else												var tmpType = 'install';
			if (this.packages[this.multiPkgs[d]].flags[tmpType].RestartLuna)	mFlags.RestartLuna		= true;
			if (this.packages[this.multiPkgs[d]].flags[tmpType].RestartJava)	mFlags.RestartJava		= true;
			if (this.packages[this.multiPkgs[d]].flags[tmpType].RestartDevice)	mFlags.RestartDevice	= true;
		}
		
		// return them
		return mFlags;
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#getMultiFlags');
	}
		
};
packagesModel.prototype.multiActionFunction = function(value, flags)
{
	try 
	{
		if (value == 'ok') 
		{
			this.multiRunFlags(flags);
		}
		else
		{
			// we should still rescan...
			if (!prefs.get().avoidBugs)
			{
				this.subscription = IPKGService.rescan(function(){});
			}
		}
		this.assistant.endAction();
		this.multiPkg	= false;
		this.multiPkgs	= false;
		this.multiFlags	= false;
		return;
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#multiActionFunction');
	}
};
packagesModel.prototype.multiActionMessage = function(flags)
{
	try 
	{
		var msg = '';
		if (flags.RestartJava) 
		{
			msg = $L("<b>Java Restart Is Required</b><br /><i>Once you press Ok your phone will lose network connection and be unresponsive until it is done restarting.</i><br />");
		}
		if (flags.RestartLuna) 
		{
			msg = $L("<b>Luna Restart Is Required</b><br /><i>Once you press Ok all your open applications will be closed while luna restarts.</i><br />");
		}
		if ((flags.RestartLuna && flags.RestartJava) || flags.RestartDevice) 
		{
			msg = $L("<b>Phone Restart Is Required</b><br /><i>You will need to restart your phone to be able to use the packages that were just installed.</i><br />");
		}
		return msg;
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#multiActionMessage');
	}
};
packagesModel.prototype.multiRunFlags = function(flags)
{
	try
	{
		if ((flags.RestartLuna && flags.RestartJava) || flags.RestartDevice) 
		{
			this.subscription = IPKGService.restartdevice(function(){});
		}
		if (flags.RestartJava && !flags.RestartLuna) 
		{
			this.subscription = IPKGService.restartjava(function(){});
		}
		if (flags.RestartLuna && !flags.RestartJava) 
		{
			this.subscription = IPKGService.restartluna(function(){});
		}
		// this is always ran...
		if (!prefs.get().avoidBugs) 
		{
			this.subscription = IPKGService.rescan(function(){});
		}
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#multiRunFlags');
	}
};

// Local Variables:
// tab-width: 4
// End:
