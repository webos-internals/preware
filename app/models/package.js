/* *** Info ***
 * information on package standard is:
 * http://www.webos-internals.org/wiki/Packaging_Standards
 */

// initialize function which loads all the data from the info object
function packageModel(infoString, infoObj)
{
	try
	{
		// for when we're doing a subscription of some service
		this.subscription = false;
		
		// for storing an assistant when we get one for certain functions
		this.assistant = false;
		
		// load up some default items incase the package has no sourceObj (like installed applications not in any feeds)
		this.pkg =					(infoObj && infoObj.pkg ? infoObj.pkg : false);
		this.type =					(infoObj && infoObj.type ? infoObj.type : false);
		this.category =				false;
		this.version =				false;
		this.maintainer =			false;
		this.title =				(infoObj && infoObj.title ? infoObj.title : false);
		this.size =					false;
		this.filename =				(infoObj && infoObj.filename ? infoObj.filename : false);
		this.location =				(infoObj && infoObj.location ? infoObj.location : false);
		this.hasUpdate =			false;
		this.icon =					false;
		this.iconImg =				{object: false, loading: false, loaded: false, target: false, local: false};
		this.date =					false;
		this.price =				false;
		this.feeds =				['Unknown'];
		this.feedString =			'Unknown';
		this.countries =			[];
		this.countryString =		false;
		this.languages =			[];
		this.languageString =		false;
		this.homepage =				false;
		this.license =				false;
		this.description =			false;
		this.changeLog =			false;
		this.screenshots =			[];
		this.depends =				[];
		this.flags =				{install:	{RestartLuna:false, RestartJava:false, RestartDevice:false},
									 update:	{RestartLuna:false, RestartJava:false, RestartDevice:false},
									 remove:	{RestartLuna:false, RestartJava:false, RestartDevice:false}};
		this.isInstalled =			false;
		this.dateInstalled =		false;
		this.sizeInstalled =		false;
		this.appCatalog =			false;
		this.isInSavedList =		false;
		this.minWebOSVersion =		'1.0.0';
		this.maxWebOSVersion =		'99.9.9';
		this.deviceCompatibility =	[];
		this.preInstallMessage =	false;
		this.preUpdateMessage =		false;
		this.preRemoveMessage =		false;
		this.blacklisted =			false;
		
		// load the info
		this.infoLoad(infoString);
		
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
	}
};

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
			// Package in multiple feeds, with different versions
			//alert('Replace Type: 1');
			// Fill in any missing information from the older version
			newPackage.infoLoadFromPkg(this);
			return newPackage;
		}
		
		if (newPackage.isInstalled && !this.isInstalled && !newer)
		{
			// Package in multiple feeds, older version installed from later feed
			// (why wasn't it found in the status file?)
			//alert('Replace Type: 2');
			this.isInstalled = true;
			this.hasUpdate = true; // comment when status is last?
			this.versionInstalled = newPackage.version;
			this.infoLoadFromPkg(newPackage);
			return false;
		}
		
		if (!newPackage.isInstalled && this.isInstalled && !newer)
		{
			// Package loaded from status, and same or older version in a feed
			//alert('Replace Type: 3');
			this.isInstalled = true;
			//this.hasUpdate = false; // this fixes the not update thing?
			//this.versionInstalled = newPackage.version; // don't override the newer version
			this.infoLoadFromPkg(newPackage);
			return false;
		}
		
		if (newPackage.isInstalled && !this.isInstalled && newer)
		{
			// Package in multiple feeds, installed from later version
			//alert('Replace Type: 4');
			newPackage.isInstalled = true;
			//newPackage.hasUpdate = false; // this fixes the not update thing?
			newPackage.versionInstalled = this.version;
			newPackage.infoLoadFromPkg(this);
			return newPackage;
		}
		
		if (!newPackage.isInstalled && this.isInstalled && newer)
		{
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
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packageModel#infoUpdate');
		return false;
	}
};

packageModel.prototype.infoLoad = function(info)
{
	try
	{
		// load data
		if (!this.pkg &&		info.Package)		this.pkg =		info.Package;
		if (!this.version &&	info.Version)		this.version =	info.Version;
		if (!this.size &&		info.Size)			this.size =		info.Size;
		if (!this.filename &&	info.Filename)		this.filename =	info.Filename;
		
		// check if is installed
		if (info.Status && !info.Status.include('not-installed') && !info.Status.include('deinstall'))
		{
			this.isInstalled =		true;
			this.dateInstalled =	(info['Installed-Time'] && isNumeric(info['Installed-Time']) ? info['Installed-Time'] : false);
			this.sizeInstalled =	info['Installed-Size'];
		}
		
		// parse package dependencies
		if ((!this.depends || this.depends.length == 0) && info.Depends)
		{
			//alert(info.Depends);
			var dSplit = info.Depends.split(',');
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
		if (info.Source && info.Source.include('{')) 
		{
			// parse json to object
			try
			{
				var sourceJson = JSON.parse(info.Source.replace(/\\'/g, "'")); //"
			}
			catch (e) 
			{
				Mojo.Log.logException(e, 'infoLoad#parse ('+this.pkg+'): '+info.Source);
				var sourceJson = {};
			}

			// check if the object has data we can load or overwrite the defaults with
			if ((!this.type || this.type == 'Unknown') && sourceJson.Type) this.type = sourceJson.Type;
			// override the type
			if (sourceJson.Type == "AppCatalog") {
				this.type = "Application";
				this.appCatalog = true;
			}
		
			if (!this.category &&			sourceJson.Category)			this.category =				sourceJson.Category;
			if (!this.title &&				sourceJson.Title)				this.title =				sourceJson.Title;
			if (!this.icon &&				sourceJson.Icon)				this.icon =					sourceJson.Icon;
			if (!this.date && sourceJson.LastUpdated && isNumeric(sourceJson.LastUpdated)) this.date = sourceJson.LastUpdated;
			if (!this.homepage &&			sourceJson.Homepage)			this.homepage =				sourceJson.Homepage;
			if (!this.filename &&			sourceJson.Filename)			this.filename =				sourceJson.Filename;
			if (!this.location &&			sourceJson.Location)			this.location =				sourceJson.Location;
			if (!this.license &&			sourceJson.License)				this.license =				sourceJson.License;
			if (!this.description &&		sourceJson.FullDescription)		this.description =			sourceJson.FullDescription;
			if (!this.changeLog &&			sourceJson.Changelog)			this.changeLog =			sourceJson.Changelog;
			if (!this.preInstallMessage &&	sourceJson.PreInstallMessage)	this.preInstallMessage =	sourceJson.PreInstallMessage;
			if (!this.preUpdateMessage &&	sourceJson.PreUpdateMessage)	this.preUpdateMessage =		sourceJson.PreUpdateMessage;
			if (!this.preRemoveMessage &&	sourceJson.PreRemoveMessage)	this.preRemoveMessage =		sourceJson.PreRemoveMessage;
			if (!this.screenshots || this.screenshots.length == 0 && sourceJson.Screenshots) this.screenshots =	sourceJson.Screenshots;
			
			if (!this.price && sourceJson.Price)
			{
				this.price = sourceJson.Price;
				packages.hasPrices = true;
			}
		
			if (sourceJson.MinWebOSVersion)
			{
				this.minWebOSVersion = sourceJson.MinWebOSVersion;
			}
			if (sourceJson.MaxWebOSVersion)
			{
				this.maxWebOSVersion = sourceJson.MaxWebOSVersion;
			}
			
			if (sourceJson.DeviceCompatibility) 
			{
				this.deviceCompatibility = sourceJson.DeviceCompatibility;
			}
			
			if (sourceJson.Feed) 
			{
				this.feeds = [sourceJson.Feed];
				this.feedString = sourceJson.Feed;
			}
			
			if (sourceJson.Countries) 
			{
				this.countries = sourceJson.Countries;
				this.countryString = sourceJson.Countries.join(", ");
			}
			
			if (sourceJson.Languages) 
			{
				this.languages = sourceJson.Languages;
				this.languageString = sourceJson.Languages.join(", ");
			}
			
			if (sourceJson.PostInstallFlags) 
			{
				if (sourceJson.PostInstallFlags.include('RestartLuna'))		this.flags.install.RestartLuna		= true;
				if (sourceJson.PostInstallFlags.include('RestartJava'))		this.flags.install.RestartJava		= true;
				if (sourceJson.PostInstallFlags.include('RestartDevice'))	this.flags.install.RestartDevice	= true;
			}
			if (sourceJson.PostUpdateFlags) 
			{
				if (sourceJson.PostUpdateFlags.include('RestartLuna'))		this.flags.update.RestartLuna		= true;
				if (sourceJson.PostUpdateFlags.include('RestartJava'))		this.flags.update.RestartJava		= true;
				if (sourceJson.PostUpdateFlags.include('RestartDevice'))	this.flags.update.RestartDevice		= true;
			}
			if (sourceJson.PostRemoveFlags) 
			{
				if (sourceJson.PostRemoveFlags.include('RestartLuna'))		this.flags.remove.RestartLuna		= true;
				if (sourceJson.PostRemoveFlags.include('RestartJava'))		this.flags.remove.RestartJava		= true;
				if (sourceJson.PostRemoveFlags.include('RestartDevice'))	this.flags.remove.RestartDevice		= true;
			}
			
		}
		
		// load info that may not be in source object
		if (!this.category &&	info.Section)		this.category =	info.Section;
		if (!this.title &&		info.Description)	this.title =	info.Description;
		
		// parse maintainer
		if ((!this.maintainer || this.maintainer.length == 0) && info.Maintainer)
		{
			this.maintainer = [];
			var mSplit = info.Maintainer.split(',');
			var r = new RegExp("^([^<]*)<([^>]*)>?"); // this one is win
			for (var m = 0; m < mSplit.length; m++) 
			{
				var match = trim(mSplit[m]).match(r);
				if (match)
				{
					var tmpMaint = {name: trim(match[1]), url: match[2]};
					if (tmpMaint.url.include('@'))
					{
						// remove stupid default palm address for palm-package'd apps
						if (tmpMaint.url == 'palm@palm.com' ||		// v1.1 style
							tmpMaint.url == 'nobody@example.com')	// v1.2 style
						{
							tmpMaint.url = false;
						}
						else
						{
							tmpMaint.url = 'mailto:' + tmpMaint.url + '?subject=' + this.title;
						}
					}
					this.maintainer.push(tmpMaint);
				}
				else
				{
					this.maintainer.push({name: trim(mSplit[m]), url: false});
				}
			}
		}
		
		// check blacklist
		var blacklist = prefs.get().blackList;
		if (!this.blacklisted && blacklist.length > 0 && !this.isInstalled && !this.isInSavedList)
		{
			for (var b = 0; b < prefs.get().blackList.length; b++)
			{
				if (!this.blacklisted)
				{
					if (prefs.get().blackList[b].field == 'title' && this.title && this.title.toLowerCase().include(blacklist[b].search.toLowerCase()))
					{
						this.blacklisted = true;
					}
					else if (prefs.get().blackList[b].field == 'maintainer' && this.maintainer.length > 0)
					{
						for (var m = 0; m < this.maintainer.length; m++) 
						{
							if (this.maintainer[m].name.toLowerCase().include(blacklist[b].search.toLowerCase()))
							{
								this.blacklisted = true;
							}
						}
					}
					else if (prefs.get().blackList[b].field == 'id' && this.pkg.toLowerCase().include(blacklist[b].search.toLowerCase()))
					{
						this.blacklisted = true;
					}
					else if (prefs.get().blackList[b].field == 'desc' && this.description && this.description.toLowerCase().include(blacklist[b].search.toLowerCase()))
					{
						this.blacklisted = true;
					}
					else if (prefs.get().blackList[b].field == 'category' && this.category && this.category.toLowerCase().include(blacklist[b].search.toLowerCase()))
					{
						this.blacklisted = true;
					}
				}
			}
		}

	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packageModel#infoLoad ('+this.pkg+')');
	}
};
packageModel.prototype.infoLoadFromPkg = function(pkg)
{
	try
	{
		if ((!this.type || this.type == 'Unknown') && pkg.type) this.type = pkg.type;
		// override the type
		if (pkg.appCatalog || (pkg.type == "AppCatalog"))
		{
		    this.type = "Application";
		    this.appCatalog = true;
		}
		else
		{
		    this.appCatalog = false;
		}
		
		// check blacklist
		if (pkg.blacklisted == true) this.blacklisted = true;
		
		if (!this.title || this.title == 'This is a webOS application.')	this.title = pkg.title;
		if (this.category == 'Unsorted')	this.category =			pkg.category;
		if (!this.maintainer || this.maintainer.length == 0
			|| (this.maintainer.length == 1 && this.maintainer[0].name == 'N/A')) this.maintainer = pkg.maintainer;
		if (!this.maintUrl)					this.maintUrl =				pkg.maintUrl;
		if (!this.size)						this.size =					pkg.size;
		if (!this.filename)					this.filename =				pkg.filename;
		if (!this.location)					this.location =				pkg.location;
		if (!this.date && pkg.date && isNumeric(pkg.date)) this.date =	pkg.date;
		if (!this.price)					this.price =				pkg.price;
		if (!this.homepage)					this.homepage =				pkg.homepage;
		if (!this.license)					this.license =				pkg.license;
		if (!this.description)				this.description =			pkg.description;
		if (!this.changeLog)				this.changeLog =			pkg.changeLog;
		if (!this.isInstalled)				this.isInstalled =			pkg.isInstalled;
		if (!this.hasUpdate)				this.hasUpdate =			pkg.hasUpdate;
		if (!this.dateInstalled && pkg.dateInstalled && isNumeric(pkg.dateInstalled)) this.dateInstalled =		pkg.dateInstalled;
		if (!this.sizeInstalled)			this.sizeInstalled =		pkg.sizeInstalled;
		if (!this.isInSavedList)			this.isInSavedList =		pkg.isInSavedList;
		if (!this.preInstallMessage)		this.preInstallMessage =	pkg.preInstallMessage;
		if (!this.preUpdateMessage)			this.preUpdateMessage =		pkg.preUpdateMessage;
		if (!this.preRemoveMessage)			this.preRemoveMessage =		pkg.preRemoveMessage;
		if (!this.icon) 
		{
			this.icon =				pkg.icon;
			this.iconImg.local =	false;
		}
		
		// join feeds
		if (this.feeds[0] == 'Unknown') 
		{
			this.feeds = pkg.feeds;
			this.feedString = pkg.feedString;
		}
		/*
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
		*/
		
		// join countries
		if (this.countries.length == 0) 
		{
			this.countries = pkg.countries;
			this.countryString = pkg.countryString;
		}
		/*
		else if (pkg.countries.length != 0)
		{
			for (var f = 0; f < pkg.countries.length; f++) 
			{
				if (!this.inCountry(pkg.countries[f])) 
				{
					this.countries.push(pkg.countries[f]);
					this.countryString += ', ' + pkg.countries[f];
				}
			}
		}
		*/
		
		// join languages
		if (this.languages.length == 0) 
		{
			this.languages = pkg.languages;
			this.languageString = pkg.languageString;
		}
		/*
		else if (pkg.languages.length != 0)
		{
			for (var f = 0; f < pkg.languages.length; f++) 
			{
				if (!this.inLanguage(pkg.languages[f])) 
				{
					this.languages.push(pkg.languages[f]);
					this.languageString += ', ' + pkg.languages[f];
				}
			}
		}
		*/
		
		// join deps
		if (this.depends.length == 0 && pkg.depends.length > 0) 
		{
			this.depends = pkg.depends;
		}
		/*
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
		*/
		
		// join screenshots
		if (this.screenshots.length == 0 && pkg.screenshots.length > 0)
		{
			this.screenshots = pkg.screenshots;
		}
		/*
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
		*/

		// join flags
		if (!this.flags.install.RestartLuna		&& pkg.flags.install.RestartLuna)	this.flags.install.RestartLuna		= true;
		if (!this.flags.install.RestartJava		&& pkg.flags.install.RestartJava)	this.flags.install.RestartJava		= true;
		if (!this.flags.install.RestartDevice	&& pkg.flags.install.RestartDevice)	this.flags.install.RestartDevice	= true;
		if (!this.flags.update.RestartLuna		&& pkg.flags.update.RestartLuna)	this.flags.update.RestartLuna		= true;
		if (!this.flags.update.RestartJava		&& pkg.flags.update.RestartJava)	this.flags.update.RestartJava		= true;
		if (!this.flags.update.RestartDevice	&& pkg.flags.update.RestartDevice)	this.flags.update.RestartDevice		= true;
		if (!this.flags.remove.RestartLuna		&& pkg.flags.remove.RestartLuna)	this.flags.remove.RestartLuna		= true;
		if (!this.flags.remove.RestartJava		&& pkg.flags.remove.RestartJava)	this.flags.remove.RestartJava		= true;
		if (!this.flags.remove.RestartDevice	&& pkg.flags.remove.RestartDevice)	this.flags.remove.RestartDevice		= true;
		
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packageModel#infoLoadFromPkg ('+this.pkg+')');
	}
};

packageModel.prototype.infoSave = function()
{
	var info = {};

	try
	{
		// load data
		info.Package = this.pkg;
		//alert('info.Package: ' + info.Package);
		if (this.version) info.Version = this.version;
		//alert('info.Version: ' + info.Version);
		if (this.size) info.Size = this.size;
		//alert('info.Size: ' + info.Size);
		if (this.filename) info.Filename = this.filename;
		//alert('info.Filename: ' + info.Filename);
		if (this.title) info.Description = this.title;
		//alert('info.Description: ' + info.Description);
		
		// %%% Missing information below: %%%
		// this.screenshots = sourceJson.Screenshots;
		// this.countries = sourceJson.Countries;
		// this.countryString = sourceJson.Countries.join(", ");
		// this.languages = sourceJson.Languages;
		// this.languageString = sourceJson.Languages.join(", ");
		// this.maintainer = info.Maintainer.split(',');

		var fields = [];
		if (this.appCatalog) {
			fields.push('"Type": "AppCatalog"');
		}
		else {
			fields.push('"Type": "' + this.type + '"');
		}
		if (this.category) fields.push('"Category": "' + this.category + '"');
		if (this.title) fields.push('"Title": "' + this.title + '"');
		if (this.icon) fields.push('"Icon": "' + this.icon + '"');
		if (this.date) fields.push('"LastUpdated": "' + this.date + '"');
		if (this.homepage) fields.push('"Homepage": "' + this.homepage + '"');
		if (this.license) fields.push('"License": "' + this.license + '"');
		if (this.description) fields.push('"FullDescription": "' + this.description + '"');
		if (this.changelog) fields.push('"ChangeLog": "' + this.changeLog + '"');
		info.Source = '{ ' + fields.join(", ") + ' }';
		//alert('info.Source: ' + info.Source);

	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packageModel#infoSave');
	}

	return info;
};

packageModel.prototype.loadAppinfoFile = function(callback)
{
	this.subscription = IPKGService.getAppinfoFile(this.loadAppinfoFileResponse.bindAsEventListener(this, callback), this.pkg);
};
packageModel.prototype.loadControlFile = function(callback)
{
	this.subscription = IPKGService.getControlFile(this.loadControlFileResponse.bindAsEventListener(this, callback), this.pkg);
};
packageModel.prototype.loadAppinfoFileResponse = function(payload, callback)
{
	if (payload.contents) 
	{
		try
		{
			var appInfo = JSON.parse(payload.contents);
		}
		catch (e) 
		{
			Mojo.Log.logException(e, 'loadAppinfoFileResponse#parse: '+payload.contents);
			var appInfo = {};
		}
		
		if ((!this.type || this.type == '' || this.type == 'Unknown') && this.title == 'This is a webOS application.') 
		{
			// assume application if its unknown and has an appinfo
			this.type = 'Application';
		}
		if ((!this.title || this.title == '' || this.title == 'This is a webOS application.')
			&& appInfo.title)
		{
			this.title = appInfo.title;
		}
		if (!this.icon || this.icon == '')
		{
			this.iconImg.local = true;
			if (appInfo.icon) 
			{
				this.icon = '../' + this.pkg + '/' + appInfo.icon;
			}
			else
			{
				this.icon = '../' + this.pkg + '/icon.png';
			}
		}
		if ((!this.maintainer || this.maintainer.length == 0
			|| (this.maintainer.length == 1 && this.maintainer[0].name == 'N/A'))
			&& appInfo.vendor) 
		{
			this.maintainer = [{name: appInfo.vendor, url: false}];
		}
	}
	
	// hit control file
	this.loadControlFile(callback);
};
packageModel.prototype.loadControlFileResponse = function(payload, callback)
{
	if (payload.contents) 
	{
		var data = payload.contents.split(/\n/);
		var lineRegExp = new RegExp(/[\s]*([^:]*):[\s]*(.*)[\s]*$/);
		var info = 
		{	// blank information
			Architecture: '',
			Section: '',
			Package: '',
			Depends: '',
			Maintainer: '',
			Version: '',
			Description: '',
			Source: ''
		};
		
		for (var x = 0; x < data.length; x++) 
		{
			var match = lineRegExp.exec(data[x]);
			if (match) 
			{
				if (match[1] && match[2]) 
				{
					info[match[1]] = match[2];
				}
			}
		}
		
		//alert('== = ==');
		//for (var d in data) alert(d + ': ' + data[d]);
		//alert('-- - --');
		//for (var i in info) alert(i + ': ' + info[i]);
		
		this.infoLoad(info);
	}
	
	if (callback) 
	{
		callback();
	}
};

packageModel.prototype.iconFill = function(target)
{
	if (this.icon) 
	{
		if (this.iconImg.local)
		{
			//this.iconImg.loaded = true;
			target.style.backgroundImage = 'url(images/localIcon.png)';
			return;
		}
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
};
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
	
};
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
};

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
};

// checks if this package is in the country
packageModel.prototype.inCountry = function(country)
{
	for (var f = 0; f < this.countries.length; f++)
	{
		if (this.countries[f] == country)
		{
			return true;
		}
	}
	return false;
};

// checks if this package is in the language
packageModel.prototype.inLanguage = function(language)
{
	for (var f = 0; f < this.languages.length; f++)
	{
		if (this.languages[f] == language)
		{
			return true;
		}
	}
	return false;
};

// this function will return an object ready for inclusion in the list widget
packageModel.prototype.getForList = function(item)
{
	var listObj = {};
	
	try
	{
		listObj.pkg = this.pkg;
		listObj.title = this.title;
		listObj.date = this.date;
		listObj.price = this.price;
		
		listObj.pkgNum = packages.packageInList(this.pkg);
		
		listObj.rowClass = '';
		
		// include description if we need it for searching.
		if (prefs.get().searchDesc && this.description)
		{
			listObj.description = this.description.stripTags();
		}
		
		listObj.sub = '';
		var secondOptions = prefs.get().secondRow.split(',');
		for (s = 0; s < secondOptions.length; s++)
		{
			if (s > 0) listObj.sub += ' - ';
			switch (secondOptions[s])
			{
				case 'id':
					listObj.sub += this.pkg;
					break;
					
				case 'version':
					if (item && item.pkgList == 'installed' && this.isInstalled && this.versionInstalled) 
					{
						listObj.sub += 'v' + this.versionInstalled;
					}
					else
					{
						listObj.sub += 'v' + this.version;
					}
					break;
					
				case 'maint':
					var tempM = '';
					for (var m = 0; m < this.maintainer.length; m++) 
					{
						if (tempM != '') 
						{
							tempM += ', ';
						}
						tempM += this.maintainer[m].name;
					}
					if (tempM == '')
					{
						tempM = '<i>Unknown</i>';
					}
					listObj.sub += tempM;
					break;
					
				case 'date':
					if (this.date) 
					{
						listObj.sub += formatDate(this.date);
					}
					else
					{
						listObj.sub += "<i>Unknown Date</i>";
					}
					break;
					
				case 'price':
					if (this.price)
					{
						listObj.sub += '$'+this.price;
					}
					else
					{
						listObj.sub += "<i>Free</i>";
					}
					break;
					
				case 'feed':
					listObj.sub += this.feedString;
					break;
					
				case 'country':
					if (this.countryString) {
					    listObj.sub += this.countryString;
					}
					else {
						listObj.sub += "<i>All Countries</i>";
					}
					break;
					
				case 'language':
					if (this.languageString) {
					    listObj.sub += this.languageString;
					}
					else {
						listObj.sub += "<i>All Languages</i>";
					}
					break;
					
				case 'license':
					if (this.license)
					{
						listObj.sub += this.license;
					}
					else
					{
						if (this.appCatalog) 
						{
							listObj.sub += "<i>App Catalog</i>";
						}
						else
						{
							listObj.sub += "<i>Unknown License</i>";
						}
					}
					break;
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
};

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
						// if we want just whats needed, check for updates
						else
						{
							if (packages.packages[p].isInstalled)
							{
								// if it has an update, it's a dependency
								if (packages.packages[p].hasUpdate)
								{
									returnArray.push(p);
								}
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
};
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
};
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
};

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
};

packageModel.prototype.matchItem = function(item)
{
	var matchIt = false;
	
	// check blacklist
	if (this.blacklisted) return false;
	
	// push packages that meet the listing
	if ((item.pkgList == 'all') ||
		(item.pkgList == 'other' &&
		this.type != 'Application' && this.type != 'Theme' &&
		this.type != 'Patch'))
	{
		matchIt = true;
		// if is installed and installed is not to be shown, dont push it
		if (this.isInstalled && !prefs.get().listInstalled) 
		{
			matchIt = false;
			// if it is installed and is not to be shown but its the "list of everything", push it anyways
			if (item.pkgType == 'all' && item.pkgFeed == 'all' && item.pkgCat == 'all')
			{
				matchIt = true;
			}
		}
		// if it is not installed, but is in the saved list and not in a feed, then dont push it
		if (!this.isInstalled && this.isInSavedList && (this.feeds[0] == 'Unknown')) {
			matchIt = false;
		}
	}
	else if (item.pkgList == 'updates' && this.hasUpdate) matchIt = true;
	else if (item.pkgList == 'installed' && this.isInstalled) matchIt = true;
	else if (item.pkgList == 'saved' && this.isInSavedList && !this.appCatalog) matchIt = true;
	
	// check type and dont push if not right
	if (item.pkgType != 'all' && item.pkgType != '' && item.pkgType != this.type) matchIt = false;
	
	// check feed and dont push if not right
	if (item.pkgFeed != 'all' && item.pkgFeed != '' && !this.inFeed(item.pkgFeed)) matchIt = false;
	
	// check category and dont push if not right
	if (item.pkgCat != 'all' && item.pkgCat != '' && item.pkgCat != this.category) matchIt = false;
	
	// return if it matches!
	return matchIt;
};


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
};

packageModel.prototype.doRedirect = function()
{
	var request = new Mojo.Service.Request('palm://com.palm.applicationManager', 
	{
		method: 'open',
		parameters: 
		{
			target: this.homepage
		}
	});
};

packageModel.prototype.doInstall = function(assistant, multi, skipDeps)
{
	try 
	{
		// save assistant
		this.assistant = assistant;
		
		// check dependencies and do multi-install
		if (!skipDeps) 
		{
			this.assistant.displayAction($L("Checking Dependencies"));
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
			this.assistant.displayAction($L("Downloading / Installing<br />") + this.title);
			
			// call install service
			this.subscription = IPKGService.install(this.onInstall.bindAsEventListener(this, multi), this.filename, this.location.replace(/ /g, "%20"));
		}
		else
		{
			this.assistant.displayAction($L("Downloading / Installing"));
			
			this.assistant.startAction();
			
			// call install service
			this.subscription = IPKGService.install(this.onInstall.bindAsEventListener(this), this.filename, this.location.replace(/ /g, "%20"));
		}
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#doInstall');
	}
};
packageModel.prototype.doUpdate = function(assistant, multi, skipDeps)
{
	try 
	{
		// save assistant
		this.assistant = assistant;
		
		// check dependencies and do multi-install
		if (!skipDeps) 
		{
			this.assistant.displayAction($L("Checking Dependencies"));
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
			this.assistant.displayAction($L("Downloading / Updating<br />") + this.title);

			if (packages.can(this.type, 'updateAsReplace'))
			{
				this.subscription = IPKGService.replace(this.onUpdate.bindAsEventListener(this, multi), this.pkg, this.filename, this.location.replace(/ /g, "%20"));
				this.assistant.displayAction('Downloading / Replacing<br />' + this.title);
			}
			else
			{
				this.subscription = IPKGService.install(this.onUpdate.bindAsEventListener(this, multi), this.filename, this.location.replace(/ /g, "%20"));
			}
		}
		else
		{
			this.assistant.displayAction($L("Downloading / Updating"));

			this.assistant.startAction();
		
			if (packages.can(this.type, 'updateAsReplace'))
			{
				this.subscription = IPKGService.replace(this.onUpdate.bindAsEventListener(this), this.pkg, this.filename, this.location.replace(/ /g, "%20"));
				this.assistant.displayAction($L("Downloading / Replacing"));
			}
			else
			{
				this.subscription = IPKGService.install(this.onUpdate.bindAsEventListener(this), this.filename, this.location.replace(/ /g, "%20"));
			}
		}
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#doUpdate');
	}
};
packageModel.prototype.doRemove = function(assistant, skipDeps)
{
	try 
	{
		// save assistant
		this.assistant = assistant;
		
		// check dependencies and do multi-install
		if (!skipDeps)
		{
			this.assistant.displayAction($L("Checking Dependencies"));
			var deps = this.getDependent(true); // true to get "just installed" packages
			if (deps.length > 0) 
			{
				packages.checkMultiRemove(this, deps, assistant);
				return;
			}
		}
		
		// start action
		this.assistant.displayAction($L("Removing"));
		this.assistant.startAction();
		
		// call remove service
		this.subscription = IPKGService.remove(this.onRemove.bindAsEventListener(this), this.pkg);
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#doRemove');
	}
};

packageModel.prototype.onInstall = function(payload, multi)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload);
		
		if (!payload) 
		{
			var msg = $L("Error Installing: Communication Error");
			var msgError = true;
		}
		else 
		{
			if (!payload.returnValue)
			{
				var msg = $L("Error Installing: No Further Information");
				var msgError = true;
			}
			if (payload.stage == "failed")
			{
				var msg = $L("Error Installing: See IPKG Log");
				var msgError = true;
			}
			else if (payload.stage == "status")
			{
				this.assistant.displayAction($L("Downloading / Installing<br />") + payload.status);
				return;
			}
			else if (payload.stage == "completed")
			{
				// update info
				this.isInstalled = true;
				
				// cancel the subscription
				this.subscription.cancel();
				
				// message
				var msg = this.type + $L(" installed");
				
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
							[{label:$L("Ok"), value:'ok'}, {label:$L("Later"), value:'skip'}],
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
				var msg = this.type + $L(" installed");
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
				[{label:$L("Ok"), value:'ok'}, {label:$L("IPKG Log"), value:'view-log'}],
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
};
packageModel.prototype.onUpdate = function(payload, multi)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload);
		
		if (!payload) 
		{
			var msg = $L("Error Updating: Communication Error");
			var msgError = true;
		}
		else
		{
			if (!payload.returnValue)
			{
				var msg = $L("Error Updating: No Further Information");
				var msgError = true;
			}
			if (payload.stage == "failed")
			{
				var msg = $L("Error Updating: See IPKG Log");
				var msgError = true;
			}
			else if (payload.stage == "status")
			{
				this.assistant.displayAction($L("Downloading / Updating<br />") + payload.status);
				return;
			}
			else if (payload.stage == "completed")
			{
				// update info
				this.hasUpdate = false;
				
				// cancel the subscription
				this.subscription.cancel();
				
				// message
				var msg = this.type + $L(" updated");
				
				// do finishing stuff
				if (multi != undefined) 
				{
					packages.doMultiInstall(multi + 1);
					return;
				}
				else 
				{
					if (this.hasFlags('update')) 
					{
						this.assistant.actionMessage(
							msg + ':<br /><br />' + this.actionMessage('update'),
							[{label:$L("Ok"), value:'ok'}, {label:$L("Later"), value:'skip'}],
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
				var msg = this.type + $L(" updated");
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
				[{label:$L("Ok"), value:'ok'}, {label:$L("IPKG Log"), value:'view-log'}],
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
};
packageModel.prototype.onRemove = function(payload)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload);
		
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
				this.assistant.displayAction($L("Removing<br />") + payload.status);
				return;
			}
			else if (payload.stage == "completed")
			{
				// update info
				this.hasUpdate = false;
				this.isInstalled = false;
				
				// cancel the subscription
				this.subscription.cancel();
				
				// message
				var msg = this.type + $L(" removed");
				
				// do finishing stuff
				if (this.hasFlags('remove')) 
				{
					this.assistant.actionMessage(
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
				this.subscription.cancel();
				
				// message
				var msg = this.type + $L(" removal probably failed");
				var msgError = true;
			}
			else return;
		}
		
		if (msgError)
		{
			this.assistant.actionMessage(
				msg,
				[{label:$L("Ok"), value:'ok'}, {label:$L("IPKG Log"), value:'view-log'}],
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
};

packageModel.prototype.errorLogFunction = function(value)
{
	if (value == 'view-log')
	{
		this.assistant.controller.stageController.pushScene({name: 'ipkg-log', disableSceneScroller: true});
	}
	return;
};
packageModel.prototype.actionFunction = function(value, type)
{
	if (value == 'ok') 
	{
		this.runFlags(type);
	}
	else
	{
		// we should still rescan...
		if (!prefs.get().avoidBugs && type != 'remove') 
		{
			this.subscription = IPKGService.rescan(function(){});
		}
	}
	this.assistant.endAction();
	return;
};
packageModel.prototype.actionMessage = function(type)
{
	var msg = '';
	if (this.flags[type].RestartJava) 
	{
		msg += $L("<b>Java Restart Is Required</b><br /><i>Once you press Ok your phone will lose network connection and be unresponsive until it is done restarting.</i><br />");
	}
	if (this.flags[type].RestartLuna) 
	{
		msg += $L("<b>Luna Restart Is Required</b><br /><i>Once you press Ok all your open applications will be closed while luna restarts.</i><br />");
	}
	if ((this.flags[type].RestartJava && this.flags[type].RestartLuna) || this.flags[type].RestartDevice) 
	{
		msg = $L("<b>Phone Restart Is Required</b><br /><i>You will need to restart your phone to be able to use the package that you just installed.</i><br />");
	}
	return msg;
};
packageModel.prototype.hasFlags = function(type)
{
	if (this.flags[type].RestartLuna || this.flags[type].RestartJava || this.flags[type].RestartDevice) 
	{
		return true;
	}
	return false;
};
packageModel.prototype.runFlags = function(type)
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
		if (!prefs.get().avoidBugs && type != 'remove')
		{
			this.subscription = IPKGService.rescan(function(){});
		}
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#runFlags');
	}
};

// Local Variables:
// tab-width: 4
// End:
