function ConfigsAssistant()
{
	this.feeds = [];
}

ConfigsAssistant.prototype.setup = function()
{
	// init feed loading
	IPKGService.list_configs(this.onFeeds.bindAsEventListener(this));
	
	
	this.controller.setupWidget
	(
		'newName',
		{
			multiline: false,
			enterSubmits: false,
		},
		{
			value: '',
			disabled: true // comment this for go time
		}
	);
	this.controller.setupWidget
	(
		'newUrl',
		{
			multiline: false,
			enterSubmits: false,
		},
		{
			value: 'http://',
			disabled: true // comment this for go time
		}
	);
	this.controller.setupWidget
	(
		'newCompressed',
		{
  			trueLabel:  'Yes',
 			falseLabel: 'No',
  			fieldName:  'newCompressed'
		},
		{
			value: true,
			//disabled: true // comment this for go time
		}
	);
	this.controller.setupWidget
	(
		'newButton',
		this.attributes = 
		{
			type: Mojo.Widget.activityButton
		},
		this.model =
		{
			buttonLabel: 'Add Feed',
			buttonClass: 'palm-button',
			disabled: true // comment this for go time
		}
	);
	//this.controller.listen('allowServiceUpdates', Mojo.Event.propertyChange, this.toggleChangeHandler);
	//this.controller.listen('newButton', Mojo.Event.tap, this.transferBestsButton.bindAsEventListener(this));
	
	
	// setup list widget
	this.confModel = { items: [] };
	this.controller.setupWidget
	(
		'confList',
		{
			itemTemplate: "configs/rowTemplate",
			swipeToDelete: true, // uncomment this for go time
			reorderable: false
		},
		this.confModel
	);
	this.controller.listen('confList', Mojo.Event.propertyChanged, this.confToggled.bindAsEventListener(this));
	this.controller.listen('confList', Mojo.Event.listDelete, this.confDeleted.bindAsEventListener(this));
	
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
				//for (var p in payload.configs[x]) 
				//{
					var feedObj = 
					{
						//name: p.replace(/.conf/, ''),
						name: payload.configs[x].config.replace(/.conf/, ''),
						urls: [],
						enabled: payload.configs[x].enabled
					};
					
					//var tmpSplit1 = payload.configs[x][p].split('<br>');
					var tmpSplit1 = payload.configs[x].contents.split('<br>');
					for (var c = 0; c < tmpSplit1.length; c++)
					{
						if (tmpSplit1[c]) 
						{
							var tmpSplit2 = tmpSplit1[c].split(' ');
							feedObj.urls.push(tmpSplit2[2]);
						}
					}
					
					this.feeds.push(feedObj);
				//}
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
			this.confModel.items = [];
			
			for (var f = 0; f < this.feeds.length; f++) 
			{
				
				var fancyName = this.feeds[f].name.substr(0, 1).toUpperCase() + this.feeds[f].name.substr(1);
				var urls = '';
				for (var u = 0; u < this.feeds[f].urls.length; u++)
				{
					urls += '<div class="truncating-text">' + this.feeds[f].urls[u].replace(/http:\/\//, '').replace(/www./, '') + '</div>';
				}
				
				
				this.confModel.items.push(
				{
					toggleName: this.feeds[f].name,
					fancyName: fancyName,
					url: urls,
					
					// these are for the child toggle widget
					//disabled: true, // comment this for go time
					value: this.feeds[f].enabled
				});
			}
			
			this.controller.get('confList').mojo.noticeUpdatedItems(0, this.confModel.items);
		 	this.controller.get('confList').mojo.setLength(this.confModel.items.length);
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'configs#doneLoading');
		this.alertMessage('doneLoading Error', e);
	}
}

ConfigsAssistant.prototype.confToggled = function(event)
{
	// make sure this is a toggle button
	if (event.property == 'value' && event.target.id.include('_toggle')) 
	{
		alert(event.target.id.replace(/_toggle/, '') + ' - ' + event.value);
	}
}

ConfigsAssistant.prototype.confDeleted = function(event)
{
	alert ('Delete: ' + event.item.toggleName);
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

