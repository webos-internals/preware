packagesModel.prototype.getGroups = function(item)
{
	var returnArray = [];
	var counts = $H();
	
	try
	{
		// temporary item for getting list counts
		var itemL =
		{
			pkgList:	item.pkgList,
			pkgType:	item.pkgType,
			pkgFeed:	item.pkgFeed,
			pkgCat:		item.pkgCat
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

// Local Variables:
// tab-width: 4
// End:
