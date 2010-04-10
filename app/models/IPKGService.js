IPKGService.identifier = 'palm://org.webosinternals.ipkgservice';

function IPKGService()
{
	this.log = '';
	this.logNum = 1;
};

IPKGService.version = function(callback)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'version',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};

IPKGService.list_configs = function(callback)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'getConfigs',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
IPKGService.setConfigState = function(callback, config, enabled)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'setConfigState',
		parameters: {
			"config":config,
			"enabled":enabled
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};

IPKGService.update = function(callback)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'update',
		parameters: {
			"subscribe":true
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};

IPKGService.rawlist = function(callback, feed)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'getListFile',
		parameters: {
			"subscribe":true,
			"feed":feed
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
IPKGService.rawstatus = function(callback)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'getStatusFile',
		parameters: {
			"subscribe":true,
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};

IPKGService.install = function(callback, pkg, title, filename, url)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'install',
		parameters: {"package":pkg, "title":title, "filename":filename, "url":url, "subscribe":true},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
IPKGService.replace = function(callback, pkg, title, filename, url)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'replace',
		parameters: {"package":pkg, "title":title, "filename":filename, "url":url, "subscribe":true},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
IPKGService.remove = function(callback, pkg, title)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'remove',
		parameters: {"package":pkg, "title":title, "subscribe":true},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};

IPKGService.rescan = function(callback)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'rescan',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
IPKGService.restartluna = function(callback)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'restartLuna',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
IPKGService.restartjava = function(callback)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'restartJava',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
IPKGService.restartdevice = function(callback)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'restartDevice',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};

IPKGService.getAppinfoFile = function(callback, pkg)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'getAppinfoFile',
		parameters: {"package":pkg},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
IPKGService.getControlFile = function(callback, pkg)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'getControlFile',
		parameters: {"package":pkg},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};

IPKGService.addConfig = function(callback, config, name, url, gzip)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'addConfig',
		parameters:
		{
			'subscribe': true,
			'config': config,
			'name': name,
			'url': url,
			'gzip': gzip
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};
IPKGService.deleteConfig = function(callback, config, name)
{
	var request = new Mojo.Service.Request(IPKGService.identifier,
	{
		method: 'deleteConfig',
		parameters:
		{
			'subscribe': true,
			'config': config,
			'name': name
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
};

IPKGService.logClear = function()
{
	this.log = '';
	this.logNum = 1;
};
IPKGService.logPayload = function(payload, stage)
{
	if ((payload.stage && (payload.stage != "status")) || stage)
	{
		this.log += '<div class="container '+(this.logNum%2?'one':'two')+'">';
		
		if (payload.stage) this.log += '<div class="title">' + payload.stage + '</div>';
		else if (stage) this.log += '<div class="title">' + stage + '</div>';
		
		var stdPlus = false;
		
		if (payload.errorCode || payload.errorText)
		{
			stdPlus = true;
			this.log += '<div class="stdErr">';
			this.log += '<b>' + payload.errorCode + '</b>: '
			this.log += payload.errorText;
			this.log += '</div>';
		}
		
		if (payload.stdOut && payload.stdOut.length > 0)
		{
			stdPlus = true;
			this.log += '<div class="stdOut">';
			for (var s = 0; s < payload.stdOut.length; s++)
			{
				this.log += '<div>' + payload.stdOut[s] + '</div>';
			}
			this.log += '</div>';
		}
		
		if (payload.stdErr && payload.stdErr.length > 0)
		{
			stdPlus = true;
			this.log += '<div class="stdErr">';
			for (var s = 0; s < payload.stdErr.length; s++)
			{
				// These messages just confuse users
				if (!payload.stdErr[s].include($L("(offline root mode: not running ")))
				{      
					this.log += '<div>' + payload.stdErr[s] + '</div>';
				}
			}
			this.log += '</div>';
		}
		
		if (!stdPlus)
		{
			this.log += $L("<div class=\"msg\">Nothing Interesting.</div>");
		}
		
		this.log += '</div>';
		this.logNum++;
	}
	/*
	// debug display
	alert('--- IPKG Log ---');
	for (p in payload)
	{
		alert(p + ': ' + payload[p]);
	}
	*/
};

// Local Variables:
// tab-width: 4
// End:
