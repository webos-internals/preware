function PreferencesAssistant()
{
	// setup default preferences in the preferenceCookie.js model
	this.cookie = new preferenceCookie();
	this.prefs = this.cookie.get();
	
	// IpkgWrapper enabled?
	this.wrapperEnabled = false;

	// for secret group
	this.secretString = '';
	this.secretAnswer = 'iknowwhatimdoing';
	
	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: "Help",
				command: 'do-help'
			}
		]
	}

	// setup app limit fix toggle
	this.appLimitToggleModel =
	{
		value : this.wrapperEnabled,
		disabled: false
	}

}

PreferencesAssistant.prototype.setup = function()
{
	try
	{
		// setup menu
		this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
		
		// set this scene's default transition
		this.controller.setDefaultTransition(Mojo.Transition.zoomFade);
		
		// setup handlers for preferences
		this.toggleChangeHandler = this.toggleChanged.bindAsEventListener(this)
		this.listChangedHandler  = this.listChanged.bindAsEventListener(this)
		
		// toggle panes:
		this.toggleShowTypesChanged();
		
		// init feed loading
		IPKGService.getIpkgWrapperState(this.onGetWrapper.bindAsEventListener(this));

		// setup header button
		this.controller.listen('headerButton', Mojo.Event.tap, this.headerButton.bindAsEventListener(this));
		
		// Global Group
		this.controller.setupWidget
		(
			'theme',
			{
				label: 'Theme',
				choices:
				[
					{label:'Palm Default',	value:'palm-default'},
					{label:'Palm Dark',		value:'palm-dark'}
				],
				modelProperty: 'theme'
			},
			this.prefs
		);
		
		this.controller.listen('theme', Mojo.Event.propertyChange, this.themeChanged.bindAsEventListener(this));
		
		
		
		// Startup Group
		this.controller.setupWidget
		(
			'updateInterval',
			{
				label: 'Update Feeds',
				choices:
				[
					{label:'Every Launch',	value:'launch'},
					{label:'Once Daily',	value:'daily'},
					{label:'Manually Only',	value:'manual'}
				],
				modelProperty: 'updateInterval'
			},
			this.prefs
		);
		if (this.prefs.lastUpdate) 
		{
			this.controller.get('lastUpdate').innerHTML = formatDate(this.prefs.lastUpdate);
		}
		this.controller.setupWidget
		(
			'fixUnknown',
			{
	  			trueLabel:  'Yes',
	 			falseLabel: 'No',
	  			fieldName:  'fixUnknown'
			},
			{
				value : this.prefs.fixUnknown,
	 			disabled: false
			}
		);

		this.controller.setupWidget
		(
			'fixAppLimit',
			{
	  			trueLabel:  'Yes',
	 			falseLabel: 'No',
	  			fieldName:  'fixAppLimit'
			},
			this.appLimitToggleModel
		);
		
		this.controller.listen('updateInterval', Mojo.Event.propertyChange, this.listChangedHandler);
		this.controller.listen('fixUnknown',     Mojo.Event.propertyChange, this.toggleChangeHandler);
		this.controller.listen('fixAppLimit',    Mojo.Event.propertyChange, this.toggleAppLimitChanged.bindAsEventListener(this));
		
		
		
		// Main Scene Group
		this.controller.setupWidget
		(
			'showAvailableTypes',
			{
	  			trueLabel:  'Yes',
	 			falseLabel: 'No',
	  			fieldName:  'showAvailableTypes'
			},
			{
				value : this.prefs.showAvailableTypes,
	 			disabled: false
			}
		);
		this.controller.setupWidget
		(
			'showTypeApplication',
			{
	  			trueLabel:  'Yes',
	 			falseLabel: 'No',
	  			fieldName:  'showTypeApplication'
			},
			{
				value : this.prefs.showTypeApplication,
	 			disabled: false
			}
		);
		this.controller.setupWidget
		(
			'showTypeTheme',
			{
	  			trueLabel:  'Yes',
	 			falseLabel: 'No',
	  			fieldName:  'showTypeTheme'
			},
			{
				value : this.prefs.showTypeTheme,
	 			disabled: false
			}
		);
		this.controller.setupWidget
		(
			'showTypePatch',
			{
	  			trueLabel:  'Yes',
	 			falseLabel: 'No',
	  			fieldName:  'showTypePatch'
			},
			{
				value : this.prefs.showTypePatch,
	 			disabled: false
			}
		);
		this.controller.setupWidget
		(
			'showTypeOther',
			{
	  			trueLabel:  'Yes',
	 			falseLabel: 'No',
	  			fieldName:  'showTypeOther'
			},
			{
				value : this.prefs.showTypeOther,
	 			disabled: false
			}
		);
		
		this.controller.listen('showAvailableTypes',  Mojo.Event.propertyChange, this.toggleShowTypesChanged.bindAsEventListener(this));
		this.controller.listen('showTypeApplication', Mojo.Event.propertyChange, this.toggleChangeHandler);
		this.controller.listen('showTypeTheme',       Mojo.Event.propertyChange, this.toggleChangeHandler);
		this.controller.listen('showTypePatch',       Mojo.Event.propertyChange, this.toggleChangeHandler);
		this.controller.listen('showTypeOther',       Mojo.Event.propertyChange, this.toggleChangeHandler);
		
		
		
		// List Scene Group
		this.controller.setupWidget
		(
			'listSort',
			{
				label: 'Default Sort',
				choices:
				[
					{label:'Category Default',	value:'default'},
					{label:'Alphabetically',	value:'alpha'},
					{label:'Last Updated',		value:'date'}
				],
				modelProperty: 'listSort'
			},
			this.prefs
		);
		this.controller.setupWidget
		(
			'secondRow',
			{
				label: 'Second Line',
				choices:
				[
					{label:'Package ID',		value:'id'},
					{label:'Version',		value:'version'},
					{label:'Maintainer',		value:'maint'},
					{label:'Modified Date',		value:'date'},
					{label:'Version & ID',		value:'v&i'},
					{label:'Version & Maint.',	value:'v&m'},
					{label:'Version & Date',	value:'v&d'},
					{label:'License',		value:'license'}
				],
				modelProperty: 'secondRow'
			},
			this.prefs
		);
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
		
		this.controller.listen('listSort',      Mojo.Event.propertyChange, this.listChangedHandler);
		this.controller.listen('secondRow',     Mojo.Event.propertyChange, this.listChangedHandler);
		this.controller.listen('listInstalled', Mojo.Event.propertyChange, this.toggleChangeHandler);
		
		
		
		// Background Group
		this.controller.setupWidget
		(
			'backgroundUpdates',
			{
				label: 'Check Updates',
				choices:
				[
					{label:'Disabled',	value:'disabled'}
				],
				modelProperty: 'backgroundUpdates'
			},
			//this.prefs
			{
				backgroundUpdates: 'disabled',
        		disabled: true
			}
		);
		this.controller.setupWidget
		(
			'autoInstallUpdates',
			{
	  			trueLabel:  'Yes',
	 			falseLabel: 'No',
	  			fieldName:  'autoInstallUpdates'
			},
			{
				value : this.prefs.autoInstallUpdates,
	 			disabled: true
			}
		);
		
		this.controller.listen('backgroundUpdates',  Mojo.Event.propertyChange, this.listChangedHandler);
		this.controller.listen('autoInstallUpdates', Mojo.Event.propertyChange, this.toggleChangeHandler);
		
		
		
		// Secret Group
		this.keyPressHandler = this.keyPress.bindAsEventListener(this)
		Mojo.Event.listen(this.controller.sceneElement, Mojo.Event.keypress, this.keyPressHandler);
		
		this.controller.setupWidget
		(
			'allowFlagSkip',
			{
	  			trueLabel:  'Yes',
	 			falseLabel: 'No',
	  			fieldName:  'allowFlagSkip'
			},
			{
				value : this.prefs.allowFlagSkip,
	 			disabled: false
			}
		);
		
		this.controller.listen('allowFlagSkip', Mojo.Event.propertyChange, this.toggleChangeHandler);
		
		// hide secret group
		this.controller.get('secretPreferences').style.display = 'none';
		
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'preferences#setup');
	}

}

PreferencesAssistant.prototype.listChanged = function(event)
{
	this.cookie.put(this.prefs);
}

PreferencesAssistant.prototype.themeChanged = function(event)
{
	// set the theme right away with the body class
	this.controller.document.body.className = event.value;
	this.cookie.put(this.prefs);
}

PreferencesAssistant.prototype.toggleChanged = function(event)
{
	this.prefs[event.target.id] = event.value;
	this.cookie.put(this.prefs);
}

PreferencesAssistant.prototype.toggleAppLimitChanged = function(event)
{
	IPKGService.setIpkgWrapperState(this.onSetWrapper.bindAsEventListener(this), event.value);
}

PreferencesAssistant.prototype.toggleShowTypesChanged = function(event)
{
	if (event) 
	{
		this.toggleChanged(event);
	}
	if (this.prefs['showAvailableTypes'])
	{
		this.controller.get('showAvailableTypesContainer').className = 'palm-row first';
		this.controller.get('availableTypes').style.display = '';
	}
	else
	{
		this.controller.get('showAvailableTypesContainer').className = 'palm-row single';
		this.controller.get('availableTypes').style.display = 'none';
	}
}

PreferencesAssistant.prototype.headerButton = function(event)
{
	this.controller.stageController.swapScene({name: 'configs', transition: Mojo.Transition.crossFade});
}

PreferencesAssistant.prototype.handleCommand = function(event)
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

PreferencesAssistant.prototype.keyPress = function(event)
{
	this.secretString += String.fromCharCode(event.originalEvent.charCode);
	
	if (event.originalEvent.charCode == 8)
	{
		this.secretString = '';
	}
	
	if (this.secretString.length == this.secretAnswer.length)
	{
		if (this.secretString === this.secretAnswer)
		{
			this.controller.get('secretPreferences').style.display = '';
			this.controller.getSceneScroller().mojo.revealElement(this.controller.get('secretPreferences'));
			this.secretString = '';
		}
	}
	else if (this.secretString.length > this.secretAnswer.length)
	{
		this.secretString = '';
	}
}

PreferencesAssistant.prototype.onGetWrapper = function(payload)
{
	try 
	{
		if (!payload) 
		{
			// i dont know if this will ever happen, but hey, it might
			this.alertMessage('Preware', 'Update Error. The service probably isn\'t running.');
		}
		else if (payload.errorCode == -1) 
		{
			// we probably dont need to check this stuff here,
			// it would have already been checked and errored out of this process
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.alertMessage('Preware', 'The Package Manager Service is not running. Did you remember to install it? If you did, first try restarting Preware, then try rebooting your phone and waiting longer before starting Preware.');
			}
			else
			{
				this.alertMessage('Preware', payload.errorText);
			}
		}
		else 
		{
			this.wrapperEnabled = payload.enabled;
			this.appLimitToggleModel.value = this.wrapperEnabled;
			this.controller.modelChanged(this.appLimitToggleModel);
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'configs#onGetWrapper');
		this.alertMessage('onGetWrapper Error', e);
	}
}

PreferencesAssistant.prototype.onSetWrapper = function(payload)
{
	try 
	{
		if (!payload) 
		{
			// i dont know if this will ever happen, but hey, it might
			this.alertMessage('Preware', 'Update Error. The service probably isn\'t running.');
		}
		else if (payload.errorCode == -1) 
		{
			// we probably dont need to check this stuff here,
			// it would have already been checked and errored out of this process
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.alertMessage('Preware', 'The Package Manager Service is not running. Did you remember to install it? If you did, first try restarting Preware, then try rebooting your phone and waiting longer before starting Preware.');
			}
			else
			{
				this.alertMessage('Preware', payload.errorText);
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'configs#onSetWrapper');
		this.alertMessage('onSetWrapper Error', e);
	}
}

PreferencesAssistant.prototype.alertMessage = function(title, message)
{
	this.controller.showAlertDialog({
	    onChoose: function(value) {},
		allowHTMLMessage: true,
	    title: title,
	    message: message,
	    choices:[{label:$L('Ok'), value:""}]
    });
}

PreferencesAssistant.prototype.activate = function(event) {}

PreferencesAssistant.prototype.deactivate = function(event)
{
	// reload global storage of preferences when we get rid of this stage
	var tmp = prefs.get(true);
}

PreferencesAssistant.prototype.cleanup = function(event) {}
