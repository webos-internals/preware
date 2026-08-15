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
	
	// list of feeds
	this.feeds = [];

	// we'll need these for the subscription based update
	this.subscription = false;

	// feed downloads run several at a time, so they each need their own state
	this.downloadSubscriptions = [];	// subscription per feed number
	this.downloadActive = {};			// feeds currently downloading, keyed by feed number
	this.downloadNext = 0;				// next feed in line to be started
	this.downloadDone = 0;				// feeds finished, successfully or not
	this.downloadErrors = [];			// collected so we can report them all at once
	this.downloadStatus = '';			// latest status line from any of them
	this.downloadStatusFeed = '';		// which feed that status came from

	// load stayawake class
	this.stayAwake = new stayAwake();
	
	// required ipkgservice
	this.ipkgServiceVersion = 14;

	// first ipkgservice whose downloadFeed can be called for several feeds at
	// once. older ones build their replies in shared buffers, so asking them
	// for more than one feed at a time corrupts the responses
	this.parallelServiceVersion = 18;
	this.serviceApiVersion = 0;
	
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
		this.onlyLoad = false;
		this.updateFeeds();
	}
	else if (this.force === 'load')
	{
		this.onlyLoad = true;
		this.updateFeeds();
	}
	else if (prefs.get().updateInterval == 'launch')
	{
		// we should update then load
		this.onlyLoad = false;
		this.updateFeeds();
	}
	else if (prefs.get().updateInterval == 'manual')
	{
		// straight to loading
		this.onlyLoad = true;
		this.updateFeeds();
	}
	else if (prefs.get().updateInterval == 'daily')
	{
		var now = Math.round(new Date().getTime()/1000.0);
		// if more then 24 hours has passed since last update, update
		if (now - prefs.get().lastUpdate > 86400)
		{
			// we should update then load
			this.onlyLoad = false;
			this.updateFeeds();
		}
		else
		{
			// straight to loading
			this.onlyLoad = true;
			this.updateFeeds();
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
		this.onlyLoad = false;
		this.updateFeeds();
	}
};

UpdateAssistant.prototype.yesTap = function(event)
{
	// we should update then load
	this.onlyLoad = false;
	this.updateFeeds();
};
UpdateAssistant.prototype.noTap = function(event)
{
	// straight to loading
	this.onlyLoad = true;
	this.updateFeeds();
};

UpdateAssistant.prototype.updateFeeds = function()
{
	this.spinnerElement.style.display = "";
	this.questionContainer.style.display = "none";
	
	// clear some packages stuff (incase an update is already in progress)
	packages.feeds = [];
	if (packages.subscription)
	{
		packages.subscription.cancel();
	}
	this.cancelDownloads();
	
	// start and show the spinner
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	
	// this is the start of the stayawake class to keep it awake till we're done with it
	this.stayAwake.start();
	
	// get device type
	this.displayAction($L("<strong>Checking Device Type</strong>"), $L("This action should be immediate.  If it takes longer than that, it is probably due to interrupting an update or a download. You should reboot your device and try again."));
	this.showActionHelpTimer(2);
	this.hideProgress();

	this.loadAuthParams();
};

UpdateAssistant.prototype.loadAuthParams = function()
{
	DeviceProfile.getDeviceProfile(this.getDeviceProfile.bind(this), false);
};

UpdateAssistant.prototype.getDeviceProfile = function(returnValue, deviceProfile, errorText)
{
	if (returnValue === false) {
		this.subscription = IPKGService.getMachineName(this.onDeviceType.bindAsEventListener(this));
		return;
	}

	this.deviceProfile = deviceProfile;

	if (this.deviceProfile) {
		this.palmProfile = false;
		PalmProfile.getPalmProfile(this.getPalmProfile.bind(this), false);
	}
	else {
		this.subscription = IPKGService.getMachineName(this.onDeviceType.bindAsEventListener(this));
	}
};

UpdateAssistant.prototype.getPalmProfile = function(returnValue, palmProfile, errorText)
{
	if (returnValue === false) {
		this.subscription = IPKGService.getMachineName(this.onDeviceType.bindAsEventListener(this));
		return;
	}

	this.palmProfile = palmProfile;

	if (this.palmProfile) {
		IPKGService.setAuthParams(this.authParamsSet.bind(this),
								  this.deviceProfile.deviceId,
								  this.palmProfile.token);
	}
	else {
		this.subscription = IPKGService.getMachineName(this.onDeviceType.bindAsEventListener(this));
	}
};

UpdateAssistant.prototype.authParamsSet = function(payload)
{
	// Not yet checking status or reporting errors
	this.subscription = IPKGService.getMachineName(this.onDeviceType.bindAsEventListener(this));
};

UpdateAssistant.prototype.onDeviceType = function(response)
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
	    onSuccess: this.onConnection.bindAsEventListener(this),
	    onFailure: this.onConnection.bindAsEventListener(this)
	});
};

UpdateAssistant.prototype.onConnection = function(response)
{
	var hasNet = false;
	if (response && response.returnValue === true && (response.isInternetConnectionAvailable === true || response.wifi.state == "connected"))
	{
		var hasNet = true;
	}
	
	// run version check
	this.displayAction($L("<strong>Checking Service Access</strong>"), $L("This action should be immediate.  If it takes longer than that, it is probably due to interrupting an update or a download. You should reboot your device and try again."));
	this.showActionHelpTimer(2);
	this.subscription = IPKGService.version(this.onVersionCheck.bindAsEventListener(this, hasNet));
};

UpdateAssistant.prototype.onVersionCheck = function(payload, hasNet)
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
			// remember this so we know whether feeds can be downloaded in parallel
			this.serviceApiVersion = (payload.apiVersion ? parseInt(payload.apiVersion, 10) : 0);

			if (payload.apiVersion && payload.apiVersion < this.ipkgServiceVersion)
			{
				// this is if this version is too old for the version number stuff
				this.errorMessage('Preware', $L("The service version is too old. First try rebooting your device, or reinstall Preware and try again."),
						  this.doneUpdating);
			}
			else 
			{
				if (hasNet && !this.onlyLoad) 
				{
					// initiate update if we have a connection
					this.displayAction($L("<strong>Downloading Feed Information</strong>"), $L("This should take less than a couple of minutes even on a slow connection.<br>If it takes longer than that, first check your network connection, then try disabling feeds one at a time until you find which of the feeds are not responding."));
					this.showActionHelpTimer(120); // 2 minutes
					this.subscription = feeds.loadFeeds(this, this.downloadFeeds.bindAsEventListener(this));
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

// how many feeds we download at the same time. downloads spend most of their
// time waiting on the network rather than transferring, so running several at
// once hides most of that wait. measured against a shared link, 6 is where the
// gain flattens out: past it we are down to the transfer time of the largest
// feed, and only very high latency links get anything more.
// set this to 1 for the old one-at-a-time behavior.
UpdateAssistant.prototype.maxParallelDownloads = 6;

UpdateAssistant.prototype.downloadFeeds = function(feeds)
{
	this.feeds = feeds;

	// reset the download state (incase an update was already run this session)
	this.downloadSubscriptions = [];
	this.downloadActive = {};
	this.downloadNext = 0;
	this.downloadDone = 0;
	this.downloadErrors = [];
	this.downloadStatus = '';
	this.downloadStatusFeed = '';
	this.lastProgressDraw = 0;

	if (!this.feeds.length) {
		// nothing to download, so go straight to loading what we already have
		this.loadFeeds();
		return;
	}

	this.showProgress();
	this.displayDownloadProgress(true);

	// only ask an older service for one feed at a time, it cannot handle more
	var atOnce = (this.serviceApiVersion >= this.parallelServiceVersion ? this.maxParallelDownloads : 1);

	// fill the pipe: start as many feeds at once as we're allowed to run
	var starting = Math.min(atOnce, this.feeds.length);
	for (var s = 0; s < starting; s++) {
		this.downloadFeedRequest(this.downloadNext++);
	}
};

// Least time between status repaints, in milliseconds. Six feeds downloading
// at once produce curl progress lines faster than the screen can usefully be
// redrawn, and rewriting the status that often leaves the display with stale
// patches that never get repainted. Feed starts and finishes always redraw.
UpdateAssistant.prototype.progressRedrawMs = 400;

UpdateAssistant.prototype.displayDownloadProgress = function(force)
{
	var now = new Date().getTime();
	if (!force && this.lastProgressDraw && (now - this.lastProgressDraw) < this.progressRedrawMs) {
		return;
	}
	this.lastProgressDraw = now;

	// Six feeds download at once, but we only ever name one of them: the one we
	// last heard from. Listing them all wraps onto extra lines, and the block
	// then grows down into the progress bar below it. One name per line keeps
	// this a fixed four lines however many downloads are in flight.
	var name = this.downloadStatusFeed;
	if (!name) {
		for (var num in this.downloadActive) {
			name = this.downloadActive[num].name;
			break;
		}
	}

	var msg = $L("<strong>Downloading Feed Information</strong><br>") +
			  this.downloadDone + $L(" of ") + this.feeds.length;
	msg += '<div class="feeds">' + (name ? name : '&nbsp;') + '</div>';
	msg += '<div class="status">' + (this.downloadStatus ? this.downloadStatus : '&nbsp;') + '</div>';

	this.displayAction(msg);
	this.setProgress(Math.round((this.downloadDone / this.feeds.length) * 100));
};

UpdateAssistant.prototype.downloadFeedRequest = function(num)
{
	this.downloadActive[num] = this.feeds[num];
	this.displayDownloadProgress(true);

	// subscribe to new feed
	this.downloadSubscriptions[num] = IPKGService.downloadFeed(this.downloadFeedResponse.bindAsEventListener(this, num),
															   this.feeds[num].gzipped, this.feeds[num].name, this.feeds[num].url);
};

UpdateAssistant.prototype.downloadFeedResponse = function(payload, num)
{
	// this feed is already finished with (or we've been cancelled), so ignore late payloads
	if (!this.downloadActive[num]) {
		return;
	}

	if ((payload.returnValue === false) || (payload.stage == "failed")) {
		// one bad feed shouldn't stop the rest, so remember it and carry on
		var errorText = (payload.errorText ? payload.errorText : '');
		if (payload.stdErr && payload.stdErr.length) {
			errorText += (errorText ? '<br>' : '') + payload.stdErr.join("<br>");
		}
		this.downloadErrors.push('<strong>' + this.feeds[num].name + '</strong><br>' + errorText);
		this.downloadFeedFinished(num);
	}
	else if (payload.stage == "status") {
		// the feed is named on its own line, so the status is just the text
		this.downloadStatusFeed = this.feeds[num].name;
		this.downloadStatus = payload.status;
		this.displayDownloadProgress();
	}
	else if (payload.stage == "completed") {
		this.downloadFeedFinished(num);
	}
};

UpdateAssistant.prototype.downloadFeedFinished = function(num)
{
	// if this is the feed we were naming, let the next one take over the line
	if (this.downloadStatusFeed == this.feeds[num].name) {
		this.downloadStatusFeed = '';
		this.downloadStatus = '';
	}

	// drop this feed and free up its slot
	delete this.downloadActive[num];
	if (this.downloadSubscriptions[num]) {
		this.downloadSubscriptions[num].cancel();
		this.downloadSubscriptions[num] = false;
	}
	this.downloadDone++;

	// start whichever feed is next in line, if there is one
	if (this.downloadNext < this.feeds.length) {
		this.downloadFeedRequest(this.downloadNext++);
	}
	else {
		this.displayDownloadProgress(true);
	}

	// still waiting on the other downloads
	if (this.downloadDone < this.feeds.length) {
		return;
	}

	// we're done
	this.displayAction($L("<strong>Done Downloading!</strong>"));
	this.setProgress(0);
	this.hideProgress();

	if (this.downloadErrors.length) {
		// report every feed that failed in one go, rather than a dialog per feed
		this.errorMessage('Preware', $L("These feeds could not be downloaded:") + '<br><br>' + this.downloadErrors.join('<br><br>'),
						  this.loadFeeds);
	}
	else {
		// well updating looks to have finished, lets log the date:
		prefs.put('lastUpdate', Math.round(new Date().getTime()/1000.0));

		this.loadFeeds();
	}
};

UpdateAssistant.prototype.cancelDownloads = function()
{
	for (var num = 0; num < this.downloadSubscriptions.length; num++) {
		if (this.downloadSubscriptions[num]) {
			this.downloadSubscriptions[num].cancel();
			this.downloadSubscriptions[num] = false;
		}
	}
	this.downloadActive = {};
};

UpdateAssistant.prototype.loadFeeds = function()
{
	// cancel the last subscription, this may not be needed
	if (this.subscription)
	{
		this.subscription.cancel();
	}
	this.cancelDownloads();

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
	// this.displayAction($L("<strong>ERROR!</strong>"));
	// this.hideProgress();
	
	this.controller.showAlertDialog(
	{
		allowHTMLMessage:	true,
		preventCancel:		true,
	    title:				title,
		message:			removeAuth(message),
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
	this.cancelDownloads();

	// should maybe stop the power timer?
	this.stayAwake.end();
	
	// stop monitoring scene visibility
	this.controller.stopListening(this.documentElement, Mojo.Event.stageActivate,   this.visibleWindowHandler);
	this.controller.stopListening(this.documentElement, Mojo.Event.stageDeactivate, this.invisibleWindowHandler);
};

// Local Variables:
// tab-width: 4
// End:
