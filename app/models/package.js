/* *** Info ***
 * information on package standard is:
 * http://www.webos-internals.org/wiki/Packaging_Standards
 */

// initialize function which loads all the data from the info object
function packageModel(info)
{
	try
	{
		// for when we're doing a subscription of some service
		this.subscription = false;
		
		// for storing an assistant when we get one for certain functions
		this.assistant = false;
		
		// save the info sent to us
		this.info = info;
		
		// load up some default items incase the package has no sourceObj (like installed applications not in any feeds)
		this.pkg =		   this.info.Package;
		this.type =		   'Unknown';
		this.category =	   this.info.Section;
		this.version =	   this.info.Version;
		this.maintainer =  this.info.Maintainer;
		this.maintUrl =    false;
		this.title =	   this.info.Description;
		this.size =		   this.info.Size;
		this.hasUpdate =   false;
		this.icon =		   false;
		this.iconImg =     {object: false, loading: false, loaded: false, target: false};
		this.date =		   false;
		this.feeds =	   ['Unknown'];
		this.feedString =  'Unknown';
		this.homepage =	   false;
		this.license =	   false;
		this.description = false;
		this.changeLog =   false;
		this.screenshots = [];
		this.depends =	   [];
		this.flags =	   {install: {RestartLuna:false, RestartJava:false},
							remove: {RestartLuna:false, RestartJava:false}};
		
		if ((this.info.Status.include('not-installed') && this.info.Status != '') || this.info.Status == '')
		{
			this.isInstalled =   false;
			this.dateInstalled = false;
			this.sizeInstalled = false;
			//this.versionInstalled = false;
		}
		else
		{
			this.isInstalled =   true;
			this.dateInstalled = this.info['Installed-Time'];
			this.sizeInstalled = this.info['Installed-Size'];
			//this.versionInstalled = this.version;
		}
		this.versionInstalled = false;
		
		// parse package dependencies
		if (this.info.Depends)
		{
			//alert(this.info.Depends);
			var dSplit = this.info.Depends.split(',');
			for (var d = 0; d < dSplit.length; d++)
			{
				//var r = new RegExp(/(.*)\((.*)\)/); // this regex sucks
				var r = new RegExp("^([^\(]*)[\s]*[\(]?([^0-9]*)[\s]*([0-9.]*)[\)]?"); // this one is win
				var match = dSplit[d].match(r);
				if (match)
				{
					//for(var m = 0; m < match.length; m++) alert(m + ' [' + match[m] + ']');
					if (match[2]) match[2] = trim(match[2]); else match[2] = false;
					if (match[3]) match[3] = trim(match[3]); else match[3] = false;
					
					this.depends.push({pkg: trim(match[1]), match: match[2], version: match[3]});
				}
			}
		}
		
		// check if Source is json object
		// basically, if it has a { in it, we'll assume its json data
		if (this.info.Source && this.info.Source.include('{')) 
		{
			// parse json to object
			this.sourceJson = JSON.parse(this.info.Source);

			// check if the object has data we can load or overwrite the defaults with
			if (this.sourceJson.Type)			 this.type =		 this.sourceJson.Type;
			if (this.sourceJson.Category)		 this.category =	 this.sourceJson.Category;
			if (this.sourceJson.Title)			 this.title =		 this.sourceJson.Title;
			if (this.sourceJson.Icon)			 this.icon =		 this.sourceJson.Icon;
			if (this.sourceJson.LastUpdated)	 this.date =		 this.sourceJson.LastUpdated;
			if (this.sourceJson.Homepage)		 this.homepage =	 this.sourceJson.Homepage;
			if (this.sourceJson.License)		 this.license = 	 this.sourceJson.License;
			if (this.sourceJson.FullDescription) this.description =	 this.sourceJson.FullDescription;
			if (this.sourceJson.Changelog)		 this.changeLog =	 this.sourceJson.Changelog;
			if (this.sourceJson.Screenshots)	 this.screenshots =	 this.sourceJson.Screenshots;
			
			if (this.sourceJson.Feed) 
			{
				this.feeds = [this.sourceJson.Feed];
				this.feedString = this.sourceJson.Feed;
			}
			
			if (this.sourceJson.PostInstallFlags) 
			{
				//alert('PostInstallFlags: ' + this.sourceJson.PostInstallFlags);
				if (this.sourceJson.PostInstallFlags.include('RestartLuna')) this.flags.install.RestartLuna = true;
				if (this.sourceJson.PostInstallFlags.include('RestartJava')) this.flags.install.RestartJava = true;
			}
			if (this.sourceJson.PostRemoveFlags) 
			{
				//alert('PostRemoveFlags: ' + this.sourceJson.PostRemoveFlags);
				if (this.sourceJson.PostRemoveFlags.include('RestartLuna')) this.flags.remove.RestartLuna = true;
				if (this.sourceJson.PostRemoveFlags.include('RestartJava')) this.flags.remove.RestartJava = true;
			}
			
		}
		
		// parse maintainer
		if (this.maintainer)
		{
			var r = new RegExp("^([^<]*)<([^>]*)>?"); // this one is win
			var match = this.maintainer.match(r);
			if (match)
			{
				//for(var m = 0; m < match.length; m++) alert(m + ' [' + match[m] + ']');
				this.maintainer = trim(match[1]);
				this.maintUrl = match[2];
				// check if its an email
				if (this.maintUrl.include('@'))
				{
					// remove stupid default palm address for palm-package'd apps
					if (this.maintUrl == 'palm@palm.com' ||		// v1.1 style
						this.maintUrl == 'nobody@example.com')	// v1.2 style
					{
						this.maintUrl = false;
					}
					else
					{
						this.maintUrl = 'mailto:' + this.maintUrl + '?subject=' + this.title;
					}
				}
			}
		}
		
		// check up on what we've loaded to make sure stuff thats needed isn't blank
		if (!this.category || this.category == 'misc')
		{
			this.category = 'Unsorted';
		}
		if (!this.type)
		{
			this.type = 'Unknown';
		}
		
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packageModel#initialize');
		alert(this.info.Package);
	}
}

// this function is called when loading info and it finds another package
// its for updating the current package with new info if we should
packageModel.prototype.infoUpdate = function(newPackage)
{
	try
	{
		// check if its newer
		var newer = packages.versionNewer(this.version, newPackage.version);
		
		//alert('--- --- ---');
		//alert('Old: ' + this.pkg + ' v' + this.version);
		//alert('     = isInstalled: ' + this.isInstalled);
		//alert('     = hasUpdate: ' + this.hasUpdate);
		//alert('New: ' + newPackage.pkg + ' v' + newPackage.version);
		//alert('     = isInstalled: ' + newPackage.isInstalled);
		//alert('     = hasUpdate: ' + newPackage.hasUpdate);
		//alert('Newer: ' + newer);
		
		if (!newPackage.isInstalled && !this.isInstalled && newer)
		{
			//alert('Replace Type: 1');
			newPackage.infoLoadMissing(this);
			return newPackage;
		}
		
		if (newPackage.isInstalled && !this.isInstalled && !newer)
		{
			//alert('Replace Type: 2');
			this.isInstalled = true;
			this.hasUpdate = true;
			this.versionInstalled = newPackage.version;
			this.infoLoadMissing(newPackage);
			return false;
		}
		
		if (!newPackage.isInstalled && this.isInstalled && !newer)
		{
			//alert('Replace Type: 3');
			this.isInstalled = true;
			//this.hasUpdate = false; // this fixes the not update thing?
			this.versionInstalled = newPackage.version;
			this.infoLoadMissing(newPackage);
			return false;
		}
		
		if (newPackage.isInstalled && !this.isInstalled && newer)
		{
			//alert('Replace Type: 4');
			newPackage.isInstalled = true;
			//newPackage.hasUpdate = false; // this fixes the not update thing?
			newPackage.versionInstalled = this.version;
			newPackage.infoLoadMissing(this);
			return newPackage;
		}
		
		if (!newPackage.isInstalled && this.isInstalled && newer)
		{
			//alert('Replace Type: 5');
			newPackage.isInstalled = true;
			newPackage.hasUpdate = true;
			newPackage.versionInstalled = this.version;
			newPackage.infoLoadMissing(this);
			return newPackage;
		}
		
		//alert('Replace Type: 6');
		this.infoLoadMissing(newPackage);
		return false;
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packageModel#infoUpdate');
		return false;
	}
}

// this function tries to load missing info in this package from the new one
packageModel.prototype.infoLoadMissing = function(pkg)
{
	try
	{
		if (!this.title || this.title == 'This is a webOS application.') this.title = pkg.title;
		if (this.type == 'Unknown')		 this.type = pkg.type;
		if (this.category == 'Unsorted') this.category =		pkg.category;
		if (!this.maintainer)			 this.maintainer =		pkg.maintainer;
		if (!this.maintUrl)				 this.maintUrl =		pkg.maintUrl;
		if (!this.size)					 this.size =			pkg.size;
		if (!this.icon)					 this.icon =			pkg.icon;
		if (!this.date)					 this.date =			pkg.date;
		if (!this.homepage)				 this.homepage =		pkg.homepage;
		if (!this.license)				 this.license =			pkg.license;
		if (!this.description)			 this.description =		pkg.description;
		if (!this.changeLog)			 this.changeLog =		pkg.changeLog;
		if (!this.isInstalled)			 this.isInstalled =		pkg.isInstalled;
		if (!this.hasUpdate)			 this.hasUpdate =		pkg.hasUpdate;
		if (!this.dateInstalled)		 this.dateInstalled =	pkg.dateInstalled;
		if (!this.sizeInstalled)		 this.sizeInstalled =	pkg.sizeInstalled;
		
		// join feeds
		if (this.feeds[0] == 'Unknown') 
		{
			this.feeds = pkg.feeds;
			this.feedString = pkg.feedString;
		}
		else if (pkg.feeds[0] != 'Unknown')
		{
			for (var f = 0; f < pkg.feeds.length; f++) 
			{
				if (!this.inFeed(pkg.feeds[f])) 
				{
					this.feeds.push(pkg.feeds[f]);
					this.feedString += ', ' + pkg.feeds[f];
				}
			}
		}
		
		// join deps
		if (this.depends.length == 0 && pkg.depends.length > 0) 
		{
			this.depends = pkg.depends;
		}
		else if (this.depends.length > 0 && pkg.depends.length > 0) 
		{
			for (var pd = 0; pd < pkg.depends.length; pd++) 
			{
				var depFound = false;
				for (var td = 0; td < this.depends.length; td++) 
				{
					if (pkg.depends[pd].pkg == this.depends[td].pkg)
					{
						depFound = true;
					}
				}
				
				if (!depFound) 
				{
					this.depends.push(pkg.depends[pd]);
				}
			}
		}
		
		// join screenshots
		if (this.screenshots.length == 0 && pkg.screenshots.length > 0)
		{
			this.screenshots = pkg.screenshots;
		}
		else if (this.screenshots.length > 0 && pkg.screenshots.length > 0)
		{
			for (var ps = 0; ps < pkg.screenshots.length; ps++) 
			{
				var ssFound = false;
				for (var ts = 0; ts < this.screenshots.length; ts++) 
				{
					if (pkg.screenshots[ps] == this.screenshots[ts])
					{
						ssFound = true;
					}
				}
				if (!ssFound)
				{
					this.screenshots.push(pkg.screenshots[ps]);
				}
			}
		}
		
		// join flags
		if (!this.flags.install.RestartLuna && pkg.flags.install.RestartLuna) this.flags.install.RestartLuna = true;
		if (!this.flags.install.RestartJava && pkg.flags.install.RestartJava) this.flags.install.RestartJava = true;
		if (!this.flags.remove.RestartLuna  && pkg.flags.remove.RestartLuna)  this.flags.remove.RestartLuna  = true;
		if (!this.flags.remove.RestartJava  && pkg.flags.remove.RestartJava)  this.flags.remove.RestartJava  = true;
		
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packageModel#infoLoadMissing');
	}
}

packageModel.prototype.iconFill = function(target)
{
	if (this.icon) 
	{
		if (this.iconImg.loaded) 
		{
			target.style.backgroundImage = 'url(' + this.icon + ')';
		}
		else if (this.iconImg.loading) 
		{
			this.iconImg.target = target;
		}
		else
		{
			this.iconImg.target = target;
			this.iconInit();
		}
	}
}
packageModel.prototype.iconInit = function()
{
	if (this.icon) 
	{
		doc = Mojo.Controller.appController.getStageController(mainStageName).document;
		// think that above line was too roundabout? well it works, so whatever... (btw: mainStageName is setup in the app-assistant)
		this.iconImg.object = doc.createElement('img');
		this.iconImg.object.onload = this.iconOnLoad.bind(this);
		this.iconImg.loading = true;
		this.iconImg.object.src = this.icon;
	}
	
}
packageModel.prototype.iconOnLoad = function()
{
	this.iconImg.object.onload = undefined; // remove the listener
	this.iconImg.loaded = true;
	this.iconImg.loading = false;
	if (this.iconImg.target)
	{
		this.iconImg.target.style.backgroundImage = 'url(' + this.icon + ')';
	}
	this.iconImg.target = false;
}

// checks if this package is in the feed
packageModel.prototype.inFeed = function(feed)
{
	for (var f = 0; f < this.feeds.length; f++)
	{
		if (this.feeds[f] == feed)
		{
			return true;
		}
	}
	return false;
}

// this function will return an object ready for inclusion in the list widget
packageModel.prototype.getForList = function(item)
{
	var listObj = {};
	
	try
	{
		listObj.title = this.title;
		listObj.date = this.date;
		listObj.pkg = this.pkg;
		
		listObj.pkgNum = packages.packageInList(this.pkg);
		
		listObj.rowClass = '';
		
		
		if (prefs.get().secondRow == 'id') 
		{
			listObj.sub = this.pkg;
		}
		else if (prefs.get().secondRow == 'version') 
		{
			if (item && item.pkgList == 'installed' && this.isInstalled && this.versionInstalled) 
			{
				listObj.sub = 'v' + this.versionInstalled;
			}
			else
			{
				listObj.sub = 'v' + this.version;
			}
		}
		else if (prefs.get().secondRow == 'maint') 
		{
			listObj.sub = this.maintainer;
		}
		else if (prefs.get().secondRow == 'v&m') 
		{
			if (item && item.pkgList == 'installed' && this.isInstalled && this.versionInstalled) 
			{
				listObj.sub = 'v' + this.versionInstalled + ' - ' + this.maintainer;
			}
			else
			{
				listObj.sub = 'v' + this.version + ' - ' + this.maintainer;
			}
		}
		else if (prefs.get().secondRow == 'v&i') 
		{
			if (item && item.pkgList == 'installed' && this.isInstalled && this.versionInstalled) 
			{
				listObj.sub = 'v' + this.versionInstalled + ' - ' + this.pkg;
			}
			else
			{
				listObj.sub = 'v' + this.version + ' - ' + this.pkg;
			}
		}
		else if (prefs.get().secondRow == 'license') 
		{
			if (this.license)
			{
				listObj.sub = this.license;
			}
			else
			{
				listObj.sub = "<i>Unknown</i>";
			}
		}
		
		if (item) 
		{
			if (this.isInstalled && !this.hasUpdate &&
				item.pkgList != 'updates' &&
				item.pkgList != 'installed')
			{
				listObj.rowClass += ' installed';
			}
			if (this.hasUpdate && item.pkgList != 'updates')
			{
				listObj.rowClass += ' update';
			}
		}
		else
		{
			if (this.isInstalled && !this.hasUpdate)
			{
				listObj.rowClass += ' installed';
			}
			if (this.hasUpdate)
			{
				listObj.rowClass += ' update';
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packageModel#getForList');
	}
	
	return listObj;
}

packageModel.prototype.getDependencies = function(justNeeded)
{
	var returnArray = [];
	
	if (this.depends.length > 0)
	{
		for (var d = 0; d < this.depends.length; d++)
		{
			
			if (packages.packages.length > 0) 
			{
				for (var p = 0; p < packages.packages.length; p++) 
				{
					if (packages.packages[p].pkg == this.depends[d].pkg) 
					{
						//alert(packages.packages[p].title);
						//for (var t in this.depends[d]) alert(t + ': ' + this.depends[d][t]);
						
						if (!justNeeded) 
						{
							returnArray.push(p);
						}
						// if we want just whats needed, check the version numbers etc
						else
						{
							if (packages.packages[p].isInstalled)
							{
								/* // not checking version stuff, and eval probably isn't really the best way to do it
								// if it doesn't have dependent version information, being installed is all we need
								if (this.depends[d].match && this.depends[d].version) 
								{
									// if it doesn't have an update, we'll just assume the installed version is ok because its all they're going to get
									if (packages.packages[p].hasUpdate)
									{
										// there really should always be an installed version number if there is an update...
										if (packages.packages[p].versionInstalled) 
										{
											// first we check against the installed version
											// eval seems like the best way to do these tests? (in simple tests while writing this, it seemed to work)
											eval('var versionTest = (packages.packages[p].versionInstalled ' + this.depends[d].match + ' this.depends[d].version);');
											if (!versionTest) 
											{
												// if the installed version didn't pass the thest, check the update version
												eval('var versionTest = (packages.packages[p].version ' + this.depends[d].match + ' this.depends[d].version);');
												if (versionTest) 
												{
													// if the update passes the test, this package is "needed"
													returnArray.push(p);
												}
											}
										}
										// really, this shouldn't happen... but if it does, this will test against the "version" field
										else
										{
											eval('var versionTest = (packages.packages[p].version ' + this.depends[d].match + ' this.depends[d].version);');
											if (versionTest) 
											{
												returnArray.push(p);
											}
										}
									}
								}
								*/
							}
							// if its not installed then we'll assume we need
							else
							{
								returnArray.push(p);
							}
						}
					}
				}
			}
			
		}
	}
	
	return returnArray;
}
packageModel.prototype.getDependenciesRecursive = function(justNeeded)
{
	// setup our return array
	var deps = [];
	
	// get all recursive dependencies
	var rawDeps = this.getDependenciesRecursiveFunction(justNeeded, 0);
	
	if (rawDeps.length > 0) 
	{
		// sort them by depth
		rawDeps.sort(function(a, b)
		{
			return b.d - a.d;
		});
		
		// remove dups while adding to the final list
		for (var n = 0; n < rawDeps.length; n++)
		{
			var pushIt = true;
			if (deps.length > 0)
			{
				for (var r = 0; r < deps.length; r++)
				{
					if (rawDeps[n].id == deps[r])
					{
						pushIt = false;
					}
				}
			}
			if (pushIt) 
			{
				deps.push(rawDeps[n].id);
			}
		}
	}
	
	return deps;
}
packageModel.prototype.getDependenciesRecursiveFunction = function(justNeeded, depth)
{
	if (!depth && depth != 0) depth = 0;
	var returnArray = [];
	
	var depTest = this.getDependencies(justNeeded);
	if (depTest.length > 0)
	{
		for (var p = 0; p < depTest.length; p++)
		{
			returnArray.push({d:depth, id:depTest[p]});
			
			var recTest = packages.packages[depTest[p]].getDependenciesRecursiveFunction(justNeeded, depth+1);
			if (recTest.length > 0)
			{
				for (var r = 0; r < recTest.length; r++) 
				{
					returnArray.push({d:recTest[r].d, id:recTest[r].id});
				}
			}
		}
	}
	
	return returnArray;
}

packageModel.prototype.getDependent = function(justInstalled, installedFirst)
{
	var packageArray = [];
	var returnArray = [];
	
	if (packages.packages.length > 0)
	{
		for (var p = 0; p < packages.packages.length; p++)
		{
			
			// this is for real
			if (packages.packages[p].depends.length > 0)
			{
				for (var d = 0; d < packages.packages[p].depends.length; d++)
				{
					if (packages.packages[p].depends[d].pkg == this.pkg)
					{
						//alert(packages.packages[p].title);
						
						if (!justInstalled) 
						{
							packageArray.push(p);
						}
						else 
						{
							if (packages.packages[p].isInstalled) 
							{
								packageArray.push(p);
							}
						}
					}
				}
			}
			
			// this is for testing
			/*
			if (packages.packages[p].pkg == 'ws.junk.blocked')
			{
				packageArray.push(p);
			}
			if (p > 150 && p <= 155)
			{
				packageArray.push(p);
			}
			*/
			
		}
	}
	
	if (packageArray.length > 0 && installedFirst)
	{
		for (var p = 0; p < packageArray.length; p++)
		{
			if (packages.packages[packageArray[p]].isInstalled)
			{
				returnArray.push(packageArray[p]);
			}
		}
		for (var p = 0; p < packageArray.length; p++)
		{
			if (!packages.packages[packageArray[p]].isInstalled)
			{
				returnArray.push(packageArray[p]);
			}
		}
	}
	else
	{
		returnArray = packageArray;
	}
	
	return returnArray;
}


/* ------- below are for package actions -------- */

packageModel.prototype.launch = function()
{
	if (this.isInstalled && this.type == 'Application') 
	{
		var request = new Mojo.Service.Request('palm://com.palm.applicationManager', 
		{
			method: 'launch',
			parameters: 
			{
				id: this.pkg
			}
		});
	}
}

packageModel.prototype.doInstall = function(assistant, multi, skipDeps)
{
	try 
	{
		// save assistant
		this.assistant = assistant;
		
		// check dependencies and do multi-install
		if (!skipDeps) 
		{
			this.assistant.displayAction('Checking Dependencies');
			var deps = this.getDependenciesRecursive(true); // true to get "just needed" packages
			if (deps.length > 0) 
			{
				packages.checkMultiInstall(this, deps, assistant);
				return;
			}
		}
		
		// start action
		if (multi != undefined)
		{
			this.assistant.displayAction('Installing<br />' + this.title);
			
			// call install service
			this.subscription = IPKGService.install(this.onInstall.bindAsEventListener(this, multi), this.pkg, this.title);
		}
		else
		{
			this.assistant.displayAction('Installing');
			
			this.assistant.startAction();
		
			// call install service
			this.subscription = IPKGService.install(this.onInstall.bindAsEventListener(this), this.pkg, this.title);
		}
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#doInstall');
	}
}
packageModel.prototype.doUpdate = function(assistant)
{
	try 
	{
		// save assistant
		this.assistant = assistant;
		
		// start action
		this.assistant.displayAction('Updating');
		this.assistant.startAction();
		
		// call install service for update, yes
		this.subscription = IPKGService.install(this.onUpdate.bindAsEventListener(this), this.pkg, this.title);
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#doUpdate');
	}
}
packageModel.prototype.doRemove = function(assistant, skipDeps)
{
	try 
	{
		// save assistant
		this.assistant = assistant;
		
		// check dependencies and do multi-install
		if (!skipDeps)
		{
			this.assistant.displayAction('Checking Dependencies');
			var deps = this.getDependent(true); // true to get "just installed" packages
			if (deps.length > 0) 
			{
				packages.checkMultiRemove(this, deps, assistant);
				return;
			}
		}
		
		// start action
		this.assistant.displayAction('Removing');
		this.assistant.startAction();
		
		// call remove service
		this.subscription = IPKGService.remove(this.onRemove.bindAsEventListener(this), this.pkg, this.title);
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#doRemove');
	}
}

packageModel.prototype.onInstall = function(payload, multi)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload);
		
		if (!payload) 
		{
			var msg = 'Error Installing: Communication Error';
			var msgError = true;
		}
		else 
		{
			if (!payload.returnValue)
			{
				var msg = 'Error Installing: No Further Information';
				var msgError = true;
			}
			if (payload.stage == "failed")
			{
				var msg = 'Error Installing: See IPKG Log';
				var msgError = true;
			}
			else if (payload.stage == "completed")
			{
				// update info
				this.isInstalled = true;
				
				// cancel the subscription
				this.subscription.cancel();
				
				// message
				var msg = this.type + ' installed';
				
				// do finishing stuff
				if (multi != undefined) 
				{
					packages.doMultiInstall(multi+1);
					return;
				}
				else
				{
					if (this.hasFlags('install')) 
					{
						this.assistant.actionMessage(
							msg + ':<br /><br />' + this.actionMessage('install'),
							(!prefs.get().allowFlagSkip?[{label:$L('Ok'), value:'ok'}]:[{label:$L('Ok'), value:'ok'}, {label:$L('Later'), value:'skip'}]),
							this.actionFunction.bindAsEventListener(this, 'install')
						);
						return;
					}
					else
					{
						// we run this anyways to get the rescan
						this.runFlags('install');
					}
				}
				
			}
			// we keep this around for services without flags that have a javarestart in their scripts
			// of course, it might get here on accident, but thats a risk we'll have to take for now [2]
			else if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				// update info
				this.isInstalled = true;
				
				// cancel the subscription
				this.subscription.cancel();
				
				// message
				var msg = this.type + ' probably installed';
				var msgError = true;
				
				if (multi != undefined) 
				{
					packages.doMultiInstall(multi + 1);
					return;
				}
			}
			else return;
		}
		
		if (msgError)
		{
			this.assistant.actionMessage(
				msg,
				[{label:$L('Ok'), value:'ok'}, {label:$L('IPKG Log'), value:'view-log'}],
				this.errorLogFunction.bindAsEventListener(this)
			);
		}
		else
		{
			this.assistant.simpleMessage(msg);
		}
		
		this.assistant.endAction();
		
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#onInstall');
	}
}
packageModel.prototype.onUpdate = function(payload)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload);
		
		if (!payload) 
		{
			var msg = 'Error Updating: Communication Error';
			var msgError = true;
		}
		else
		{
			if (!payload.returnValue)
			{
				var msg = 'Error Updating: No Further Information';
				var msgError = true;
			}
			if (payload.stage == "failed")
			{
				var msg = 'Error Updating: See IPKG Log';
				var msgError = true;
			}
			else if (payload.stage == "completed")
			{
				// update info
				this.hasUpdate = false;
				
				// cancel the subscription
				this.subscription.cancel();
				
				// message
				var msg = this.type + ' updated';
				
				// do finishing stuff
				if (this.hasFlags('update')) 
				{
					this.assistant.actionMessage(
						msg + ':<br /><br />' + this.actionMessage('update'),
						(!prefs.get().allowFlagSkip?[{label:$L('Ok'), value:'ok'}]:[{label:$L('Ok'), value:'ok'}, {label:$L('Later'), value:'skip'}]),
						this.actionFunction.bindAsEventListener(this, 'update')
					);
					return;
				}
				else
				{
					// we run this anyways to get the rescan
					this.runFlags('update');
				}
			}
			// we keep this around for services without flags that have a javarestart in their scripts
			// of course, it might get here on accident, but thats a risk we'll have to take for now
			else if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				// update info
				this.hasUpdate = false;
				
				// cancel the subscription
				this.subscription.cancel();
				
				// message
				var msg = this.type + ' probably updated';
				var msgError = true;
			}
			else return;
		}
		
		if (msgError)
		{
			this.assistant.actionMessage(
				msg,
				[{label:$L('Ok'), value:'ok'}, {label:$L('IPKG Log'), value:'view-log'}],
				this.errorLogFunction.bindAsEventListener(this)
			);
		}
		else
		{
			this.assistant.simpleMessage(msg);
		}
		
		this.assistant.endAction();
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#onUpdate');
	}
}
packageModel.prototype.onRemove = function(payload)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload);
		
		if (!payload) 
		{
			var msg = 'Error Removing: Communication Error';
			var msgError = true;
		}
		else
		{
			if (!payload.returnValue)
			{
				var msg = 'Error Removing: No Further Information';
				var msgError = true;
			}
			if (payload.stage == "failed")
			{
				var msg = 'Error Removing: See IPKG Log';
				var msgError = true;
			}
			else if (payload.stage == "completed")
			{
				// update info
				this.hasUpdate = false;
				this.isInstalled = false;
				
				// cancel the subscription
				this.subscription.cancel();
				
				// message
				var msg = this.type + ' removed';
				
				// do finishing stuff
				if (this.hasFlags('remove')) 
				{
					this.assistant.actionMessage(
						msg + ':<br /><br />' + this.actionMessage('remove'),
						(!prefs.get().allowFlagSkip?[{label:$L('Ok'), value:'ok'}]:[{label:$L('Ok'), value:'ok'}, {label:$L('Later'), value:'skip'}]),
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
				this.subscription.cancel();
				
				// message
				var msg = this.type + ' removal probably failed';
				var msgError = true;
			}
			else return;
		}
		
		if (msgError)
		{
			this.assistant.actionMessage(
				msg,
				[{label:$L('Ok'), value:'ok'}, {label:$L('IPKG Log'), value:'view-log'}],
				this.errorLogFunction.bindAsEventListener(this)
			);
		}
		else
		{
			this.assistant.simpleMessage(msg);
		}
		
		this.assistant.endAction();
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#onRemove');
	}
}

packageModel.prototype.errorLogFunction = function(value)
{
	if (value == 'view-log')
	{
		this.assistant.controller.stageController.pushScene({name: 'ipkg-log', disableSceneScroller: true});
	}
	return;
}
packageModel.prototype.actionFunction = function(value, type)
{
	if (value == 'ok') 
	{
		this.runFlags(type);
	}
	this.assistant.endAction();
	return;
}
packageModel.prototype.actionMessage = function(type)
{
	var msg = '';
	if (type == 'install' || type == 'update') 
	{
		if (this.flags.install.RestartJava) 
		{
			msg += '<b>Java Restart Is Required</b><br /><i>Once you press Ok your phone will lose network connection and be unresponsive until it is done restarting.</i><br />';
		}
		if (this.flags.install.RestartLuna) 
		{
			msg += '<b>Luna Restart Is Required</b><br /><i>Once you press Ok all your open applications will be closed while luna restarts.</i><br />';
		}
	}
	else if (type == 'remove')
	{
		if (this.flags.remove.RestartJava) 
		{
			msg += '<b>Java Restart Is Required</b><br /><i>Once you press Ok your phone will lose network connection and be unresponsive until it is done restarting.</i><br />';
		}
		if (this.flags.remove.RestartLuna) 
		{
			msg += '<b>Luna Restart Is Required</b><br /><i>Once you press Ok all your open applications will be closed while luna restarts.</i><br />';
		}
	}
	return msg;
}
packageModel.prototype.hasFlags = function(type)
{
	if (type == 'install' || type == 'update') 
	{
		if (this.flags.install.RestartLuna || this.flags.install.RestartJava) 
		{
			return true;
		}
	}
	else if (type == 'remove')
	{
		if (this.flags.remove.RestartLuna || this.flags.remove.RestartJava)
		{
			return true;
		}
	}
	return false;
}
packageModel.prototype.runFlags = function(type)
{
	try 
	{
		if (type == 'install' || type == 'update') 
		{
			if (this.flags.install.RestartJava) 
			{
				IPKGService.restartjava(function(){});
			}
			if (this.flags.install.RestartLuna) 
			{
				IPKGService.restartluna(function(){});
			}
		}
		else if (type == 'remove')
		{
			if (this.flags.remove.RestartJava) 
			{
				IPKGService.restartjava(function(){});
			}
			if (this.flags.remove.RestartLuna) 
			{
				IPKGService.restartluna(function(){});
			}
		}
		// this is always ran...
		IPKGService.rescan(function(){});
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#doneInstall');
	}
}