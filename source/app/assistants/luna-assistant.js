function LunaAssistant() {
	// we'll need this for the subscription based services
	this.subscription = false;
};

LunaAssistant.prototype.setup = function()
{
		this.controller.get('title').innerHTML = $L("Luna Manager");	
		this.controller.get('rescan-text').innerHTML = $L("Due to a webOS bug, this will close and stop notifications from the phone, email and messaging applications when it rescans.");
		this.controller.get('restart-luna-text').innerHTML = $L("This will close all the applications you have open when it restarts.");
		this.controller.get('restart-java-text').innerHTML = $L("This will cause your device to lose network connections and be pretty slow until it's done restarting.");

		// setup back tap
		if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') == 0 ||
			Mojo.Environment.DeviceInfo.modelNameAscii == 'Emulator')
			this.backElement = this.controller.get('back');
		else
			this.backElement = this.controller.get('header');
		this.backTapHandler = this.backTap.bindAsEventListener(this);
		this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);

	try
	{
		this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, { visible: false });
		
		this.controller.setupWidget
		(
			'Rescan',
			this.attributes = 
			{
				type: Mojo.Widget.activityButton
			},
			this.model =
			{
				buttonLabel: $L("Rescan"),
				buttonClass: 'palm-button',
				disabled: false
			}
		);
		this.controller.setupWidget
		(
			'RestartLuna',
			this.attributes = 
			{
				type: Mojo.Widget.activityButton
			},
			this.model =
			{
				buttonLabel: $L("Restart Luna"),
				buttonClass: 'palm-button',
				disabled: false
			}
		);
		this.controller.setupWidget
		(
			'RestartJava',
			this.attributes = 
			{
				type: Mojo.Widget.activityButton
			},
			this.model =
			{
				buttonLabel: $L("Restart Java"),
				buttonClass: 'palm-button',
				disabled: false
			}
		);
		
		this.controller.listen('Rescan',		Mojo.Event.tap, this.doRescan.bindAsEventListener(this));
		this.controller.listen('RestartLuna',	Mojo.Event.tap, this.doRestartLuna.bindAsEventListener(this));
		this.controller.listen('RestartJava',	Mojo.Event.tap, this.doRestartJava.bindAsEventListener(this));
		
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'luna#setup');
		this.alertMessage('luna#setup Error', e);
	}
};

LunaAssistant.prototype.callbackFunction = function(payload, item)
{
	if (!payload) 
	{
		this.alertMessage('Luna Manager', $L("Cannot access the service. First try restarting Preware, or reboot your device and try again."));
	}
	else if (payload.errorCode == -1 && item != 'RestartJava') 
	{
		if (payload.errorText == "org.webosinternals.ipkgservice is not running.") 
		{
			this.alertMessage('Luna Manager', $L("The service is not running. First try restarting Preware, or reboot your device and try again."));
		}
		else 
		{
			this.alertMessage('Luna Manager', payload.errorText);
		}
	}
	else 
	{
		if (payload.apiVersion && payload.apiVersion < this.ipkgServiceVersion) 
		{
			this.alertMessage('Luna Manager', $L("The service version is too old. First try rebooting your device, or reinstall Preware and try again."));
		}
	}
	
	this.controller.get(item).mojo.deactivate();
};

LunaAssistant.prototype.doRescan = function()
{
	try
	{
		var callback = this.callbackFunction.bindAsEventListener(this, 'Rescan');
		this.subscription = IPKGService.rescan(callback);
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'luna#doRescan');
		this.alertMessage('luna#doRescan Error', e);
	}
};
LunaAssistant.prototype.doRestartLuna = function()
{
	try
	{
		var callback = this.callbackFunction.bindAsEventListener(this, 'RestartLuna');
		this.subscription = IPKGService.restartluna(callback);
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'luna#doRestartLuna');
		this.alertMessage('luna#doRestartLuna Error', e);
	}
};
LunaAssistant.prototype.doRestartJava = function()
{
	try
	{
		var callback = this.callbackFunction.bindAsEventListener(this, 'RestartJava');
		this.subscription = IPKGService.restartjava(callback);
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'luna#doRestartJava');
		this.alertMessage('luna#doRestartJava Error', e);
	}
};


LunaAssistant.prototype.alertMessage = function(title, message)
{
	this.controller.showAlertDialog(
	{
	    onChoose: function(value) {},
		allowHTMLMessage: true,
	    title: title,
	    message: removeAuth(message),
	    choices:[{label:$L("Ok"), value:""}]
    });
};

LunaAssistant.prototype.backTap = function(event)
{
	this.controller.stageController.popScene();
};

LunaAssistant.prototype.activate = function(event) {};
LunaAssistant.prototype.deactivate = function(event) {};

LunaAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening('Rescan',			Mojo.Event.tap, this.doRescan.bindAsEventListener(this));
	this.controller.stopListening('RestartLuna',	Mojo.Event.tap, this.doRestartLuna.bindAsEventListener(this));
	this.controller.stopListening('RestartJava',	Mojo.Event.tap, this.doRestartJava.bindAsEventListener(this));
	this.controller.stopListening(this.backElement, Mojo.Event.tap, this.backTapHandler);
};

// Local Variables:
// tab-width: 4
// End:
