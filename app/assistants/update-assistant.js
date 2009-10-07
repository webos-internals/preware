// we load these global objects here because this scene is the first to get pushed to the stack...
// But it probably doesn't matter...

// global items object
var packages = new packagesModel();

// holds the preferences cookie
var prefs = new prefCookie();

function UpdateAssistant(scene, var1, var2, var3)
{
	// load variables we will use when we're done updating
	this.swapScene = scene;
	if (!this.swapScene) this.swapScene = 'main';
	this.swapVar1 = var1;
	this.swapVar2 = var2;
	this.swapVar3 = var3;
	
	// load stayawake class
	this.stayAwake = new stayAwake();
	
	// required ipkgservice
	this.ipkgServiceVersion = 4;
	
	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: "Preferences",
				command: 'do-prefs'
			},
			{
				label: "Update Feeds",
				command: 'do-update'
			},
			{
				label: "Help",
				command: 'do-help'
			}
		]
	}
}

UpdateAssistant.prototype.setup = function()
{
	// set theme because this is the first scene pushed
	this.controller.document.body.className = prefs.get().theme;
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	// clear log
	IPKGService.logClear();
	
	// setup spinner spinner model
	this.spinnerModel = {spinning: true};
	this.controller.setupWidget('spinner', {spinnerSize: 'large'}, this.spinnerModel);
	
	// hide progress bar
	this.controller.get('progress').style.display = 'none';
	this.controller.get('progress-bar').style.width = '0%';
	
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
		// if more then 24 hours has passed since last update, update
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

UpdateAssistant.prototype.updateFeeds = function(onlyLoad)
{
	// the onlyLoad specifies if we should go straight to loading or not
	// even if there is an internet connection
	
	// clear some packages stuff (incase an update is already in progress)
	packages.feeds = [];
	if (packages.subscription)
	{
		packages.subscription.cancel();
	}
	
	// start and show the spinner
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	
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

UpdateAssistant.prototype.onConnection = function(response, onlyLoad)
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

UpdateAssistant.prototype.onVersionCheck = function(payload, hasNet, onlyLoad)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload, 'VersionCheck');
	
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
	catch (e)
	{
		Mojo.Log.logException(e, 'main#onVersionCheck');
		this.alertMessage('onVersionCheck Error', e);
		
		// we're done here
		this.doneUpdating();
	}
}

UpdateAssistant.prototype.onUpdate = function(payload)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload, 'Update');
		
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

UpdateAssistant.prototype.onFeeds = function(payload)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload, 'Feeds');
		
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
				if (payload.configs[x].enabled) 
				{
					var tmpSplit1 = payload.configs[x].contents.split('<br>');
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

// this is called when done, will push the 
UpdateAssistant.prototype.doneUpdating = function()
{
	// stop and hide the spinner
	//this.spinnerModel.spinning = false;
	//this.controller.modelChanged(this.spinnerModel);
	
	this.controller.get('spinnerStatus').innerHTML = "Done!";
	
	// hide progress bar
	this.controller.get('progress').style.display = 'none';
	this.controller.get('progress-bar').style.width = '0%';
	
	// we're done loading so let the phone sleep if it needs to
	this.stayAwake.end();
	
	//alert(packages.packages.length);
	
	// swap to the scene passed when we were initialized:
	this.controller.stageController.swapScene({name: this.swapScene, transition: Mojo.Transition.crossFade}, this.swapVar1, this.swapVar2, this.swapVar3);
}

UpdateAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-prefs':
				this.controller.stageController.pushScene('preferences');
				break;
			
			case 'do-update':
				this.updateFeeds();
				break;
			
			case 'do-showLog':
				this.controller.stageController.pushScene({name: 'ipkg-log', disableSceneScroller: true});
				break;
			
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
		}
	}
}

UpdateAssistant.prototype.alertMessage = function(title, message)
{
	this.controller.showAlertDialog({
	    onChoose: function(value) {},
		allowHTMLMessage: true,
	    title: title,
	    message: message,
	    choices:[{label:$L('Ok'), value:""}]
    });
}

UpdateAssistant.prototype.activate = function(event) {}
UpdateAssistant.prototype.deactivate = function(event) {}
UpdateAssistant.prototype.cleanup = function(event)
{
	// should maybe stop the power timer?
	this.stayAwake.end();
}
