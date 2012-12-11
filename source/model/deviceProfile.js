/*global enyo, IPKGService */

enyo.kind({
  name: "preware.DeviceProfile",
  deviceProfile: false,
  deviceId: false,
  requestDeviceProfile: false,
  requestDeviceId: false,
  events: {
    onDeviceProfileReady: "", //inEvent will have deviceProfile: obj, succes: boolean, message: string.
    onDeviceIdReady: "" //inEvent will have deviceId: obj, success: boolean, message: string
  },
  getDeviceProfile: function(reload) {
    if (this.deviceProfile && !reload) {
      this.doDeviceProfileReady({deviceProfile: this.deviceProfile, success: true, message: ""});
    } else {
      this.deviceProfile = false;
      this.deviceId = false;
      
      if (this.requestDeviceProfile) {
        this.requestDeviceProfile.cancel();
      }
      this.requestDeviceProfile = IPKGService.impersonate(this._gotDeviceProfile.bind(this),
							"com.palm.configurator",
							"com.palm.deviceprofile",
							"getDeviceProfile", {});
    }
  },
  _gotDeviceProfile: function(payload) {
    if (this.requestDeviceProfile) {
      this.requestDeviceProfile.cancel();
    }
    this.requestDeviceProfile = false;
    
    if (payload.returnValue === false) {
      this.doDeviceProfileReady({deviceProfile: false, success: false, message: payload.errorText});
    } else {
      this.deviceProfile = payload.deviceInfo;
      if (this.deviceProfile.deviceId === "") {
        this.deviceProfile.deviceId = this.deviceProfile.nduId;
      }
      this.doDeviceProfileReady({deviceProfile: this.deviceProfile, success: true, message: ""});
    }
  },
  getDeviceId: function(reload) {
    if (this.deviceId && !reload) {
      this.doDeviceIdRead({deviceId: this.deviceId, success: true, message: ""});
    } else {
      this.deviceId = false;
      if (this.requestDeviceId) {
        this.requestDeviceId.cancel();
      }
      this.requestDeviceId = IPKGService.impersonate(this._gotDeviceId.bind(this),
						   "com.palm.configurator",
						   "com.palm.deviceprofile",
						   "getDeviceId", {});
    }
  },
  _gotDeviceId: function(payload) {
    if (this.requestDeviceId) {
      this.requestDeviceId.cancel();
    }
    this.requestDeviceId = false;
    
    if (payload.returnValue === false) {
      this.doDeviceIdReady({deviceId: false, success: false, message: payload.errorText});
    } else {
      this.deviceId = payload.deviceId;
      this.doDeviceIdReady({deviceId: this.deviceId, success: true, message: ""});
    }
  }
});
