/*
 * resourceHandler
 */

resourceHandler.serviceIdentifier = 'palm://com.palm.applicationManager';

function resourceHandler(params)
{
	this.extension =		params.extension;
	this.mime =				params.mime;
	this.addMessage =		params.addMessage;
	this.activeMessage =	params.activeMessage;

	this.extensionMap =		false;
	this.resourceHandlers =	false;
	
	this.log =				false;
	
	if (prefs.get().resourceHandlerCheck)
	{
		this.listExtMap();
		this.listMimeHandlers();
	}
}

resourceHandler.prototype.doIt = function(assistant)
{
	if (!this.isAdded())
	{
		assistant.controller.showDialog(
		{
			template: 'resource-handler/dialog',
			assistant: new resourceHandlerDialog(assistant, this, 'add'),
			preventCancel: true
		});
	}
	else
	{
		if (!this.isActive())
		{
			assistant.controller.showDialog(
			{
				template: 'resource-handler/dialog',
				assistant: new resourceHandlerDialog(assistant, this, 'active'),
				preventCancel: true
			});
		}
	}
}

resourceHandler.prototype.isAdded = function()
{
	if (this.extensionMap) 
	{
		var foundExtension = false;
		for (var m = 0; m < this.extensionMap.length; m++)
		{
			for (var x in this.extensionMap[m])
			{
				if (x == this.extension && this.extensionMap[m][x] == this.mime)
				{
					foundExtension = true;
				}
			}
		}
		if (foundExtension)
		{
			if (this.isActive()) return true;
			if (this.resourceHandlers)
			{
				if (this.resourceHandlers.alternates)
				{
					if (this.resourceHandlers.alternates.length > 0)
					{
						for (var a = 0; a < this.resourceHandlers.alternates.length; a++)
						{
							if (this.resourceHandlers.alternates[a].appId == Mojo.Controller.appInfo.id)
							{
								return true;
							}
						}
					}
				}
			}
		}
	}
	return false;
}
resourceHandler.prototype.add = function(activate)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'addResource',
		parameters:
		{
			extension: this.extension,
			mimeType:  this.mime,
			appId:	   Mojo.Controller.appInfo.id
		},
		onSuccess: this.addResourceResponse.bindAsEventListener(this, activate),
		onFailure: this.addResourceResponse.bindAsEventListener(this, activate)
	});
	return request;
}
resourceHandler.prototype.addResourceResponse = function(payload, activate)
{
	//alert('=================');
	//alert('ACTIVATE?: '+activate);
	//for (var p in payload) alert(p+': '+payload[p]);
	
	if (payload.returnValue)
	{
		this.listExtMap();
		if (activate)
		{
			this.listMimeHandlers(this.addActivate.bind(this));
		}
		else
		{
			this.listMimeHandlers();
		}
	}
}
resourceHandler.prototype.addActivate = function()
{
	//alert('CHECKING ACTIVE');
	if (!this.isActive())
	{
		//alert('ACTIVATING!');
		this.makeActive();
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
	return $L('Unknown');
}
resourceHandler.prototype.makeActive = function()
{
	var index = -1;
	if (this.resourceHandlers)
	{
		if (this.resourceHandlers.alternates)
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
	//alert('=================');
	//for (var p in payload) alert(p+': '+payload[p]);
	
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

resourceHandler.prototype.listMimeHandlers = function(callback)
{
	this.resourceHandlers = false;
	var request = new Mojo.Service.Request(resourceHandler.serviceIdentifier,
	{
		method: 'listAllHandlersForMime',
		parameters:
		{
			mime: this.mime
		},
		onSuccess: this.listMimeHandlersResponse.bindAsEventListener(this, callback),
		onFailure: this.listMimeHandlersResponse.bindAsEventListener(this, callback)
	});
	return request;
}
resourceHandler.prototype.listMimeHandlersResponse = function(payload, callback)
{
	if (payload.returnValue)
	{
		this.resourceHandlers = payload.resourceHandlers;
		if (typeof callback == 'function') callback();
		if (this.log)
		{
			alert('=================');
			alert('active ---');
			for (var c in payload.resourceHandlers.activeHandler) alert(c+': '+payload.resourceHandlers.activeHandler[c]);
			if (payload.resourceHandlers.alternates)
			{
				alert('alternates: '+payload.resourceHandlers.alternates.length+' ---');
				payload.resourceHandlers.alternates.each(function(l)
				{
					for (var c in l) alert(c+': '+l[c]);
				}.bind(this));
			}
			else
			{
				alert('alternates: 0');
			}
		}
	}
}



function resourceHandlerDialog(sceneAssistant, resourceHandler, type)
{
	this.sceneAssistant =	sceneAssistant;
	this.resourceHandler =	resourceHandler;
	this.type =				type
}
resourceHandlerDialog.prototype.setup = function(widget)
{
	this.widget = widget;
	
	this.dialogTitle =		this.sceneAssistant.controller.get('dialogTitle');
	this.dialogMessage =	this.sceneAssistant.controller.get('dialogMessage');
	this.yesButton =		this.sceneAssistant.controller.get('yesButton');
	this.noButton =			this.sceneAssistant.controller.get('noButton');
	this.toggleMessage =	this.sceneAssistant.controller.get('toggleMessage');
	
	this.dialogTitle.innerHTML =	$L('FileType Association');
	if (this.type == 'add')
	{
		this.dialogMessage.innerHTML =	$L(this.resourceHandler.addMessage);
		this.toggleMessage.innerHTML = 	$L('Make active handler');
		var toggleValue = true;
	}
	else if (this.type == 'active')
	{
		this.dialogMessage.innerHTML =	$L(this.resourceHandler.activeMessage).interpolate({active: this.resourceHandler.getActive()});
		this.toggleMessage.innerHTML = 	$L('Always perform check');
		var toggleValue = prefs.get().resourceHandlerCheck;
	}
	
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
		'dialogToggle',
		{
  			trueLabel:  $L("Yes"),
 			falseLabel: $L("No")
		},
		this.dialogToggleModel =
		{
			value: toggleValue
		}
	);
	
	this.sceneAssistant.controller.listen(this.yesButton,	Mojo.Event.tap,	this.yesTapped);
	this.sceneAssistant.controller.listen(this.noButton,	Mojo.Event.tap,	this.noTapped);
}
resourceHandlerDialog.prototype.yes = function(event)
{
	event.stop();
	if (this.type == 'add')
	{
		this.resourceHandler.add(this.dialogToggleModel.value);
	}
	else if (this.type == 'active')
	{
		prefs.prefs.resourceHandlerCheck = this.dialogToggleModel.value;
		prefs.put(prefs.prefs);
		this.resourceHandler.makeActive();
	}
	this.widget.mojo.close();
}
resourceHandlerDialog.prototype.no = function(event)
{
	event.stop();
	if (this.type == 'add')
	{
		prefs.prefs.resourceHandlerCheck = false;
		prefs.put(prefs.prefs);
	}
	else if (this.type == 'active')
	{
		prefs.prefs.resourceHandlerCheck = this.dialogToggleModel.value;
		prefs.put(prefs.prefs);
	}
	this.widget.mojo.close();
}
resourceHandlerDialog.prototype.cleanup = function(event)
{
	this.sceneAssistant.controller.stopListening(this.yesButton,	Mojo.Event.tap,	this.yesTapped);
	this.sceneAssistant.controller.stopListening(this.noButton,		Mojo.Event.tap,	this.noTapped);
}

