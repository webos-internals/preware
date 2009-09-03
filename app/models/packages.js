function packagesModel()
{
	this.packages = [];
	this.categories = [];
	this.feeds = [];
	
	// this is for use to seperate the patches from the apps
	this.patchCategory = 'WebOS Patches';
}

packagesModel.prototype.load = function(payload)
{
	// clear out our current data (incase this is a re-update)
	this.packages = [];
	this.categories = [];
	this.feeds = [];
	
	try
	{
		for (var x = 0; x < payload.info.length; x++)
		{
			// load the package from the info
			var newPkg = new packageModel(payload.info[x])
			
			// look for a previous package with the same name
			var pkgNum = this.packageInList(newPkg.pkg);
			if (pkgNum === false) 
			{
				// add this package to global app list
				this.packages.push(newPkg);
			}
			else
			{
				// run package update function of the old package with the new package
				var pkgUpd = this.packages[pkgNum].infoUpdate(newPkg);
				if (pkgUpd !== false)
				{
					// if the new package is to replace the old one, do it
					this.packages[pkgNum] = pkgUpd;
				}
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#load:packageList');
	}
	
	// sort the packages
	if (this.packages.length > 0) 
	{
		this.packages.sort(function(a, b)
		{
			if (a.title && b.title) return ((a.title.toLowerCase() < b.title.toLowerCase()) ? -1 : ((a.title.toLowerCase() > b.title.toLowerCase()) ? 1 : 0));
			else return -1;
		});
	}
	
	
	try
	{
		// add package categorys to global category list
		for (var p = 0; p < this.packages.length; p++) 
		{
			// build categories list
			var catNum = this.categoryInList(this.packages[p].category);
			if (catNum === false) 
			{
				// push new category
				this.categories.push({name: this.packages[p].category});
			}
			
			// build feeds list
			for (var f = 0; f < this.packages[p].feeds.length; f++) 
			{
				var feedNum = this.feedInList(this.packages[p].feeds[f]);
				if (feedNum === false) 
				{
					// push new category
					this.feeds.push({name: this.packages[p].feeds[f]});
				}
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#load:categoryfeedList');
	}
	
	// sort categories
	if (this.categories.length > 0)
	{
		this.categories.sort(function(a, b)
		{
			// this needs to be lowercase for sorting.
			if (a.name.toLowerCase() && b.name.toLowerCase()) return ((a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : ((a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : 0));
			else return -1;
		});
	}
	
	// sort feeds
	if (this.feeds.length > 0)
	{
		this.feeds.sort(function(a, b)
		{
			// this needs to be lowercase for sorting.
			if (a.name.toLowerCase() && b.name.toLowerCase()) return ((a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : ((a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : 0));
			else return -1;
		});
	}
	
}

packagesModel.prototype.versionNewer = function(one, two)
{
	// if one >= two returns false
	// if one < two returns true
	var v1 = one.split('.');
	var v2 = two.split('.');
	if (parseInt(v2[0]) > parseInt(v1[0])) return true; 
	else if (parseInt(v2[0]) == parseInt(v1[0]) && parseInt(v2[1])  > parseInt(v1[1])) return true;
	else if (parseInt(v2[0]) == parseInt(v1[0]) && parseInt(v2[1]) == parseInt(v1[1]) && parseInt(v2[2])  > parseInt(v1[2])) return true;
	else if (parseInt(v2[0]) == parseInt(v1[0]) && parseInt(v2[1]) == parseInt(v1[1]) && parseInt(v2[2]) == parseInt(v1[2]) && parseInt(v2[3]) > parseInt(v1[3])) return true;
	return false;
}

packagesModel.prototype.packageInList = function(pkg)
{
	if (this.packages.length > 0)
	{
		for (var p = 0; p < this.packages.length; p++)
		{
			if (this.packages[p].pkg == pkg) 
			{
				return p;
			}
		}
	}
	return false;
}

packagesModel.prototype.categoryInList = function(cat)
{
	if (this.categories.length > 0) 
	{
		for (var c = 0; c < this.categories.length; c++) 
		{
			if (this.categories[c].name == cat) 
			{
				return c;
			}
		}
	}
	return false;
}

packagesModel.prototype.feedInList = function(feed)
{
	if (this.feeds.length > 0) 
	{
		for (var f = 0; f < this.feeds.length; f++) 
		{
			if (this.feeds[f].name == feed) 
			{
				return f;
			}
		}
	}
	return false;
}

packagesModel.prototype.getGroups = function(item)
{
	var returnArray = [];
	
	try
	{
		if (item.list == 'categories') 
		{
			for (var c = 0; c < this.categories.length; c++)
			{
				item.pkgGroup = this.categories[c].name;
				var count = this.getPackages(item).length;
				if (count > 0) 
				{
					returnArray.push(
					{
						// this is for group list
						name: packages.categories[c].name,
						count: count,
						
						// this is for group selector
						label: packages.categories[c].name,
						command: packages.categories[c].name
					});
				}
			}
		}
		else if (item.list == 'feeds')
		{
			for (var f = 0; f < this.feeds.length; f++)
			{
				item.pkgGroup = this.feeds[f].name;
				var count = this.getPackages(item).length;
				if (count > 0) 
				{
					returnArray.push(
					{
						// this is for group list
						name: this.feeds[f].name,
						count: count,
						
						// this is for group selector
						label: this.feeds[f].name,
						command: this.feeds[f].name
					});
				}
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#getGroups');
	}
	
	return returnArray;
}

packagesModel.prototype.getPackages = function(item)
{
	var returnArray = [];
	
	try
	{
		// build list from global array
		for (var p = 0; p < this.packages.length; p++)
		{
			// default to not pusing it
			var pushIt = false;
			
			
			if (item.pkgType != 'all') 
			{
				if (item.pkgType == this.packages[p].type) pushIt = true;
				
				// for now, we want to show services and plugins in the application lists if they aren't splitting them up in the main list
				// once we handle dependencies we can delete this code
				if (!prefs.get().showOther && item.pkgType == "Application" &&
					(this.packages[p].type == "Plugin" || this.packages[p].type == "Service"))
				{
					pushIt = true;
				}
			}
			else 
			{
				pushIt = true;
			}
			
			if (item.pkgValue == 'group')
			{
				if (item.pkgGroup)
				{
					if (item.list == 'categories' && this.packages[p].category != item.pkgGroup) pushIt = false;
					if (item.list == 'feeds' && !this.packages[p].inFeed(item.pkgGroup)) pushIt = false;
				}
			}
			else if (item.pkgValue == 'updates' && !this.packages[p].hasUpdate) pushIt = false;
			else if (item.pkgValue == 'installed' && !this.packages[p].isInstalled) pushIt = false;
			
			
			// push it to the list if we should
			if (pushIt) 
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
}
