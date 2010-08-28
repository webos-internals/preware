/*
 * filePicker
 */

fileHandler.serviceIdentifier = 'palm://com.palm.applicationManager';

function fileHandler(params)
{
	this.mime =				params.mime;

	this.extensionMap =		false;
	this.resourceHandlers =	false;
	
	this.log =				true;
	
	this.listMimeHandlers();
}

fileHandler.prototype.doIt = function()
{
	if (!this.isActive()) this.makeActive();
}

fileHandler.prototype.isActive = function()
{
	if (this.resourceHandlers) 
	{
		if (this.resourceHandlers.activeHandler.appId == Mojo.Controller.appInfo.id) return true;
	}
	return false;
}

fileHandler.prototype.makeActive = function()
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
			var request = new Mojo.Service.Request(fileHandler.serviceIdentifier,
			{
				method: 'swapResourceHandler',
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
fileHandler.prototype.swapResourceResponse = function(payload)
{
	alert('=================');
	for (var p in payload) alert(p+': '+payload[p]);
	if (payload.returnValue)
	{
	}
}

fileHandler.prototype.listExtMap = function()
{
	var request = new Mojo.Service.Request(fileHandler.serviceIdentifier,
	{
		method: 'listExtensionMap',
		onSuccess: this.listExtMapResponse.bind(this),
		onFailure: this.listExtMapResponse.bind(this)
	});
	return request;
}
fileHandler.prototype.listExtMapResponse = function(payload)
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

fileHandler.prototype.listMimeHandlers = function()
{
	var request = new Mojo.Service.Request(fileHandler.serviceIdentifier,
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
fileHandler.prototype.listMimeHandlersResponse = function(payload)
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

