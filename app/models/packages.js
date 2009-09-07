function packagesModel()
{
	this.packages = [];
	this.categories = [];
	this.feeds = [];
	this.types = [];
	
	// this is for use to seperate the patches from the apps
	this.patchCategory = 'WebOS Patches';
}

packagesModel.prototype.loadFeeds = function(feeds, mainAssistant)
{
	try 
	{
		// clear out our current data (incase this is a re-update)
		this.packages = [];
		
		// get our current data
		this.feeds = feeds;
		this.mainAssistant = mainAssistant;
		
		if (this.feeds.length > 0)
		{
			this.mainAssistant.controller.get('spinnerStatus').innerHTML = "Loading";
			this.mainAssistant.controller.get('progress').style.display = "";
			
			this.infoStatusRequest();
		}
	} 
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#loadFeeds');
	}
}

packagesModel.prototype.infoStatusRequest = function()
{
	this.mainAssistant.controller.get('spinnerStatus').innerHTML = 'Loading<br>Status';
	this.mainAssistant.controller.get('progress-bar').style.width = Math.round((1/(this.feeds.length+1)) * 100) + '%';
	
	IPKGService.rawstatus(this.infoResponse.bindAsEventListener(this, -1));
}

packagesModel.prototype.infoListRequest = function(num)
{
	this.mainAssistant.controller.get('spinnerStatus').innerHTML = 'Loading<br>' + this.feeds[num].substr(0, 1).toUpperCase() + this.feeds[num].substr(1);
	this.mainAssistant.controller.get('progress-bar').style.width = Math.round(((num+2)/(this.feeds.length+1)) * 100) + '%';
	this.feedNum++;
	
	IPKGService.rawlist(this.infoResponse.bindAsEventListener(this, num), this.feeds[num]);
}

packagesModel.prototype.infoResponse = function(payload, num)
{
	try 
	{
		if (!payload || payload.errorCode == -1) 
		{
			// some sort of error
		}
		else 
		{
			if (payload.contents) 
			{
				var test = payload.contents.split(/\n/);
				var lineRegExp = new RegExp(/[\s]*([^:]*):[\s]*(.*)[\s]*$/);
				var curPkg = false;
				
				for (var x = 0; x <= test.length; x++) 
				{
				
					//if (this.feeds[num] == 'webosinternals')
					//{
					//	alert(x + ': ' + test[x]);
					//}
					
					//if (test[x] && test[x].include('PreYour'))
					//{
					//	alert(x + ': ' + test[x]);
					//}
					
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
							this.loadPackage(curPkg);
							curPkg = false;
						}
					}
				}
				
				if (curPkg) 
				{
					this.loadPackage(curPkg);
					curPkg = false;
				}
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#infoResponse');
	}
	
	if (this.feeds[(num + 1)]) 
	{
		// start next
		this.infoListRequest((num + 1));
	}
	else 
	{
		// we're done
		this.mainAssistant.controller.get('spinnerStatus').innerHTML = 'Complete';
		this.mainAssistant.controller.get('progress-bar').style.width = '100%';
		this.doneLoading();
	}
}

packagesModel.prototype.loadPackage = function(packageObj)
{
	// load the package from the info
	var newPkg = new packageModel(packageObj)
	
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

packagesModel.prototype.doneLoading = function()
{
	// clear out our current data (incase this is a re-update)
	this.categories = [];
	this.feeds = [];
	
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
			
			// build types list
			var typeNum = this.typeInList(this.packages[p].type);
			if (typeNum === false) 
			{
				// push new category
				this.types.push({name: this.packages[p].type});
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
	
	// sort feeds
	if (this.feeds.length > 0)
	{
		this.feeds.sort(function(a, b)
		{
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
	
	// sort types
	if (this.types.length > 0)
	{
		this.types.sort(function(a, b)
		{
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

packagesModel.prototype.typeInList = function(type)
{
	if (this.types.length > 0) 
	{
		for (var t = 0; t < this.types.length; t++) 
		{
			if (this.types[t].name == type) 
			{
				return t;
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
				
				// for now, we want to show all types in the application lists if they aren't splitting them up in the main list
				// once we handle dependencies we can delete this code
				if (!prefs.get().showAllTypes && item.pkgType == "Application" && this.packages[p].type != 'Patch')
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
