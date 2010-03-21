function LunaAssistant() {
	// we'll need this for the subscription based services
	this.subscription = false;
}

LunaAssistant.prototype.setup = function()
{
		this.controller.get('luna-title').innerHTML = $L('Luna Manager');	
		this.controller.get('restart-luna-text').innerHTML = $L('This will close all the applications you have open when it restarts.');
		this.controller.get('restart-java-text').innerHTML = $L('This will cause your phone to lose network connections and be pretty slow until it\'s done restarting.');
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
				buttonLabel: 'Rescan',
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
				buttonLabel: 'Restart Luna',
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
				buttonLabel: 'Restart Java',
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
}

LunaAssistant.prototype.callbackFunction = function(payload, item)
{
	if (!payload) 
	{
		this.alertMessage('Luna Manager', 'This Error shouldn\'t happen...');
	}
	else if (payload.errorCode == -1 && item != 'RestartJava') 
	{
		if (payload.errorText == "org.webosinternals.ipkgservice is not running.") 
		{
			this.alertMessage('Luna Manager', 'The Package Manager Service is not running. Did you remember to install it? If you did, perhaps you should try rebooting your phone.');
		}
		else 
		{
			this.alertMessage('Luna Manager', payload.errorText);
		}
	}
	else if (payload.errorCode == "ErrorGenericUnknownMethod") 
	{
		this.alertMessage('Luna Manager', 'The Package Manger Service you\'re running isn\'t compatible with this version of Preware. Please update it with WebOS Quick Install. [1]');
	}
	else 
	{
		if (payload.apiVersion && payload.apiVersion < this.ipkgServiceVersion) 
		{
			this.alertMessage('Luna Manager', 'The Package Manger Service you\'re running isn\'t compatible with this version of Preware. Please update it with WebOS Quick Install. [2]');
		}
	}
	
	this.controller.get(item).mojo.deactivate();
}

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
}
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
}
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
}


LunaAssistant.prototype.alertMessage = function(title, message)
{
	this.controller.showAlertDialog(
	{
	    onChoose: function(value) {},
		allowHTMLMessage: true,
	    title: title,
	    message: message,
	    choices:[{label:$L('Ok'), value:""}]
    });
}

LunaAssistant.prototype.activate = function(event) {}
LunaAssistant.prototype.deactivate = function(event) {}

LunaAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening('Rescan',			Mojo.Event.tap, this.doRescan.bindAsEventListener(this));
	this.controller.stopListening('RestartLuna',	Mojo.Event.tap, this.doRestartLuna.bindAsEventListener(this));
	this.controller.stopListening('RestartJava',	Mojo.Event.tap, this.doRestartJava.bindAsEventListener(this));
}
