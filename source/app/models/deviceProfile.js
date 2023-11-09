function deviceProfile()
{
    this.deviceProfile = false;
    this.deviceProfileCallback = false;
    this.requestDeviceProfile = false;

    this.deviceId = false;
    this.requestDeviceId = false;
    this.deviceIdCallback = false;
};

deviceProfile.prototype.getDeviceProfile = function(callback, reload)
{
    this.deviceProfileCallback = callback;

    if (this.deviceProfile && !reload) {
	if (this.deviceProfileCallback !== false) {
	    this.deviceProfileCallback(true, this.deviceProfile, '');
	}
	return;
    }

    this.deviceProfile = false;
    this.deviceId = false;

    if (this.requestDeviceProfile) this.requestDeviceProfile.cancel();
    this.requestDeviceProfile = IPKGService.impersonate(this._gotDeviceProfile.bind(this),
							"com.palm.configurator",
							"com.palm.deviceprofile",
							"getDeviceProfile", {});
};

deviceProfile.prototype._gotDeviceProfile = function(payload)
{
    if (this.requestDeviceProfile) this.requestDeviceProfile.cancel();
    this.requestDeviceProfile = false;

    if (payload.returnValue === false) {
	if (this.deviceProfileCallback !== false) {
	    this.deviceProfileCallback(false, false, payload.errorText);
	}
    }
    else {
	this.deviceProfile = payload.deviceInfo;
	if (this.deviceProfile.deviceId === "") {
	    this.deviceProfile.deviceId = this.deviceProfile.nduId;
	}
	if (this.deviceProfileCallback !== false) {
	    this.deviceProfileCallback(true, this.deviceProfile, '');
	}
    }
};

deviceProfile.prototype.getDeviceId = function(callback, reload)
{
    this.deviceIdCallback = callback;

    if (this.deviceId && !reload) {
	if (this.deviceIdCallback !== false) {
	    this.deviceIdCallback(true, this.deviceId, '');
	}
	return;
    }

    this.deviceId = false;

    if (this.requestDeviceId) this.requestDeviceId.cancel();
    this.requestDeviceId = IPKGService.impersonate(this._gotDeviceId.bind(this),
						   "com.palm.configurator",
						   "com.palm.deviceprofile",
						   "getDeviceId", {});
};

deviceProfile.prototype._gotDeviceId = function(payload)
{
    if (this.requestDeviceId) this.requestDeviceId.cancel();
    this.requestDeviceId = false;

    if (payload.returnValue === false) {
	if (this.deviceIdCallback !== false) {
	    this.deviceIdCallback(false, false, payload.errorText);
	}
    }
    else {
	this.deviceId = payload.deviceId;
	if (this.deviceIdCallback !== false) {
	    this.deviceIdCallback(true, this.deviceId, '');
	}
    }
};

