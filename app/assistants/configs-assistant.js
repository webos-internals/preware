function ConfigsAssistant()
{
	this.feeds = [];
	
	// we'll need this for the subscription based services
	this.subscription = false;

	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: $L("Help"),
				command: 'do-help'
			}
		]
	}
}

ConfigsAssistant.prototype.setup = function()
{
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	// set this scene's default transition
	this.controller.setDefaultTransition(Mojo.Transition.zoomFade);
	
	// init feed loading
	this.subscription = IPKGService.list_configs(this.onFeeds.bindAsEventListener(this));
	
	// setup header button
	this.controller.listen('headerButton', Mojo.Event.tap, this.headerButton.bindAsEventListener(this));
	
	// setup new feed form
	this.controller.setupWidget
	(
		'newName',
		{
			autoFocus: false,
			focus: false,
			multiline: false,
			enterSubmits: false,
			charsAllow: this.validChars
		},
		{
			value: ''
		}
	);
	this.controller.setupWidget
	(
		'newUrl',
		{
			autoFocus: false,
			multiline: false,
			enterSubmits: false
		},
		{
			value: 'http://'
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
			value: true
		}
	);
	this.controller.setupWidget
	(
		'newButton',
		{
			type: Mojo.Widget.activityButton
		},
		{
			buttonLabel: 'Add Feed',
			buttonClass: 'palm-button'
		}
	);
	this.controller.listen('newButton', Mojo.Event.tap, this.newConfButton.bindAsEventListener(this));

	
	// setup list widget
	this.confModel = { items: [] };
	this.controller.setupWidget
	(
		'confList',
		{
			itemTemplate: "configs/rowTemplate",
			swipeToDelete: true,
			reorderable: false
		},
		this.confModel
	);
	this.controller.listen('confList', Mojo.Event.propertyChanged, this.confToggled.bindAsEventListener(this));
	this.controller.listen('confList', Mojo.Event.listDelete, this.confDeleted.bindAsEventListener(this));
	
}

ConfigsAssistant.prototype.onFeeds = function(payload)
{
	try 
	{
		if (!payload) 
		{
			// i dont know if this will ever happen, but hey, it might
			this.alertMessage('Preware', $L("Update Error. The service probably isn't running."));
			this.doneLoading();
		}
		else if (payload.errorCode != undefined) 
		{
			// we probably dont need to check this stuff here,
			// it would have already been checked and errored out of this process
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.alertMessage('Preware', $L("The Package Manager Service is not running. Did you remember to install it? If you did, first try restarting Preware, then try rebooting your phone and waiting longer before starting Preware."));
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
			    var feedObj = {
				config: payload.configs[x].config,
				name: payload.configs[x].config.replace(/.conf/, ''),
				urls: [],
				enabled: payload.configs[x].enabled
			    };
				
			    if (payload.configs[x].contents) {

				var tmpSplit1 = payload.configs[x].contents.split('<br>');
				for (var c = 0; c < tmpSplit1.length; c++)
				{
					if (tmpSplit1[c]) 
					{
						var tmpSplit2 = tmpSplit1[c].split(' ');
						feedObj.urls.push(tmpSplit2[2]);
					}
				}
				
			    }

			    this.feeds.push(feedObj);
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
					toggleName: f,
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

ConfigsAssistant.prototype.validChars = function(test)
{
	if (String.fromCharCode(test).match(/^[-a-zA-Z0-9]*$/))
	{
		return true;
	}
	else
	{
		return false;
	}
}

ConfigsAssistant.prototype.test = function(payload)
{
	for (var p in payload) alert(p + ': ' + payload[p]);
}

ConfigsAssistant.prototype.confToggled = function(event)
{
	// make sure this is a toggle button
	if (event.property == 'value' && event.target.id.include('_toggle')) 
	{
		//alert(event.target.id.replace(/_toggle/, '') + ' - ' + event.value);
		this.subscription = IPKGService.setConfigState(this.test.bindAsEventListener(this), this.feeds[event.target.id.replace(/_toggle/, '')].config, event.value);
	}
}
ConfigsAssistant.prototype.confDeleted = function(event)
{
	this.subscription = IPKGService.deleteConfig(this.test.bindAsEventListener(this),
		this.feeds[event.item.toggleName].config,
		this.feeds[event.item.toggleName].name);
}

ConfigsAssistant.prototype.newConfButton = function()
{
	this.controller.showAlertDialog(
	{
	    title:				$L('Custom Feed'),
		allowHTMLMessage:	true,
	    message:			'By adding a custom feed, you take full responsibility for any and all potential outcomes that may occur as a result of doing so, including (but not limited to): loss of warranty, loss of all data, loss of all privacy, security vulnerabilities and device damage.',
	    choices:			[{label:$L('Ok'), value:''}],
		onChoose:			this.newConfCall.bindAsEventListener(this)
    });
}
ConfigsAssistant.prototype.newConfCall = function(e)
{
	this.subscription = IPKGService.addConfig(this.newConfResponse.bindAsEventListener(this),
		this.controller.get('newName').mojo.getValue() + ".conf",
		this.controller.get('newName').mojo.getValue(),
		this.controller.get('newUrl').mojo.getValue(),
		true);
}
ConfigsAssistant.prototype.newConfResponse = function(payload)
{
	if (payload.stage == 'completed')
	{
		this.controller.get('newName').mojo.setValue('');
		this.controller.get('newUrl').mojo.setValue('http://');
		
		this.controller.get('newButton').mojo.deactivate();

		// init feed loading
		this.subscription = IPKGService.list_configs(this.onFeeds.bindAsEventListener(this));
	}
}

ConfigsAssistant.prototype.headerButton = function(event)
{
	this.controller.stageController.swapScene({name: 'preferences', transition: Mojo.Transition.crossFade});
}

ConfigsAssistant.prototype.alertMessage = function(title, message)
{
	this.controller.showAlertDialog({
	    onChoose: function(value) {},
		allowHTMLMessage: true,
	    title: title,
	    message: message,
	    choices:[{label:$L("Ok"), value:""}]
    });
}

ConfigsAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
		}
	}
}

ConfigsAssistant.prototype.activate = function(event) {}
ConfigsAssistant.prototype.deactivate = function(event) {}
ConfigsAssistant.prototype.cleanup = function(event) {
	// cancel the last subscription, this may not be needed
	if (this.subscription)
	{
		this.subscription.cancel();
	}
}

