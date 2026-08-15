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
	
	this.warningOkd = false;
};

ConfigsAssistant.prototype.setup = function()
{
	this.controller.get('headerButton').innerHTML = $L("Preferences");
	this.controller.get('headerTitle').innerHTML = $L("Feeds");		
	this.controller.get('installed-feeds-title').innerHTML = $L("Installed");	
	this.controller.get('new-feed-title').innerHTML = $L("New Feed");
	this.controller.get('new-feed-name').innerHTML = $L("Name");
	this.controller.get('new-feed-url').innerHTML = $L("URL");	
	this.controller.get('new-feed-is-compressed').innerHTML = $L("Is Compressed");	
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	// setup back tap
	this.backElement = this.controller.get('icon');
	this.backTapHandler = this.backTap.bindAsEventListener(this);
	this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);

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
			charsAllow: this.validChars,
			textCase: Mojo.Widget.steModeLowerCase
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
			focus: false,
			multiline: false,
			enterSubmits: false
		},
		{
			value: 'http://'
		}
	);
	this.newCompressed =
	{
		value: true
	}
	this.controller.setupWidget
	(
		'newCompressed',
		{
  			trueLabel:  $L("Yes"),
 			falseLabel: $L("No"),
  			fieldName:  'newCompressed'
		},
		this.newCompressed
	);
	this.controller.setupWidget
	(
		'newButton',
		{
			type: Mojo.Widget.activityButton
		},
		{
			buttonLabel: $L("Add Feed"),
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
	this.controller.listen('confList', Mojo.Event.listTap, this.confTapped.bindAsEventListener(this));
	
	
	// make it so nothing is selected by default
	this.controller.setInitialFocusedElement(null);
};

ConfigsAssistant.prototype.onFeeds = function(payload)
{
	try 
	{
		if (!payload) 
		{
			// i dont know if this will ever happen, but hey, it might
			this.alertMessage('Preware', $L("Cannot access the service. First try restarting Preware, or reboot your device and try again."));
			this.doneLoading();
		}
		else if (payload.errorCode != undefined) 
		{
			// we probably dont need to check this stuff here,
			// it would have already been checked and errored out of this process
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.alertMessage('Preware', $L("The service is not running. First try restarting Preware, or reboot your device and try again."));
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
					data: [],
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
						feedObj.data.push(tmpSplit2)
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
};
ConfigsAssistant.prototype.doneLoading = function()
{
	try 
	{
		if (this.feeds.length > 0) 
		{
			this.confModel.items = [];
			
			for (var f = 0; f < this.feeds.length; f++) 
			{
				var fancyName = this.feeds[f].name;
				var urls = '';
				for (var u = 0; u < this.feeds[f].urls.length; u++)
				{
					urls += '<div class="truncating-text">' + this.feeds[f].urls[u].replace(/http:\/\//, '').replace(/www./, '').replace(/.*@/, '').replace(/:.*\//, '/') + '</div>';
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
};

ConfigsAssistant.prototype.validChars = function(test)
{
	if (String.fromCharCode(test).match(/^[-a-z0-9]*$/))
	{
		return true;
	}
	else
	{
		return false;
	}
};

ConfigsAssistant.prototype.dirtyFeed = function(payload)
{
	//for (var p in payload) alert(p + ': ' + payload[p]);
	
	// tell packages the feeds are "dirty"
	packages.dirtyFeeds = true;
};

ConfigsAssistant.prototype.confTapped = function(event)
{
	alert('---');
	alert(event.item.toggleName);
	for (var f in this.feeds[event.item.toggleName]) alert(f+': '+this.feeds[event.item.toggleName][f]);
};
ConfigsAssistant.prototype.confToggled = function(event)
{
	// make sure this is a toggle button
	if (event.property == 'value' && event.target.id.include('_toggle')) 
	{
		//alert(event.target.id.replace(/_toggle/, '') + ' - ' + event.value);
		this.subscription = IPKGService.setConfigState(this.dirtyFeed.bindAsEventListener(this), this.feeds[event.target.id.replace(/_toggle/, '')].config, event.value);
	}
};
ConfigsAssistant.prototype.confDeleted = function(event)
{
	this.subscription = IPKGService.deleteConfig(this.dirtyFeed.bindAsEventListener(this),
		this.feeds[event.item.toggleName].config,
		this.feeds[event.item.toggleName].name);
};

ConfigsAssistant.prototype.newConfButton = function()
{
	var newUrl = this.controller.get('newUrl').mojo.getValue();
	if (newUrl.indexOf("http://ipkg.preware.org/alpha") == 0)
	{
		this.controller.showAlertDialog(
		{
		    title:				$L("Custom Feed"),
			allowHTMLMessage:	true,
		    message:			$L("You may not add alpha testing feeds here. See http://testing.preware.net/"),
		    choices:			[{label:$L("Ok"), value:'ok'}],
		});
		this.controller.get('newButton').mojo.deactivate();
	}
	else if (newUrl.indexOf("http://ipkg.preware.org/beta") == 0)
	{
		this.controller.showAlertDialog(
		{
		    title:				$L("Custom Feed"),
			allowHTMLMessage:	true,
		    message:			$L("You may not add beta testing feeds here. See http://testing.preware.net/"),
		    choices:			[{label:$L("Ok"), value:'ok'}],
		});
		this.controller.get('newButton').mojo.deactivate();
	}
	else if ((newUrl.indexOf("http://ipkg.preware.org/feeds") == 0) &&
			 (newUrl.indexOf("/testing/") > 0))
	{
		this.controller.showAlertDialog(
		{
		    title:				$L("Custom Feed"),
			allowHTMLMessage:	true,
		    message:			$L("The instructions you are following are obsolete. See http://testing.preware.net/"),
		    choices:			[{label:$L("Ok"), value:'ok'}],
		});
		this.controller.get('newButton').mojo.deactivate();
	}
	else if (newUrl.indexOf("http://preware.is.awesome.com") == 0)
	{
		this.controller.showAlertDialog(
		{
		    title:				$L("Custom Feed"),
			allowHTMLMessage:	true,
		    message:			$L("The instructions you are following are obsolete. See http://testing.preware.net/"),
		    choices:			[{label:$L("Ok"), value:'ok'}],
		});
		this.controller.get('newButton').mojo.deactivate();
	}
	else if (this.controller.get('newName').mojo.getValue() != '' &&
			 newUrl != '' && newUrl != 'http://')
	{
		if (!this.warningOkd)
		{
			this.controller.showAlertDialog(
			{
			    title:				$L("Custom Feed"),
				allowHTMLMessage:	true,
			    message:			$L("By adding a custom feed, you take full responsibility for any and all potential outcomes that may occur as a result of doing so, including (but not limited to): loss of warranty, loss of all data, loss of all privacy, security vulnerabilities and device damage."),
			    choices:			[{label:$L("Ok"), value:'ok'}, {label:$L("Cancel"), value:'cancel'}],
				onChoose:			this.newConfCall.bindAsEventListener(this)
		    });
		}
		else
		{
			this.newConfTest();
		}
	}
	else
	{
		this.controller.showAlertDialog(
		{
		    title:				$L("Custom Feed"),
			allowHTMLMessage:	true,
		    message:			$L("You need to fill in all fields for a new feed."),
		    choices:			[{label:$L("Ok"), value:'ok'}],
			onChoose:			function(v){ this.controller.get('newButton').mojo.deactivate(); }
	    });
	}
};
ConfigsAssistant.prototype.newConfTest = function()
{
	// Test the new feed here, if successful, run the below, if not, tell them
	
	this.subscription = IPKGService.addConfig(this.newConfResponse.bindAsEventListener(this),
		this.controller.get('newName').mojo.getValue() + ".conf",
		this.controller.get('newName').mojo.getValue(),
		this.controller.get('newUrl').mojo.getValue(),
		this.newCompressed.value);
	
}
ConfigsAssistant.prototype.newConfCall = function(value)
{
	if (value == "ok")
	{
		this.warningOkd = true;
		this.newConfTest();
	}
	else
	{
		this.controller.get('newButton').mojo.deactivate();
	}
};
ConfigsAssistant.prototype.newConfResponse = function(payload)
{
	if (payload.stage == 'completed')
	{
		// tell packages the feeds are "dirty"
		packages.dirtyFeeds = true;
		
		this.controller.get('newName').mojo.setValue('');
		this.controller.get('newUrl').mojo.setValue('http://');
		
		this.controller.get('newButton').mojo.deactivate();

		// init feed loading
		this.subscription = IPKGService.list_configs(this.onFeeds.bindAsEventListener(this));
	}
};

ConfigsAssistant.prototype.backTap = function(event)
{
	this.controller.stageController.popScene();
};

ConfigsAssistant.prototype.headerButton = function(event)
{
	this.controller.stageController.swapScene({name: 'preferences', transition: Mojo.Transition.crossFade});
};

ConfigsAssistant.prototype.alertMessage = function(title, message)
{
	this.controller.showAlertDialog({
	    onChoose: function(value) {},
		allowHTMLMessage: true,
	    title: title,
	    message: removeAuth(message),
	    choices:[{label:$L("Ok"), value:""}]
    });
};

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
};

ConfigsAssistant.prototype.activate = function(event) {};
ConfigsAssistant.prototype.deactivate = function(event) {};
ConfigsAssistant.prototype.cleanup = function(event) {
	// cancel the last subscription, this may not be needed
	if (this.subscription) {
		this.subscription.cancel();
	}

	this.controller.stopListening(this.backElement,  Mojo.Event.tap, this.backTapHandler);
};

// Local Variables:
// tab-width: 4
// End:
