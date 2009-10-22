function packagesModel()
{
	// for storing assistants when we get one for certain functions
	this.updateAssistant = false;
	this.assistant = false;
	// for storing action information when we're in a multi-action
	this.multiPkg = false;
	this.multiPkgs = false;
	
	// for storing all the package information
	this.packages = [];
	this.categories = [];
	this.feeds = [];
	this.types = [];
	
	// we'll need these for the subscription based rawlist
	this.subscription = false;
	this.rawData = '';
	
	/* *** Type Conditions ***
	 * launch			// can be launched by luna, makes the button appear in the view scene
	 * update			// can be updated (installed over the top of the old version) this also makes the button appear in the view scene
	 * updateAsReplace	// is updated by removing then reinstalling
	 * showScreenshots	// may have screenshots that should be displayed, for view scene
	 * showDependendent	// may have dependent packages that should be displayed, for view scene
	 */
	this.typeConditions =
	{
		// major types
		Application:
		{
			launch: true,
			update: true,
			showScreenshots: true,
			showDependendent: true
		},
		Service:
		{
			update: true,
			showDependendent: true
		},
		Plugin:
		{
			update: true,
			showDependendent: true
		},
		Patch:
		{
			//update: true,
			updateAsReplace: true,
			showScreenshots: true,
			showDependendent: true
		},
		Theme:
		{
			//update: true,
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
			showDependendent: true
		},
		'Linux Application':
		{
			update: true,
			showDependendent: true
		},
		'System Utilities':
		{
			update: true,
			showDependendent: true
		},
		
		// unknown (used by actual unknown type, and any other type without values)
		'Unknown': {}
	}
}

packagesModel.prototype.loadFeeds = function(feeds, updateAssistant)
{
	try 
	{
		// clear out our current data (incase this is a re-update)
		this.packages = [];
		
		// get our current data
		this.feeds = feeds;
		this.updateAssistant = updateAssistant;
		
		if (this.feeds.length > 0)
		{
			this.updateAssistant.displayAction('Loading Package Information');
			this.updateAssistant.showProgress();
			
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
	// update display
	this.updateAssistant.displayAction('Loading Package Information<br>Status');
	this.updateAssistant.setProgress(Math.round((1/(this.feeds.length+1)) * 100));
	
	// request the rawdata
	IPKGService.rawstatus(this.infoResponse.bindAsEventListener(this, -1));
}
packagesModel.prototype.infoListRequest = function(num)
{
	// cancel the last subscription, this may not be needed
	if (this.subscription)
	{
		this.subscription.cancel();
	}
	
	// update display
	this.updateAssistant.displayAction('Loading Package Information<br>' + this.feeds[num].substr(0, 1).toUpperCase() + this.feeds[num].substr(1));
	this.updateAssistant.setProgress(Math.round(((num+2)/(this.feeds.length+1)) * 100));
	this.feedNum++;
	
	// subscribe to new feed
	this.subscription = IPKGService.rawlist(this.infoResponse.bindAsEventListener(this, num), this.feeds[num]);
}
packagesModel.prototype.infoResponse = function(payload, num)
{
	var doneLoading = false;
	
	try
	{
		// log payload for display
		//IPKGService.logPayload(payload);
		
		if (!payload || payload.errorCode == -1) 
		{
			// some sort of error message perhapse?
			return;
		}
		
		// no stage means its not a subscription, and we shouold hav all the contents right now
		if (!payload.stage)
		{
			if (payload.contents) 
			{
				this.parsePackages(payload.contents);
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
				}
			}
			else if (payload.stage == 'end')
			{
				// at end, we parse the data we've recieved this whole time
				if (this.rawData != '') 
				{
					this.parsePackages(this.rawData);
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
			this.updateAssistant.displayAction('Complete');
			this.updateAssistant.setProgress(100);
			this.doneLoading();
		}
	}
}
packagesModel.prototype.parsePackages = function(rawData)
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
			
				/*if (this.feeds[num] == 'preyourmind')
				{
					alert(x + ': ' + test[x]);
				}*/
				
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
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#parsePackages');
	}
}
packagesModel.prototype.loadPackage = function(packageObj)
{
	// load the package from the info
	var newPkg = new packageModel(packageObj);
	
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
	// cancel the last subscription, this may not be needed
	if (this.subscription)
	{
		this.subscription.cancel();
	}
	
	// clear out our current data (incase this is a re-update)
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
	this.updateAssistant.doneUpdating();
}

packagesModel.prototype.versionNewer = function(one, two)
{
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
}

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
			pkgList:  item.pkgList,
			pkgType:  item.pkgType,
			pkgFeed:  item.pkgFeed,
			pkgCat:   item.pkgCat
		};
		
		if (item.pkgGroup[0] == 'types')
		{
			for (var t = 0; t < this.types.length; t++)
			{
				itemL.pkgType = this.types[t].name;
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
		else if (item.pkgGroup[0] == 'feeds')
		{
			for (var f = 0; f < this.feeds.length; f++)
			{
				itemL.pkgFeed = this.feeds[f].name;
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
		else if (item.pkgGroup[0] == 'categories') 
		{
			// we push this all category first...
			itemL.pkgCat = 'all';
			var count = this.getPackages(itemL).length;
			if (count > 0) 
			{
				returnArray.push(
				{
					// this is because its special
					style: 'all',
					
					// this is for group list
					name: 'all',
					count: count,
					
					// this is for group selector
					label: 'all',
					command: 'all'
				});
			}
			for (var c = 0; c < this.categories.length; c++)
			{
				itemL.pkgCat = this.categories[c].name;
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
			
			
			
			// push packages that meet the listing
			if (item.pkgList == 'all')
			{
				pushIt = true;
				// if is installed and installed is not to be shown, dont push it
				if (this.packages[p].isInstalled && !prefs.get().listInstalled) 
				{
					pushIt = false;
					// if it is installed and is not to be shown but its the "list of everything", push it anyways
					if (item.pkgType == 'all' && item.pkgFeed == 'all' && item.pkgCat == 'all')
					{
						pushIt = true;
					}
				}
			}
			else if (item.pkgList == 'other' && // other is for main scene where its not already there
					this.packages[p].type != 'Application' && this.packages[p].type != 'Theme' &&
					this.packages[p].type != 'Patch') pushIt = true;
			else if (item.pkgList == 'updates' && this.packages[p].hasUpdate) pushIt = true;
			else if (item.pkgList == 'installed' && this.packages[p].isInstalled) pushIt = true;
			
			
			// check type and dont push if not right
			if (item.pkgType != 'all' && item.pkgType != '' && item.pkgType != this.packages[p].type) pushIt = false;
			
			// check feed and dont push if not right
			if (item.pkgFeed != 'all' && item.pkgFeed != '' && !this.packages[p].inFeed(item.pkgFeed)) pushIt = false;
			
			// check category and dont push if not right
			if (item.pkgCat != 'all' && item.pkgCat != '' && item.pkgCat != this.packages[p].category) pushIt = false;
			
			
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


/* ------- below are for multiple package actions -------- */

packagesModel.prototype.startMultiInstall = function(pkg, pkgs, assistant)
{
	try 
	{
		this.assistant = assistant;
		
		this.multiPkg = pkg;
		this.multiPkgs = pkgs;
		
		this.assistant.displayAction('Installing');
		this.assistant.startAction();
		this.doMultiInstall(0);
		
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#startMultiInstall');
	}
}

packagesModel.prototype.checkMultiInstall = function(pkg, pkgs, assistant)
{
	try 
	{
		// save assistant
		this.assistant = assistant;
		
		this.multiPkg = pkg;
		this.multiPkgs = pkgs;
		
		// see what they want to do:
		this.assistant.actionMessage(
			'This package depends on <b>' + this.multiPkgs.length + '</b> other package' + (this.multiPkgs.length>1?'s':'') + ' to be installed.',
			[
				{label:$L('Install ' + (this.multiPkgs.length>1?'Them':'It')), value:'ok'},
				{label:$L('View ' + (this.multiPkgs.length>1?'Them':'It')), value:'view'},
				{label:$L('Cancel'), value:'cancel'}
			],
			this.testMultiInstall.bindAsEventListener(this)
		);
		
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#checkMultiInstall');
	}
}
packagesModel.prototype.checkMultiRemove = function(pkg, pkgs, assistant)
{
	try 
	{
		// save assistant
		this.assistant = assistant;
		
		this.multiPkg = pkg;
		this.multiPkgs = pkgs;
		
		// see what they want to do:
		this.assistant.actionMessage(
			'This package has <b>' + this.multiPkgs.length + '</b> other installed package' + (this.multiPkgs.length>1?'s':'') +
			' that depend' + (this.multiPkgs.length>1?'':'s') + ' on it. <br\><br\>Removing this package may cause ' + (this.multiPkgs.length>1?'them':'it') +
			' to no longer function.',
			[
				// uncomment to allow removing of itself
				//{label:$L('Remove Anyways'), value:'ok'},
				{label:$L('View ' + (this.multiPkgs.length>1?'Them':'It')), value:'view'},
				{label:$L('Cancel'), value:'cancel'}
			],
			this.testMultiRemove.bindAsEventListener(this)
		);
		
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#checkMultiRemove');
	}
}

packagesModel.prototype.testMultiInstall = function(value)
{
	switch(value)
	{
		case 'ok':
			this.assistant.displayAction('Installing');
			this.assistant.startAction();
			this.doMultiInstall(0);
			break;
			
		case 'view':
			this.assistant.controller.stageController.pushScene('pkg-connected', 'install', this.multiPkg, this.multiPkgs);
			this.multiPkg = false;
			this.multiPkgs = false;
			break;
	}
	return;
}
packagesModel.prototype.testMultiRemove = function(value)
{
	switch(value)
	{
		case 'ok':
			this.multiPkg.doRemove(this.assistant, true);
			this.multiPkg = false;
			this.multiPkgs = false;
			break;
			
		case 'view':
			this.assistant.controller.stageController.pushScene('pkg-connected', 'remove', this.multiPkg, this.multiPkgs);
			this.multiPkg = false;
			this.multiPkgs = false;
			break;
	}
	return;
}

packagesModel.prototype.doMultiInstall = function(number)
{
	try 
	{
		// call install for dependencies
		if (number < this.multiPkgs.length) 
		{
			this.packages[this.multiPkgs[number]].doInstall(this.assistant, number, true);
		}
		// call install for package
		else if (number == this.multiPkgs.length && this.multiPkg) 
		{
			this.multiPkg.doInstall(this.assistant, number, true);
		}
		// end actions!
		else
		{
			var flags = this.getMultiFlags();
			if (flags.RestartLuna || flags.RestartJava) 
			{
				this.assistant.actionMessage(
					'Packages installed:<br /><br />' + this.multiActionMessage(flags),
					(!prefs.get().allowFlagSkip?[{label:$L('Ok'), value:'ok'}]:[{label:$L('Ok'), value:'ok'}, {label:$L('Later'), value:'skip'}]),
					this.multiActionFunction.bindAsEventListener(this, flags)
				);
				return;
			}
			else
			{
				// we run this anyways to get the rescan
				this.multiRunFlags(flags);
			}
			this.assistant.simpleMessage('Packages installed');
			this.assistant.endAction();
			this.multiPkg = false;
			this.multiPkgs = false;
		}
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#doMultiInstall');
	}
}

packagesModel.prototype.getMultiFlags = function()
{
	try 
	{
		var mFlags = {RestartLuna:false, RestartJava:false};
		
		// check base package first if there is one
		if (this.multiPkg) 
		{
			if (this.multiPkg.flags.install.RestartLuna) mFlags.RestartLuna = true;
			if (this.multiPkg.flags.install.RestartJava) mFlags.RestartJava = true;
		}
		
		// check all deps
		for (var d = 0; d < this.multiPkgs.length; d++)
		{
			if (this.packages[this.multiPkgs[d]].flags.install.RestartLuna) mFlags.RestartLuna = true;
			if (this.packages[this.multiPkgs[d]].flags.install.RestartJava) mFlags.RestartJava = true;
		}
		
		// return them
		return mFlags;
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#getMultiFlags');
	}
		
}
packagesModel.prototype.multiActionFunction = function(value, flags)
{
	try 
	{
		if (value == 'ok') 
		{
			this.multiRunFlags(flags);
		}
		this.assistant.endAction();
		this.multiPkg = false;
		this.multiPkgs = false;
		return;
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#multiActionFunction');
	}
}
packagesModel.prototype.multiActionMessage = function(flags)
{
	try 
	{
		var msg = '';
		if (flags.RestartJava) 
		{
			msg = '<b>Java Restart Is Required</b><br /><i>Once you press Ok your phone will lose network connection and be unresponsive until it is done restarting.</i><br />';
		}
		if (flags.RestartLuna) 
		{
			msg = '<b>Luna Restart Is Required</b><br /><i>Once you press Ok all your open applications will be closed while luna restarts.</i><br />';
		}
		if (flags.RestartLuna && flags.RestartJava) 
		{
			msg = '<b>Phone Restart Is Required</b><br /><i>You will need to restart your phone to be able to use the packages that were just installed.</i><br />';
		}
		return msg;
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#multiActionMessage');
	}
}
packagesModel.prototype.multiRunFlags = function(flags)
{
	try
	{
		if (flags.RestartJava && !flags.RestartLuna) 
		{
			IPKGService.restartjava(function(){});
		}
		if (flags.RestartLuna && !flags.RestartJava) 
		{
			IPKGService.restartluna(function(){});
		}
		// this is always ran...
		IPKGService.rescan(function(){});
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packagesModel#multiRunFlags');
	}
}
