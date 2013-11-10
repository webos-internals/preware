/*
	The code below was obtained from
	https://github.com/enyojs/enyo-1.0/blob/master/framework/source/palm/controls/WebView.js; and
	https://github.com/enyojs/enyo-1.0/blob/master/framework/source/palm/controls/BasicWebView.js
	
	
	and modified as can be seen below to function as an Enyo 2.0 component.
*/

//* @protected
// FIXME: experimental, NOT currently used
// in case we need to do weighted average 
// for gestures like enyo1 does
enyo.weightedAverage = {
	data: {},
	count: 4,
	weights: [1, 2, 4, 8],
	compute: function(inValue, inKind) {
		if (!this.data[inKind]) {
			this.data[inKind] = [];
		}
		var cache = this.data[inKind];
		cache.push(inValue);
		if (cache.length > this.count) {
			cache.shift();
		}
		for (var i=0, d=0, o=0, c, w; (c=cache[i]) && (w=this.weights[i]); i++) {
			o += c * w;
			d += w;
		}
		d = d || 1;
		o = o / d;
		return o;
	},
	clear: function(inKind) {
		this.data[inKind] = [];
	}
};

//* @protected
enyo.kind({
	name: "enyo.BasicWebView",
	kind: enyo.Control,
	tag: "object",
	//* @protected
	published: {
		identifier: "",
		url: "",
		minFontSize: 16,
		enableJavascript: true,
		blockPopups: true,
		acceptCookies: true,
		headerHeight: 0,
		redirects: [],
		systemRedirects: [],
		networkInterface: "",
		dnsServers: [],
		ignoreMetaTags: false,
		cacheAdapter: true
	},
	attributes: {
		"tabIndex": 0
	},
	handlers: {
		onblur: "blurHandler"
	},
	requiresDomMousedown: true,
	events: {
		onMousehold: "",
		onResized: "",
		onPageTitleChanged: "",
		onUrlRedirected: "",
		onSingleTap: "",
		onLoadStarted: "",
		onLoadProgress: "",
		onLoadStopped: "",
		onLoadComplete: "",
		onFileLoad: "",
		onAlertDialog: "",
		onConfirmDialog: "",
		onPromptDialog: "",
		onSSLConfirmDialog: "",
		onUserPasswordDialog: "",
		onOpenSelect: "",
		onNewPage: "",
		onPrint: "",
		onEditorFocusChanged: "",
		onScrolledTo: "",
		onConnected: "",
		onDisconnected: "",
		onError: ""
	},
	//* @protected
	lastUrl: "",
	domStyles: {
		display: "block",
		"-webkit-transform": "translate3d(0, 0, 0)"
	},
	//* @protected
	create: function() {
		this.inherited(arguments);
		this.history = [];
		this.callQueue = [];
		this.dispatcher = enyo.dispatcher;
		/*
		this.domAttributes.type = "application/x-palm-browser";
		this.domAttributes["x-palm-cache-plugin"] = this.cacheAdapter;
		*/
		this.setAttribute("type", "application/x-palm-browser");
		this.setAttribute("x-palm-cache-plugin", this.cacheAdapter);
		/*
		this._mouseInInteractive = false;
		this._mouseInFlash = false;
		*/
		this._flashGestureLock = false;
	},
	destroy: function() {
		this.callQueue = null;
		this.node.eventListener = null;
		this.inherited(arguments);
	},
	rendered: function() {
		this.inherited(arguments);
		if (this.hasNode()) {
			this.node.eventListener = this;
			// need to add event listeners for touch events for
			// webkit to send them to browser adapter
			this.node.addEventListener("touchstart", enyo.bind(this, "touchHandler"));
			this.node.addEventListener("touchmove", enyo.bind(this, "touchHandler"));
			this.node.addEventListener("touchend", enyo.bind(this, "touchHandler"));
			this.history = [];
			this.lastUrl = "";
			if (this.adapterReady()) {
				this.connect();
			}
		}
	},
	blurHandler: function() {
		if (window.PalmSystem) {
			window.PalmSystem.editorFocused(false, 0, 0);
		}
	},
	touchHandler: function() {
		// nop
	},
	// check to make sure the adapter is ready to receive commands. when
	// the node is hidden we cannot call adapter functions.
	adapterReady: function() {
		return this.hasNode() && this.node.openURL;
	},
	// (browser adapter callback) we only get this if the view is initially
	// hidden
	adapterInitialized: function() {
		this._serverConnected = false;
		this.connect();
	},
	// (browser adapter callback) called when the server is connected
	serverConnected: function() {
		this._serverConnected = true;
		this.initView();
		this.doConnected();
	},
	connect: function() {
		if (this.adapterReady() && !this._serverConnected) {
			this._connect();
			/*
			this._connectJob = enyo.job("browserserver-connect", enyo.bind(this, "connect"), 500);
		} else {
			this._connectJob = null;
			*/
		}
	},
	_connect: function() {
		try {
			this.node.setPageIdentifier(this.identifier || this.id);
			this.node.connectBrowserServer();
		} catch (e) {
			// eat the exception, this is expected while browserserver
			// is starting up
		}
	},
	initView: function() {
		if (this.adapterReady() && this._serverConnected) {
			this.cacheBoxSize();
			this.node.interrogateClicks(false);
			this.node.setShowClickedLink(true);
			this.node.pageFocused(true);
			this.blockPopupsChanged();
			this.acceptCookiesChanged();
			this.enableJavascriptChanged();
			this.systemRedirectsChanged();
			this.redirectsChanged();
			this.updateViewportSize();
			this.minFontSizeChanged();
			this.urlChanged();
			
		}
	},
	//* @public
	// NOTE: to be called manually when browser should be resized.
	resize: function() {
		var s = this.getBounds();//enyo.fetchControlSize(this);
		if (this._boxSize && (this._boxSize.width != s.width || this._boxSize.height != s.height)) {
			this.cacheBoxSize();
		}
		this.updateViewportSize();
	},
	getBounds: function() {
		// have to override because we have no bounds :(
		
		//
		// due to the fact that BasicWebView should only ever be owned by WebView
		// we'll make an (educated - but definitely not one you should make) assumption
		// that this.owner = WebView so we need to getBounds() from this.owner.owner
		// we should improve this somehow...
		//
		
		var bounds = this.owner.owner.getBounds(),
			ownerPaddingTop = 0,
			ownerPaddingLeft = 0,
			ownerPaddingRight = 0,
			ownerPaddingBottom = 0,
			ownerBorderWidth = 0;
		
		// if this.owner.owner.hasNode() then get paddings
		this.owner.owner.hasNode() &&
		  (ownerPaddingTop = enyo.dom.getComputedStyleValue(this.owner.owner.node, 'padding-top').replace('px', ''),
		  ownerPaddingLeft = enyo.dom.getComputedStyleValue(this.owner.owner.node, 'padding-left').replace('px', ''),
		  ownerPaddingRight = enyo.dom.getComputedStyleValue(this.owner.owner.node, 'padding-right').replace('px', ''),
		  ownerPaddingBottom = enyo.dom.getComputedStyleValue(this.owner.owner.node, 'padding-bottom').replace('px', ''),
		  ownerBorderWidth = enyo.dom.getComputedStyleValue(this.owner.owner.node, 'border-top-width').replace('px', ''));
		
		ownerBorderWidth = parseInt(ownerBorderWidth, 10);
		
		return {
			width: bounds.width - (parseInt(ownerPaddingLeft, 10) + parseInt(ownerPaddingRight, 10)) - (ownerBorderWidth * 2),
			height: bounds.height - (parseInt(ownerPaddingTop, 10) + parseInt(ownerPaddingBottom, 10)) - (ownerBorderWidth * 2)
		};
	},
	//* @protected
	// save our current containing box size;
	// we use this to determine if we need to resize
	cacheBoxSize: function() {
		this._boxSize = this.getBounds();//enyo.fetchControlSize(this);
		this.applyStyle("width", this._boxSize.width + "px");
		this.applyStyle("height", this._boxSize.height + "px");
	},
	//* @protected
	// this tells the adapter how big the plugin is.
	updateViewportSize: function() {
		var b = this.getBounds();//enyo.calcModalControlBounds(this);
		if (b.width && b.height) {
			this.callBrowserAdapter("setVisibleSize", [b.width, b.height]);
		}
	},
	urlChanged: function() {
		if (this.url) {
			this.callBrowserAdapter("openURL", [this.url]);
		}
	},
	minFontSizeChanged: function() {
		this.callBrowserAdapter("setMinFontSize", [Number(this.minFontSize)]);
	},
	dispatchDomEvent: function(inEvent) {
		var r = true;	
		var pass = (inEvent.type == "gesturechange" || inEvent.type == "gesturestart" || inEvent.type == "gestureend");
		var left = inEvent.centerX || inEvent.clientX || inEvent.pageX;
		var top = inEvent.centerY || inEvent.clientY || inEvent.pageY;
		if (inEvent.preventDefault && (left < 0 || top < 0)) {
			inEvent.preventDefault();
			return true;
		}
		//this.log('type: ' + inEvent.type + ' pass: ' + pass + ' flashGestureLock: ' + this._flashGestureLock + ' mouseInFlash: ' + this._mouseInFlash + ' mouseInInteractive: ' + this._mouseInInteractive);
		if (pass || (!this._flashGestureLock && !this._mouseInInteractive) || (this._flashGestureLock && !this._mouseInFlash)) {
			r = this.inherited(arguments);
		}
		return r;
	},
	dragstartHandler: function() {
		// prevent dragging event from bubbling when dragging in webview
		return true;
	},
	flickHandler: function(inSender, inEvent) {
		this.callBrowserAdapter("handleFlick", [inEvent.xVel, inEvent.yVel]);
		// prevent flick event from bubbling when flicking in webview
		return true;
	},
	enableJavascriptChanged: function() {
		this.callBrowserAdapter("setEnableJavaScript", [this.enableJavascript]);
	},
	blockPopupsChanged: function() {
		this.callBrowserAdapter("setBlockPopups", [this.blockPopups]);
	},
	acceptCookiesChanged: function() {
		this.callBrowserAdapter("setAcceptCookies", [this.acceptCookies]);
	},
	headerHeightChanged: function() {
		this.callBrowserAdapter("setHeaderHeight", [this.headerHeight]);
	},
	systemRedirectsChanged: function(inOldRedirects) {
		this._redirectsChanged(this.systemRedirects, inOldRedirects);
	},
	redirectsChanged: function(inOldRedirects) {
		this._redirectsChanged(this.redirects, inOldRedirects);
	},
	_redirectsChanged: function(inRedirects, inOldRedirects) {
		for (var i=0, r; r=inOldRedirects && inOldRedirects[i]; i++) {
			this.callBrowserAdapter("addUrlRedirect", [r.regex, false, r.cookie, r.type || 0]);
		}
		for (i=0, r; r=inRedirects[i]; i++) {
			this.callBrowserAdapter("addUrlRedirect", [r.regex, r.enable, r.cookie, r.type || 0]);
		}
	},
	networkInterfaceChanged: function() {
		if (this.networkInterface) {
			this.callBrowserAdapter("setNetworkInterface", [this.networkInterface]);
		}
	},
	dnsServersChanged: function() {
		if (this.networkInterface) {
			var serverList = this.dnsServers.join(",");
			this.callBrowserAdapter("setDNSServers", [serverList]);
		}
	},
	ignoreMetaTagsChanged: function() {
		this.callBrowserAdapter("ignoreMetaTags", [this.ignoreMetaTags]);
	},
	//* @public
	clearHistory: function() {
		this.callBrowserAdapter("clearHistory");
	},
	//* @protected
	cutHandler: function() {
		this.callBrowserAdapter("cut");
	},
	copyHandler: function() {
		this.callBrowserAdapter("copy");
	},
	pasteHandler: function() {
		this.callBrowserAdapter("paste");
	},
	selectAllHandler: function() {
		this.callBrowserAdapter("selectAll");
	},
	// attempt to call a method on the browser adapter; if the adapter is not
	// ready the call will be added to the call queue. The call queue is
	// flushed next time this api is called.
	//* @public
	callBrowserAdapter: function(inFuncName, inArgs) {
		if (this.adapterReady() && this._serverConnected) {
			// flush the call queue first
			for (var i=0,q; q=this.callQueue[i]; i++) {
				this._callBrowserAdapter(q.name, q.args);
			}
			this.callQueue = [];
			this._callBrowserAdapter(inFuncName, inArgs);
		} else if (inFuncName !== "disconnectBrowserServer") {
			this.callQueue.push({name: inFuncName, args: inArgs});
			if (this.adapterReady() && !this._serverConnected) {
				this.connect();
			}
		}
	},
	//* @protected
	_callBrowserAdapter: function(inFuncName, inArgs) {
		if (this.node[inFuncName]) {
			this.node[inFuncName].apply(this.node, inArgs);
		}
	},
	showFlashLockedMessage: function() {
		if (this.flashPopup == null) {
			// Note: the html break in the message is intentional
			// (requested by HI)
			this.flashPopup = this.createComponent({kind: "Popup", modal: true, style: "text-align:center", components: [{content: $L("Tap outside or pinch when finished")}]});
			this.flashPopup.render();
			if (this.flashPopup.hasNode()) {
				this.flashTransitionEndHandler = enyo.bind(this, "flashPopupTransitionEndHandler");
				this.flashPopup.node.addEventListener("webkitTransitionEnd", this.flashTransitionEndHandler, false);
			}
		}
		this.flashPopup.applyStyle("opacity", 1);
		this.flashPopup.openAtCenter();
		enyo.job(this.id + "-hideFlashPopup", enyo.bind(this, "hideFlashLockedMessage"), 2000);
	},
	hideFlashLockedMessage: function() {
		this.flashPopup.addClass("enyo-webview-flashpopup-animate");
		this.flashPopup.applyStyle("opacity", 0);
	},
	flashPopupTransitionEndHandler: function() {
		this.flashPopup.removeClass("enyo-webview-flashpopup-animate");
		this.flashPopup.close();
	},
	// (browser adapter callback) reports page url, title and if it's possible
	// to go back/forward
	urlTitleChanged: function(inUrl, inTitle, inCanGoBack, inCanGoForward) {
		this.lastUrl = this.url;
		this.url = inUrl;
		this.doPageTitleChanged({
			inTitle: inTitle,
			inUrl: inUrl,
			inCanGoBack: inCanGoBack,
			inCanGoForward: inCanGoForward
		});
	},
	// (browser adapter callback) used to store history and generate event
	loadStarted: function() {
		this.doLoadStarted();
	},
	// (browser adapter callback) generates event that can be used to show
	// load progress
	loadProgressChanged: function(inProgress) {
		this.doLoadProgress({
			inProgress: inProgress
		});
	},
	// (browser adapter callback) used to restore history and generate event
	loadStopped: function() {
		this.log();
		this.doLoadStopped();
	},
	// (browser adapter callback) generates event
	documentLoadFinished: function() {
		this.doLoadComplete();
	},
	// (browser adapter callback) generates event
	mainDocumentLoadFailed: function(domain, errorCode, failingURL, localizedMessage) {
		this.doError({
			errorCode: errorCode,
			message: localizedMessage + ": " + failingURL
		});
	},
	// (browser adapter callback) ?
	linkClicked : function(url) {
	},
	// (browser adapter callback) called when loading a URL that should
	// be redirected
	urlRedirected: function(inUrl, inCookie) {
		this.doUrlRedirected({
			inUrl: inUrl,
			inCookie: inCookie
		});
	},
	// working
	updateGlobalHistory: function(url, reload) {
	},
	// working
	firstPaintCompleted: function() {
	},
	// (browser adapter callback) used to show/hide virtual keyboard when
	// input field is focused
	editorFocused: function(inFocused, inFieldType, inFieldActions) {
		if (window.PalmSystem) {
			if (inFocused) {
				this.node.focus();
			}
			window.PalmSystem.editorFocused(inFocused, inFieldType, inFieldActions);
		}
		this.doEditorFocusChanged({
			inFocused: inFocused,
			inFieldType: inFieldType,
			inFieldActions: inFieldActions
		});
	},
	// (browser adapter callback) called when the webview scrolls.
	scrolledTo: function(inX, inY) {
		this.doScrolledTo({
			x: inX,
			y: inY
		});
	},
	// (browser adapter callback) called to close a list selector
	// gets called after we send a response, so no need to do anything
	// hideListSelector: function(inId) {
	// },
	// (browser adapter callback) called to open an alert dialog
	dialogAlert: function(inMsg) {
		this.doAlertDialog({
			message: inMsg
		});
	},
	// (browser adapter callback) called to open a confirm dialog
	dialogConfirm: function(inMsg) {
		this.doConfirmDialog({
			message: inMsg
		});
	},
	// (browser adapter callback) called to open a prompt dialog
	dialogPrompt: function(inMsg, inDefaultValue) {
		this.doPromptDialog({
			message: inMsg,
			defaultValue: inDefaultValue
		});
	},
	// (browser adapter callback) called to open a SSL confirm dialog
	dialogSSLConfirm: function(inHost, inCode, inCertFile) {
		this.doSSLConfirmDialog({
			host: inHost,
			code: inCode,
			certFile: inCertFile
		});
	},
	// (browser adapter callback) called to open a user/password dialog
	dialogUserPassword: function(inMsg) {
		this.doUserPasswordDialog({
			message: inMsg
		});
	},
	// (browser adapter callback) called when loading an unsupported MIME type
	mimeNotSupported: function(inMimeType, inUrl) {
		this.doFileLoad({
			mimeType: inMimeType,
			url: inUrl
		});
	},
	// (browser adapter callback) called when loading an unsupported MIME type
	mimeHandoffUrl: function(inMimeType, inUrl) {
		this.doFileLoad({
			mimeType: inMimeType,
			url: inUrl
		});
	},
	// (browser adapter callback) called when mouse moves in or out of a
	// non-flash interactive rect
	mouseInInteractiveChange: function(inInteractive) {
		this._mouseInInteractive = inInteractive;
	},
	// (browser adapter callback) called when mouse moves in or out of a
	// flash rect 
	mouseInFlashChange: function(inFlash) {
		//this.log(inFlash);
		this._mouseInFlash = inFlash;
	},
	// (browser adapter callback) called when flash "gesture lock" state
	// changes
	flashGestureLockChange: function(enabled) {
		this._flashGestureLock = enabled;
        	if (this._flashGestureLock) {
                    this.showFlashLockedMessage();
                }
	},
	/**
	(browser adapter callback) called when browser needs to create
	a new card. (e.g. links with target)
	**/
	createPage: function(inIdentifier) {
		this.doNewPage(inIdentifier);
	},
	/**
	(browser adapter callback) called when the browser needs to scroll
	the page. (e.g. named anchors)
	**/
	scrollTo: function(inLeft, inTop) {
		// nop
	},
	/**
	(browser adapter callback) called when found a meta viewport tag
	**/
	metaViewportSet: function(inInitialScale, inMinimumScale, inMaximumScale, inWidth, inHeight, inUserScalable) {
		// nop
	},
	/**
	(browser adapter callback) called when browser server disconnected
	**/
	browserServerDisconnected: function() {
		this._serverConnected = false;
		this.doDisconnected();
	},
	/**
	(browser adapter callback) called when web page  requests print
	**/
	showPrintDialog: function() {
		this.doPrint();
	},
	/**
	(browser adapter callback) called when text caret position is updated
	**/
	textCaretRectUpdate: function(inLeft, inTop, inRight, inBottom) {
		// nop
	},
	/**
	(browser adapter callback)
	**/
	eventFired: function(inEvent, inInfo) {
		var e = {type:inEvent.type, pageX:inEvent.pageX, pageY:inEvent.pageY};
		var h = {
			isNull: inInfo.isNull,
			isLink: inInfo.isLink,
			isImage: inInfo.isImage,
			x: inInfo.x,
			y: inInfo.y,
			bounds: {
				left: inInfo.bounds && inInfo.bounds.left || 0,
				top: inInfo.bounds && inInfo.bounds.top || 0,
				right: inInfo.bounds && inInfo.bounds.right || 0,
				bottom: inInfo.bounds && inInfo.bounds.bottom || 0
			},
			element: inInfo.element,
			title: inInfo.title,
			linkText: inInfo.linkText,
			linkUrl: inInfo.linkUrl,
			linkTitle: inInfo.linkTitle,
			altText: inInfo.altText,
			imageUrl: inInfo.imageUrl,
			editable: inInfo.editable,
			selected: inInfo.selected
		};
		var fn = "do" + inEvent.type.substr(0, 1).toUpperCase() + inEvent.type.substr(1);
		return this[fn] && this[fn].apply(this, {
			event: e,
			extra: h
		});
	},
	// renamed browser adapter callbacks:
	// (browser adapter callback) renamed to showListSelector
	showPopupMenu: function(inId, inItemsJson) {
		this.doOpenSelect({
			id: inId,
			items: inItemsJson
		});
	},
	// (browser adapter callback) renamed to documentLoadFinished
	didFinishDocumentLoad: function() {
		this.documentLoadFinished();
	},
	// (browser adapter callback) renamed to loadFailed
	failedLoad: function(domain, errorCode, failingURL, localizedMessage) {
	},
	// (browser adapter callback) renamed to mainDocumentLoadFailed
	setMainDocumentError: function(domain, errorCode, failingURL, localizedMessage) {
		this.mainDocumentLoadFailed(domain, errorCode, failingURL, localizedMessage);
	},
	// (browser adapter callback) renamed to firstPaintCompleted
	firstPaintComplete: function() {
		this.firstPaintCompleted();
	},
	// (browser adapter callback) renamed to loadProgressChanged
	loadProgress: function(inProgress) {
		this.loadProgressChanged(inProgress);
	},
	// (browser adapter callback) renamed to pageDimensionsChanged
	pageDimensions: function(width, height) {
		// nop
	},
	// (browser adapter callback) renamed to smartZoomAreaFound
	smartZoomCalculateResponseSimple: function(left, top, right, bottom, centerX, centerY, spotlightHandle) {
		// nop
	},
	// (browser adapter callback) renamed to urlTitleChanged
	titleURLChange: function(inTitle, inUrl, inCanGoBack, inCanGoForward) {
		this.urlTitleChanged(inUrl, inTitle, inCanGoBack, inCanGoForward);
	}
});
//* @public
/**
A control that shows web content with built-in scroller.

	{kind: "WebView"}

The URL to load can be specified when declaring the instance, or by calling setUrl.

	{kind: "WebView", url: "http://www.google.com"}

	goToUrl: function(inUrl) {
		this.$.webView.setUrl(inUrl);
	}
*/
enyo.kind({
	name: "enyo.WebView",
	kind: enyo.Control,
	//* @public
	published: {
		/** page identifier, used to open new webviews for new window requests */
		identifier: "",
		/** url for page, updated as user navigates, relative URLs not allowed */
		url: "",
		/** smallest font size shown on the page, used to stop text from becoming unreadable */
		minFontSize: 16,
		/** boolean, allow page to run javascript */
		enableJavascript: true,
		/** boolean, allow page to request new windows to be opened */
		blockPopups: true,
		/** boolean, allow webview to accept cookies from server */
		acceptCookies: true,
		/** the height of the header to scroll with the webview **/
		headerHeight: 0,
		/** array of URL redirections specified as {regex: string, cookie: string, enable: boolean}. */
		redirects: [],
		/** the network interface */
		networkInterface: "",
		/** array of DNS servers */
		dnsServers: [],
		/** boolean, if set, page ignores viewport-related meta tags */
		ignoreMetaTags: false,
		/** boolean, if set (default) webkit will cache the plugin when the node is hidden. if your app explicitly destroys the plugin outside the app lifecycle, you must set this to false */
		cacheAdapter: true
	},
	events: {
		onMousehold: "",
		onResized: "",
		onPageTitleChanged: "",
		onUrlRedirected: "",
		onSingleTap: "",
		onLoadStarted: "",
		onLoadProgress: "",
		onLoadStopped: "",
		onLoadComplete: "",
		onFileLoad: "",
		onAlertDialog: "",
		onConfirmDialog: "",
		onPromptDialog: "",
		onSSLConfirmDialog: "",
		onUserPasswordDialog: "",
		onNewPage: "",
		onPrint: "",
		onEditorFocusChanged: "",
		onScrolledTo: "",
		onError: "",
		onDisconnected: ""
	},
	components: [
		{name: "view", kind: enyo.BasicWebView,
			onclick: "webviewClick",
			onMousehold: "doMousehold",
			onResized: "doResized",
			onPageTitleChanged: "pageTitleChanged",
			onUrlRedirected: "doUrlRedirected",
			onSingleTap: "doSingleTap",
			onLoadStarted: "doLoadStarted",
			onLoadProgress: "doLoadProgress",
			onLoadStopped: "doLoadStopped",
			onLoadComplete: "doLoadComplete",
			onFileLoad: "doFileLoad",
			onAlertDialog: "alertDialog",
			onConfirmDialog: "confirmDialog",
			onPromptDialog: "promptDialog",
			onSSLConfirmDialog: "sslConfirmDialog",
			onUserPasswordDialog: "userPasswordDialog",
			onOpenSelect: "showSelect",
			onNewPage: "doNewPage",
			onPrint: "doPrint",
			onEditorFocusChanged: "doEditorFocusChanged",
			onScrolledTo: "doScrolledTo",
			onConnected: "connected",
			onDisconnected: "disconnected",
			onError: "doError",
			cacheAdapter: true
		}
	],
	_freeSelectPopups: [],
	_cachedSelectPopups: {},
	//* @protected
	create: function(inInfo) {
		// XXX hack to initialize the x-palm-cache-plugin property
		// before create, because this is the only time it is valid
		this.inherited(arguments);
		this.identifierChanged();
		this.minFontSizeChanged();
		this.enableJavascriptChanged();
		this.blockPopupsChanged();
		this.acceptCookiesChanged();
		this.headerHeightChanged();
		this.addSystemRedirects();
		this.redirectsChanged();
		this.networkInterfaceChanged();
		this.ignoreMetaTagsChanged();
		this.urlChanged();
	},
	identifierChanged: function() {
		this.$.view.setIdentifier(this.identifier);
	},
	urlChanged: function(inOldUrl) {
		this.$.view.setUrl(this.url);
	},
	minFontSizeChanged: function() {
		this.$.view.setMinFontSize(this.minFontSize);
	},
	enableJavascriptChanged: function() {
		this.$.view.setEnableJavascript(this.enableJavascript);
	},
	blockPopupsChanged: function() {
		this.$.view.setBlockPopups(this.blockPopups);
	},
	acceptCookiesChanged: function() {
		this.$.view.setAcceptCookies(this.acceptCookies);
	},
	headerHeightChanged: function() {
		this.$.view.setHeaderHeight(this.headerHeight);
	},
	redirectsChanged: function(inOldRedirects) {
		this.$.view.setRedirects(this.redirects);
	},
	networkInterfaceChanged: function() {
		this.$.view.setNetworkInterface(this.networkInterface);
	},
	dnsServersChanged: function() {
		this.$.view.setDnsServers(this.dnsServers);
	},
	ignoreMetaTagsChanged: function() {
		this.$.view.setIgnoreMetaTags(this.ignoreMetaTags);
	},
	showSelect: function(inSender, inId, inItemsJson) {
		if (this._cachedSelectPopups[inId]) {
			this._cachedSelectPopups[inId]._response = -1;
			this.openSelect(this._cachedSelectPopups[inId]);
		} else {
			//this.showSpinner();
			enyo.asyncMethod(this, "createSelectPopup", inId, inItemsJson);
		}
	},
	openSelect: function(inPopup) {
		var s = this._selectRect;
		if (s) {
			var p = inPopup.calcSize();
			var o = this.getOffset();
			var l = Math.max(0, s.right - (s.right - s.left)/2 - p.width/2);
			var t = Math.max(0, s.bottom - (s.bottom - s.top)/2 - p.height/2);
			inPopup.openAt({left: l + o.left, top: t + o.top});
		} else {
			inPopup.openAtCenter();
		}
	},
	createSelectPopup: function(inId, inItemsJson) {
		var p = this._freeSelectPopups.pop();
		if (!p) {
			p = this.createComponent({kind: "PopupList", name: "select-" + inId, _webviewId: inId, _response: -1, onSelect: "selectPopupSelect", onClose: "selectPopupClose"});
		} else {
			p._webviewId = inId;
			p._response = -1;
		}
		var listItems = [];
		var items = enyo.json.parse(inItemsJson);
		for (var i = 0, c; c = items.items[i]; i++) {
			listItems.push({caption: c.text, disabled: !c.isEnabled});
		}
		p.setItems(listItems);
		p.render();
		this._cachedSelectPopups[inId] = p;
		//this.hideSpinner();
		this.openSelect(p);
	},
	selectPopupSelect: function(inSender, inSelected, inOldItem) {
		inSender._response = inSelected;
	},
	selectPopupClose: function(inSender) {
		// MenuItem calls close then doSelect, so wait for the function
		// to finish before replying to get the correct value.
		enyo.asyncMethod(this, "selectPopupReply", inSender);
	},
	selectPopupReply: function(inSender) {
		this.callBrowserAdapter("selectPopupMenuItem", [inSender._webviewId, inSender._response]);
	},
	connected: function() {
		//this.hideSpinner();
	},
	disconnected: function() {
		var r = this._requestDisconnect;
		if (!this._requestDisconnect) {
			//this.showSpinner();
			setTimeout(enyo.bind(this, "reinitialize"), 5000);
		} else {
			this._requestDisconnect = false;
		}
		this.doDisconnected(r);
	},
	reinitialize: function() {
		this.$.view.connect();
	},
	showSpinner: function() {
		/*if (!this.$.spinnerPopup.isOpen) {
			this.$.spinnerPopup.validateComponents();
			this.$.spinner.show();
			this.$.spinnerPopup.openAtCenter();
		}*/
	},
	hideSpinner: function() {
		/*this.$.spinnerPopup.validateComponents();
		this.$.spinnerPopup.close();
		this.$.spinner.hide();*/
	},
	pageTitleChanged: function(inSender, inEvent) {
		for (var p in this._cachedSelectPopups) {
			this._freeSelectPopups.push(this._cachedSelectPopups[p]);
		}
		this._cachedSelectPopups = {};
		this.doPageTitleChanged(inEvent);
	},
	alertDialog: function() {
		this.handleDialog("AlertDialog", arguments);
	},
	confirmDialog: function() {
		this.handleDialog("ConfirmDialog", arguments);
	},
	promptDialog: function() {
		this.handleDialog("PromptDialog", arguments);
	},
	sslConfirmDialog: function() {
		this.handleDialog("SSLConfirmDialog", arguments);
	},
	userPasswordDialog: function() {
		this.handleDialog("UserPasswordDialog", arguments);
	},
	handleDialog: function(inEventType, inArgs) {
		var handler = this["on" + inEventType];
		if (this.owner && this.owner[handler]) {
			var args = Array.prototype.slice.call(inArgs, 1);
			this["do" + inEventType].apply(this, args);
		} else {
			this.cancelDialog();
		}
	},
	activate: function() {
		this.$.view.callBrowserAdapter("pageFocused", [true]);
	},
	deactivate: function() {
		this.$.view.callBrowserAdapter("pageFocused", [false]);
	},
	deferSetUrl: function(inUrl) {
		this.setUrl(inUrl);
	},
	resize: function() {
		// nop
	},
	resizeHandler: function() {
		this.$.view.resize();
	},
	//* @public
	/** disconnects this webview from the browser server */
	disconnect: function() {
		this.$.view.callBrowserAdapter("disconnectBrowserServer");
		this._requestDisconnect = true;
	},
	/** clears the browser cache */
	clearCache: function() {
		this.$.view.callBrowserAdapter("clearCache");
	},
	/** clears cookies */
	clearCookies: function() {
		this.$.view.callBrowserAdapter("clearCookies");
	},
	/** clears browser history */
	clearHistory: function() {
		this.$.view.clearHistory();
	},
	/** deletes an image from the filesystem */
	deleteImage: function(inPath) {
		this.$.view.callBrowserAdapter("deleteImage", [inPath]);
	},
	/** generates an icon from an image on the filesystem. only works with PNG files */
	generateIconFromFile: function(inPath, inIconPath, inLeft, inTop, inWidth, inHeight) {
		this.$.view.callBrowserAdapter("generateIconFromFile", [inPath, inIconPath, inLeft, inTop, inWidth, inHeight]);
	},
	/** go back one entry in history */
	goBack: function() {
		this.$.view.callBrowserAdapter("goBack");
	},
	/** go forward one entry in history */
	goForward: function() {
		this.$.view.callBrowserAdapter("goForward");
	},
	/** reloads the current page */
	reloadPage: function() {
		this.$.view.callBrowserAdapter("reloadPage");
	},
	/** resizes an image on the filesystem */
	resizeImage: function(inFromPath, inToPath, inWidth, inHeight) {
		this.$.view.callBrowserAdapter("resizeImage", [inFromPath, inToPath, inWidth, inHeight]);
	},
	//* @protected
	/** save a screenshot of the page to the filesystem */
	saveViewToFile: function(inPath, inLeft, inTop, inWidth, inHeight) {
		this.$.view.callBrowserAdapter("saveViewToFile", [inPath, inLeft, inTop, inWidth, inHeight]);
	},
	//* @public
	/** stop loading the current page */
	stopLoad: function() {
		this.$.view.callBrowserAdapter("stopLoad");
	},
	/** accepts the current dialog. */
	acceptDialog: function() {
		var args = [].slice.call(arguments);
		args.unshift("1");
		this.$.view.callBrowserAdapter("sendDialogResponse", args);
	},
	/** cancels the current dialog */
	cancelDialog: function() {
		this.$.view.callBrowserAdapter("sendDialogResponse", ["0"]);
	},
	/** responds to the current dialog */
	sendDialogResponse: function(inResponse) {
		this.$.view.callBrowserAdapter("sendDialogResponse", [inResponse]);
	},
	//* @protected
	inspectUrlAtPoint: function(inX, inY, inCallback) {
		this.$.view.callBrowserAdapter("inspectUrlAtPoint", [inX, inY, inCallback]);
	},
	//* @public
	/** if in an editable field, inserts a string at the current cursor position */
	insertStringAtCursor: function(inString) {
		this.$.view.callBrowserAdapter("insertStringAtCursor", [inString]);
	},
	/** saves the image at the specified position to the filesystem */
	saveImageAtPoint: function(inLeft, inTop, inDirectory, inCallback) {
		this.$.view.callBrowserAdapter("saveImageAtPoint", [inLeft, inTop, inDirectory, inCallback]);
	},
	//* @protected
	getImageInfoAtPoint: function(inX, inY, inCallback) {
		this.$.view.callBrowserAdapter("getImageInfoAtPoint", [inX, inY, inCallback]);
	},
	setHTML: function(inUrl, inBody) {
		this.$.view.callBrowserAdapter("setHTML", [inUrl, inBody]);
	},
	//* @public
	/** shows the print dialog to print the current page */
	printFrame: function(inName, inJobId, inWidth, inHeight, inDpi, inLandscape, inReverseOrder) {
		this.$.view.callBrowserAdapter("printFrame", [inName, inJobId, inWidth, inHeight, inDpi, inLandscape, inReverseOrder]);
	},
	//* @protected
	findInPage: function(inString) {
		// might not be working yet
		this.$.view.callBrowserAdapter("findInPage", [inString]);
	},
	getHistoryState: function(inCallback) {
		this.$.view.getHistoryState(inCallback);
	},
	//* XXX removeme
	redirectUrl: function(inRegex, inCookie, inEnable) {
		this.$.view.callBrowserAdapter("addUrlRedirect", [inRegex, inEnable, inCookie, 0]);
	},
	addSystemRedirects: function() {
		/*enyo.xhr.request({
			url: "/usr/palm/command-resource-handlers.json",
			method: "GET",
			callback: enyo.bind(this, "gotSystemRedirects")
		});*/
	},
	gotSystemRedirects: function(inText, inXhr) {
		var resp = inXhr && enyo.json.parse(inXhr.responseText);
		var redirects = [];
		for (var i=0,r;resp && resp.redirects && (r=resp.redirects[i]);i++) {
			if (r.appId != enyo.fetchAppId()) {
				redirects.push({regex: r.url, enable: true, cookie: r.appId, type: 0});
			}
		}
		for (i=0,r;resp && resp.commands && (r=resp.commands[i]);i++) {
			if (r.appId != enyo.fetchAppId() && r.appId != "com.palm.app.browser") {
				redirects.push({regex: r.url, enable: true, cookie: r.appId, type: 1});
			}
		}
		this.$.view.setSystemRedirects(redirects);
	},
	callBrowserAdapter: function(inFuncName, inArgs) {
		this.$.view.callBrowserAdapter(inFuncName, inArgs);
	},
	webviewClick: function(inSender, inEvent) {
		// now that this gets passes {event: Object, extra: Object}
		var inInfo = inEvent.extra;
		if (inInfo) {
			if (inInfo.element == "SELECT") {
				this._selectRect = inInfo.bounds;
			} else {
				this._selectRect = null;
			}
			this.doClick(inEvent.event);
		}
	}
});