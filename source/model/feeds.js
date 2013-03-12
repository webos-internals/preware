/*global enyo, preware, $L */

enyo.singleton({
	name: "preware.FeedsModel",
	feeds: [], // for storing all the feed information
	subscription: false, // we'll need these for the subscription based methods
	/*events: {
		onLoadFeedsFinished: "" //inEvent will have feeds with array of feeds, succes with true/false, message: string
	},*/
	log: function(msg) {
		enyo.error(msg);
		this.owner.log(msg);
	},
	doLoadFeedsFinished: function(data) {
		if (this.callback) {
			this.callback({}, data.feeds);
		}
	},
	loadFeeds: function(callback) {
		this.callback = callback;
		try {
			// clear out our current data (incase this is a re-update)
			this.feeds = [];

			this.log("calling list configs");
			// init feed loading
			this.subscription = preware.IPKGService.list_configs(this.onConfigs.bind(this));
		} catch (e) {
			enyo.error("feedsModel#loadFeeds", e);
		}
	},
	getFeedUrl: function(name) {
		var f;
		if (name && this.feeds.length > 0) {
			for (f = 0; f <= this.feeds.length; f += 1) {
				if (this.feeds[f].name === name) {
					return this.feeds[f].url;
				}
			}
		}
		return false;
	},
	onConfigs: function(payload) {
		var x, c, tmpSplit1, tmpSplit2, feedObj;
		this.log("configs returned: " + JSON.stringify(payload));
		try {
			if (!payload) {
				// i dont know if this will ever happen, but hey, it might
				this.doLoadFeedsFinished({success: false, message: $L("Cannot access the service. First try restarting Preware, or reboot your device and try again.")});
			} else if (payload.errorCode !== undefined) {
				// we probably don't need to check this stuff here,
				// it would have already been checked and errored out of this process
				if (payload.errorText === "org.webosinternals.ipkgservice is not running.") {
					this.doLoadFeedsFinished({success: false, message: $L("Cannot access the service. First try restarting Preware, or reboot your device and try again.")});
				} else {
					this.doLoadFeedsFinished({success: false, message: payload.errorText });
				}
			} else { //no error
				//clear feeds array
				this.feeds = [];
				
				//load feeds
				for (x = 0; x < payload.configs.length; x += 1) {
					if (payload.configs[x].enabled && payload.configs[x].contents) {
						tmpSplit1 = payload.configs[x].contents.split("<br>");
						for (c = 0; c < tmpSplit1.length; c += 1) {
							if (tmpSplit1[c]) {
								tmpSplit2 = tmpSplit1[c].split(' ');
								feedObj = {};
								feedObj.gzipped = (tmpSplit2[0] === "src/gz" ? true : false);
								feedObj.name = tmpSplit2[1];
								feedObj.url = tmpSplit2[2];
								// alert("Adding feed '"+feedObj.name+"' at '"+feedObj.url+"'");
								this.feeds.push(feedObj);
							}
						}
					}
				} //end of for
				
				// sort them
				this.feeds.sort(function(a, b) {
					if (a.name && b.name) {
						return ((a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0));
					}
					return -1;
				});
				
				//send out feeds as event.
				enyo.log("Loading finished, feeds: " + JSON.stringify(this.feeds));
				this.doLoadFeedsFinished({feeds: this.feeds, success: true});
			} //end of no error-case
		} catch (e) {
			enyo.error("feedsModel#onFeeds", e);
			this.doLoadFeedsFinished({success: false, message: e });
		}
	}
});

