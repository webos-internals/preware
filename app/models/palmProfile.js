function palmProfile()
{
    this.palmProfile = false;
    this.callback = false;

    this.requestPalmService = false;
};

palmProfile.prototype.getPalmProfile = function(callback, reload)
{
    this.callback = callback;

    if (this.palmProfile && !reload) {
	if (this.callback !== false) {
	    this.callback(true, this.palmProfile, '');
	}
	return;
    }

    this.palmProfile = false;

    if (this.requestPalmService) this.requestPalmService.cancel();

    if (Mojo.Environment.DeviceInfo.platformVersionMajor == 1) {
	this.requestPalmService = IPKGService.impersonate(this._gotPalmProfile.bind(this),
							  "com.palm.configurator",
							  "com.palm.accountservices",
							  "getAccountToken", {});
    }
    else {
	this.requestPalmService = IPKGService.impersonate(this._gotPalmProfile.bind(this),
							  "com.palm.configurator",
							  "com.palm.db",
							  "get", {"ids":["com.palm.palmprofile.token"]});
    }
};

palmProfile.prototype._gotPalmProfile = function(payload)
{
    if (this.requestPalmService) this.requestPalmService.cancel();
    this.requestPalmService = false;

    if (Mojo.Environment.DeviceInfo.platformVersionMajor == 1) {
	if (payload.errorCode == "NO_TOKEN") {
	    this.palmProfile = false;
	}
	else {
	    this.palmProfile = payload;
	    this.palmProfile.alias = this.palmProfile.accountAlias;
	}
	if (this.callback !== false) {
	    this.callback(true, this.palmProfile, '');
	}
    }
    else {
	if (payload.returnValue === false) {
	    if (this.callback !== false) {
		this.callback(false, false, payload.errorText);
	    }
	}
	else {
	    this.palmProfile = payload.results[0];
	    if (this.callback !== false) {
		this.callback(true, this.palmProfile, '');
	    }
	}
    }
};


