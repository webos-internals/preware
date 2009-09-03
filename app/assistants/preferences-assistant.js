function PreferencesAssistant()
{
	// setup default preferences in the prefCookie.js model
	this.cookie = new prefCookie();
	this.prefs = this.cookie.get();
}

PreferencesAssistant.prototype.setup = function()
{
	try
	{
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
		
		this.controller.listen('updateInterval', Mojo.Event.propertyChange, this.listChanged.bindAsEventListener(this));
		
		
		
		// Main Scene Group
		this.controller.setupWidget
		(
			'showOther',
			{
	  			trueLabel:  'Yes',
	 			falseLabel: 'No',
	  			fieldName:  'showOther'
			},
			{
				value : this.prefs.showOther,
	 			disabled: false
			}
		);
		
		this.controller.listen('showOther', Mojo.Event.propertyChange, this.toggleChanged.bindAsEventListener(this));
		
		
		
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
			this.prefs
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
	 			disabled: false
			}
		);
		
		this.controller.listen('backgroundUpdates',  Mojo.Event.propertyChange, this.listChanged.bindAsEventListener(this));
		this.controller.listen('autoInstallUpdates', Mojo.Event.propertyChange, this.toggleChanged.bindAsEventListener(this));
		
		
		
		// setup menu that is no menu
		this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, { visible: false });
		
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'preferences#setup');
	}

}

PreferencesAssistant.prototype.listChanged = function(event)
{
	this.cookie.put(this.prefs);
};

PreferencesAssistant.prototype.toggleChanged = function(event)
{
	this.prefs[event.target.id] = event.value;
	this.cookie.put(this.prefs);
};


PreferencesAssistant.prototype.activate = function(event) {}

PreferencesAssistant.prototype.deactivate = function(event) {}

PreferencesAssistant.prototype.cleanup = function(event) {}
