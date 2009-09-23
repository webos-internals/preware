// global items object
var packages = new packagesModel();

// holds the preferences cookie
var prefs = new prefCookie();

function MainAssistant()
{
	// subtitle random list
	this.randomSub = 
	[
		'The Open Standard Installer',
		'The Advanced Homebrew Installer',
		'The Universal Application Installer',
		'Accessing All Open Standard Feeds',
		'The Advanced Homebrew Installer' // double billing
	];
	
	// load stayawake class
	this.stayAwake = new stayAwake();
	
	// required ipkgservice
	this.ipkgServiceVersion = 4;
}

MainAssistant.prototype.setup = function()
{
	// set theme
	this.controller.document.body.className = prefs.get().theme;
	
	// set random subtitle
	this.controller.get('subTitle').innerHTML = this.randomSub[Math.floor(Math.random() * this.randomSub.length)];
	
	// set version string
	this.controller.get('version').innerHTML = "v" + Mojo.Controller.appInfo.version;
	
	// spinner model
	this.spinnerModel = {spinning: true};
	
	// setup spinner widget
	this.controller.setupWidget('spinner', {spinnerSize: 'large'}, this.spinnerModel);
	
	// hide progress bar
	this.controller.get('progress').style.display = 'none';
	this.controller.get('progress-bar').style.width = '0%';
	
	// setup list model
	this.mainModel = { items: [] };
	
	// setup list widget
	this.controller.setupWidget('mainList', { itemTemplate: "main/rowTemplate", swipeToDelete: false, reorderable: false }, this.mainModel);
	Mojo.Event.listen(this.controller.get('mainList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));

	// setup menu model
	var menuModel =
	{
		visible: true,
		items:
		[
			{
				label: "Preferences",
				command: 'do-prefs'
			},
			{
				label: "Update Feeds...",
				command: 'do-update'
			},
			{
				label: "List Configs...",
				command: 'do-configs'
			}
		]
	}
	
	// setup widget
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, menuModel);
	
	// call for feed update depending on update interval
	if (prefs.get().updateInterval == 'launch')
	{
		// we should update then load
		this.updateFeeds();
	}
	else if (prefs.get().updateInterval == 'manual')
	{
		// straight to loading
		this.updateFeeds(true);
	}
	else if (prefs.get().updateInterval == 'daily')
	{
		var now = Math.round(new Date().getTime()/1000.0);
		// if more then a day has passed since last update, update
		if (now - prefs.get().lastUpdate > 86400)
		{
			// we should update then load
			this.updateFeeds();
		}
		else
		{
			// straight to loading
			this.updateFeeds(true);
		}
	}
	else
	{
		// this really shouldn't happen, but if it does, lets update
		this.updateFeeds();
	}
}

MainAssistant.prototype.updateFeeds = function(onlyLoad)
{
	// the onlyLoad specifies if we should go straight to loading or not
	// even if there is an internet connection
	
	// start and show the spinner
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	
	// hide the list while we update ipkg
	this.controller.get('mainList').style.display = "none";
	
	// this is the start of the stayawake class to keep it awake till we're done with it
	this.stayAwake.start();
	
	// start with checking the internet connection
	this.controller.get('spinnerStatus').innerHTML = "Checking Connection";
	this.controller.get('progress').style.display = 'none';
	this.controller.get('progress-bar').style.width = '0%';
	this.controller.serviceRequest('palm://com.palm.connectionmanager', {
	    method: 'getstatus',
	    onSuccess: this.onConnection.bindAsEventListener(this, onlyLoad),
	    onFailure: this.onConnection.bindAsEventListener(this, onlyLoad)
	});
}

MainAssistant.prototype.listTapHandler = function(event)
{
	if (event.item.scene === false || event.item.style == 'disabled') 
	{
		// no scene or its disabled, so we won't do anything
	}
	else
	{
		// push the scene
		this.controller.stageController.pushScene(event.item.scene, event.item);
	}
}

MainAssistant.prototype.onConnection = function(response, onlyLoad)
{
	var hasNet = false;
	if (response && response.returnValue === true && response.isInternetConnectionAvailable === true)
	{
		var hasNet = true;
	}
	
	// run version check
	this.controller.get('spinnerStatus').innerHTML = "Checking Version";
	IPKGService.version(this.onVersionCheck.bindAsEventListener(this, hasNet, onlyLoad));
}

MainAssistant.prototype.onVersionCheck = function(payload, hasNet, onlyLoad)
{
	if (!payload) 
	{
		// i dont know if this will ever happen, but hey, it might
		this.alertMessage('Preware', 'Update Error. The service probably isn\'t running.');
		this.doneUpdating();
	}
	else if (payload.errorCode == -1)
	{
		if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
		{
			this.alertMessage('Preware', 'The Package Manager Service is not running. Did you remember to install it? If you did, perhaps you should try rebooting your phone.');
			this.doneUpdating();
		}
		else
		{
			this.alertMessage('Preware', payload.errorText);
			this.doneUpdating();
		}
	}
	else if (payload.errorCode == "ErrorGenericUnknownMethod")
	{
		// this is if this version is too old for the version number stuff
		this.alertMessage('Preware', 'The Package Manger Service you\'re running isn\'t compatible with this version of Preware. Please update it with WebOS Quick Install. [1]');
		this.doneUpdating();
	}
	else
	{
		if (payload.apiVersion && payload.apiVersion < this.ipkgServiceVersion) 
		{
			// this is if this version is too old for the version number stuff
			this.alertMessage('Preware', 'The Package Manger Service you\'re running isn\'t compatible with this version of Preware. Please update it with WebOS Quick Install. [2]');
			this.doneUpdating();
		}
		else 
		{
			if (hasNet && !onlyLoad) 
			{
				// initiate update if we have a connection
				this.controller.get('spinnerStatus').innerHTML = "Updating";
				IPKGService.update(this.onUpdate.bindAsEventListener(this));
			}
			else 
			{
				// if not, go right to loading the pkg info
				this.controller.get('spinnerStatus').innerHTML = "Loading";
				IPKGService.list_configs(this.onFeeds.bindAsEventListener(this));
			}
		}
	}
}

MainAssistant.prototype.onUpdate = function(payload)
{
	try 
	{
		if (!payload) 
		{
			// i dont know if this will ever happen, but hey, it might
			this.alertMessage('Preware', 'Update Error. The service probably isn\'t running.');
			this.doneUpdating();
		}
		else if (payload.errorCode == -1)
		{
			// we probably dont need to check this stuff here,
			// it would have already been checked and errored out of this process
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.alertMessage('Preware', 'The Package Manager Service is not running. Did you remember to install it? If you did, perhaps you should try rebooting your phone.');
				this.doneUpdating();
			}
			else
			{
				this.alertMessage('Preware', payload.errorText);
				this.doneUpdating();
			}
		}
		else if (payload.returnVal != undefined) 
		{
			// its returned, but we don't really care if anything was actually updated
			//console.log(payload.returnVal);
			
			// well updating looks to have finished, lets log the date:
			prefs.put('lastUpdate', Math.round(new Date().getTime()/1000.0));
			
			// lets call the function to update the global list of pkgs
			this.controller.get('spinnerStatus').innerHTML = "Loading";
			IPKGService.list_configs(this.onFeeds.bindAsEventListener(this));
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#onUpdate');
		this.alertMessage('onUpdate Error', e);
		
		// we're done here
		this.doneUpdating();
	}
}

MainAssistant.prototype.onFeeds = function(payload)
{
	try 
	{
		if (!payload) 
		{
			// i dont know if this will ever happen, but hey, it might
			this.alertMessage('Preware', 'Update Error. The service probably isn\'t running.');
			this.doneUpdating();
		}
		else if (payload.errorCode == -1) 
		{
			// we probably dont need to check this stuff here,
			// it would have already been checked and errored out of this process
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.alertMessage('Preware', 'The Package Manager Service is not running. Did you remember to install it? If you did, perhaps you should try rebooting your phone.');
				this.doneUpdating();
			}
			else
			{
				this.alertMessage('Preware', payload.errorText);
				this.doneUpdating();
			}
		}
		else 
		{
			// clear feeds array
			var feeds = [];
			
			// load feeds
			for (var x = 0; x < payload.configs.length; x++)
			{
				for (var p in payload.configs[x]) 
				{
					var tmpSplit1 = payload.configs[x][p].split('<br>');
					for (var c = 0; c < tmpSplit1.length; c++)
					{
						if (tmpSplit1[c]) 
						{
							var tmpSplit2 = tmpSplit1[c].split(' ');
							if (tmpSplit2[1]) 
							{
								feeds.push(tmpSplit2[1]);
								//alert(x + '-' + p + ': ' + tmpSplit2[1]);
							}
						}
					}
				}
			}
			
			// sort them (mostly so precentral is in the middle so it doesnt seem like it hangs at the end.)
			feeds.sort();
			
			// send payload to items object
			packages.loadFeeds(feeds, this);
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#onFeeds');
		this.alertMessage('onFeeds Error', e);
		
		// we're done here
		this.doneUpdating();
	}
}

// stops the spinner and displays the list
MainAssistant.prototype.doneUpdating = function()
{
	// stop and hide the spinner
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	
	// update the list
	this.updateList();
	
	// show the list
	this.controller.get('mainList').style.display = 'inline';
	
	this.controller.get('progress').style.display = 'none';
	this.controller.get('progress-bar').style.width = '0%';
	
	// we're done loading so let the phone sleep if it needs to
	this.stayAwake.end();
	
	//alert(packages.packages.length);
}

// this is called to update the list (namely the counts and styles)
MainAssistant.prototype.updateList = function()
{
	try 
	{
		// clear main list model of its items
		this.mainModel.items = [];
		
		this.mainModel.items.push(
		{
			name:     $L('Package Updates'),	// displays in list
			style:    'disabled',				// class for use in the list display
			scene:    'pkg-list',				// scene that will be pushed on tap 
			pkgList:  'updates',				// 
			pkgType:  'all',					// 
			pkgFeed:  'all',					// 
			pkgCat:   'all',					// 
			pkgCount: 0							// count of pkgs for display in list, will only display if style is set to 'showCount'
		});
		
		if (!prefs.get().showAllTypes) 
		{
			this.mainModel.items.push(
			{
				name:     $L('Available Applications'),
				style:    'disabled',
				scene:    'pkg-groups',
				pkgGroup: ['categories','feeds'],
				pkgList:  'all',
				pkgType:  'Application',
				pkgFeed:  '',
				pkgCat:   '',
				pkgCount: 0
			});
			
			this.mainModel.items.push(
			{
				name:     $L('Available Themes'),
				style:    'disabled',
				scene:    'pkg-list',
				pkgList:  'all',
				pkgType:  'Theme',
				pkgFeed:  'all',
				pkgCat:   'all',
				pkgCount: 0
			});
			
			this.mainModel.items.push(
			{
				name:     $L('Available Patches'),
				style:    'disabled',
				scene:    'pkg-list',
				pkgList:  'all',
				pkgType:  'Patch',
				pkgFeed:  'all',
				pkgCat:   'all',
				pkgCount: 0
			});
		}
		else
		{
			this.mainModel.items.push(
			{
				name:     $L('Available Packages'),
				style:    'disabled',
				scene:    'pkg-groups',
				pkgGroup: ['types','feeds'],
				pkgList:  'all',
				pkgType:  '',
				pkgFeed:  '',
				pkgCat:   '',
				pkgCount: 0
			});
		}
		
		this.mainModel.items.push(
		{
			name:     $L('Installed Packages'),
			style:    'disabled',
			scene:    'pkg-groups',
			pkgGroup: ['types'],
			pkgList:  'installed',
			pkgType:  '',
			pkgFeed:  'all',
			pkgCat:   'all',
			pkgCount: 0
		});
		
		this.mainModel.items.push(
		{
			name:     $L('List of Everything'),
			style:    'disabled',
			scene:    'pkg-list',
			pkgList:  'all',
			pkgType:  'all',
			pkgFeed:  'all',
			pkgCat:   'all',
		});
		
		// if we have packages we need to get out list counts
		if (packages.packages.length > 0)
		{
			// '-1' so we don't add a count to the everything list
			//for (var i = 0; i < (this.mainModel.items.length-1); i++)
			for (var i = 0; i < this.mainModel.items.length; i++)
			{
				var count = packages.getPackages(this.mainModel.items[i]).length;
				if (count > 0) 
				{
					this.mainModel.items[i].style = 'showCount';
					this.mainModel.items[i].pkgCount = count;
				}
			}
			
			// enable everything list
			//this.mainModel.items[(this.mainModel.items.length-1)].style = false;
		}
		
		// update list widget
		this.controller.get('mainList').mojo.noticeUpdatedItems(0, this.mainModel.items);
	 	this.controller.get('mainList').mojo.setLength(this.mainModel.items.length);
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#updateList');
		this.alertMessage('updateList Error', e);
	}
}

MainAssistant.prototype.activate = function(event)
{
	// something may have been updated/installed/removed so lets update the list
	this.updateList();
}

MainAssistant.prototype.alertMessage = function(title, message)
{
	this.controller.showAlertDialog({
	    onChoose: function(value) {},
		allowHTMLMessage: true,
	    title: title,
	    message: message,
	    choices:[{label:$L('Ok'), value:""}]
    });
}

MainAssistant.prototype.handleCommand = function(event)
{

	if (event.type == Mojo.Event.command) {

		switch (event.command) {

		case 'do-prefs':
			this.controller.stageController.pushScene('preferences');
			break;

		case 'do-update':
			this.updateFeeds();
			break;

		case 'do-configs':
			IPKGService.list_configs(this.onConfigs.bindAsEventListener(this));
			break;

		}

	}

}

MainAssistant.prototype.onConfigs = function(payload)
{
	var msg = "";
	for (var x = 0; x < payload.configs.length; x++)
	{
		for (p in payload.configs[x]) 
		{
			msg += '<b>' + p + '</b>:<br />' + payload.configs[x][p];
		}
	}
	this.alertMessage('IPKG Configs', '<div style="font-size: 12px;">' + msg + '</div>');
}

MainAssistant.prototype.deactivate = function(event) {}

MainAssistant.prototype.cleanup = function(event)
{
	// should maybe stop the power timer?
	this.stayAwake.end();
}
