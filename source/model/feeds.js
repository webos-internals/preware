/*jslint sloppy: true */
/*global enyo, preware, $L, console */

enyo.singleton({
	name: "preware.FeedsModel",
	feeds: [], // for storing all the feed information
	/*events: {
		onLoadFeedsFinished: "" //inEvent will have feeds with array of feeds, succes with true/false, message: string
	},*/
	doLoadFeedsFinished: function (data) {
		enyo.Signals.send("onLoadFeedsFinished", data);
	},
	loadFeeds: function () {
		try {
			// clear out our current data (incase this is a re-update)
			this.feeds = [];

			//console.error("calling list configs");
			// init feed loading
			preware.IPKGService.list_configs(this.onConfigs.bind(this));
		} catch (e) {
			console.error("feedsModel#loadFeeds: " + e);
		}
	},
	getFeedUrl: function (name) {
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
	
	onConfigs: function (payload) {
		var x, c, tmpSplit1, tmpSplit2, feedObj;
		console.error("configs returned: " + JSON.stringify(payload));
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
				this.feeds.sort(function (a, b) {
					if (a.name && b.name) {
						return ((a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0));
					}
					return -1;
				});
				
				//send out feeds as event.
				console.error("Loading finished, feeds: " + JSON.stringify(this.feeds));
				this.doLoadFeedsFinished({feeds: this.feeds, success: true});
			} //end of no error-case
		} catch (e) {
			console.error("feedsModel#onConfigs: " + e);
			this.doLoadFeedsFinished({success: false, message: e });
		}
	}
});

