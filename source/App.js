// Preware App kind and main window.
/*global enyo, onyx, preware */

enyo.kind({
	name: "preware.App",
  //fit: true,
  kind: enyo.Control,
  layoutKind: "FittableRowsLayout",
  classes: "onyx", 
	components:[
    //feeds model:
    { kind: "preware.FeedsModel", onLoadFeedsFinished: "loadFeedsFinished" },
    //initialize preware toolbare with preware in it and a search field + button.
     {kind: "onyx.MoreToolbar", components: [
       {content: "Preware" },
       {kind: "onyx.InputDecorator", style: "position:absolute; right:0px", components: [
         {kind: "onyx.Input", name: "searchTerm", placeholder: "Search packet", onkeydown: "searchOnEnter"},
         {kind: "Image", src: "assets/search-input-search.png", ontap: "search"}
       ]}
     ]},
    //want to have Panels that are "cards" on phones (<800px width) and sliding stuff otherwise.
    {kind: "Panels", draggable: true, wrap: false, 
          narrowFit: true, fit: true, 
          arrangerKind: "CollapsingArranger", 
          classes: "app-panels", 
         components: [
         { kind: enyo.FittableRows, components: [
          { kind: onyx.Button, content: "getVersion", ontap: "versionTap" },
          { kind: onyx.Button, content: "getMachineName", ontap: "machineName" },
          { kind: onyx.Button, content: "downloadWOCEFeed", ontap: "downloadFeed" },
          { kind: onyx.Button, content: "loadFeeds", ontap: "loadFeeds" },
          { kind: enyo.Scroller, components: [
            { name: "out", content: "press button...<br>", allowHtml: true}
          ]}
         ] }
    ]}
	],
  log: function(msg) {
    this.$.out.addContent(msg + "<br>");
  },
  versionTap: function(inSender, inEvent) {
    preware.IPKGService.version(this.gotVersion.bind(this));
    this.log("getting version");
  },
  gotVersion: function(version) {
    this.log("version: " + JSON.stringify(version) + "<br>");
  },
  machineName: function() {
    preware.IPKGService.getMachineName(this.gotMachineName.bind(this));
    this.log("getting machine name.");
  },
  gotMachineName: function(machineName) {
    this.log("Got machinename: " + machineName + " (" + JSON.stringify(machineName) + ")");
  },
  downloadFeed: function() {
    preware.IPKGService.downloadFeed(this.gotFeed.bind(this),true, "woce", "http://ipkg.preware.org/feeds/woce/");
    this.log("started feed dl.");
  },
  gotFeed: function(feed) {
    this.log("Got feed!");
    this.log(JSON.stringify(feed));
  },
  loadFeeds: function() {
    this.log("starting to load feeds.");
    preware.DeviceProfile.getDeviceProfile(this.gotDeviceProfile.bind(this), false);
    this.log("...");
  },
  gotDeviceProfile: function(inSender, inEvent) {
    this.log("got device profile: " + JSON.stringify(inEvent));
    if (!inEvent.success || !inEvent.deviceProfile) {
      this.log("failure...");
      this.subscription = preware.IPKGService.getMachineName(this.onDeviceType.bind(this));
      this.log("getting machine name.");
    } else {
      this.log("got deviceProfile: " + JSON.stringify(inEvent.deviceProfile));
      this.deviceProfile = inEvent.deviceProfile;
      preware.PalmProfile.getPalmProfile(this.gotPalmProfile.bind(this), false);
    }
  },
  gotPalmProfile: function(inSender, inEvent) {
    if (!inEvent.success || !inEvent.palmProfile) {
      this.log("failure...");
      this.subscription = preware.IPKGService.getMachineName(this.onDeviceType.bind(this));
      this.log("getting machine name.");
    } else {
      this.log("got palmProfile: " + JSON.stringify(inEvent.palmProfile));
      this.palmProfile = inEvent.palmProfile;
      this.subsciption = preware.IPKGService.setAuthParams(this.authParamsSet.bind(this),
                                        this.deviceProfile.deviceId,
                                        this.palmProfile.token);
    }
  },
  authParamsSet: function(inResponse) {
    this.log("got authParams: " + JSON.stringify(inResponse));
    this.subscription = preware.IPKGService.getMachineName(this.onDeviceType.bind(this));
    this.log("getting machine name.");
  },
  onDeviceType: function(inEvent) {
    /*if (inEvent && inEvent.returnValue === true) {
      if (inEvent.stdOut[0] == "roadrunner") {
        Mojo.Environment.DeviceInfo.modelNameAscii = "Pre2";
      }
    }*/ //hm.. all this calls feel a bit like wasted time, now. :(
	
    // start with checking the internet connection
    var request = new enyo.webOS.ServiceRequest({
                                service: 'palm://com.palm.connectionmanager',
                                method: 'getstatus'
    });
    request.response(this.onConnection.bind(this));
    request.error(this.generalFailure.bind(this));
    request.go({}); //parameters to the service go as parameters to the go method.
  },
  loadFeedsFinished: function(inSender, inEvent) {
    this.log("loadFeedsFinished event received.");
    this.log("result: " + JSON.stringify(inEvent));
  }
});
