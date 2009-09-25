function ConfigsAssistant()
{
	this.feeds = [];
}

ConfigsAssistant.prototype.setup = function()
{
	// init feed loading
	IPKGService.list_configs(this.onFeeds.bindAsEventListener(this));
	
	// setup toggle handler
	this.toggleChangeHandler = this.toggleChanged.bindAsEventListener(this);
	
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
					var feedObj = 
					{
						name: p.replace(/.conf/, ''),
						urls: []
					};
										
					var tmpSplit1 = payload.configs[x][p].split('<br>');
					for (var c = 0; c < tmpSplit1.length; c++)
					{
						if (tmpSplit1[c]) 
						{
							var tmpSplit2 = tmpSplit1[c].split(' ');
							feedObj.urls.push(tmpSplit2[2]);
						}
					}
					
					this.feeds.push(feedObj);
				}
			}
			
			// sort them
			this.feeds.sort(function(a, b)
			{
				if (a.name && b.name)
				{
					return ((a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0));
				}
				else
				{
					return -1;
				}
			});
			
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
		if (this.feeds.length > 0) 
		{
			this.controller.get('confList').innerHTML = '';
			var rowTemplate = 'configs/rowTemplate';	
			var html = ''
			
			for (var f = 0; f < this.feeds.length; f++) 
			{
				
				var fancyName = this.feeds[f].name.substr(0, 1).toUpperCase() + this.feeds[f].name.substr(1);
				var urls = '';
				for (var u = 0; u < this.feeds[f].urls.length; u++)
				{
					//if (urls != '') urls += '<br />';
					urls += '<div class="truncating-text">' + this.feeds[f].urls[u].replace(/http:\/\//, '').replace(/www./, '') + '</div>';
				}
				
				html += Mojo.View.render
				(
					{
						object: 
						{
							rowStyle: ((f+1)==this.feeds.length?'last':''),
							toggleName: this.feeds[f].name,
							fancyName: fancyName,
							url: urls
						},
						template: rowTemplate
					}
				);
			}
			
			this.controller.get('confList').innerHTML = html;
			
			for (var f = 0; f < this.feeds.length; f++) 
			{
				
				this.controller.setupWidget
				(
					this.feeds[f].name + '_toggle',
					{
			  			trueLabel:  'On',
			 			falseLabel: 'Off'
					},
					{
						value: true,
			 			disabled: true
					}
				);
				this.controller.listen(this.feeds[f].name + '_toggle', Mojo.Event.propertyChange, this.toggleChangeHandler);
				this.controller.get(this.feeds[f].name + '_toggle').className = 'disabled';
				
			}
			
			// make it load all our widgets
			this.controller.instantiateChildWidgets(this.controller.get('confList'));
			
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'configs#doneLoading');
		this.alertMessage('doneLoading Error', e);
	}
}

ConfigsAssistant.prototype.toggleChanged = function(event)
{
	alert(event.target.id + ' - ' + event.value);
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
