/* *** Info ***
 * Size:			  package size in kb
 * Status:      	  installed/not-installed, and other stuff we don't use
 * Architecture:	  
 * Section:			  the category when there is no source data
 * Package:			  package name in reverse-dns style
 * Filename:		  of the ipk file
 * Depends:			  package name of packages required for this (comma-space seperated ignore anything inside () at the end)
 * Maintainer:		 
 * Version:			  x.y.z or w.x.y.z
 * Description:		  title of the package
 * MD5Sum:			  md5sub of package to verify downloaded file
 * Installed-Time:	  timestamp of installation
 * Installed-Size:	  size of installed package
 * Source:
 *   Title:			  actual title of the package
 *   Source:		  where to get the source code
 *   LastUpdated:	  timestamp
 *   Feed:			  that this package comes from
 *   Type:			  Application, Service, Plugin, Patch
 *   Category:		 
 *   Homepage:		  url 
 *   Icon:			  url to image (assumed to be 64x64)
 *   FullDescription: actual description of package (includes html?)
 *   Screenshots:	  array of urls
 */


// initialize function which loads all the data from the info object
function packageModel(info)
{
	try
	{
		// save the info sent to us
		this.info = info;
		
		// load up some default items incase the package has no sourceObj (like installed applications not in any feeds)
		this.pkg =		   this.info.Package;
		this.type =		   'Unknown';
		this.category =	   this.info.Section;
		this.version =	   this.info.Version;
		this.maintainer =  this.info.Maintainer;
		this.title =	   this.info.Description;
		this.size =		   this.info.Size;
		this.hasUpdate =   false;
		this.icon =		   false;
		this.date =		   false;
		this.feeds =	   ['Unknown'];
		this.feedString =  'Unknown';
		this.homepage =	   false;
		this.description = false;
		this.screenshots = [];
		this.depends =	   [];
		if (this.info.Status.include('not-installed')) 
		{
			this.isInstalled =   false;
			this.dateInstalled = false;
			this.sizeInstalled = false;
		}
		else 
		{
			this.isInstalled =   true;
			this.dateInstalled = this.info['Installed-Time'];
			this.sizeInstalled = this.info['Installed-Size'];
		}
		if (this.info.Depends)
		{
			var dSplit = this.info.Depends.split(',');
			for (var d = 0; d < dSplit.length; d++)
			{
				var dRx = new RegExp(/(.*)\((.*)\)/);
				var match = dRx.exec(dSplit[d]);
				if (match)
				{
					this.depends.push({pkg: match[1].replace(/^\s*/, "").replace(/\s*$/, ""), version: match[2].replace(/^\s*/, "").replace(/\s*$/, "")});
				}
				else
				{
					this.depends.push({pkg: dSplit[d].replace(/^\s*/, "").replace(/\s*$/, ""), version: false});
				}
			}
		}
		
		
		// check if Source is json object
		// basically, if it has a { in it, we'll assume its json data
		if (this.info.Source != undefined && this.info.Source.include('{')) 
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
			if (this.sourceJson.FullDescription) this.description =	 this.sourceJson.FullDescription;
			if (this.sourceJson.Screenshots)	 this.screenshots =	 this.sourceJson.Screenshots;
			if (this.sourceJson.Feed) 
			{
				this.feeds = [this.sourceJson.Feed];
				this.feedString = this.sourceJson.Feed;
			}
		}
		
		// check up on what we've loaded to make sure it makes sense
		if (this.category == 'misc')
		{
			this.category = 'Unsorted';
		}
		
		// here we handle types that don't make sense, and make sense out of them
		if (this.type == 'Unknown' || this.type == 'LinuxBinary')
		{
			this.type = 'Application';
		}
		
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packageModel#initialize');
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
		
		// if they're both not installed, and this is newer, replace the old one
		if (!newPackage.isInstalled && !this.isInstalled && newer)
		{
			newPackage.infoLoadMissing(this);
			return newPackage;
		}
		
		// if the new one is installed and the old one is not, and its older, update the old one
		if (newPackage.isInstalled && !this.isInstalled && !newer)
		{
			this.isInstalled = true;
			this.hasUpdate = true;
			this.versionInstalled = newPackage.version;
			this.infoLoadMissing(newPackage);
			return false;
		}
		
		// if the old one is installed and the new one is not, and its newer, update the new one
		if (!newPackage.isInstalled && this.isInstalled && newer)
		{
			newPackage.isInstalled = true;
			newPackage.hasUpdate = true;
			newPackage.versionInstalled = this.version;
			newPackage.infoLoadMissing(this);
			return newPackage;
		}
		
		// if the new one is installed but the old one is not, and this is newer, replace the old one
		if (newPackage.isInstalled && !this.isInstalled && newer)
		{
			newPackage.isInstalled = true;
			newPackage.hasUpdate = false;
			newPackage.versionInstalled = this.version;
			newPackage.infoLoadMissing(this);
			return newPackage;
		}
		
		this.infoLoadMissing(newPackage);
		return false;
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packageModel#infoUpdate');
		return false;
	}
}
packageModel.prototype.infoLoadMissing = function(pkg)
{
	try
	{
		if (this.type ==	 'Unknown')	 this.type =			 pkg.type;
		if (this.category == 'Unsorted') this.category =		 pkg.category;
		if (!this.maintainer)			 this.maintainer =		 pkg.Maintainer;
		if (!this.title)				 this.title =			 pkg.title;
		if (!this.size)					 this.size =			 pkg.size;
		if (!this.icon)					 this.icon =			 pkg.icon;
		if (!this.date)					 this.date =			 pkg.date;
		if (!this.homepage)				 this.homepage =		 pkg.homepage;
		if (!this.description)			 this.description =		 pkg.description;
		if (!this.isInstalled)			 this.isInstalled =		 pkg.isInstalled;
		if (!this.dateInstalled)		 this.dateInstalled =	 pkg.dateInstalled;
		if (!this.sizeInstalled)		 this.sizeInstalled =	 pkg.sizeInstalled;
		
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
		
		if (pkg.depends.length > 0) 
		{
			for (var d = 0; d < pkg.depends.length; d++) 
			{
				this.depends.push(pkg.depends[d]);
			}
		}
		
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
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packageModel#infoLoadMissing');
	}
}

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
		
		if (this.icon)
		{
			listObj.rowClass += ' img';
			listObj.icon = '<img src="' + this.icon + '" />';
		}
		
		if (item) 
		{
			if (this.isInstalled && !this.hasUpdate &&
			item.list != 'updates' &&
			item.list != 'installed')
			{
				listObj.rowClass += ' installed';
			}
			if (this.hasUpdate && item.list != 'updates')
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

// this function will return a list of packages this package depends on
packageModel.prototype.getDependencies = function()
{
	
}

// this function will return a list of packages dependent on the current package
packageModel.prototype.getDependent = function()
{
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
						returnArray.push(p);
					}
				}
			}
			
			/*// this is for testing
			if (p <= 6)
			{
				returnArray.push(p);
			}
			*/
		}
	}
	
	return returnArray;
}
