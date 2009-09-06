function packagesModel()
{
	this.packages = [];
	this.categories = [];
	this.feeds = [];
	this.types = [{name: 'Application'}, {name: 'Patch'}, {name: 'Service'}, {name: 'Plugin'}, {name: 'LinuxBinary'}];
	
	// this is for use to seperate the patches from the apps
	this.patchCategory = 'WebOS Patches';
}

/* // we're  not using this anymore
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
*/

packagesModel.prototype.load = function(payload, mainAssistant)
{
	// clear out our current data (incase this is a re-update)
	this.packages = [];
	this.categories = [];
	this.feeds = [];
	
	this.mainAssistant = mainAssistant;
	
	try 
	{
		// build an array of the packages
		this.pkgs = [];
		for (var p in payload) 
		{
			this.pkgs.push(p);
		}
		
		if (this.pkgs[0]) this.infoRequest(0);
		
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#load:packageList');
	}
	
}

packagesModel.prototype.infoRequest = function(num)
{
	//alert('Start: ' + (num+1) + ' of ' + this.pkgs.length);
	
	this.mainAssistant.controller.get('spinnerStatus').innerHTML = 'Loading<br>' + (num+1) + ' of ' + this.pkgs.length;
	
	IPKGService.info(this.infoResponse.bindAsEventListener(this, num), this.pkgs[num]);
}

packagesModel.prototype.infoResponse = function(payload, num)
{
	try
	{
		if (!payload || payload.errorCode == -1) 
		{
			// error or something
		}
		else 
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
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#infoResponse');
	}
	
	//alert('End: ' + (num+1) + ' of ' + this.pkgs.length);
	
	if (this.pkgs[(num+1)]) 
	{
		// start next
		this.infoRequest((num+1));
	}
	else
	{
		// we're done
		this.mainAssistant.controller.get('spinnerStatus').innerHTML = 'Finishing';
		this.doneLoading();
	}
}

packagesModel.prototype.doneLoading = function()
{
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
		Mojo.Log.logException(e, 'packagesModel#doneLoading:categoryfeedList');
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
	
	// tell the main scene we're done updating
	this.mainAssistant.doneUpdating();
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
		// temporary item for getting list counts
		var itemL =
		{
			list: item.list,
			pkgType: item.pkgType,
			pkgValue: item.pkgValue,
			pkgGroup: ''
		};
			
		if (item.list == 'categories') 
		{
			for (var c = 0; c < this.categories.length; c++)
			{
				itemL.pkgGroup = this.categories[c].name;
				var count = this.getPackages(itemL).length;
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
				itemL.pkgGroup = this.feeds[f].name;
				var count = this.getPackages(itemL).length;
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
		else if (item.list == 'types')
		{
			for (var t = 0; t < this.types.length; t++)
			{
				itemL.pkgGroup = this.types[t].name;
				var count = this.getPackages(itemL).length;
				if (count > 0) 
				{
					returnArray.push(
					{
						// this is for group list
						name: this.types[t].name,
						count: count,
						
						// this is for group selector
						label: this.types[t].name,
						command: this.types[t].name
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
			
			
			
			// push packages that meet the type
			if (item.pkgType != 'all') 
			{
				if (item.pkgType == this.packages[p].type) pushIt = true;
				
				// for now, we want to show libraries in the application lists if they aren't splitting them up in the main list
				// once we handle dependencies we can delete this code
				if (!prefs.get().showLibraries && item.pkgType == "Application" &&
					(this.packages[p].type == "Plugin" || this.packages[p].type == "Service" || this.packages[p].type == "LinuxBinary"))
				{
					pushIt = true;
				}
				
				if (item.pkgType == "libraries" &&
					(this.packages[p].type == "Plugin" || this.packages[p].type == "Service" || this.packages[p].type == "LinuxBinary"))
				{
					pushIt = true;
				}
			}
			else 
			{
				pushIt = true;
			}
			
			
			// dont push packages that dont meet the value
			if (item.pkgValue == 'group')
			{
				if (item.pkgGroup)
				{
					if (item.list == 'categories' && this.packages[p].category != item.pkgGroup) pushIt = false;
					if (item.list == 'feeds' && !this.packages[p].inFeed(item.pkgGroup)) pushIt = false;
					if (item.list == 'types' && this.packages[p].type != item.pkgGroup) pushIt = false;
				}
			}
			else if (item.pkgValue == 'updates' && !this.packages[p].hasUpdate) pushIt = false;
			else if (item.pkgValue == 'installed' && !this.packages[p].isInstalled) pushIt = false;
			
			
			// dont push packages that are installed in most lists if the user doesnt want to see them
			if (!prefs.get().listInstalled && this.packages[p].isInstalled && item.pkgValue != 'installed' && item.pkgValue != 'updates' &&
				!(item.pkgType == 'all' && item.pkgValue == 'all')) pushIt = false;
			
			
			
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
