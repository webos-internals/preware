IPKGService.identifier = 'palm://org.webosinternals.ipkgservice';

function IPKGService() {

}

IPKGService.launch = function(callback) {
	// problem is, this doesn't work without com.palm.blarg
	
	var request = new Mojo.Service.Request('palm://com.palm.vm', {
		method:      'launch',
		parameters:	{
			serviceName: "org.webosinternals.ipkgservice",
			className: "org.webosinternals.ipkgservice.IPKGService"
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}

IPKGService.update = function(callback) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'update',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}

IPKGService.list_categories = function(callback) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'list_categories',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}

IPKGService.list = function(callback) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'list',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}

IPKGService.list_installed = function(callback) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'list_installed',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}

IPKGService.list_upgrades = function(callback) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'list_upgrades',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}

IPKGService.rescan = function(callback) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'rescan',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}

IPKGService.info = function(callback, pkg) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'info',
		parameters: {"package":pkg},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}

IPKGService.install = function(callback, pkg, title) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'install',
		parameters: {"package":pkg, "title":title, "subscribe":true},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}

IPKGService.remove = function(callback, pkg, title) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'remove',
		parameters: {"package":pkg, "title":title, "subscribe":true},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}