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
	this.onlyLoad  = false;
	
	// load stayawake class
	this.stayAwake = new stayAwake();
	
	// required ipkgservice
	this.ipkgServiceVersion = 6;
	
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
	this.isVisible = true;
	
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
		this.onlyLoad = true;
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
			this.onlyLoad = true;
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
	this.displayAction('<strong>Checking Internet Connection</strong>', 'This action should be immediate.  If it takes longer than that, then restart Preware.  If that does not work, then check that both the Packaage Manager Service and Preware are installed properly.');
	this.showActionHelpTimer(2);
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
	this.displayAction('<strong>Checking Package Manager Version</strong>', 'This action should be immediate.  If it takes longer than that, it is probably due to interrupting an update or a download. You should reboot your phone and not launch Preware until you have a stable network connection available.');
	this.showActionHelpTimer(2);
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
				this.errorMessage('Preware', 'The Package Manager Service is not running. Did you remember to install it? If you did, first try restarting Preware, then try rebooting your phone and not launching Preware until you have a stable network connection available.');
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
					this.displayAction('<strong>Downloading Feed Information</strong>', 'This should take less than a couple of minutes even on a slow connection.<br>If it takes longer than that, first check your network connection, then try disabling feeds one at a time until you find which of the feeds are not responding.');
					this.showActionHelpTimer(120); // 2 minutes
					IPKGService.update(this.onUpdate.bindAsEventListener(this));
				}
				else 
				{
					// if not, go right to loading the pkg info
					this.displayAction('<strong>Loading Package Information</strong>');
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
				this.errorMessage('Preware', 'The Package Manager Service is not running. Did you remember to install it? If you did, first try restarting Preware, then try rebooting your phone and not launching Preware until you have a stable network connection available.');
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
			this.displayAction('<strong>Loading Package Information</strong>');
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
				this.errorMessage('Preware', 'The Package Manager Service is not running. Did you remember to install it? If you did, first try restarting Preware, then try rebooting your phone and not launching Preware until you have a stable network connection available.');
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

UpdateAssistant.prototype.displayAction = function(msg, msgHelp)
{
	this.showActionHelpTimerClear();
	var statusText = msg;
	if (msgHelp)
	{
		statusText += '<div class="text" id="spinnerStatusHelp" style="display:none;">' + msgHelp + '</div>';
	}
	this.controller.get('spinnerStatus').innerHTML = statusText;
}
UpdateAssistant.prototype.showActionHelpTimer = function(time)
{
	this.showActionHelpTimerClear();
	this.currentHelpTimer = this.controller.window.setTimeout(this.showActionHelp.bind(this), time * 1000);
}
UpdateAssistant.prototype.showActionHelpTimerClear = function()
{
	if (this.currentHelpTimer)
	{
		this.controller.window.clearTimeout(this.currentHelpTimer);
	}
}
UpdateAssistant.prototype.showActionHelp = function()
{
	if (this.currentHelpTimer) 
	{
		this.showActionHelpTimerClear();
		if (this.controller.get('spinnerStatusHelp')) 
		{
			this.controller.get('spinnerStatusHelp').style.display = '';
		}
	}
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
	this.displayAction('<strong>Done!</strong>');
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
		if (this.onlyLoad) 
		{
			Mojo.Controller.getAppController().showBanner({messageText:'Preware: Done Loading Feeds', icon:'miniicon.png'}, {source:'updateNotification'});
		}
		else
		{
			Mojo.Controller.getAppController().showBanner({messageText:'Preware: Done Updating Feeds', icon:'miniicon.png'}, {source:'updateNotification'});
		}
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
	this.displayAction('<strong>ERROR!</strong>');
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
