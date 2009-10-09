// we load these global objects here because this scene is the first to get pushed to the stack...
// But it probably doesn't matter...

// global items object
var packages = new packagesModel();

// holds the preferences cookie
var prefs = new prefCookie();

function UpdateAssistant(scene, force, var1, var2, var3)
{
	// load variables we will use when we're done updating
	this.swapScene = scene;
	if (!this.swapScene) this.swapScene = 'main';
	this.force = force;
	this.swapVar1 = var1;
	this.swapVar2 = var2;
	this.swapVar3 = var3;
	
	// for storing the scene state and loading info
	this.isLoading = true;
	this.isActive  = true;
	this.isVisible = false;
	
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
	
	// monitor scene visibility
	this.controller.listen(this.controller.stageController.document, Mojo.Event.stageActivate,   this.visibleWindow.bindAsEventListener(this));
	this.controller.listen(this.controller.stageController.document, Mojo.Event.stageDeactivate, this.invisibleWindow.bindAsEventListener(this));
	this.visible = true;
	
	// clear log
	IPKGService.logClear();
	
	// setup spinner spinner model
	this.spinnerModel = {spinning: true};
	this.controller.setupWidget('spinner', {spinnerSize: 'large'}, this.spinnerModel);
	
	// hide progress bar
	this.hideProgress();
	
	// stores if its still loading
	this.isLoading = true;
	
	// call for feed update depending on update interval
	if (this.force)
	{
		this.updateFeeds();
	}
	else if (prefs.get().updateInterval == 'launch')
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
	this.displayAction('Checking Connection');
	this.hideProgress();
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
	this.displayAction('Checking Version');
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
			this.errorMessage('Preware', 'Update Error. The service probably isn\'t running.');
			return;
		}
		else if (payload.errorCode == -1)
		{
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.errorMessage('Preware', 'The Package Manager Service is not running. Did you remember to install it? If you did, perhaps you should try rebooting your phone.');
				return;
			}
			else
			{
				this.errorMessage('Preware', payload.errorText);
				return;
			}
		}
		else if (payload.errorCode == "ErrorGenericUnknownMethod")
		{
			// this is if this version is too old for the version number stuff
			this.errorMessage('Preware', 'The Package Manger Service you\'re running isn\'t compatible with this version of Preware. Please update it with WebOS Quick Install. [1]');
			return;
		}
		else
		{
			if (payload.apiVersion && payload.apiVersion < this.ipkgServiceVersion) 
			{
				// this is if this version is too old for the version number stuff
				this.errorMessage('Preware', 'The Package Manger Service you\'re running isn\'t compatible with this version of Preware. Please update it with WebOS Quick Install. [2]');
				return;
			}
			else 
			{
				if (hasNet && !onlyLoad) 
				{
					// initiate update if we have a connection
					this.displayAction('Updating');
					IPKGService.update(this.onUpdate.bindAsEventListener(this));
				}
				else 
				{
					// if not, go right to loading the pkg info
					this.displayAction('Loading');
					IPKGService.list_configs(this.onFeeds.bindAsEventListener(this));
				}
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#onVersionCheck');
		this.errorMessage('onVersionCheck Error', e);
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
			this.errorMessage('Preware', 'Update Error. The service probably isn\'t running.');
			return;
		}
		else if (payload.errorCode == -1)
		{
			// we probably dont need to check this stuff here,
			// it would have already been checked and errored out of this process
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.errorMessage('Preware', 'The Package Manager Service is not running. Did you remember to install it? If you did, perhaps you should try rebooting your phone.');
				return;
			}
			else
			{
				this.errorMessage('Preware', payload.errorText);
				return;
			}
		}
		else if (payload.returnVal != undefined) 
		{
			// its returned, but we don't really care if anything was actually updated
			//console.log(payload.returnVal);
			
			// well updating looks to have finished, lets log the date:
			prefs.put('lastUpdate', Math.round(new Date().getTime()/1000.0));
			
			// lets call the function to update the global list of pkgs
			this.displayAction('Loading');
			IPKGService.list_configs(this.onFeeds.bindAsEventListener(this));
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#onUpdate');
		this.errorMessage('onUpdate Error', e);
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
			this.errorMessage('Preware', 'Update Error. The service probably isn\'t running.');
			return;
		}
		else if (payload.errorCode == -1) 
		{
			// we probably dont need to check this stuff here,
			// it would have already been checked and errored out of this process
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.errorMessage('Preware', 'The Package Manager Service is not running. Did you remember to install it? If you did, perhaps you should try rebooting your phone.');
				return;
			}
			else
			{
				this.errorMessage('Preware', payload.errorText);
				return;
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
		this.errorMessage('onFeeds Error', e);
	}
}

UpdateAssistant.prototype.displayAction = function(msg)
{
	this.controller.get('spinnerStatus').innerHTML = msg;
}
UpdateAssistant.prototype.showProgress = function()
{
	this.controller.get('progress-bar').style.width = '0%';
	this.controller.get('progress').style.display = "";
}
UpdateAssistant.prototype.hideProgress = function()
{
	this.controller.get('progress-bar').style.width = '0%';
	this.controller.get('progress').style.display = "none";
}
UpdateAssistant.prototype.setProgress = function(percent)
{
	this.controller.get('progress-bar').style.width = percent + '%';
}
UpdateAssistant.prototype.doneUpdating = function()
{
	// stop and hide the spinner
	//this.spinnerModel.spinning = false;
	//this.controller.modelChanged(this.spinnerModel);
	
	// so if we're inactive we know to push a scene when we return
	this.isLoading = false;
	
	// show that we're done (while the pushed scene is going)
	this.displayAction('Done!');
	this.hideProgress();
	
	// we're done loading so let the phone sleep if it needs to
	this.stayAwake.end();
	
	//alert(packages.packages.length);
	
	// swap to the scene passed when we were initialized:
	if (this.isActive) 
	{
		this.controller.stageController.swapScene({name: this.swapScene, transition: Mojo.Transition.crossFade}, this.swapVar1, this.swapVar2, this.swapVar3);
	}
	
	if (!this.isActive || !this.isVisible)
	{	// if we're not the active scene, let them know via banner:
		Mojo.Controller.getAppController().showBanner({messageText:'Preware: Done Updating Feeds', icon:'miniicon.png'}, {source:'updateNotification'});
	}
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
UpdateAssistant.prototype.errorMessage = function(title, message)
{
	this.displayAction('ERROR!');
	this.hideProgress();
	
	this.controller.showAlertDialog(
	{
		allowHTMLMessage:	true,
		preventCancel:		true,
	    title:				title,
	    message:			message,
	    choices:			[{label:$L('Ok'), value:'ok'}],
	    onChoose:			this.errorMessageFunction.bindAsEventListener(this)
    });
	
	/*
	this.controller.showAlertDialog(
	{
	    onChoose: function(value) {},
		allowHTMLMessage: true,
	    title: title,
	    message: message,
	    choices:[{label:$L('Ok'), value:""}]
    });
    */
}
UpdateAssistant.prototype.errorMessageFunction = function(value)
{
	/*
	switch(value)
	{
		case 'ok':
			this.doneUpdating();
			break;
	}
	*/
	this.doneUpdating();
	return;
}

UpdateAssistant.prototype.visibleWindow = function(event)
{
	//alert('visible');
	
	if (!this.isVisible)
	{
		this.isVisible = true;
	}
}
UpdateAssistant.prototype.invisibleWindow = function(event)
{
	//alert('invisible');
	
	this.isVisible = false;
}
UpdateAssistant.prototype.activate = function(event)
{
	//alert('activate');
	
	// if we're done loading, but the scene was just activated, swap the scene 
	if (!this.isLoading) 
	{
		this.controller.stageController.swapScene({name: this.swapScene, transition: Mojo.Transition.crossFade}, this.swapVar1, this.swapVar2, this.swapVar3);
	}
	this.isActive = true;
}
UpdateAssistant.prototype.deactivate = function(event)
{
	//alert('deactivate');
	
	this.isActive = false;
}
UpdateAssistant.prototype.cleanup = function(event)
{
	// should maybe stop the power timer?
	this.stayAwake.end();
	
	// stop monitoring scene visibility
	this.controller.stopListening(this.controller.stageController.document, Mojo.Event.stageActivate,   this.visibleWindow.bindAsEventListener(this));
	this.controller.stopListening(this.controller.stageController.document, Mojo.Event.stageDeactivate, this.invisibleWindow.bindAsEventListener(this));
}
