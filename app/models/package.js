/* *** Info ***
 * Size: package size in kb
 * Status: installed/not-installed, and other stuff we don't use
 * Architecture: 
 * Section: the category when there is no source data
 * Package: package name in reverse-dns style
 * Filename: of the ipk file
 * Depends: package name of packages required for this (comma-space seperated ignore anything inside () at the end)
 * Maintainer: 
 * Version: x.y.z or w.x.y.z
 * Description: title of the package
 * MD5Sum: md5sub of package to verify downloaded file
 * Installed-Time: timestamp of installation
 * Installed-Size: size of installed package
 * Source:
 *   Title: actual title of the package
 *   Source: where to get the source code
 *   LastUpdated: timestamp
 *   Feed: that this package comes from
 *   Type: Application, Service, Plugin
 *   Category: 
 *   Homepage: url 
 *   Icon: url to image (assumed to be 64x64)
 *   FullDescription: actual description of package (includes html?)
 *   Screenshots: array of urls
 */


// initialize function which loads all the data from the info object
function packageModel(info)
{
	// save the info sent to us
	this.info = info;
	
	
	// load up some default items incase the package has no sourceObj (like installed applications not in any feeds)
	this.pkg = this.info.Package;
	this.type = 'Unknown';
	this.category = this.info.Section;
	this.version = this.info.Version;
	this.maintainer = this.info.Maintainer;
	this.title = this.info.Description;
	this.size = this.info.Size;
	this.hasUpdate = false;
	this.icon = false;
	this.date = false;
	this.feed = 'Unknown';
	this.homepage = false;
	if (this.info.Status.include('not-installed')) 
	{
		this.isInstalled = false;
		this.dateInstalled = false;
		this.sizeInstalled = false;
	}
	else 
	{
		this.isInstalled = true;
		this.dateInstalled = this.info['Installed-Time'];
		this.sizeInstalled = this.info['Installed-Size'];
	}
	
	
	// check if Source is json object
	// basically, if it has a { in it, we'll assume its json data
	if (this.info.Source != undefined && this.info.Source.include('{')) 
	{
		// parse json to object
		this.sourceJson = JSON.parse(this.info.Source);
		
		// check if the object has data we can load or overwrite the defaults with
		if (this.sourceJson.Type) 
		{
			this.type = this.sourceJson.Type;
		}
		if (this.sourceJson.Category) 
		{
			this.category = this.sourceJson.Category;
		}
		if (this.sourceJson.Title)
		{
			this.title = this.sourceJson.Title;
		}
		if (this.sourceJson.Icon) 
		{
			this.icon = this.sourceJson.Icon;
		}
		if (this.sourceJson.LastUpdated)
		{
			this.date = this.sourceJson.LastUpdated;
		}
		if (this.sourceJson.Feed)
		{
			this.feed = this.sourceJson.Feed;
		}
		if (this.sourceJson.Homepage)
		{
			this.homepage = this.sourceJson.Homepage;
		}
		
	}
	
	// check up on what we've loaded to make sure it makes sense
	if (this.category == 'misc')
	{
		this.category = 'Unsorted';
	}
}

// this function is called when loading info and it finds another package
// its for updating the current package with new info if we should
packageModel.prototype.infoUpdate = function(newPackage)
{
	// check if its newer
	var newer = packages.versionNewer(this.version, newPackage.version);
	
	// if they're both not installed, and this is newer, replace the old one
	if (!newPackage.isInstalled && !this.isInstalled && newer)
	{
		//return false;
		return newPackage;
	}
	
	// if the new one is installed and the old one is not, and its older, update the old one
	if (newPackage.isInstalled && !this.isInstalled && !newer)
	{
		this.isInstalled = true;
		this.hasUpdate = true;
		this.versionInstalled = newPackage.version;
		return false;
	}
	
	// if the new one is installed but the old one is not, and this is newer, replace the old one
	if (newPackage.isInstalled && !this.isInstalled && newer)
	{
		newPackage.isInstalled = true;
		newPackage.hasUpdate = false;
		return newPackage;
	}
	
	// if it gets this far, we will just replace it all
	return false;
}

// this function will return an object ready for inclusion in the list widget
packageModel.prototype.getForList = function(item)
{
	var listObj = {};
	
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
	
	return listObj;
}
