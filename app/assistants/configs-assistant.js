function ConfigsAssistant()
{
	this.feeds = [];
}

ConfigsAssistant.prototype.setup = function()
{
	// init feed loading
	IPKGService.list_configs(this.onFeeds.bindAsEventListener(this));
	
	// setup menu that is no menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, { visible: false });
}

ConfigsAssistant.prototype.onFeeds = function(payload)
{
	try 
	{
		if (!payload) 
		{
			// i dont know if this will ever happen, but hey, it might
			this.alertMessage('Preware', 'Update Error. The service probably isn\'t running.');
			this.doneLoading();
		}
		else if (payload.errorCode == -1) 
		{
			// we probably dont need to check this stuff here,
			// it would have already been checked and errored out of this process
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.alertMessage('Preware', 'The Package Manager Service is not running. Did you remember to install it? If you did, perhaps you should try rebooting your phone.');
				this.doneLoading();
			}
			else
			{
				this.alertMessage('Preware', payload.errorText);
				this.doneLoading();
			}
		}
		else 
		{
			// clear feeds array
			this.feeds = [];
			
			// load feeds
			for (var x = 0; x < payload.configs.length; x++)
			{
				for (var p in payload.configs[x]) 
				{
					//alert(p + ': ' + payload.configs[x][p]);
					
					var tmpSplit1 = payload.configs[x][p].split('<br>');
					for (var c = 0; c < tmpSplit1.length; c++)
					{
						if (tmpSplit1[c]) 
						{
							var tmpSplit2 = tmpSplit1[c].split(' ');
							if (tmpSplit2[1]) 
							{
								this.feeds.push(tmpSplit2[1]);
								
								//alert(x + '-' + p + ': ' + tmpSplit2[1]);
							}
						}
					}
				}
			}
			
			// sort them (mostly so precentral is in the middle so it doesnt seem like it hangs at the end.)
			this.feeds.sort();
			
			this.doneLoading();
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'configs#onFeeds');
		this.alertMessage('onFeeds Error', e);
	}
}

ConfigsAssistant.prototype.doneLoading = function()
{
	try 
	{
		alert(this.feeds.length);
	
		if (this.feeds.length > 0) 
		{
			
			this.listModel = { items: [] };
			
			for (var f = 0; f < this.feeds.length; f++) 
			{
				alert(f + ': ' + this.feeds[f]);
				
				this.listModel.items.push(
				{
					name: this.feeds[f],
					url: this.feeds[f]
				});
			}
			
			this.controller.setupWidget
			(
				'theList', 
				{
					itemTemplate: "configs/rowTemplate",
					swipeToDelete: false,
					reorderable: false
				},
				this.listModel
			);
			//this.controller.listen(this.controller.get('theList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
			
			for (var f = 0; f < this.feeds.length; f++) 
			{
				/*
				this.controller.setupWidget
				(
					'listInstalled',
					{
			  			trueLabel:  'Yes',
			 			falseLabel: 'No',
			  			fieldName:  'listInstalled'
					},
					{
						value : this.prefs.listInstalled,
			 			disabled: false
					}
				);
				*/
				//this.controller.listen('listInstalled', Mojo.Event.propertyChange, this.toggleChangeHandler);
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'configs#doneLoading');
		this.alertMessage('doneLoading Error', e);
	}
}

ConfigsAssistant.prototype.alertMessage = function(title, message)
{
	this.controller.showAlertDialog({
	    onChoose: function(value) {},
		allowHTMLMessage: true,
	    title: title,
	    message: message,
	    choices:[{label:$L('Ok'), value:""}]
    });
}

ConfigsAssistant.prototype.activate = function(event) {}
ConfigsAssistant.prototype.deactivate = function(event) {}
ConfigsAssistant.prototype.cleanup = function(event) {}
