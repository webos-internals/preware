//parses information for a single package
	parsePackage: function(rawData) {
		var test, lineRegExp, curPkg, x, match;
		try {
			if (rawData) {
				test = rawData;
				lineRegExp = new RegExp(/[\s]*([^:]*):[\s]*(.*)[\s]*$/);
				curPkg = false;
				
				for (x = 0; x < test.length; x += 1) {
					match = lineRegExp.exec(test[x]);
					if (match) {
						if (match[1] === 'Package' && !curPkg) {
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
						if (match[1] && match[2]) {
							curPkg[match[1]] = match[2];
						}
					} else {
						if (curPkg) {
							return curPkg;
						}
					}
				}
				
				if (curPkg) {
					return curPkg;
				}
			}
		} catch (e) {
			enyo.error('packagesModel#parsePackage', e);
		}
	},

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
			if (this.packages[this.multiPkgs[number]].appCatalog && !prefs.get().useTuckerbox) {
				this.doMyApps = true;
				this.doMultiInstall(number+1);
			}
			else if (this.packages[this.multiPkgs[number]].isInstalled) 
			{
				if (!this.packages[this.multiPkgs[number]].location) {
					alert('No location');
					// see note above about this skipping if the type can't be updated
					this.doMultiInstall(number+1);
				}
				else if (this.can(this.packages[this.multiPkgs[number]].type, 'update')) 
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
				if (!this.packages[this.multiPkgs[number]].location) {
					alert('No location');
					// see note above about this skipping if the type can't be updated
					this.doMultiInstall(number+1);
				}
				else {
					this.packages[this.multiPkgs[number]].doInstall(this.assistant, number, true);
				}
			}
		}
		// call install for package
		else if (number == this.multiPkgs.length && this.multiPkg) 
		{
			if (this.multiPkg.appCatalog && !prefs.get().useTuckerbox) {
				this.doMyApps = true;
				this.doMultiInstall(number+1);
			}
			else if (this.multiPkg.isInstalled) 
			{
				if (!this.multiPkg.location) {
					alert('No location');
					// see note above about this skipping if the type can't be updated
					this.doMultiInstall(number+1);
				}
				else if (this.can(this.multiPkg.type, 'update')) 
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
				if (!this.multiPkg.location) {
					alert('No location');
					// see note above about this skipping if the type can't be updated
					this.doMultiInstall(number+1);
				}
				else {
					this.multiPkg.doInstall(this.assistant, number, true);
				}
			}
		}
		// end actions!
		else
		{
			if (this.doMyApps) {
				this.dirtyFeeds = true;
				if (Mojo.Environment.DeviceInfo.platformVersionMajor == 1) {
					var request = new Mojo.Service.Request('palm://com.palm.applicationManager', {
							method: 'launch',
							parameters: 
							{
								id: "com.palm.app.findapps",
								params: { myapps: '' }
							}
						});
				}
				else {
					var request = new Mojo.Service.Request('palm://com.palm.applicationManager', {
							method: 'launch',
							parameters: 
							{
								id: "com.palm.app.swmanager",
								params: { launchType: "updates" }
							}
						});
				}
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
			this.doMyApps		= false;
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
			msg = $L("<b>Java Restart Is Required</b><br /><i>Once you press Ok your device will lose network connection and be unresponsive until it is done restarting.</i><br />");
		}
		if (flags.RestartLuna) 
		{
			msg = $L("<b>Luna Restart Is Required</b><br /><i>Once you press Ok all your open applications will be closed while luna restarts.</i><br />");
		}
		if ((flags.RestartLuna && flags.RestartJava) || flags.RestartDevice) 
		{
			msg = $L("<b>Device Restart Is Required</b><br /><i>You will need to restart your device to be able to use the packages that were just installed.</i><br />");
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
