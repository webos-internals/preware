function PkgInstallAssistant(file)
{
	// this is true when a package action is in progress
	this.active = false;
	
	this.launchFile = file;
	
	// Package currently being installed - required to stop garbage collection.
	this.packageModel = false;
	
	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			Mojo.Menu.editItem,
			{
				label: $L("IPKG Log"),
				command: 'do-showLog'
			},
			{
				label: $L("Help"),
				command: 'do-help'
			}
		]
	}
	
	// load stayawake class
	this.stayAwake = new stayAwake();
};

PkgInstallAssistant.prototype.setup = function()
{

	this.controller.get('install-title').innerHTML = $L("Install Package");
	this.controller.get('group-title').innerHTML = $L("File");

	this.controller.get('notice-text').innerHTML = $L("<b>Note:</b><br />If this package needs a luna restart or device restart after installation, you will need to manually perform it when the installation is complete.");

	// set theme because this can be the first scene pushed
	var deviceTheme = '';
	if (Mojo.Environment.DeviceInfo.modelNameAscii == 'Pixi' ||
		Mojo.Environment.DeviceInfo.modelNameAscii == 'Veer')
		deviceTheme += ' small-device';
	if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') == 0 ||
		Mojo.Environment.DeviceInfo.modelNameAscii == 'Emulator')
		deviceTheme += ' no-gesture';
	this.controller.document.body.className = prefs.get().theme + deviceTheme;
	
	// clear log so it only shows stuff from this scene
	IPKGService.logClear();
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	// setup spinner widget
	this.spinnerModel = {spinning: false};
	this.controller.setupWidget('spinner', {spinnerSize: 'large'}, this.spinnerModel);
	
	// setup back tap
	this.backElement = this.controller.get('icon');
	this.backTapHandler = this.backTap.bindAsEventListener(this);
	this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);

	this.fileElement =			this.controller.get('file');
	this.browseButtonElement =	this.controller.get('browseButton');
	this.infoButtonElement =	this.controller.get('infoButton');
	this.installButtonElement =	this.controller.get('installButton');
	
	this.textChanged =			this.textChanged.bindAsEventListener(this);
	this.browseButtonPressed =	this.browseButtonPressed.bindAsEventListener(this);
	this.infoButtonPressed =	this.infoButtonPressed.bindAsEventListener(this);
	this.installButtonPressed =	this.installButtonPressed.bindAsEventListener(this);
	
	
	this.controller.setupWidget
	(
		'file',
		{
			hintText: $L('http:// or file:// or ftp://'),
			multiline: true,
			enterSubmits: false,
			changeOnKeyPress: true,
			textCase: Mojo.Widget.steModeLowerCase,
			focusMode: Mojo.Widget.focusSelectMode
		},
		{
			value: (this.launchFile ? this.launchFile : '')
		}
	);
	
	this.controller.setupWidget
	(
		'browseButton',
		{
			type: Mojo.Widget.activityButton
		},
		{
			buttonLabel: $L('Browse')
		}
	);
	
	this.controller.setupWidget
	(
		'infoButton',
		{
			type: Mojo.Widget.activityButton
		},
		this.infoButtonModel = {
			buttonLabel: $L('Get Info'),
			disabled: (this.launchFile ? false : true)
		}
	);
	
	this.controller.setupWidget
	(
		'installButton',
		{
			type: Mojo.Widget.activityButton
		},
		this.installButtonModel = {
			buttonLabel: $L('Install'),
			disabled: (this.launchFile ? false : true)
		}
	);
	
	Mojo.Event.listen(this.fileElement, Mojo.Event.propertyChange, this.textChanged);
	Mojo.Event.listen(this.browseButtonElement, Mojo.Event.tap, this.browseButtonPressed);
	Mojo.Event.listen(this.infoButtonElement, Mojo.Event.tap, this.infoButtonPressed);
	Mojo.Event.listen(this.installButtonElement, Mojo.Event.tap, this.installButtonPressed);
	
};

PkgInstallAssistant.prototype.textChanged = function(event)
{
	if (event.value != '')
	{
		this.installButtonModel.disabled = false;
		this.infoButtonModel.disabled = false;
		this.controller.modelChanged(this.installButtonModel);
		this.controller.modelChanged(this.infoButtonModel);
	}
	else
	{
		this.installButtonModel.disabled = true;
		this.infoButtonModel.disabled = true;
		this.controller.modelChanged(this.installButtonModel);
		this.controller.modelChanged(this.infoButtonModel);
	}
}
PkgInstallAssistant.prototype.updateText = function(value)
{
	this.fileElement.mojo.setValue(value);
}

PkgInstallAssistant.prototype.browseButtonPressed = function(event)
{
	var f = new filePicker({
		type: 'file',
		root: prefs.get().browseFromRoot,
		folder: '/media/internal/',
		extensions: ['ipk'],
		onSelect: this.browsed.bind(this),
		pop: false
	});
}
PkgInstallAssistant.prototype.browsed = function(value)
{
	if (value === false)
	{
	}
	else
	{
		this.fileElement.mojo.setValue('file://'+value);
	}
	this.browseButtonElement.mojo.deactivate();
}

PkgInstallAssistant.prototype.infoButtonPressed = function(event)
{
	var url =		this.fileElement.mojo.getValue();
	var filename =	filePicker.getFileName(url);
	IPKGService.extractControl(this.controllExtracted.bindAsEventListener(this, filename, url), filename, url);
}
PkgInstallAssistant.prototype.controllExtracted = function(payload, filename, url)
{
	if (payload.stage && payload.stage == 'completed')
	{
		this.infoButtonElement.mojo.deactivate();
		var tmpPackageModel = new packageModel(packages.parsePackage(payload.info), {type: 'Package', filename: filename, location: url});
		if (tmpPackageModel)
		{
			this.controller.stageController.pushScene('pkg-view', tmpPackageModel, false);
		}
	}
}


PkgInstallAssistant.prototype.installButtonPressed = function(event)
{
	IPKGService.installStatus(this.doCheckAppCatInstalls.bindAsEventListener(this));
};

PkgInstallAssistant.prototype.doCheckAppCatInstalls = function(response)
{
    var installing = false;

    if (response.status.apps.length > 0)
	{
		for (var x = 0; x < response.status.apps.length; x++)
		{
		    // We're going to ignore "removing" here, because it's either modal or erroneous.
		    if ((response.status.apps[x].details.state == "ipk download current") ||
				(response.status.apps[x].details.state == "ipk download complete") ||
				(response.status.apps[x].details.state == "installing"))
			{
				installing = true;
		    }
		}
    }
	
    if (installing == false)
	{
		var textValue = this.fileElement.mojo.getValue();
		var filename = filePicker.getFileName(textValue);
		var packageId = filename.split("_", 1)[0];
		this.packageModel = new packageModel('', {type: 'Package', pkg: packageId, title: packageId, filename: filename, location: textValue});
		this.packageModel.doInstall(this);
    }
    else
	{
		Mojo.Controller.errorDialog("An App Catalog background operation is in progress, please try again later.", this.controller.window);
    }
};

PkgInstallAssistant.prototype.backTap = function(event)
{
	if (!this.active) {
		this.controller.stageController.popScene();
	}
};

PkgInstallAssistant.prototype.handleCommand = function(event)
{
	if(event.type == Mojo.Event.back)
	{
		if (this.active) 
		{
			event.preventDefault();
			event.stopPropagation();
		}      
	}
	else if(event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-showLog':
				this.controller.stageController.pushScene({name: 'ipkg-log', disableSceneScroller: true});
				break;
				
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
				
			default:
				// this shouldn't happen
				break;
		}
	}
};

/* 
 * this functions are called by the package model when doing stuff
 * anywhere the package model will be installing stuff these functions are needed
 */
PkgInstallAssistant.prototype.startAction = function()
{
	// this is the start of the stayawake class to keep it awake till we're done with it
	this.stayAwake.start();
	
	// set this to stop back gesture
	this.active = true;
	
	// to update the spinner
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	
	// and to hide the data while we do the action
	this.controller.get('formContainer').style.display = "none";
	
	// and make sure the scene scroller is at the top
	this.controller.sceneScroller.mojo.scrollTo(0, 0);
};
PkgInstallAssistant.prototype.displayAction = function(msg)
{
	this.controller.get('spinnerStatus').innerHTML = msg;
};
PkgInstallAssistant.prototype.endAction = function()
{
	// we're done loading so let the device sleep if it needs to
	this.stayAwake.end();
	
	// let garbage collection of the service call happen
	this.packageModel = false;

	// allow back gesture again
	this.active = false;
	
	// end action action is to stop the spinner
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	
	// stop button spinner xD
	this.installButtonElement.mojo.deactivate();
	
	// show the data
	this.controller.get('formContainer').style.display = 'inline';
};
PkgInstallAssistant.prototype.simpleMessage = function(message)
{
	this.controller.showAlertDialog(
	{
	    title:				$L('Package'),
		allowHTMLMessage:	true,
	    message:			removeAuth(message),
	    choices:			[{label:$L('Ok'), value:''}],
		onChoose:			function(value){}
    });
};
PkgInstallAssistant.prototype.actionMessage = function(message, choices, actions)
{
	this.controller.showAlertDialog(
	{
	    title:				$L('Package'),
		allowHTMLMessage:	true,
		preventCancel:		true,
	    message:			removeAuth(message),
	    choices:			choices,
	    onChoose:			actions
    });
};
/* end functions called by the package model */

PkgInstallAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening(this.backElement,  Mojo.Event.tap, this.backTapHandler);
};

// Local Variables:
// tab-width: 4
// End:


