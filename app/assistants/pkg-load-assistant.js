function PkgLoadAssistant(pkg)
{
	this.pkg = pkg;
	Mojo.Log.error('pkg:', this.pkg);
	
	this.pkgObj = false;
	
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
				label: $L("Help"),
				command: 'do-help'
			}
		]
	};
};

PkgLoadAssistant.prototype.setup = function()
{
	this.controller.get('spinnerStatus').innerHTML = $L("Starting");

	// set theme because this can be the first scene pushed
	this.controller.document.body.className = prefs.get().theme;
	
	// get elements
	this.documentElement =			this.controller.stageController.document;
	this.spinnerElement =			this.controller.get('spinner');
	this.spinnerStatusElement =		this.controller.get('spinnerStatus');
	this.progressBarElement =		this.controller.get('progress-bar');
	this.progressElement =			this.controller.get('progress');
	
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
	
	
	// if packages are already loaded (aka preware is already open)
	if (packages.loaded)
	{
		var pkgNum = packages.packageInList(this.pkg);
		if (pkgNum !== false)
		{
			this.pkgObj = packages.packages[packages.packageInList(this.pkg)];
			this.doneUpdating();
		}
	}
	else
	{
		/*
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
		*/
	}
};

PkgLoadAssistant.prototype.updateFeeds = function()
{
	// even if there is an internet connection
	this.spinnerElement.style.display = "";
	
	// start and show the spinner
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	
	// this is the start of the stayawake class to keep it awake till we're done with it
	this.stayAwake.start();
	
	// get device type
	this.displayAction($L("<strong>Checking Device Type</strong>"), $L("This action should be immediate.  If it takes longer than that, it is probably due to interrupting an update or a download. You should reboot your phone and try again."));
	this.showActionHelpTimer(2);
	this.hideProgress();
	this.subscription = IPKGService.getMachineName(this.onDeviceType.bindAsEventListener(this));

};
PkgLoadAssistant.prototype.onDeviceType = function(response)
{

	if (response && response.returnValue === true) {
		if (response.stdOut[0] == "roadrunner") {
			Mojo.Environment.DeviceInfo.modelNameAscii = "Pre2";
		}
	}
	
	// run version check
	this.displayAction($L("<strong>Checking Service Access</strong>"), $L("This action should be immediate.  If it takes longer than that, it is probably due to interrupting an update or a download. You should reboot your phone and try again."));
	this.showActionHelpTimer(2);
	this.subscription = IPKGService.version(this.onVersionCheck.bindAsEventListener(this));
};
PkgLoadAssistant.prototype.onVersionCheck = function(payload)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload, 'VersionCheck');
	
		if (!payload) 
		{
			// i dont know if this will ever happen, but hey, it might
			this.errorMessage('Preware', $L("Cannot access the service. First try restarting Preware, or reboot your phone and try again."),
					  this.doneUpdating);
		}
		else if (payload.errorCode != undefined)
		{
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.errorMessage('Preware', $L("The service is not running. First try restarting Preware, or reboot your phone and try again."),
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
				this.errorMessage('Preware', $L("The service version is too old. First try rebooting your phone, or reinstall Preware and try again."),
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
PkgLoadAssistant.prototype.onUpdate = function(payload)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload, $L("Update"));
		
		if (!payload) 
		{
			// i dont know if this will ever happen, but hey, it might
			this.errorMessage('Preware', $L("Cannot access the service. First try restarting Preware, or reboot your phone and try again."),
					  this.doneUpdating);
		}
		else if (payload.errorCode != undefined)
		{
			// we probably dont need to check this stuff here,
			// it would have already been checked and errored out of this process
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.errorMessage('Preware', $L("The service is not running. First try restarting Preware, or reboot your phone and try again."),
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

PkgLoadAssistant.prototype.loadFeeds = function()
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

PkgLoadAssistant.prototype.parseFeeds = function(feeds)
{
	packages.loadFeeds(feeds, this);
}

PkgLoadAssistant.prototype.displayAction = function(msg, msgHelp)
{
	this.showActionHelpTimerClear();
	var statusText = msg;
	if (msgHelp)
	{
		statusText += '<div class="text" id="spinnerStatusHelp" style="display:none;">' + msgHelp + '</div>';
	}
	this.spinnerStatusElement.innerHTML = statusText;
};
PkgLoadAssistant.prototype.showActionHelpTimer = function(time)
{
	this.showActionHelpTimerClear();
	this.currentHelpTimer = this.controller.window.setTimeout(this.showActionHelp.bind(this), time * 1000);
};
PkgLoadAssistant.prototype.showActionHelpTimerClear = function()
{
	if (this.currentHelpTimer && this.controller)
	{
		this.controller.window.clearTimeout(this.currentHelpTimer);
	}
};
PkgLoadAssistant.prototype.showActionHelp = function()
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
PkgLoadAssistant.prototype.showProgress = function()
{
	this.progressBarElement.style.width = '0%';
	this.progressElement.style.display = "";
};
PkgLoadAssistant.prototype.hideProgress = function()
{
	this.progressElement.style.display = "none";
	this.progressBarElement.style.width = '0%';
};
PkgLoadAssistant.prototype.setProgress = function(percent)
{
	this.progressBarElement.style.width = percent + '%';
};
PkgLoadAssistant.prototype.doneUpdating = function()
{
	// stop and hide the spinner
	//this.spinnerModel.spinning = false;
	//this.controller.modelChanged(this.spinnerModel);
	
	// so if we're inactive we know to push a scene when we return
	this.isLoading = false;
	
	// show that we're done (while the pushed scene is going)
	this.displayAction($L("<strong>Done!</strong>"));
	this.hideProgress();
	
	// we're done loading so let the phone sleep if it needs to
	this.stayAwake.end();
	
	// swap to the scene passed when we were initialized:
	if (this.isActive) 
	{
		if (this.pkgObj !== false)
			this.controller.stageController.swapScene({name: 'pkg-view', transition: Mojo.Transition.crossFade}, this.pkgObj, false);
	}
};

PkgLoadAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
		}
	}
};
PkgLoadAssistant.prototype.errorMessage = function(title, message, okFunction)
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

PkgLoadAssistant.prototype.visibleWindow = function(event)
{
	if (!this.isVisible)
	{
		this.isVisible = true;
	}
};
PkgLoadAssistant.prototype.invisibleWindow = function(event)
{
	this.isVisible = false;
};
PkgLoadAssistant.prototype.activate = function(event)
{
	// if we're done loading, but the scene was just activated, swap the scene 
	if (!this.isLoading) 
	{
		if (this.pkgObj !== false)
			this.controller.stageController.swapScene({name: 'pkg-view', transition: Mojo.Transition.crossFade}, this.pkgObj, false);
	}
	this.isActive = true;
};
PkgLoadAssistant.prototype.deactivate = function(event)
{
	this.isActive = false;
};
PkgLoadAssistant.prototype.cleanup = function(event)
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
