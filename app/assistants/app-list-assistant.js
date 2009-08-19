function AppListAssistant(item)
{
	this.item = item;
	this.apps = [];
	this.listModel = {items:[]};
	this.searchTimer = false;
	this.searchText = '';
}

AppListAssistant.prototype.setup = function()
{
	// setup list title
	this.controller.get('listTitle').innerHTML = this.item.name;
	
	// setup list attributes
	this.listAttributes =
	{
		itemTemplate: "app-list/rowTemplate",
		swipeToDelete: false,
		reorderable: false
	};
	
	// category list has dividers
	if (this.item.list == 'all')
	{
		// all list has alpha dividers
		this.listAttributes.dividerTemplate = 'app-list/rowAlphaDivider';
		this.listAttributes.dividerFunction = this.getAlphaDivider;
	}
	
	// search model & attributes
	this.searchAttributes =
	{
		focus: false,
		autoFocus: false,
		changeOnKeyPress: true
	};
	
	// change scene if this is a single category
	if (this.item.list == 'category')
	{
		// update submenu styles
		this.controller.get('appListHeader').className = 'palm-header left';
		this.controller.get('categorySource').style.display = 'inline';
		this.controller.get('categoryTitle').innerHTML = this.item.category;
		
		// listen for tap to open menu
		Mojo.Event.listen(this.controller.get('categorySource'), Mojo.Event.tap, this.menuTapHandler.bindAsEventListener(this));
	}
	
	// update listModel
	this.updateList(true);
	
	// setup list widget
	this.controller.setupWidget('appList', this.listAttributes, this.listModel);
	
	// listen for tap
	Mojo.Event.listen(this.controller.get('appList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	
	// search spinner model
	this.spinnerModel = {spinning: false};
	
	// setup spinner widget
	this.controller.setupWidget('spinner', {spinnerSize: 'small'}, this.spinnerModel);
	
	// setup search widget
	this.controller.setupWidget('searchText', this.searchAttributes);
	
	// listen for type
	this.searchFunction = this.filter.bind(this);
	Mojo.Event.listen(this.controller.get('searchText'), Mojo.Event.propertyChange, this.filterDelayHandler.bindAsEventListener(this));
	
	// listen for typing
	this.keyHandler = this.keyTest.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.sceneElement, Mojo.Event.keypress, this.keyHandler);
	
}

AppListAssistant.prototype.keyTest = function(event)
{
	// if its a valid character
	if (Mojo.Char.isValidWrittenChar(event.originalEvent.charCode)) 
	{
		// display and focus search field
		Mojo.Event.stopListening(this.controller.sceneElement, Mojo.Event.keypress, this.keyHandler);
		this.controller.get('appListHeader').style.display = 'none';
		this.controller.get('searchText').style.display = 'inline';
		this.controller.get('searchText').mojo.focus();
	}
}

AppListAssistant.prototype.filterDelayHandler = function(event)
{
	// clear timer (incase one already exists)
	clearTimeout(this.searchTimer);
	
	// set search text
	this.searchText = event.value;
	
	// if there isn't search text
	if (this.searchText == '') 
	{
		// stop spinner
		this.spinnerModel.spinning = false;
		this.controller.modelChanged(this.spinnerModel);
		
		// reidsplay the title text
		this.controller.get('searchText').mojo.blur();
		this.controller.get('searchText').style.display = 'none';
		this.controller.get('appListHeader').style.display = 'inline';
		Mojo.Event.listen(this.controller.sceneElement, Mojo.Event.keypress, this.keyHandler);
		this.searchFunction();
	}
	else
	{
		// start spinner
		this.spinnerModel.spinning = true;
		this.controller.modelChanged(this.spinnerModel);
		
		// start delay timer to one second
		this.searchTimer = setTimeout(this.searchFunction, 1000);
	}
}

AppListAssistant.prototype.filter = function(skipUpdate)
{
	this.listModel.items = [];
	
	//alert(this.searchText);
	
	for (var a = 0; a < this.apps.length; a++) 
	{
		var pushIt = false;
		
		if (this.searchText == '')
		{
			pushIt = true;
		}
		else if (this.apps[a].Description.toLowerCase().include(this.searchText.toLowerCase()))
		{
			pushIt = true;
		}
		
		if (pushIt) 
		{
			this.listModel.items.push(this.apps[a]);
		}
	}
	
	// update list widget if skipUpdate isn't set to true (meaning, its called in the setup function and not activate)
	if (!skipUpdate) 
	{
		// reload list
		this.controller.get('appList').mojo.noticeUpdatedItems(0, this.listModel.items);
	 	this.controller.get('appList').mojo.setLength(this.listModel.items.length);
		
		// stop spinner
		this.spinnerModel.spinning = false;
		this.controller.modelChanged(this.spinnerModel);
	}
	
}

AppListAssistant.prototype.updateList = function(skipUpdate)
{
	// clear the current list
	this.apps = [];
	
	// build list from global array
	for (var a = 0; a < apps.length; a++) 
	{
		var pushIt = false;
		
		// all
		if (this.item.list == 'all') pushIt = true;
		
		// updates
		if (this.item.list == 'updates' && apps[a].Update) pushIt = true;
		
		// installed
		if (this.item.list == 'installed' && apps[a].Installed) pushIt = true;
		
		// category
		if (this.item.list == 'category' && this.item.category == apps[a].Section) pushIt = true;
		
		// push it to the list if we should
		if (pushIt) 
		{
			// check for icon in SourceObj
			var tmpApp = apps[a];
			
			// add the appNum so we can update it when changed by the view scene
			tmpApp.appNum = a;
			
			if (tmpApp.SourceObj != undefined && tmpApp.SourceObj.Icon)
			{
				tmpApp.ListIconClass = 'img';
				tmpApp.ListIconImg = '<img src="' + tmpApp.SourceObj.Icon + '" />';
			}
			
			// push
			this.apps.push(tmpApp);
		}
	}
	
	// call filter function to update list 
	this.filter(skipUpdate);
}

// this is only used by the everything list
AppListAssistant.prototype.getAlphaDivider = function(item)
{
	var firstChar = item.Description.substr(0, 1);
	if (parseInt(firstChar) == firstChar)
	{
		return '#';
	}
	else
	{
		return firstChar.toUpperCase();
	} 
}

AppListAssistant.prototype.listTapHandler = function(event)
{
	// push app view scene with this items info
	this.controller.stageController.pushScene('app-view', event.item);
}

AppListAssistant.prototype.menuTapHandler = function(event)
{
	// build category list model
	var categoryMenu = [];
	for (var c = 0; c < cats.length; c++) 
	{
		categoryMenu.push(
		{
			label: cats[c].name.substr(0, 1).toUpperCase() + cats[c].name.substr(1),
			command: cats[c].name
		});
	}
	
	// open category selector
	this.controller.popupSubmenu(
	{
		onChoose: function(value)
		{
			if (value === null ||
				value == "" ||
				value == undefined ||
				value == this.item.category) 
			{
				return;
			}
			else
			{
				this.controller.stageController.swapScene('app-list', {list: 'category', category: value.toLowerCase(), name: "WebOS Applications"});
				return;
			}
			
		},
		toggleCmd: this.item.category,
		placeNear: event.target,
		items: categoryMenu
	});
}

AppListAssistant.prototype.activate = function(event)
{
	this.updateList();
}

AppListAssistant.prototype.deactivate = function(event) {}

AppListAssistant.prototype.cleanup = function(event) {}
