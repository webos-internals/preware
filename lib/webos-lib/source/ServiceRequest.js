/**
	An extension of the <a href="#enyo.Async">enyo.Async</a> object designed for webOS service requests.
*/

enyo.kind({
	name: "enyo.ServiceRequest",
	kind: enyo.Async,
	//* @protected
	resubscribeDelay: 10000,
	//* @public
	published: {
		//* Palm service URI.  Starts with palm://
		service:"",
		//* Service method you want to call
		method:"",
		//* Whether or not the request to subscribe to the service
		subscribe: false,
		//* Whether or not the request should resubscribe when an error is returned
		resubscribe: false
	},
	/**
		Properties passed in the inParams object will be mixed into the object itself,
		so you can optionally set properties like _"service"_ and _"method"_ inline in the
		constructor rather than using the setters individually.
	*/
	constructor: function(inParams) {
		enyo.mixin(this, inParams);
		this.inherited(arguments);
		if(enyo._serviceCounter == undefined) {
			enyo._serviceCounter = 1;
		} else {
			enyo._serviceCounter++;
		}
		this.id = enyo._serviceCounter;
	},
	//* Execute the service request with an optional object for parameters to be sent.
	go: function(inParams) {
		if(!PalmServiceBridge) {
			this.fail({
				errorCode: -1,
				errorText: "Invalid device for Palm services. PalmServiceBridge not found."
			});
			return undefined;
		}
		this.params = inParams || {};
		this.bridge = new PalmServiceBridge();
		this.bridge.onservicecallback = this.clientCallback = enyo.bind(this, "serviceCallback");
		var fullUrl = this.service;
		if(this.method.length>0) {
			if(fullUrl.charAt(fullUrl.length-1) != "/") {
				fullUrl += "/";
			}
			fullUrl += this.method;
		}
		if(this.subscribe) {
			this.params.subscribe = this.subscribe;
		}
		this.bridge.call(fullUrl, enyo.json.stringify(this.params));
		return this;
	},
	//* Cancel the request/subscription.
	cancel: function() {
		this.cancelled = true;
		this.responders = [];
		this.errorHandlers = [];
		if(this.resubscribeJob) {
			enyo.job.stop(this.resubscribeJob);
		}
		if(this.bridge) {
			this.bridge.cancel();
			this.bridge = undefined;
		}
	},
	//* @protected
	serviceCallback: function(respMsg) {
		var parsedMsg, error;
		if(this.cancelled) {
			return;
		}
		try {
			parsedMsg = enyo.json.parse(respMsg);
		} catch(err) {
			var error = {
				errorCode: -1,
				errorText: respMsg
			};
			this.serviceFailure(error);
			return;
		}
		if (parsedMsg.errorCode || parsedMsg.returnValue === false) {
			this.serviceFailure(parsedMsg);
		} else {
			this.serviceSuccess(parsedMsg);
		}
	},
	serviceSuccess: function(inResponse) {
		var successCallback = undefined;
		if(this.responders.length>0) {
			successCallback = this.responders[0];
		}
		this.respond(inResponse);
		if(this.subscribe && successCallback) {
			this.response(successCallback);
		}
	},
	serviceFailure: function(inError) {
		var failureCallback = undefined;
		if(this.errorHandlers.length>0) {
			failureCallback = this.errorHandlers[0];
		}
		this.fail(inError);
		if(this.resubscribe && this.subscribe) {
			if(failureCallback) {
				this.error(failureCallback);
			}
			this.resubscribeJob = this.id + "resubscribe";
			enyo.job(this.resubscribeJob, enyo.bind(this, "goAgain"), this.resubscribeDelay);
		}
	},
	goAgain: function() {
		this.go(this.params);
		
	}
});