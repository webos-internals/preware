function PkgListAssistant(item, searchText, currentSort)
{
	// the item passed by the parent scene
	this.item = item;
	
	// this holds the list (when we filter, this is what we search)
	this.packages = [];
	
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
		if (prefs.get().listSort == 'alpha') 
		{
			this.currentSort = 'alpha';
		}
		else if (prefs.get().listSort == 'date') 
		{
			this.currentSort = 'date';
		}
		else // listSort is empty or 'default 
		{
			if (this.item.list == 'categories' ||
				this.item.pkgValue == 'installed') 
			{
				this.currentSort = 'alpha';
			}
			else if (this.item.pkgValue == 'updates' ||
					this.item.pkgType == 'libraries' ||
					this.item.pkgType == 'all' ||
					this.item.list == 'feeds' ||
					this.item.list == 'types') 
			{
				this.currentSort = 'date';
			}
			else this.currentSort = 'alpha';
		}
		
	}
	
	// the pkg view will update this if the pkg is changed so the list knows when to update on activation
	this.reloadList = false;
}

PkgListAssistant.prototype.setup = function()
{
	// setup list title
	this.controller.get('listTitle').innerHTML = this.item.name;
	
	// change scene if this is a single group
	if (this.item.pkgValue == 'group')
	{
		// update submenu styles
		this.controller.get('pkgListHeader').className = 'palm-header left';
		this.controller.get('groupSource').style.display = 'inline';
		this.controller.get('groupTitle').innerHTML = this.item.pkgGroup;
		
		// listen for tap to open menu
		Mojo.Event.listen(this.controller.get('groupSource'), Mojo.Event.tap, this.menuTapHandler.bindAsEventListener(this));
	}
	
	// update listModel
	this.updateList(true);
	
	// setup list widget
	this.setupList();
	
	// listen for list tap
	Mojo.Event.listen(this.controller.get('pkgList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	
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
		this.controller.get('pkgListHeader').style.display = 'none';
		this.controller.get('searchText').style.display = 'inline';
		//this.controller.get('searchText').mojo.setValue(this.searchText);
	}
	
	// setup menu that is no menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, { visible: false });
}

PkgListAssistant.prototype.updateCommandMenu = function(skipUpdate)
{
	
	// clear current model list
	this.cmdMenuModel.items = [];
	
	// this is to put space around the icons
	this.cmdMenuModel.items.push({});
	
	// if updates, lets push the update all button
	if (this.item.pkgValue == 'updates' && this.listModel.items.length > 1) 
	{
		// we don't want this to show yet, since it doesn't work
		//this.cmdMenuModel.items.push({label: $L('Update All'), command: 'do-updateAll'});
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

PkgListAssistant.prototype.keyTest = function(event)
{
	// if its a valid character
	if (Mojo.Char.isValidWrittenChar(event.originalEvent.charCode)) 
	{
		// display and focus search field
		Mojo.Event.stopListening(this.controller.sceneElement, Mojo.Event.keypress, this.keyHandler);
		this.controller.get('pkgListHeader').style.display = 'none';
		this.controller.get('searchText').style.display = 'inline';
		this.controller.get('searchText').mojo.focus();
	}
}

PkgListAssistant.prototype.filterDelayHandler = function(event)
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
		this.controller.get('pkgListHeader').style.display = 'inline';
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

PkgListAssistant.prototype.filter = function(skipUpdate)
{
	this.listModel.items = [];
	
	//alert(this.searchText);
	
	for (var p = 0; p < this.packages.length; p++) 
	{
		var pushIt = false;
		
		if (this.searchText == '')
		{
			pushIt = true;
		}
		else if (this.packages[p].title.toLowerCase().include(this.searchText.toLowerCase()))
		{
			pushIt = true;
		}
		
		if (pushIt) 
		{
			this.listModel.items.push(this.packages[p]);
		}
	}
	
	// update list widget if skipUpdate isn't set to true (meaning, its called in the setup function and not activate)
	if (!skipUpdate) 
	{
		// reload list
		this.controller.get('pkgList').mojo.noticeUpdatedItems(0, this.listModel.items);
	 	this.controller.get('pkgList').mojo.setLength(this.listModel.items.length);
		
		// stop spinner
		this.spinnerModel.spinning = false;
		this.controller.modelChanged(this.spinnerModel);
	}
	
}

PkgListAssistant.prototype.setupList = function()
{
	// setup list attributes
	this.listAttributes = 
	{
		itemTemplate: "pkg-list/rowTemplate",
		swipeToDelete: false,
		reorderable: false
	};
	
	// setp dividers templates
	if (this.currentSort == 'date') 
	{
		this.listAttributes.dividerTemplate = 'pkg-list/rowDateDivider';
	}
	else if (this.currentSort == 'alpha' && this.item.pkgType == 'all' && this.item.pkgValue == 'all') 
	{
		this.listAttributes.dividerTemplate = 'pkg-list/rowAlphaDivider';
	}
	
	// if divider template, setup the divider function
	if (this.listAttributes.dividerTemplate)
	{
		this.listAttributes.dividerFunction = this.getDivider.bind(this);
	}
	
	// setup list widget
	this.controller.setupWidget('pkgList', this.listAttributes, this.listModel);
}

PkgListAssistant.prototype.updateList = function(skipUpdate)
{
	// clear the current list
	this.packages = [];
	
	// load pkg list
	this.packages = packages.getPackages(this.item);
	
	// if there are no pkgs to list, pop the scene (later, we may replace this with a "nothing to list" message)
	if (this.packages.length < 1)
	{
		this.controller.stageController.popScene();
	}
	
	// pkgs are sorted alphabetically by deafult, if the current sort is date, run the sort function.
	if (this.currentSort == 'date') 
	{
		this.packages.sort(function(a, b)
		{
			aTime = 0;
			bTime = 0;
			
			if (a.date) aTime = a.date;
			if (b.date) bTime = b.date;
			
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
PkgListAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'date':
			case 'alpha':
				if (this.currentSort !== event.command) 
				{
					this.currentSort = event.command;
					this.controller.stageController.swapScene('pkg-list', this.item, this.searchText, this.currentSort);
				}
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
PkgListAssistant.prototype.getDivider = function(item)
{
	// how to divide when sorting by date
	if (this.currentSort == 'date')
	{
		if (item.date) 
		{
			// a number of different date breakdowns
			var now = Math.round(new Date().getTime()/1000.0);
			if      (now - item.date <= 86400)	  return 'Today';
			else if (now - item.date <= 172800)  return 'Yesterday';
			else if (now - item.date <= 604800)  return 'This Week';
			else if (now - item.date <= 1209600) return 'Last Week';
			else if (now - item.date <= 2629744) return 'This Month';
			else if (now - item.date <= 5259488) return 'Last Month';
			else return 'Older'; // for things 2 months or older
		}
		else
		{
			// not all feeds will supply a last-updated value (or pkgs installed by the user not in any feeds)
			return 'Unknown';
		}
	}
	// how to divide when sorted by alpha (only used by the all list)
	else if (this.currentSort == 'alpha' && this.item.pkgType == 'all')
	{
		var firstChar = item.title.substr(0, 1);
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

PkgListAssistant.prototype.listTapHandler = function(event)
{
	// push pkg view scene with this items info
	this.controller.stageController.pushScene('pkg-view', event.item, this);
}

PkgListAssistant.prototype.menuTapHandler = function(event)
{
	// build group list model
	var groupMenu =  packages.getGroups(this.item);
	
	alert(this.item.pkgGroup);
	
	// open category selector
	this.controller.popupSubmenu(
	{
		onChoose: function(value)
		{
			if (value === null || value == "" || value == undefined ||
				(this.item.pkgValue == 'group' && this.item.pkgGroup == value)) 
			{
				return;
			}
			else
			{
				this.item.pkgGroup = value;
				if (this.item.pkgValue == 'group')
				{
					this.controller.stageController.swapScene('pkg-list', this.item);
				}
				return;
			}
			
		},
		popupClass: 'group-popup',
		toggleCmd: this.item.pkgGroup,
		placeNear: event.target,
		items: groupMenu
	});
}

PkgListAssistant.prototype.setReload = function()
{
	this.reloadList = true;
}

PkgListAssistant.prototype.activate = function(event)
{
	if (this.reloadList) 
	{
		this.updateList();
		this.updateCommandMenu();
	}
}

PkgListAssistant.prototype.deactivate = function(event) {}

PkgListAssistant.prototype.cleanup = function(event)
{
	// clean up our listeners
	Mojo.Event.stopListening(this.controller.sceneElement, Mojo.Event.keypress, this.keyHandler);
	Mojo.Event.stopListening(this.controller.get('searchText'), Mojo.Event.propertyChange, this.filterDelayHandler.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('pkgList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('groupSource'), Mojo.Event.tap, this.menuTapHandler.bindAsEventListener(this));
}
