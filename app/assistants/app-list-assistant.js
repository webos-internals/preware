function AppListAssistant(item, searchText, currentSort)
{
	// the item passed by the parent scene
	this.item = item;
	
	// this holds the list (when we filter, this is what we search)
	this.apps = [];
	
	// holds the model that has been filtered for use by the list
	this.listModel = {items:[]};
	
	// setup command menu
	this.cmdMenuModel =
	{
		label: $L('Menu'), 
		items: []
	};
	
	// holds the search 
	this.searchTimer = false;
	this.searchText = (searchText ? searchText : '');
	
	// store what our current sort direction is
	if (currentSort)
	{
		this.currentSort = currentSort;
	}
	else
	{
		// category and installed list get alphabetical default
		if (this.item.list == 'category' || this.item.list == 'installed') this.currentSort = 'alpha';
		// updates list and all get date default
		else if (this.item.list == 'updates' || this.item.list == 'all') this.currentSort = 'date';
		// if anything else default to alphabetical (though, this should never happen)
		else this.currentSort = 'alpha';
	}
	
	// the app view will update this if the app is changed so the list knows when to update on activation
	this.reloadList = false;
}

AppListAssistant.prototype.setup = function()
{
	// setup list title
	this.controller.get('listTitle').innerHTML = this.item.name;
	
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
	this.setupList();
	
	// listen for list tap
	Mojo.Event.listen(this.controller.get('appList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	
	// Set up a command menu
	this.updateCommandMenu(true);
	
	// setup sort command menu widget
	this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
	
	// search spinner model
	this.spinnerModel = {spinning: false};
	
	// setup spinner widget
	this.controller.setupWidget('spinner', {spinnerSize: 'small'}, this.spinnerModel);
	
	// search model & attributes
	this.searchAttributes =
	{
		focus: false,
		autoFocus: false,
		changeOnKeyPress: true
	};
	this.searchModel = { value: this.searchText };
	
	// setup search widget
	this.controller.setupWidget('searchText', this.searchAttributes, this.searchModel);
	
	// listen for type
	this.searchFunction = this.filter.bind(this);
	Mojo.Event.listen(this.controller.get('searchText'), Mojo.Event.propertyChange, this.filterDelayHandler.bindAsEventListener(this));
	
	// key handler function
	this.keyHandler = this.keyTest.bindAsEventListener(this);
	
	// if there isnt already search text, start listening
	if (this.searchText == '') 
	{
		Mojo.Event.listen(this.controller.sceneElement, Mojo.Event.keypress, this.keyHandler);
	}
	// if not, show the text box
	else
	{
		this.controller.get('appListHeader').style.display = 'none';
		this.controller.get('searchText').style.display = 'inline';
		//this.controller.get('searchText').mojo.setValue(this.searchText);
	}
	
}

AppListAssistant.prototype.updateCommandMenu = function(skipUpdate)
{
	
	// clear current model list
	this.cmdMenuModel.items = [];
	
	// this is to put space around the icons
	this.cmdMenuModel.items.push({});
	
	// if updates, lets push the update all button
	if (this.item.list == 'updates' && this.listModel.items.length > 1) 
	{
		this.cmdMenuModel.items.push({label: $L('Update All'), command: 'do-updateAll'});
	}
	
	// push the sort selector
	this.cmdMenuModel.items.push({items: [{icon: "icon-filter-alpha", command: 'alpha'}, {icon: "icon-filter-date",  command: 'date'}], toggleCmd: this.currentSort});
	
	// this is to put space around the icons
	this.cmdMenuModel.items.push({});
	
	// if we don't want to skip the update, update it
	if (!skipUpdate)
	{
		// update model
		this.controller.modelChanged(this.cmdMenuModel);
		
		// show the menu
		this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
	}
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

AppListAssistant.prototype.setupList = function()
{
	// setup list attributes
	this.listAttributes = 
	{
		itemTemplate: "app-list/rowTemplate",
		swipeToDelete: false,
		reorderable: false
	};
	
	// setp dividers templates
	if (this.currentSort == 'date') 
	{
		this.listAttributes.dividerTemplate = 'app-list/rowDateDivider';
	}
	else if (this.currentSort == 'alpha' && this.item.list == 'all') 
	{
		this.listAttributes.dividerTemplate = 'app-list/rowAlphaDivider';
	}
	
	// if divider template, setup the divider function
	if (this.listAttributes.dividerTemplate)
	{
		this.listAttributes.dividerFunction = this.getDivider.bind(this);
	}
	
	// setup list widget
	this.controller.setupWidget('appList', this.listAttributes, this.listModel);
}

AppListAssistant.prototype.updateList = function(skipUpdate)
{
	// clear the current list
	this.apps = [];
	
	// load app list
	this.apps = packages.getApps(this.item);
	
	// if there are no apps to list, pop the scene (later, we may replace this with a "nothing to list" message)
	if (this.apps.length < 1)
	{
		this.controller.stageController.popScene();
	}
	
	// apps are sorted alphabetically by deafult, if the current sort is date, run the sort function.
	if (this.currentSort == 'date') 
	{
		this.apps.sort(function(a, b)
		{
			aTime = 0;
			bTime = 0;
			
			if (a.SourceObj != undefined && a.SourceObj['Last-Updated']) aTime = a.SourceObj['Last-Updated'];
			if (b.SourceObj != undefined && b.SourceObj['Last-Updated']) bTime = b.SourceObj['Last-Updated'];
			
			if (aTime > bTime) return -1;
			else
			{
				if (aTime < bTime) return 1;
				else return 0;
			}
		});
	}
	
	
	// call filter function to update list 
	this.filter(skipUpdate);
}

// handle sort toggle commands
AppListAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'date':
			case 'alpha':
				this.currentSort = event.command;
				this.controller.stageController.swapScene('app-list', this.item, this.searchText, this.currentSort);
				break;
			case 'do-updateAll':
				this.controller.showAlertDialog({
				    onChoose: function(value) {},
				    title: $L("Update All"),
				    message: 'This Does Nothing Yet!',
				    choices:[{label:$L('Ok'), value:""}]
			    });
				break;
				
			default:
				break;
		}
	}
};

// divider function
AppListAssistant.prototype.getDivider = function(item)
{
	// how to divide when sorting by date
	if (this.currentSort == 'date')
	{
		if (item.SourceObj != undefined && item.SourceObj['Last-Updated']) 
		{
			// a number of different date breakdowns
			var now = Math.round(new Date().getTime()/1000.0);
			if      (now - item.SourceObj['Last-Updated'] <= 86400)	  return 'Today';
			else if (now - item.SourceObj['Last-Updated'] <= 172800)  return 'Yesterday';
			else if (now - item.SourceObj['Last-Updated'] <= 604800)  return 'This Week';
			else if (now - item.SourceObj['Last-Updated'] <= 1209600) return 'Last Week';
			else if (now - item.SourceObj['Last-Updated'] <= 2629744) return 'This Month';
			else if (now - item.SourceObj['Last-Updated'] <= 5259488) return 'Last Month';
			else return 'Older'; // for things 2 months or older
		}
		else
		{
			// not all feeds will supply a last-updated value (or apps installed by the user not in any feeds)
			return 'Unknown';
		}
	}
	// how to divide when sorted by alpha (only used by the all list)
	else if (this.currentSort == 'alpha' && this.item.list == 'all')
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
}

AppListAssistant.prototype.listTapHandler = function(event)
{
	// push app view scene with this items info
	this.controller.stageController.pushScene('app-view', event.item, this);
}

AppListAssistant.prototype.menuTapHandler = function(event)
{
	// build category list model
	var categoryMenu = [];
	for (var c = 0; c < cats.length; c++) 
	{
		categoryMenu.push(
		{
			label: cats[c].name,
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
				this.controller.stageController.swapScene('app-list', {list: 'category', category: value, name: "WebOS Applications"});
				return;
			}
			
		},
		toggleCmd: this.item.category,
		placeNear: event.target,
		items: categoryMenu
	});
}

AppListAssistant.prototype.setReload = function()
{
	this.reloadList = true;
}

AppListAssistant.prototype.activate = function(event)
{
	if (this.reloadList) 
	{
		this.updateList();
		this.updateCommandMenu();
	}
}

AppListAssistant.prototype.deactivate = function(event) {}

AppListAssistant.prototype.cleanup = function(event)
{
	// clean up our listeners
	Mojo.Event.stopListening(this.controller.sceneElement, Mojo.Event.keypress, this.keyHandler);
	Mojo.Event.stopListening(this.controller.get('searchText'), Mojo.Event.propertyChange, this.filterDelayHandler.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('appList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('categorySource'), Mojo.Event.tap, this.menuTapHandler.bindAsEventListener(this));
}
