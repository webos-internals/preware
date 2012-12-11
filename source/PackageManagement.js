//this kind handles all talk to the C++ package service.

enyo.kind({
	name: "preware.PackageManagement",
  events: {
    onGotDeviceInfo: ""
  }
  cancelPendingDeviceInfoRequest: function () {
  
  },
  getDeviceInfo: function() {
    //TODO: do something smart..? :(
  }
});