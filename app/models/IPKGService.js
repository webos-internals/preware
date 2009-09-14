IPKGService.identifier = 'palm://org.webosinternals.ipkgservice';

function IPKGService() {

}

IPKGService.version = function(callback) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'version',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}

IPKGService.list_configs = function(callback) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'list_configs',
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


IPKGService.rawlist = function(callback, feed) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'rawlist',
		parameters: {
			"subscribe":true, // new in apiVersion 4
			"feed":feed
		},
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}

IPKGService.rawstatus = function(callback) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'rawstatus',
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


IPKGService.rescan = function(callback) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'rescan',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}

IPKGService.restartluna = function(callback) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'restartluna',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}

IPKGService.restartjava = function(callback) {
	var request = new Mojo.Service.Request(IPKGService.identifier, {
		method: 'restartjava',
		onSuccess: callback,
		onFailure: callback
	});
	return request;
}
