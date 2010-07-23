function PreferencesAssistant()
{
	// setup default preferences in the preferenceCookie.js model
	this.cookie = new preferenceCookie();
	this.prefs = this.cookie.get();
	
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
				label: $L("Help"),
				command: 'do-help'
			}
		]
	}

};

PreferencesAssistant.prototype.setup = function()
{
	try
	{
		this.controller.get('headerButton').innerHTML = $L("Feeds");
		this.controller.get('preferences-title').innerHTML = $L("Preferences");
		this.controller.get('preferences-global').innerHTML = $L("Global");
		this.controller.get('preferences-startup').innerHTML = $L("Startup");
		this.controller.get('preferences-actions').innerHTML = $L("Actions");
		this.controller.get('last-update-title').innerHTML = $L("Last Update");
		this.controller.get('lastUpdate').innerHTML = $L("Never");
		this.controller.get('scan-unknown-packages').innerHTML = $L("Scan Unknown Packages");
		this.controller.get('avoid-bugs').innerHTML = $L("Avoid webOS Bugs");
		this.controller.get('avoid-bugs-note').innerHTML = $L("* May not work in future webOS versions.");
		this.controller.get('main-scene-title').innerHTML = $L("Main Scene");
		this.controller.get('show-available-types').innerHTML = $L("Show Available Types");
		this.controller.get('show-applications').innerHTML = $L("Show Applications");
		this.controller.get('show-themes').innerHTML = $L("Show Themes");
		this.controller.get('show-patches').innerHTML = $L("Show Patches");
		this.controller.get('show-other-types').innerHTML = $L("Show Other Types");
		this.controller.get('list-scene').innerHTML = $L("List Scene");
		this.controller.get('search-descriptions').innerHTML = $L("Search Descriptions");
		this.controller.get('installed-is-available').innerHTML = $L("Installed is Available");
		this.controller.get('only-show-free-apps').innerHTML = $L("Only Show Free Apps");
		this.controller.get('only-show-english-apps').innerHTML = $L("Only Show English Apps");
		this.controller.get('background').innerHTML = $L("Background");
		this.controller.get('automatically-install').innerHTML = $L("Automatically Install");
		this.controller.get('secret-stuff').innerHTML = $L("Secret Stuff");
		this.controller.get('secret-options').innerHTML = $L("This version has no secret options.");

		// setup menu
		this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
		
		// set this scene's default transition
		this.controller.setDefaultTransition(Mojo.Transition.zoomFade);
		
		// setup handlers for preferences
		this.toggleChangeHandler = this.toggleChanged.bindAsEventListener(this);
		this.listChangedHandler  = this.listChanged.bindAsEventListener(this);
		
		// toggle panes:
		this.toggleShowTypesChanged();
		
		// setup header button
		this.controller.listen('headerButton', Mojo.Event.tap, this.headerButton.bindAsEventListener(this));
		
		// Global Group
		this.controller.setupWidget
		(
			'theme',
			{
				label: $L("Theme"),
				choices:
				[
					{label:$L("Palm Default"),	value:'palm-default'},
					{label:$L("Palm Dark"),		value:'palm-dark'}
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
				label: $L("Update Feeds"),
				choices:
				[
					{label:$L("Every Launch"),	value:'launch'},
					{label:$L("Once Daily"),	value:'daily'},
					{label:$L("Manually Only"),	value:'manual'},
					{label:$L("Ask At Launch"),	value:'ask'}
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
	  			trueLabel:  $L("Yes"),
	 			falseLabel: $L("No"),
	  			fieldName:  'fixUnknown'
			},
			{
				value : this.prefs.fixUnknown,
	 			disabled: false
			}
		);

		this.controller.listen('updateInterval', Mojo.Event.propertyChange, this.listChangedHandler);
		this.controller.listen('fixUnknown',     Mojo.Event.propertyChange, this.toggleChangeHandler);
		
		
		
		// Actions Group
		this.controller.setupWidget
		(
			'avoidBugs',
			{
	  			trueLabel:  $L("Yes"),
	 			falseLabel: $L("No"),
	  			fieldName:  'avoidBugs'
			},
			{
				value : this.prefs.avoidBugs,
	 			disabled: false
			}
		);

		this.controller.listen('avoidBugs',     Mojo.Event.propertyChange, this.toggleChangeHandler);


		
		// Main Scene Group
		this.controller.setupWidget
		(
			'showAvailableTypes',
			{
	  			trueLabel:  $L("Yes"),
	 			falseLabel: $L("No"),
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
	  			trueLabel:  $L("Yes"),
	 			falseLabel: $L("No"),
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
	  			trueLabel:  $L("Yes"),
	 			falseLabel: $L("No"),
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
	  			trueLabel:  $L("Yes"),
	 			falseLabel: $L("No"),
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
	  			trueLabel:  $L("Yes"),
	 			falseLabel: $L("No"),
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
			'searchDesc',
			{
	  			trueLabel:  $L("Yes"),
	 			falseLabel: $L("No"),
	  			fieldName:  'searchDesc'
			},
			{
				value : this.prefs.searchDesc,
	 			disabled: false
			}
		);
		this.controller.setupWidget
		(
			'listSort',
			{
				label: $L("Default Sort"),
				choices:
				[
					{label:$L("Category Default"),	value:'default'},
					{label:$L("Alphabetically"),	value:'alpha'},
					{label:$L("Last Updated"),		value:'date'},
					{label:$L("Price"),			value:'price'}
				],
				modelProperty: 'listSort'
			},
			this.prefs
		);
		this.controller.setupWidget
		(
			'secondRow',
			{
				label: $L("Second Line"),
				choices:
				[
					{label:$L("Package ID"),			value:'id'},
					{label:$L("Version"),				value:'version'},
					{label:$L("Maintainer"),			value:'maint'},
					{label:$L("Modified Date"),			value:'date'},
					{label:$L("Price"),					value:'price'},
					{label:$L("Feed"),					value:'feed'},
					{label:$L("Country"),				value:'country'},
					{label:$L("License"),				value:'license'},
					{label:$L("Version & ID"),			value:'version,id'},
					{label:$L("Version & Maint."),		value:'version,maint'},
					{label:$L("Version & Date"),		value:'version,date'},
					{label:$L("Version, Date & Feed"),	value:'version,date,feed'},
					{label:$L("Version, Date & Lic."),	value:'version,date,license'},
					{label:$L("Price & Feed"),			value:'price,feed'},
					{label:$L("Price & Country"),		value:'price,country'},
					{label:$L("Price & License"),		value:'price,license'},
					{label:$L("Price, Vers. & Maint."),	value:'price,version,maint'},
					{label:$L("Price, Vers. & Date"),	value:'price,version,date'},
					{label:$L("Price, Vers. & Feed"),	value:'price,version,feed'},
				],
				modelProperty: 'secondRow'
			},
			this.prefs
		);
		this.controller.setupWidget
		(
			'listInstalled',
			{
	  			trueLabel:  $L("Yes"),
	 			falseLabel: $L("No"),
	  			fieldName:  'listInstalled'
			},
			{
				value : this.prefs.listInstalled,
	 			disabled: false
			}
		);
		this.controller.setupWidget
		(
			'onlyShowFree',
			{
	  			trueLabel:  $L("Yes"),
	 			falseLabel: $L("No"),
	  			fieldName:  'onlyShowFree'
			},
			{
				value : this.prefs.onlyShowFree,
	 			disabled: false
			}
		);
		this.controller.setupWidget
		(
			'onlyShowEnglish',
			{
	  			trueLabel:  $L("Yes"),
	 			falseLabel: $L("No"),
	  			fieldName:  'onlyShowEnglish'
			},
			{
				value : this.prefs.onlyShowEnglish,
	 			disabled: false
			}
		);
		
		this.controller.listen('searchDesc', 	Mojo.Event.propertyChange, this.toggleChangeHandler);
		this.controller.listen('listSort',      Mojo.Event.propertyChange, this.listChangedHandler);
		this.controller.listen('secondRow',     Mojo.Event.propertyChange, this.listChangedHandler);
		this.controller.listen('listInstalled', Mojo.Event.propertyChange, this.toggleChangeHandler);
		this.controller.listen('onlyShowFree',  Mojo.Event.propertyChange, this.toggleChangeHandler);
		this.controller.listen('onlyShowEnglish',  Mojo.Event.propertyChange, this.toggleChangeHandler);
		
		
		
		/*
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
		*/
		
		// hide background group
		this.controller.get('backgroundPreferences').style.display = 'none';
		
		// Secret Group
		this.keyPressHandler = this.keyPress.bindAsEventListener(this)
		Mojo.Event.listen(this.controller.sceneElement, Mojo.Event.keypress, this.keyPressHandler);
		
		/*
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
		*/
		
		// hide secret group
		this.controller.get('secretPreferences').style.display = 'none';
		
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'preferences#setup');
	}

};

PreferencesAssistant.prototype.listChanged = function(event)
{
	this.cookie.put(this.prefs);
};
PreferencesAssistant.prototype.themeChanged = function(event)
{
	// set the theme right away with the body class
	this.controller.document.body.className = event.value;
	this.cookie.put(this.prefs);
};
PreferencesAssistant.prototype.toggleChanged = function(event)
{
	this.prefs[event.target.id] = event.value;
	this.cookie.put(this.prefs);
	if ((event.target.id == 'onlyShowFree') ||
		(event.target.id == 'onlyShowEnglish')) {
		// tell packages the feeds are "dirty"
		packages.dirtyFeeds = true;
	}
};
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
};

PreferencesAssistant.prototype.headerButton = function(event)
{
	this.controller.stageController.swapScene({name: 'configs', transition: Mojo.Transition.crossFade});
};

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
};

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
};

PreferencesAssistant.prototype.alertMessage = function(title, message)
{
	this.controller.showAlertDialog({
	    onChoose: function(value) {},
		allowHTMLMessage: true,
	    title: title,
	    message: message,
	    choices:[{label:$L("Ok"), value:""}]
    });
};

PreferencesAssistant.prototype.activate = function(event) {};
PreferencesAssistant.prototype.deactivate = function(event)
{
	// reload global storage of preferences when we get rid of this stage
	var tmp = prefs.get(true);
};

PreferencesAssistant.prototype.cleanup = function(event) {};

// Local Variables:
// tab-width: 4
// End:
