/**
	_enyo.PalmService_ is a component similar to <a href="#enyo.WebService">enyo.WebService</a>, but for 
	Palm service requests.
	
	Internally it generates new <a href="#enyo.ServiceRequest">enyo.ServiceRequest</a> for each `send()`
	call, keeping  track of each request made and sending out resulting events as they occur. This
	allows for multiple concurrent request calls to be sent without any potential overlap or gc issues.
*/

enyo.kind({
	name: "enyo.PalmService",
	kind: enyo.Component,
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
	events: {
		/**
			Fires when a response is received.

			_inEvent.request_ contains the associated <a href="#enyo.ServiceRequest">enyo.ServiceRequest</a>
			instance.

			_inEvent.data_ contains the response data.
		*/
		onResponse: "",
		/**
			Fires when an error is received.

			_inEvent.request_ contains the associated <a href="#enyo.ServiceRequest">enyo.ServiceRequest</a>

			_inEvent.data_ contains the error data.
		*/
		onError: "",
		/**
			Fires when a service request is complete (regardless of success or failure).

			_inEvent.request_ contains the associated <a href="#enyo.ServiceRequest">enyo.ServiceRequest</a>

			_inEvent.data_ contains the response data and/or error data.
		*/
		onComplete: ""
	},
	//* @protected
	create: function() {
		this.inherited(arguments);
		this.activeRequests = [];
		this.activeSubscriptionRequests = [];
	},	
	//* @public
	/**
		Sends a webOS service request with the passed-in parameters, returning the associated
		<a href="#enyo.ServiceRequest">enyo.ServiceRequest</a> instance.
	*/
	send: function(inParams) {
		var request = new enyo.ServiceRequest({
			service: this.service,
			method: this.method,
			subscribe: this.subscribe,
			resubscribe: this.resubscribe
		});
		request.originalCancel = request.cancel;
		request.cancel = enyo.bind(this, "cancel", request);
		request.response(this, "requestSuccess");
		request.error(this, "requestFailure");
		if(this.subscribe) {
			inParams.subscribe = this.subscribe;
			this.activeSubscriptionRequests.push(request);
		} else {
			this.activeRequests.push(request);
		}
		request.go(inParams);
		return request;
	},
	//* Cancels a given request.  The equivalent of `inRequest.cancel()`
	cancel: function(inRequest) {
		this.removeRequest(inRequest);
		inRequest.originalCancel();
	},
	//* @protected
	removeRequest: function(inRequest) {
		var i = -1;
		i = this.activeRequests.indexOf(inRequest);
		if (i !== -1) {
			this.activeRequests.splice(i, 1);
		} else {
			i = this.activeSubscriptionRequests.indexOf(inRequest);
			if (i !== -1) {
				this.activeSubscriptionRequests.splice(i, 1);
			}
		}
	},
	requestSuccess: function(inRequest, inResponse) {
		this.doResponse({request:inRequest, data:inData});
		this.requestComplete(inRequest, inResponse);
	},
	requestFailure: function(inRequest, inError) {
		this.doError({request:inRequest, data:inData});
		this.requestComplete(inRequest, inResponse);
	},
	requestComplete: function(inRequest, inData) {
		var i = -1;
		i = this.activeRequests.indexOf(inRequest);
		if (i !== -1) {
			this.activeRequests.splice(i, 1);
		}
		this.doComplete({request:inRequest, data:inData});
	},
	destroy: function() {
		var i;
		for(i=0; i<this.activeRequests.length; i++) {
			this.activeRequests[i].originalCancel();
		}
		delete this.activeRequests;
		
		for(i=0; i<this.activeSubscriptionRequests.length; i++) {
			this.activeSubscriptionRequests[i].originalCancel();
		}
		delete this.activeSubscriptionRequests;
		this.inherited(arguments);
	}
});
