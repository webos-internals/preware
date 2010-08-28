/*
 * filePicker
 */

resourceHandler.serviceIdentifier = 'palm://com.palm.applicationManager';

function resourceHandler(params)
{
	this.extension =		params.extension;
	this.mime =				params.mime;
	this.dialogMessage =	params.dialogMessage;

	this.extensionMap =		false;
	this.resourceHandlers =	false;
	
	this.log =				false;
	
	if (prefs.get().resourceHandlerCheck)
	{
		this.listMimeHandlers();
	}
}

resourceHandler.prototype.doIt = function(assistant)
{
	if (!this.isActive())
	{
		assistant.controller.showDialog(
		{
			template: 'resource-handler/dialog',
			assistant: new resourceHandlerDialog(assistant, this),
			preventCancel: true
		});
	}
}

resourceHandler.prototype.isActive = function()
{
	if (this.resourceHandlers) 
	{
		if (this.resourceHandlers.activeHandler.appId == Mojo.Controller.appInfo.id) return true;
	}
	return false;
}
resourceHandler.prototype.getActive = function()
{
	if (this.resourceHandlers) 
	{
		return this.resourceHandlers.activeHandler.appName;
	}
	return 'Unknown';
}
resourceHandler.prototype.makeActive = function()
{
	var index = -1;
	if (this.resourceHandlers)
	{
		if (this.resourceHandlers.alternates.length > 0)
		{
			for (var a = 0; a < this.resourceHandlers.alternates.length; a++)
			{
				if (this.resourceHandlers.alternates[a].appId == Mojo.Controller.appInfo.id)
				{
					index = this.resourceHandlers.alternates[a].index;
				}
			}
		}
		if (index > -1)
		{
			var request = new Mojo.Service.Request(IPKGService.identifier,
			{
				method: 'swapResource',
				parameters:
				{
					mimeType: this.mime,
					index:	  index
				},
				onSuccess: this.swapResourceResponse.bind(this),
				onFailure: this.swapResourceResponse.bind(this)
			});
			return request;
		}
	}
}
resourceHandler.prototype.swapResourceResponse = function(payload)
{
	alert('=================');
	for (var p in payload) alert(p+': '+payload[p]);
	
	if (payload.returnValue)
	{
		this.listMimeHandlers();
	}
}

resourceHandler.prototype.listExtMap = function()
{
	this.extensionMap = false;
	var request = new Mojo.Service.Request(resourceHandler.serviceIdentifier,
	{
		method: 'listExtensionMap',
		onSuccess: this.listExtMapResponse.bind(this),
		onFailure: this.listExtMapResponse.bind(this)
	});
	return request;
}
resourceHandler.prototype.listExtMapResponse = function(payload)
{
	if (payload.returnValue)
	{
		this.extensionMap = payload.extensionMap;
		if (this.log)
		{
			alert('=================');
			payload.extensionMap.each(function(m)
			{
				for (var x in m) alert(x+': '+m[x]);
			}.bind(this));
		}
	}
}

resourceHandler.prototype.listMimeHandlers = function()
{
	this.resourceHandlers = false;
	var request = new Mojo.Service.Request(resourceHandler.serviceIdentifier,
	{
		method: 'listAllHandlersForMime',
		parameters:
		{
			mime: this.mime
		},
		onSuccess: this.listMimeHandlersResponse.bind(this),
		onFailure: this.listMimeHandlersResponse.bind(this)
	});
	return request;
}
resourceHandler.prototype.listMimeHandlersResponse = function(payload)
{
	if (payload.returnValue)
	{
		this.resourceHandlers = payload.resourceHandlers;
		if (this.log)
		{
			alert('=================');
			alert('active ---');
			for (var c in payload.resourceHandlers.activeHandler) alert(c+': '+payload.resourceHandlers.activeHandler[c]);
			alert('alternates: '+payload.resourceHandlers.alternates.length+' ---');
			payload.resourceHandlers.alternates.each(function(l)
			{
				for (var c in l) alert(c+': '+l[c]);
			}.bind(this));
		}
	}
}



function resourceHandlerDialog(sceneAssistant, resourceHandler)
{
	this.sceneAssistant =	sceneAssistant;
	this.resourceHandler =	resourceHandler;
}
resourceHandlerDialog.prototype.setup = function(widget)
{
	this.widget = widget;
	
	this.dialogTitle =		this.sceneAssistant.controller.get('dialogTitle');
	this.dialogMessage =	this.sceneAssistant.controller.get('dialogMessage');
	this.yesButton =		this.sceneAssistant.controller.get('yesButton');
	this.noButton =			this.sceneAssistant.controller.get('noButton');
	this.alwaysCheck =		this.sceneAssistant.controller.get('always-perform-check');
	
	this.dialogTitle.innerHTML =	$L('FileType Association');
	this.dialogMessage.innerHTML =	$L(this.resourceHandler.dialogMessage).interpolate({active: this.resourceHandler.getActive()});
	this.alwaysCheck.innerHTML = 	$L('Always perform check');
	
	this.yesTapped =	this.yes.bindAsEventListener(this);
	this.noTapped =		this.no.bindAsEventListener(this);
	
	this.sceneAssistant.controller.setupWidget
	(
		'yesButton',
		{},
		{
			buttonLabel: $L('Yes'),
			buttonClass: 'affirmative'
		}
	);
	this.sceneAssistant.controller.setupWidget
	(
		'noButton',
		{},
		{
			buttonLabel: $L('No'),
			buttonClass: 'negative'
		}
	);
	
	this.sceneAssistant.controller.setupWidget
	(
		'performCheck',
		{
  			trueLabel:  $L("Yes"),
 			falseLabel: $L("No")
		},
		this.performCheckModel =
		{
			value: prefs.get().resourceHandlerCheck
		}
	);
	
	this.sceneAssistant.controller.listen(this.yesButton,	Mojo.Event.tap,	this.yesTapped);
	this.sceneAssistant.controller.listen(this.noButton,	Mojo.Event.tap,	this.noTapped);
}
resourceHandlerDialog.prototype.yes = function(event)
{
	event.stop();
	prefs.prefs.resourceHandlerCheck = this.performCheckModel.value;
	prefs.put(prefs.prefs);
	this.resourceHandler.makeActive();
	this.widget.mojo.close();
}
resourceHandlerDialog.prototype.no = function(event)
{
	event.stop();
	prefs.prefs.resourceHandlerCheck = this.performCheckModel.value;
	prefs.put(prefs.prefs);
	this.widget.mojo.close();
}
resourceHandlerDialog.prototype.cleanup = function(event)
{
	this.sceneAssistant.controller.stopListening(this.yesButton,	Mojo.Event.tap,	this.yesTapped);
	this.sceneAssistant.controller.stopListening(this.noButton,		Mojo.Event.tap,	this.noTapped);
}

