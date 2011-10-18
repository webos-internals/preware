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
	
	// we'll need these for the subscription based update
	this.subscription = false;

	// load stayawake class
	this.stayAwake = new stayAwake();
	
	// required ipkgservice
	this.ipkgServiceVersion = 14;
	
	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: $L("Preferences"),
				command: 'do-prefs'
			},
			{
				label: $L("Update Feeds"),
				command: 'do-update'
			},
			{
				label: $L("Manage Feeds"),
				command: 'do-feeds'
			},
			{
				label: $L("Install Package"),
				command: 'do-install'
			},
			{
				label: $L("Luna Manager"),
				command: 'do-luna'
			},
			{
				label: $L("Help"),
				command: 'do-help'
			}
		]
	};
};

UpdateAssistant.prototype.setup = function()
{
	this.controller.get('spinnerStatus').innerHTML = $L("Starting");

	// set theme because this can be the first scene pushed
	var deviceTheme = '';
	if (Mojo.Environment.DeviceInfo.modelNameAscii == 'Pixi' ||
		Mojo.Environment.DeviceInfo.modelNameAscii == 'Veer')
		deviceTheme += ' small-device';
	if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') == 0 ||
		Mojo.Environment.DeviceInfo.modelNameAscii == 'Emulator')
		deviceTheme += ' no-gesture';
	this.controller.document.body.className = prefs.get().theme + deviceTheme;
	
	this.controller.get('update-question').innerHTML = $L("Update Feeds?");
	
	// get elements
	this.documentElement =			this.controller.stageController.document;
	this.spinnerElement =			this.controller.get('spinner');
	this.spinnerStatusElement =		this.controller.get('spinnerStatus');
	this.progressBarElement =		this.controller.get('progress-bar');
	this.progressElement =			this.controller.get('progress');
	this.questionContainer =		this.controller.get('question');
	this.yesButtonElement =			this.controller.get('yesButton');
	this.noButtonElement =			this.controller.get('noButton');
	
	// handlers
	this.visibleWindowHandler =		this.visibleWindow.bindAsEventListener(this);
	this.invisibleWindowHandler =	this.invisibleWindow.bindAsEventListener(this);
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	// monitor scene visibility
	this.controller.listen(this.documentElement, Mojo.Event.stageActivate,   this.visibleWindowHandler);
	this.controller.listen(this.documentElement, Mojo.Event.stageDeactivate, this.invisibleWindowHandler);
	this.isVisible = true;
	
	// clear log
	IPKGService.logClear();
	
	// setup spinner spinner model
	this.spinnerModel = {spinning: true};
	this.controller.setupWidget('spinner', {spinnerSize: 'large'}, this.spinnerModel);
	
	// set this scene's default transition
	this.controller.setDefaultTransition(Mojo.Transition.zoomFade);
	
	// hide progress bar
	this.hideProgress();
	
	// stores if its still loading
	this.isLoading = true;
	
	// call for feed update depending on update interval
	if (this.force === true)
	{
		this.updateFeeds();
	}
	else if (this.force === 'load')
	{
		this.updateFeeds(true);
		this.onlyLoad = true;
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
	else if (prefs.get().updateInterval == 'ask')
	{
		this.spinnerModel.spinning = false;
		this.controller.modelChanged(this.spinnerModel);
		this.questionContainer.style.display = "";
		this.controller.setupWidget
		(
			'yesButton',
			{},
			{
				buttonLabel: $L("Yes"),
				buttonClass: 'affirmative'
			}
		);
		this.controller.setupWidget
		(
			'noButton',
			{},
			{
				buttonLabel: $L("No"),
				buttonClass: 'negative'
			}
		);
		this.controller.listen(this.yesButtonElement, Mojo.Event.tap, this.yesTap.bindAsEventListener(this));
		this.controller.listen(this.noButtonElement, Mojo.Event.tap, this.noTap.bindAsEventListener(this));
	}
	else
	{
		// this really shouldn't happen, but if it does, lets update
		this.updateFeeds();
	}
};

UpdateAssistant.prototype.yesTap = function(event)
{
	// we should update then load
	this.updateFeeds();
};
UpdateAssistant.prototype.noTap = function(event)
{
	// straight to loading
	this.updateFeeds(true);
	this.onlyLoad = true;
};

UpdateAssistant.prototype.updateFeeds = function(onlyLoad)
{
	// the onlyLoad specifies if we should go straight to loading or not
	// even if there is an internet connection
	this.spinnerElement.style.display = "";
	this.questionContainer.style.display = "none";
	
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
	
	// get device type
	this.displayAction($L("<strong>Checking Device Type</strong>"), $L("This action should be immediate.  If it takes longer than that, it is probably due to interrupting an update or a download. You should reboot your device and try again."));
	this.showActionHelpTimer(2);
	this.hideProgress();
	this.subscription = IPKGService.getMachineName(this.onDeviceType.bindAsEventListener(this, onlyLoad));

};
UpdateAssistant.prototype.onDeviceType = function(response, onlyLoad)
{

	if (response && response.returnValue === true) {
		if (response.stdOut[0] == "roadrunner") {
			Mojo.Environment.DeviceInfo.modelNameAscii = "Pre2";
		}
	}
	
	// start with checking the internet connection
	this.displayAction($L("<strong>Checking Internet Connection</strong>"), $L("This action should be immediate.  If it takes longer than that, then check your network connectivity."));
	this.showActionHelpTimer(2);
	this.hideProgress();
	this.controller.serviceRequest('palm://com.palm.connectionmanager', {
	    method: 'getstatus',
	    onSuccess: this.onConnection.bindAsEventListener(this, onlyLoad),
	    onFailure: this.onConnection.bindAsEventListener(this, onlyLoad)
	});
};
UpdateAssistant.prototype.onConnection = function(response, onlyLoad)
{
	var hasNet = false;
	if (response && response.returnValue === true && (response.isInternetConnectionAvailable === true || response.wifi.state == "connected"))
	{
		var hasNet = true;
	}
	
	// run version check
	this.displayAction($L("<strong>Checking Service Access</strong>"), $L("This action should be immediate.  If it takes longer than that, it is probably due to interrupting an update or a download. You should reboot your device and try again."));
	this.showActionHelpTimer(2);
	this.subscription = IPKGService.version(this.onVersionCheck.bindAsEventListener(this, hasNet, onlyLoad));
};
UpdateAssistant.prototype.onVersionCheck = function(payload, hasNet, onlyLoad)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload, 'VersionCheck');
	
		if (!payload) 
		{
			// i dont know if this will ever happen, but hey, it might
			this.errorMessage('Preware', $L("Cannot access the service. First try restarting Preware, or reboot your device and try again."),
					  this.doneUpdating);
		}
		else if (payload.errorCode != undefined)
		{
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.errorMessage('Preware', $L("The service is not running. First try restarting Preware, or reboot your device and try again."),
						  this.doneUpdating);
			}
			else
			{
				this.errorMessage('Preware', payload.errorText, this.doneUpdating);
			}
		}
		else
		{
			if (payload.apiVersion && payload.apiVersion < this.ipkgServiceVersion) 
			{
				// this is if this version is too old for the version number stuff
				this.errorMessage('Preware', $L("The service version is too old. First try rebooting your device, or reinstall Preware and try again."),
						  this.doneUpdating);
			}
			else 
			{
				if (hasNet && !onlyLoad) 
				{
					// initiate update if we have a connection
					this.displayAction($L("<strong>Downloading Feed Information</strong>"), $L("This should take less than a couple of minutes even on a slow connection.<br>If it takes longer than that, first check your network connection, then try disabling feeds one at a time until you find which of the feeds are not responding."));
					this.showActionHelpTimer(120); // 2 minutes
					this.subscription = IPKGService.update(this.onUpdate.bindAsEventListener(this));
				}
				else 
				{
					// if not, go right to loading the pkg info
					this.loadFeeds();
				}
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#onVersionCheck');
		this.errorMessage('onVersionCheck Error', e, this.doneUpdating);
	}
};
UpdateAssistant.prototype.onUpdate = function(payload)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload, $L("Update"));
		
		if (!payload) 
		{
			// i dont know if this will ever happen, but hey, it might
			this.errorMessage('Preware', $L("Cannot access the service. First try restarting Preware, or reboot your device and try again."),
					  this.doneUpdating);
		}
		else if (payload.errorCode != undefined)
		{
			// we probably dont need to check this stuff here,
			// it would have already been checked and errored out of this process
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.errorMessage('Preware', $L("The service is not running. First try restarting Preware, or reboot your device and try again."),
						  this.doneUpdating);
			}
			else
			{
				this.errorMessage('Preware', payload.errorText + '<br>' + payload.stdErr,
						  this.loadFeeds);
			}
		}
		else if (payload.stage == "status") {
			this.displayAction($L("<strong>Downloading Feed Information</strong><br>") + payload.status);
		}
		else if (((payload.stage == undefined) && (payload.returnVal != undefined)) ||
			 (payload.stage == "completed"))
		{
			// its returned, but we don't really care if anything was actually updated
			//console.log(payload.returnVal);
			
			// well updating looks to have finished, lets log the date:
			prefs.put('lastUpdate', Math.round(new Date().getTime()/1000.0));
			
			this.loadFeeds();
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#onUpdate');
		this.errorMessage('onUpdate Error', e, this.doneUpdating);
	}
};

UpdateAssistant.prototype.loadFeeds = function()
{
	// cancel the last subscription, this may not be needed
	if (this.subscription)
	{
		this.subscription.cancel();
	}
	
	// lets call the function to update the global list of pkgs
	this.displayAction($L("<strong>Loading Package Information</strong>"));
	feeds.loadFeeds(this, this.parseFeeds.bind(this));
};

UpdateAssistant.prototype.parseFeeds = function(feeds)
{
	packages.loadFeeds(feeds, this);
}

UpdateAssistant.prototype.displayAction = function(msg, msgHelp)
{
	this.showActionHelpTimerClear();
	var statusText = msg;
	if (msgHelp)
	{
		statusText += '<div class="text" id="spinnerStatusHelp" style="display:none;">' + msgHelp + '</div>';
	}
	this.spinnerStatusElement.innerHTML = statusText;
};
UpdateAssistant.prototype.showActionHelpTimer = function(time)
{
	this.showActionHelpTimerClear();
	this.currentHelpTimer = this.controller.window.setTimeout(this.showActionHelp.bind(this), time * 1000);
};
UpdateAssistant.prototype.showActionHelpTimerClear = function()
{
	if (this.currentHelpTimer && this.controller)
	{
		this.controller.window.clearTimeout(this.currentHelpTimer);
	}
};
UpdateAssistant.prototype.showActionHelp = function()
{
	this.spinnerStatusHelpElement = this.controller.get('spinnerStatusHelp');
	if (this.currentHelpTimer) 
	{
		this.showActionHelpTimerClear();
		if (this.spinnerStatusHelpElement) 
		{
			this.spinnerStatusHelpElement.style.display = '';
		}
	}
};
UpdateAssistant.prototype.showProgress = function()
{
	this.progressBarElement.style.width = '0%';
	this.progressElement.style.display = "";
};
UpdateAssistant.prototype.hideProgress = function()
{
	this.progressElement.style.display = "none";
	this.progressBarElement.style.width = '0%';
};
UpdateAssistant.prototype.setProgress = function(percent)
{
	this.progressBarElement.style.width = percent + '%';
};
UpdateAssistant.prototype.doneUpdating = function()
{
	// stop and hide the spinner
	//this.spinnerModel.spinning = false;
	//this.controller.modelChanged(this.spinnerModel);
	
	// so if we're inactive we know to push a scene when we return
	this.isLoading = false;
	
	// show that we're done (while the pushed scene is going)
	this.displayAction($L("<strong>Done!</strong>"));
	this.hideProgress();
	
	// we're done loading so let the device sleep if it needs to
	this.stayAwake.end();
	
	//alert(packages.packages.length);
	
	if (!this.isActive || !this.isVisible)
	{	// if we're not the active scene, let them know via banner:
		if (this.onlyLoad) 
		{
			Mojo.Controller.getAppController().showBanner({messageText:$L("Preware: Done Loading Feeds"), icon:'miniicon.png'}, {source:'updateNotification'});
		}
		else
		{
			Mojo.Controller.getAppController().showBanner({messageText:$L("Preware: Done Updating Feeds"), icon:'miniicon.png'}, {source:'updateNotification'});
		}
	}
	
	// swap to the scene passed when we were initialized:
	if (this.isActive) 
	{
		this.controller.stageController.swapScene({name: this.swapScene, transition: Mojo.Transition.crossFade}, this.swapVar1, this.swapVar2, this.swapVar3);
	}
};

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
			
			case 'do-feeds':
				this.controller.stageController.pushScene('configs');
				break;
				
			case 'do-install':
				this.controller.stageController.pushScene('pkg-install');
				break;
	
			case 'do-showLog':
				this.controller.stageController.pushScene({name: 'ipkg-log', disableSceneScroller: true});
				break;
				
			case 'do-luna':
				this.controller.stageController.pushScene('luna');
				break;
			
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
		}
	}
};
UpdateAssistant.prototype.errorMessage = function(title, message, okFunction)
{
	this.displayAction($L("<strong>ERROR!</strong>"));
	this.hideProgress();
	
	this.controller.showAlertDialog(
	{
		allowHTMLMessage:	true,
		preventCancel:		true,
	    title:			title,
	    message:			message,
	    choices:			[{label:$L("Ok"), value:'ok'}],
	    onChoose:			okFunction.bindAsEventListener(this)
    });
};

UpdateAssistant.prototype.visibleWindow = function(event)
{
	if (!this.isVisible)
	{
		this.isVisible = true;
	}
};
UpdateAssistant.prototype.invisibleWindow = function(event)
{
	this.isVisible = false;
};
UpdateAssistant.prototype.activate = function(event)
{
	// if we're done loading, but the scene was just activated, swap the scene 
	if (!this.isLoading) 
	{
		this.controller.stageController.swapScene({name: this.swapScene, transition: Mojo.Transition.crossFade}, this.swapVar1, this.swapVar2, this.swapVar3);
	}
	this.isActive = true;
};
UpdateAssistant.prototype.deactivate = function(event)
{
	this.isActive = false;
};
UpdateAssistant.prototype.cleanup = function(event)
{
	// cancel the last subscription, this may not be needed
	if (this.subscription)
	{
		this.subscription.cancel();
	}
	
	// should maybe stop the power timer?
	this.stayAwake.end();
	
	// stop monitoring scene visibility
	this.controller.stopListening(this.documentElement, Mojo.Event.stageActivate,   this.visibleWindowHandler);
	this.controller.stopListening(this.documentElement, Mojo.Event.stageDeactivate, this.invisibleWindowHandler);
};

// Local Variables:
// tab-width: 4
// End:
