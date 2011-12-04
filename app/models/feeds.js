function feedsModel()
{
	// for storing assistants when we get one for certain functions
	this.updateAssistant = false;
	
	// for storing all the feed information
	this.feeds = [];

	// we'll need these for the subscription based methods
	this.subscription = false;
	
};

feedsModel.prototype.loadFeeds = function(updateAssistant, callback)
{
	try {
		// clear out our current data (incase this is a re-update)
		this.feeds = [];
		
		this.updateAssistant = updateAssistant;

		// init feed loading
		this.subscription = IPKGService.list_configs(this.onConfigs.bindAsEventListener(this, callback));
	
	} 
	catch (e) {
		Mojo.Log.logException(e, 'feedsModel#loadFeeds');
	}
};

feedsModel.prototype.getFeedUrl = function(name)
{
	if (name && this.feeds.length > 0)
	{
		for (var f = 0; f <= this.feeds.length; f++)
		{
			if (this.feeds[f].name == name) return this.feeds[f].url;
		}
	}
	return false;
}

feedsModel.prototype.onConfigs = function(payload, callback)
{
	try {
		
		if (!payload) {
			// i dont know if this will ever happen, but hey, it might
			this.updateAssistant.errorMessage('Preware', $L("Cannot access the service. First try restarting Preware, or reboot your device and try again."), this.updateAssistant.doneUpdating);
		}
		else if (payload.errorCode != undefined) {
			// we probably dont need to check this stuff here,
			// it would have already been checked and errored out of this process
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.") {
				this.updateAssistant.errorMessage('Preware', $L("The service is not running. First try restarting Preware, or reboot your device and try again."), this.updateAssistant.doneUpdating);
			}
			else {
				this.updateAssistant.errorMessage('Preware', payload.errorText, this.updateAssistant.doneUpdating);
			}
		}
		else {
			// clear feeds array
			this.feeds = [];
			
			// load feeds
			for (var x = 0; x < payload.configs.length; x++) {
			    if (payload.configs[x].enabled && payload.configs[x].contents) {
					var tmpSplit1 = payload.configs[x].contents.split('<br>');
					for (var c = 0; c < tmpSplit1.length; c++) {
						if (tmpSplit1[c]) {
							var tmpSplit2 = tmpSplit1[c].split(' ');
							var feedObj = {};
							feedObj.gzipped = (tmpSplit2[0] == "src/gz" ? true : false);
							feedObj.name = tmpSplit2[1];
							feedObj.url = tmpSplit2[2];
							feedObj.list = feedObj.url+"/"+(feedObj.gzipped ? "Packages.gz" : "Packages");
							// alert("Adding feed '"+feedObj.name+"' at '"+feedObj.url+"'");
							this.feeds.push(feedObj);
						}
					}
				
			    }
			}
			
			// sort them
			this.feeds.sort(function(a, b) {
					if (a.name && b.name) {
						return ((a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0));
					}
					else {
						return -1;
					}
				});
			
			if (callback) {
				callback(this.feeds);
			}
		}
	}
	catch (e) {
		Mojo.Log.logException(e, 'feeds#onFeeds');
		this.updateAssistant.errorMessage('onFeeds Error', e, this.updateAssistant.doneUpdating);
	}
};
// Local Variables:
// tab-width: 4
// End:
