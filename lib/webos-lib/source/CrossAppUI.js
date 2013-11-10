enyo.kind({
	name: "enyo.CrossAppUI",
	// TODO: Port enyo.Iframe class
	tag: "iframe",
	style: "border: 0;",
        published: {
                app: "", //* String. id of the app whose UI will be displayed.
                path: "", //* String. Relative path from the target app's main index file to the index file to be displayed.
                params: null //* Object, optional.  Window params for the target UI document.
        },
	events: {
		onResult: "" //* Sent when a result is received from the cross-app UI.
	},
	//* @protected
	create: function() {
		this.inherited(arguments);
		this.params = this.params || {};
		this.appPath = "";
		this.checkLoadBound = enyo.bind(this, "checkLoad");
		this.handleMessageBound = enyo.bind(this, "handleMessage");
		window.addEventListener('message', this.handleMessageBound);
	},
	destroy: function() {
		window.removeEventListener('message', this.handleMessageBound);
		this.inherited(arguments);
	},
	rendered: function() {
		this.inherited(arguments);
		if (this.app) {
			this.appChanged();
		} else if (this.path) {
			this.pathChanged();
		}
	},
	appChanged: function() {
		this.appPath = "";
		if (this.app) {
			var request = new enyo.ServiceRequest({
				service: "palm://com.palm.applicationManager",
				method: "getAppBasePath"
			});
			request.response(this, "gotAppInfo");
			request.go({appId: this.app});

		} else {
			this.pathChanged(); // rebuild whole path.
		}
	},
	gotAppInfo: function(inResponse) {
		if(!inResponse || !inResponse.returnValue) {
			console.error("Could not get app path: "+(inResponse && inResponse.errorText));
			return;
		}
		this.appPath = inResponse.basePath;
		this.appPath = this.appPath || "";
		if (this.appPath) {
			// Chop off app's index file.
			this.appPath = this.appPath.slice(0,this.appPath.lastIndexOf('/')+1);
			this.pathChanged();
		}
	},
	pathChanged: function() {
		var targetPath = "";
		// No path means empty URL.
		if (this.path) {
			if (this.appPath) {
				// If we've loaded an app path, use it.
				targetPath = this.appPath+this.path;
			} else if (!this.app) {
				// Blank app means path is absolute.
				targetPath = this.path;
			}
			// empty app-path but truthy app means we should do nothing.
			// If we have a target, send initial params in the URL, so they are immediately available.
			if (targetPath) {
				enyo.log("CrossAppUI: Loading cross-app UI at "+targetPath);
				targetPath = targetPath+"?enyoWindowParams="+encodeURIComponent(JSON.stringify(this.params));
				// Hack to watch the document load process, since sometimes the iframe fails to load.
				if (!this._checkLoadTimerId) {
					this._checkLoadTimerId = window.setTimeout(this.checkLoadBound, 1000);
				}
			}
		}
		this.setSrc(targetPath);
	},
	// FIXME: This hack should be removed once the real cause of DFISH-6462 is resolved.
	checkLoad: function() {
		var node = this.hasNode();
		var doc = node && node.contentDocument;
		this._checkLoadTimerId = undefined;
		if(doc && doc.readyState === "complete" && doc.location.href === "about:blank" && this.path) {
			console.log("CrossAppUI: checkLoad: Kicking iframe.");
			this.pathChanged();
		} else {
			console.log("CrossAppUI: checkLoad: things look okay.");
		}
	},
	paramsChanged: function() {
		// If we haven't been rendered yet, or are currently pointing somewhere useless, 
		// no need to send new params via message, they will go in the URL.
		if (this.path && this.hasNode() && this.hasNode().contentWindow) {
			this.hasNode().contentWindow.postMessage("enyoWindowParams="+enyo.json.stringify(this.params), "*");
		}
	},
	handleMessage: function(e) {
		enyo.log(JSON.stringify(e.data));
		var label = "enyoCrossAppResult=";
		// Only respond to cross-app result messages, and also verify that the message is from *our* iframe.
		if (e.source === (this.hasNode() && this.hasNode().contentWindow) && e.data.indexOf(label) === 0) {
			this.doResult(JSON.parse(e.data.slice(label.length)));
		}
	}
});
