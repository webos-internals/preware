function PreferencesBlacklistAssistant(params)
{
	// setup default preferences in the preferenceCookie.js model
	this.cookie = new preferenceCookie();
	this.prefs = this.cookie.get();
	
	if (params)
	{
		this.index = params.index;
		this.params = {field: params.field, search: params.search};
	}
	else
	{
		this.index = false;
		this.params = {field: 'maintainer', search: ''};
	}
	
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

PreferencesBlacklistAssistant.prototype.setup = function()
{
	try
	{
		// setup menu
		this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
		
		if (this.index === false) this.controller.get('header').update($L('Add Blacklist'));
		else this.controller.get('header').update($L('Edit Blacklist'));
		
		this.controller.get('blacklist-group-search').innerHTML=$L('Search For');
		this.controller.get('blacklist-group-field').innerHTML=$L('Field');

		this.fieldElement =			this.controller.get('field');
		this.searchElement =		this.controller.get('search');
		this.saveButtonElement =	this.controller.get('saveButton');
		
		this.listChanged = 			this.listChanged.bindAsEventListener(this);
		this.textChanged =			this.textChanged.bindAsEventListener(this);
		this.saveButtonPressed =	this.saveButtonPressed.bindAsEventListener(this);
		
		this.controller.setupWidget
		(
			'field',
			{
				label: $L("Search In"),
				choices:
				[
					{label:$L("Title"),			value:'title'},
					{label:$L("Maintainer"),	value:'maintainer'},
					{label:$L("Package Id"),	value:'id'},
					{label:$L("Description"),	value:'desc'},
					{label:$L("Category"),		value:'category'}
				],
				modelProperty: 'field'
			},
			this.params
		);
		
		this.controller.setupWidget
		(
			'search',
			{
				multiline: false,
				enterSubmits: false,
				changeOnKeyPress: true,
				textCase: Mojo.Widget.steModeLowerCase,
				focusMode: Mojo.Widget.focusSelectMode,
				modelProperty: 'search'
			},
			this.params
		);
		
		if (this.index === false)
		{
			this.controller.setupWidget
			(
				'saveButton',
				{
					type: Mojo.Widget.activityButton
				},
				this.buttonModel =
				{
					buttonLabel: $L('Save'),
					buttonClass: 'affirmative',
					disabled: (this.params.search == '' || this.params.field == '')
				}
			);
			
			Mojo.Event.listen(this.fieldElement, Mojo.Event.propertyChange, this.listChanged);
			Mojo.Event.listen(this.searchElement, Mojo.Event.propertyChange, this.textChanged);
			Mojo.Event.listen(this.saveButtonElement, Mojo.Event.tap, this.saveButtonPressed);
		}
		
		// make it so nothing is selected by default (textbox rage)
		this.controller.setInitialFocusedElement(null);
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'preferences-blacklist#setup');
	}

};

PreferencesBlacklistAssistant.prototype.saveButtonPressed = function(event)
{
	if (this.index === false)
	{
		if (this.params.search != '' && this.params.field != '')
		{
			this.prefs.blackList.push({field: this.params.field, search: this.params.search});
			this.cookie.put(this.prefs);
			this.doneSaving();
		}
		else
		{
			// not complete?
			this.saveButtonElement.mojo.deactivate();
		}
	}
	else
	{
		// tell the user an alias like this already exists
		this.saveButtonElement.mojo.deactivate();
	}
}
PreferencesBlacklistAssistant.prototype.textChanged = function(event)
{
	if (this.params.search != '' && this.params.field != '')
	{
		this.buttonModel.disabled = false;
		this.controller.modelChanged(this.buttonModel);
	}
	else
	{
		this.buttonModel.disabled = true;
		this.controller.modelChanged(this.buttonModel);
	}
}
PreferencesBlacklistAssistant.prototype.listChanged = function(event)
{
	if (this.params.search != '' && this.params.field != '')
	{
		this.buttonModel.disabled = false;
		this.controller.modelChanged(this.buttonModel);
	}
	else
	{
		this.buttonModel.disabled = true;
		this.controller.modelChanged(this.buttonModel);
	}
};

PreferencesBlacklistAssistant.prototype.doneSaving = function()
{
	this.saveButtonElement.mojo.deactivate();
	this.controller.stageController.popScene();
}

PreferencesBlacklistAssistant.prototype.handleCommand = function(event)
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

PreferencesBlacklistAssistant.prototype.activate = function(event) {};
PreferencesBlacklistAssistant.prototype.deactivate = function(event)
{
	if (this.index !== false && this.params.search != '' && this.params.field != '')
	{
		this.prefs.blackList[this.index] = ({field: this.params.field, search: this.params.search});
		this.cookie.put(this.prefs);
	}
	// reload global storage of preferences when we get rid of this stage
	var tmp = prefs.get(true);
};

PreferencesBlacklistAssistant.prototype.cleanup = function(event)
{
	if (this.index === false)
	{
		Mojo.Event.stopListening(this.fieldElement, Mojo.Event.propertyChange, this.listChanged);
		Mojo.Event.stopListening(this.searchElement, Mojo.Event.propertyChange, this.textChanged);
		Mojo.Event.stopListening(this.saveButtonElement, Mojo.Event.tap, this.saveButtonPressed);
	}
};

// Local Variables:
// tab-width: 4
// End:
