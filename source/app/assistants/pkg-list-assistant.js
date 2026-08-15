function PkgListAssistant(item, searchText, currentSort)
{
	// the item passed by the parent scene
	this.item = item;
	
	// this is true when a package action is in progress
	this.active = false;
	
	/*
	alert('-- list --');
	alert('group: '+this.item.pkgGroup)
	alert('list:  '+this.item.pkgList);
	alert('type:  '+this.item.pkgType);
	alert('feed:  '+this.item.pkgFeed);
	alert('cat:   '+this.item.pkgCat);
	*/
	
	// this holds the list (when we filter, this is what we search)
	this.packages = [];
	
	// holds the model that has been filtered for use by the list
	this.listModel = {items:[]};
	
	// setup command menu
	this.cmdMenuModel = {items:[]};
	
	// holds group menu dropdown info
	this.groupMenu = false;
	
	// holds the search 
	this.searchTimer = false;
	this.searching = false;
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
		else if (prefs.get().listSort == 'price') 
		{
			this.currentSort = 'price';
		}
		else // listSort is empty or 'default'
		{
		    if ((this.item.pkgList == 'installed')  || (this.item.pkgList == 'saved')) {
			this.currentSort = 'alpha';
		    }
		    else if ((this.item.pkgCat == 'all') ||
			     ((this.item.pkgFeed != 'all') && (this.item.pkgFeed != ''))) {
			this.currentSort = 'date';
		    }
		    else {
			this.currentSort = 'alpha';
		    }
		}
	}
	
	// initial multibutton option
	this.multiButton = (packages.stagedPkgs === false ? '' : 'multi');
	
	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: $L("Preferences"),
				command: 'do-prefs'
			},
			{
				label: $L("Update Feeds"),
				command: 'do-update'
			},
			{
				label: $L("Manage Feeds"),
				command: 'do-feeds'
			},
			{
				label: $L("Luna Manager"),
				command: 'do-luna'
			},
			{
				label: $L("Help"),
				command: 'do-help'
			}
		]
	};
	
	// load stayawake class
	this.stayAwake = new stayAwake();
};

PkgListAssistant.prototype.setup = function()
{
	this.controller.get('groupTitle').innerHTML = $L("None");
	
	try 
	{
		// clear log so it only shows stuff from this scene
		IPKGService.logClear();
		
		// get elements
		this.titleElement =			this.controller.get('listTitle');
		this.headerElement =		this.controller.get('header');
		this.listElement =			this.controller.get('pkgList');
		this.searchElement =		this.controller.get('searchText');
		this.groupTitleElement =	this.controller.get('groupTitle');
		this.groupSourceElement =	this.controller.get('groupSource');
		this.searchCountElement =	this.controller.get('searchCountElement');
		this.searchCount =			this.controller.get('searchCount');
		this.searchButtonElement =	this.controller.get('searchButton');
		
		// handlers
		this.listTapHandler =		this.listTap.bindAsEventListener(this);
		this.listSwipeHandler =		this.listSwipe.bindAsEventListener(this);
		this.pkgCheckedHandler =	this.pkgChecked.bindAsEventListener(this);
		this.menuTapHandler =		this.menuTap.bindAsEventListener(this);
		this.searchButtonHandler =	this.searchButtonPressed.bindAsEventListener(this);
		this.filterDelayHandler =	this.filterDelay.bindAsEventListener(this);
		this.keyHandler =			this.keyTest.bindAsEventListener(this);
		this.searchFunction =		this.filter.bind(this);
		
		// setup back tap
		if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') == 0 ||
			Mojo.Environment.DeviceInfo.modelNameAscii == 'Emulator')
			this.backElement = this.controller.get('back');
		else
			this.backElement = this.controller.get('listTitle');
		this.searchBackElement = this.controller.get('searchBack');
		this.backTapHandler = this.backTap.bindAsEventListener(this);
		this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);
		this.controller.listen(this.searchBackElement, Mojo.Event.tap, this.backTapHandler);

		// setup list title
		this.titleElement.innerHTML = this.item.name;
		
		// change scene if this is a single group
		if (this.item.pkgGroup)
		{
			this.groupMenu = packages.getGroups(this.item);
			
			// if the list is more then one (or two in caegories case) don't display it
			if ((this.groupMenu.length == 1 ||
				(this.groupMenu.length == 2 && this.item.pkgGroup[0] == 'categories'))) {}
			else
			{
				// update submenu styles
				this.groupSourceElement.style.display = 'inline';
				
				if (this.item.pkgGroup[0]		== 'types')			this.groupTitleElement.innerHTML = this.item.pkgType;
				else if (this.item.pkgGroup[0]	== 'feeds')			this.groupTitleElement.innerHTML = this.item.pkgFeed;
				else if (this.item.pkgGroup[0]	== 'categories')	this.groupTitleElement.innerHTML = this.item.pkgCat;
				
				// listen for tap to open menu
				this.controller.listen(this.groupSourceElement, Mojo.Event.tap, this.menuTapHandler);
			}
		}
		
		// setup menu
		this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
		
		// update list
		this.updateList(true);
		
		// setup list widget
		this.setupList();
		
		// listen for list tap
		this.controller.listen(this.listElement, Mojo.Event.listTap, this.listTapHandler);
		
		// listen for delete
		this.controller.listen(this.listElement, Mojo.Event.listDelete, this.listSwipeHandler);
		
		// listen for checkbox action
		this.controller.listen(this.listElement, Mojo.Event.propertyChanged, this.pkgCheckedHandler);
		
		// Set up a command menu
		this.updateCommandMenu(true);
		
		// setup sort command menu widget
		this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
		
		// search spinner widget
		this.spinnerModel = {spinning: false};
		this.controller.setupWidget('spinner', {spinnerSize: 'small'}, this.spinnerModel);
		
		// status spinner widget
		this.statusSpinnerModel = {spinning: false};
		this.controller.setupWidget('statusSpinner', {spinnerSize: 'large'}, this.statusSpinnerModel);
		
		// search model & attributes
		this.searchAttributes =
		{
			focus: false,
			autoFocus: false,
			changeOnKeyPress: true,
			textCase: Mojo.Widget.steModeLowerCase
		};
		this.searchModel = { value: this.searchText };
		
		// setup search widget
		this.controller.setupWidget('searchText', this.searchAttributes, this.searchModel);
		
		// listen for type
		this.controller.listen(this.searchElement, Mojo.Event.propertyChange, this.filterDelayHandler);
		
		// listen for button
		this.controller.listen(this.searchButtonElement, Mojo.Event.tap, this.searchButtonHandler);
		
		// if there isnt already search text, start listening
		if (this.searchText == '') 
		{
			this.controller.listen(this.controller.sceneElement, Mojo.Event.keypress, this.keyHandler);
		}
		// if not, show the text box
		else
		{
			this.headerElement.style.display = 'none';
			this.searchElement.style.display = 'inline';
			this.searchCountElement.style.display = 'inline';
			this.searchBackElement.style.display = 'inline';
			//this.searchElement.mojo.setValue(this.searchText);
		}
		
		// set this scene's default transition
		this.controller.setDefaultTransition(Mojo.Transition.zoomFade);
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'pkg-list#setup');
		this.alertMessage('pkg-list Exception: ' + e);
	}
};
PkgListAssistant.prototype.activate = function(event)
{
	if (this.firstActivate)
	{
		this.updateList();
	}
	this.firstActivate = true;
	
	// hide checkboxes if we don't need to see them
	if (this.multiButton == '')
	{
		for (var p = 0; p < this.packages.length; p++)
		{
			if (this.controller.get(this.packages[p].pkgNum+'_checkbox'))
			{
				this.controller.get(this.packages[p].pkgNum+'_checkbox').style.display = 'none';
			}
		}
	}
};

PkgListAssistant.prototype.listTap = function(event)
{
	// push pkg view scene with this items info
	this.controller.stageController.pushScene('pkg-view', event.item, this);
};
PkgListAssistant.prototype.listSwipe = function(event)
{
	// put code here to handle list item deletion.
	// event.item is the data that row is created with

	// Delete an item from the Saved Package List
	if (this.item.pkgList == 'saved') {
		packages.packages[event.item.pkgNum].isInSavedList = false;
		packages.savePackageList();
		event.preventDefault();
		this.updateList();
	}
};
PkgListAssistant.prototype.setupList = function()
{
	// setup list attributes
	this.listAttributes = 
	{
		itemTemplate: "pkg-list/rowTemplate",
		swipeToDelete: false, //true,
		reorderable: false,
		onItemRendered: this.itemRendered.bind(this)
	};

	if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') == 0 ||
		Mojo.Environment.DeviceInfo.modelNameAscii == 'Emulator') {
		this.listAttributes.renderLimit = 32; // show all rows on TouchPad
	}

	// swipe to delete from saved package list
	if (this.item.pkgList == 'saved') {
		this.listAttributes.swipeToDelete = true;
	}

	// setp dividers templates
	if (this.currentSort == 'date') 
	{
		this.listAttributes.dividerTemplate = 'pkg-list/rowDateDivider';
	}
	else if (this.currentSort == 'price') 
	{
		this.listAttributes.dividerTemplate = 'pkg-list/rowPriceDivider';
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
};
PkgListAssistant.prototype.updateList = function(skipUpdate)
{
	// clear the current list
	this.packages = [];
	
	// load pkg list
	this.packages = packages.getPackages(this.item);
	
	// if there are no pkgs to list, pop the scene (later, we may replace this with a "nothing to list" message)
	if ((this.packages.length < 1) && (this.item.pkgList != 'saved'))
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
			toReturn = 0;
			
			if (a.date) aTime = a.date;
			if (b.date) bTime = b.date;
			toReturn = bTime - aTime;
			
			try {
				if (toReturn == 0)
					{	// if date is the same, sort by title so things aren't jumbled
						aTitle = a.title.toLowerCase();
						bTitle = b.title.toLowerCase();
						toReturn = ((aTitle < bTitle) ? -1 : ((aTitle > bTitle) ? 1 : 0));
						if (toReturn == 0)
							{	// if the titles are also the exact same!
								aId = a.pkg;
								bId = b.pkg;
								toReturn = ((aId < bId) ? -1 : ((aId > bId) ? 1 : 0));
								// if its still 0 at this point, screw it
								}
					}
			}
			catch (e) {
				Mojo.Log.logException(e, 'pkg-list#updateList/'+a.pkg+'/'+b.pkg);
				toReturn = 0;
			}
			
			return toReturn
		});
	}
	else if (this.currentSort == 'price') 
	{
		this.packages.sort(function(a, b)
		{
			aPrice = 0;
			bPrice = 0;
			toReturn = 0;
			
			if (a.price) aPrice = a.price;
			if (b.price) bPrice = b.price;
			toReturn = aPrice - bPrice;
			
			try {
				if (toReturn == 0)
					{	// if price is the same, sort by title so things aren't jumbled
						aTitle = a.title.toLowerCase();
						bTitle = b.title.toLowerCase();
						toReturn = ((aTitle < bTitle) ? -1 : ((aTitle > bTitle) ? 1 : 0));
						if (toReturn == 0)
							{	// if the titles are also the exact same!
								aId = a.pkg;
								bId = b.pkg;
								toReturn = ((aId < bId) ? -1 : ((aId > bId) ? 1 : 0));
								// if its still 0 at this point, screw it
							}
					}
			}
			catch (e) {
				Mojo.Log.logException(e, 'pkg-list#updateList/'+a.pkg+'/'+b.pkg);
				toReturn = 0;
			}
			
			return toReturn
		});
	}
	
	// call filter function to update list 
	this.filter(skipUpdate);
};

PkgListAssistant.prototype.pkgChecked = function(event)
{
	// make sure this is a checkbox (this event will also get garbage from a package-swipe)
	if (event.property == 'value' && event.target.id.include('_checkbox')) 
	{
		//alert(event.target.id);
	}
};

PkgListAssistant.prototype.searchButtonPressed = function(event)
{
	event.stop();
	// display and focus search field
	this.controller.stopListening(this.controller.sceneElement, Mojo.Event.keypress, this.keyHandler);
	this.headerElement.style.display = 'none';
	this.searchElement.style.display = 'inline';
	this.searchCountElement.style.display = 'inline';
	this.searchBackElement.style.display = 'inline';
	this.searchElement.mojo.focus();
};

PkgListAssistant.prototype.keyTest = function(event)
{
	// if its a valid character
	if (Mojo.Char.isValidWrittenChar(event.originalEvent.charCode)) 
	{
		// display and focus search field
		this.controller.stopListening(this.controller.sceneElement, Mojo.Event.keypress, this.keyHandler);
		this.headerElement.style.display = 'none';
		this.searchElement.style.display = 'inline';
		this.searchCountElement.style.display = 'inline';
		this.searchBackElement.style.display = 'inline';
		this.searchElement.mojo.focus();
	}
};
PkgListAssistant.prototype.filterDelay = function(event)
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
		this.searchElement.mojo.blur();
		this.searchElement.style.display = 'none';
		this.searchCountElement.style.display = 'none';
		this.searchBackElement.style.display = 'none';
		this.headerElement.style.display = 'inline';
		this.controller.listen(this.controller.sceneElement, Mojo.Event.keypress, this.keyHandler);
		this.searchFunction();
	}
	else
	{
		// start spinner
		this.spinnerModel.spinning = true;
		this.controller.modelChanged(this.spinnerModel);
		this.searchCountElement.style.display = 'none';
		
		// set so the list update will reaveal top
		this.searching = true;
		
		// start delay timer to one second
		this.searchTimer = setTimeout(this.searchFunction, 1000);
	}
};
PkgListAssistant.prototype.filter = function(skipUpdate)
{
	this.listModel.items = [];
	
	//alert(this.searchText);
	
	for (var p = 0; p < this.packages.length; p++) 
	{
		var pushIt = false;
		
		if (this.searchText == '')
		{
			this.packages[p].displayTitle = this.packages[p].title;
			pushIt = true;
		}
		
		if (this.packages[p].title)
		{
			if (this.packages[p].title.toLowerCase().include(this.searchText.toLowerCase()))
			{
	     		this.packages[p].displayTitle = this.packages[p].title.replace(new RegExp('(' + this.searchText + ')', 'gi'), '<span class="highlight">$1</span>');
				pushIt = true;
			}
		}
		
		if (prefs.get().searchDesc && this.packages[p].description)
		{
			if (this.packages[p].description.toLowerCase().include(this.searchText.toLowerCase()))
			{
				this.packages[p].displayTitle = this.packages[p].title;
				pushIt = true;
			}
		}
		
		if (pushIt) 
		{
			this.listModel.items.push(this.packages[p]);
		}
	}
	
	// update count
	this.searchCount.update(this.listModel.items.length);
	
	// update list widget if skipUpdate isn't set to true (meaning, its called in the setup function and not activate)
	if (!skipUpdate) 
	{
		// reload list
		this.listElement.mojo.noticeUpdatedItems(0, this.listModel.items);
	 	this.listElement.mojo.setLength(this.listModel.items.length);
		if (this.searching)
		{
			this.listElement.mojo.revealItem(0, true);
			this.searching = false;
		}
		
		// show count
		if (this.searchText != '')
		{
			this.searchCountElement.style.display = 'inline';
		}
		
		// stop spinner
		this.spinnerModel.spinning = false;
		this.controller.modelChanged(this.spinnerModel);
	}
	
};

PkgListAssistant.prototype.getDivider = function(item)
{
	// how to divide when sorting by date
	if (this.currentSort == 'date')
	{
		if (item.date) 
		{
			// a number of different date breakdowns
			var now = Math.round(new Date().getTime()/1000.0);
			if      (now - item.date <= 86400)		return 'Today';
			else if (now - item.date <= 172800)		return 'Yesterday';
			else if (now - item.date <= 604800)		return 'This Week';
			else if (now - item.date <= 1209600)	return 'Last Week';
			else if (now - item.date <= 2629744)	return 'This Month';
			else if (now - item.date <= 5259488)	return 'Last Month';
			else return 'Older'; // for things 2 months or older
		}
		else
		{
			// not all feeds will supply a last-updated value (or pkgs installed by the user not in any feeds)
			return 'Unknown';
		}
	}
	// how to divide when sorting by price
	else if (this.currentSort == 'price')
	{
		if (item.price) 
		{
			price = parseFloat(item.price);
			// a number of different price breakdowns
			if      (price == 0.00)		return 'Free';
			else if (price < 1.00)		return 'Less than $1';
			else if (price < 2.00)		return 'Less than $2';
			else if (price < 5.00)		return 'Less than $5';
			else if (price < 10.00)		return 'Less than $10';
			else return '$10 or greater';
		}
		else
		{
			// not all feeds will supply a price
			return 'Free';
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
};
PkgListAssistant.prototype.itemRendered = function(listWidget, itemModel, itemNode)
{
	packages.packages[itemModel.pkgNum].iconFill(this.controller.get('icon-' + itemModel.pkgNum));
};

PkgListAssistant.prototype.menuTap = function(event)
{
	var selectedCmd = false;
	if (this.item.pkgGroup[0]		== 'types')			selectedCmd = this.item.pkgType;
	else if (this.item.pkgGroup[0]	== 'feeds')			selectedCmd = this.item.pkgFeed;
	else if (this.item.pkgGroup[0]	== 'categories')	selectedCmd = this.item.pkgCat;
	
	// open category selector
	this.controller.popupSubmenu(
	{
		onChoose: function(value)
		{
			if (value === null || value == "" || value == undefined) return;
			if (this.item.pkgGroup[0]		== 'types' &&
				this.item.pkgType			== value) return;
			else if (this.item.pkgGroup[0]	== 'feeds' &&
					 this.item.pkgFeed		== value) return;
			else if (this.item.pkgGroup[0]	== 'categories' &&
					 this.item.pkgCat		== value) return;
			
			if (this.item.pkgGroup[0]		== 'types')			this.item.pkgType	= value;
			else if (this.item.pkgGroup[0]	== 'feeds')			this.item.pkgFeed	= value;
			else if (this.item.pkgGroup[0]	== 'categories')	this.item.pkgCat	= value;
			
			//this.controller.stageController.swapScene('pkg-list', this.item);
			this.controller.stageController.swapScene({name: 'pkg-list', transition: Mojo.Transition.crossFade}, this.item);
			return;
			
		},
		popupClass: 'group-popup',
		toggleCmd: selectedCmd,
		placeNear: event.target,
		items: this.groupMenu
	});
};

PkgListAssistant.prototype.updateCommandMenu = function(skipUpdate)
{
	
	// clear current model list
	this.cmdMenuModel.items = [];
		
	// this is to put space around the icons
	this.cmdMenuModel.items.push({});
	
	if (this.listModel.items.length > 1)
	{

	    // if saved, push the install all buttons
	    if (this.item.pkgList == 'saved')
		{
			this.cmdMenuModel.items.push({label: $L("Install All"), command: 'do-installSaved'});
	    }
	
	    // if updates, lets push the update all button
	    if (this.item.pkgList == 'updates')
		{
			this.cmdMenuModel.items.push({label: $L("Update All"), command: 'do-updateAll'});
	    }
		
		// push multi install button, when not in a "special" list
		if (this.item.pkgList != 'saved' &&
			this.item.pkgList != 'updates' &&
			this.item.pkgList != 'installed')
		{
			//this.cmdMenuModel.items.push({items: [{icon: "icon-filter-multi", command: 'multi'}], toggleCmd: this.multiButton});
		}
	
	    // push the sort selector
	    if (packages.hasPrices && (this.item.pkgList != 'saved'))
		{
			// with prices if the packages have any
			this.cmdMenuModel.items.push({items: [{icon: "icon-filter-alpha", command: 'alpha'}, {icon: "icon-filter-date",  command: 'date'}, {icon: "icon-filter-price",  command: 'price'}], toggleCmd: this.currentSort});
	    }
	    else
		{
			// and without if there are no prices
			this.cmdMenuModel.items.push({items: [{icon: "icon-filter-alpha", command: 'alpha'}, {icon: "icon-filter-date",  command: 'date'}], toggleCmd: this.currentSort});
	    }
	}

	// if saved, push the refresh button
	if (this.item.pkgList == 'saved')
	{
	    this.cmdMenuModel.items.push({label: $L("Update"), command: 'do-updateList'});
	}
	
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
};

PkgListAssistant.prototype.backTap = function(event)
{
	if (!this.active) {
		this.controller.stageController.popScene();
	}
};

PkgListAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'date':
			case 'alpha':
			case 'price':
				if (this.currentSort !== event.command) 
				{
					this.currentSort = event.command;
					//this.controller.stageController.swapScene('pkg-list', this.item, this.searchText, this.currentSort);
					this.controller.stageController.swapScene({name: 'pkg-list', transition: Mojo.Transition.crossFade}, this.item, this.searchText, this.currentSort);
				}
				break;
				
			case 'multi':
				// show toggles & start multi
				if (this.multiButton == '')
				{
					this.multiButton = 'multi';
					for (var p = 0; p < this.packages.length; p++)
					{
						if (this.controller.get(this.packages[p].pkgNum+'_checkbox'))
						{
							this.controller.get(this.packages[p].pkgNum+'_checkbox').style.display = '';
						}
					}
				}
				// stop toggling, pop multi-install alert
				else
				{
					this.multiButton = '';
					for (var p = 0; p < this.packages.length; p++)
					{
						if (this.controller.get(this.packages[p].pkgNum+'_checkbox'))
						{
							this.controller.get(this.packages[p].pkgNum+'_checkbox').style.display = 'none';
						}
					}
					
				}
				break;
				
			case 'do-updateAll':
				var allList = [];
				var hasPreware = false;
				for (var p = 0; p < this.packages.length; p++)
				{
					if (this.packages[p].pkg == 'org.webosinternals.preware') 
					{
						hasPreware = this.packages[p].pkgNum;
					}
					else
					{
						if (!this.packages[p].appCatalog || prefs.get().useTuckerbox)
						{
							var deps = packages.packages[this.packages[p].pkgNum].getDependenciesRecursive(true);
							if (deps.length > 0) 
							{
								for (var d = 0; d < deps.length; d++)
								{
									if (allList.indexOf(deps[d]) === -1) 
									{
										allList.push(deps[d]);
									}
								}
							}
							if (allList.indexOf(this.packages[p].pkgNum) === -1) 
							{
								allList.push(this.packages[p].pkgNum);
							}
						}
					}
				}
				if (hasPreware !== false)
				{
					var deps = packages.packages[hasPreware].getDependenciesRecursive(true);
					if (deps.length > 0) 
					{
						for (var d = 0; d < deps.length; d++)
						{
							if (allList.indexOf(deps[d]) === -1) 
							{
								allList.push(deps[d]);
							}
						}
					}
					allList.push(hasPreware);
				}
				if (allList.length > 0)
				{
					if (allList.length > this.packages.length)
					{
						packages.checkMultiListInstall(allList, this);
					}
					else
					{
						packages.startMultiInstall(false, allList, this);
					}
				}
				break;
				
			case 'do-installSaved':
				var allList = [];
				for (var p = 0; p < this.packages.length; p++) {
				    var gblPkg = packages.packages[this.packages[p].pkgNum];
				    if (!gblPkg.isInstalled) {
					if (!gblPkg.appCatalog || prefs.get().useTuckerbox) {
					    var deps = gblPkg.getDependenciesRecursive(true);
					    if (deps.length > 0) {
						for (var d = 0; d < deps.length; d++) {
						    if (allList.indexOf(deps[d]) === -1) {
							allList.push(deps[d]);
						    }
						}
					    }
					    if (allList.indexOf(this.packages[p].pkgNum) === -1) {
						allList.push(this.packages[p].pkgNum);
					    }
					}
				    }
				}
				if (allList.length > 0) {
				    packages.startMultiInstall(false, allList, this);
				}
				break;
				
			case 'do-updateList':
				packages.loadSavedDefault(function(){Mojo.Controller.getAppController().showBanner({
								 messageText:$L("Preware: Wrote Saved Package List"),
								 icon:'miniicon.png'
							 } , {source:'saveNotification'});});
				this.updateList();
				break;
				
			case 'do-prefs':
				this.controller.stageController.pushScene('preferences');
				break;
	
			case 'do-update':
				this.controller.stageController.swapScene({name: 'update', transition: Mojo.Transition.crossFade}, 'pkg-list', true, this.item, this.searchText, this.currentSort);
				break;
				
			case 'do-feeds':
				this.controller.stageController.pushScene('configs');
				break;
	
			case 'do-showLog':
				this.controller.stageController.pushScene({name: 'ipkg-log', disableSceneScroller: true});
				break;
				
			case 'do-luna':
				this.controller.stageController.pushScene('luna');
				break;
				
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
				
			default:
				break;
		}
	}
};

PkgListAssistant.prototype.alertMessage = function(message)
{
	this.controller.showAlertDialog(
	{
	    title:				'Preware',
		allowHTMLMessage:	true,
	    message:			removeAuth(message),
	    choices:			[{label:$L("Ok"), value:''}],
		onChoose:			function(value){}
    });
};

/* 
 * this functions are called by the package model when doing stuff
 * anywhere the package model will be installing stuff these functions are needed
 */
PkgListAssistant.prototype.startAction = function()
{
	// this is the start of the stayawake class to keep it awake till we're done with it
	this.stayAwake.start();
	
	// set this to stop back gesture
	this.active = true;
	
	// start action is to hide this menu
	this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
	
	// to update the spinner
	this.statusSpinnerModel.spinning = true;
	this.controller.modelChanged(this.statusSpinnerModel);
	
	// and to hide the data while we do the action
	this.controller.get('pkgSpacer').style.display = "none";
	this.controller.get('pkgListContainer').style.display = "none";
	
	// and make sure the scene scroller is at the top
	this.controller.sceneScroller.mojo.scrollTo(0, 0);
};
PkgListAssistant.prototype.displayAction = function(msg)
{
	this.controller.get('spinnerStatus').innerHTML = msg;
};
PkgListAssistant.prototype.endAction = function()
{
	// we're done loading so let the device sleep if it needs to
	this.stayAwake.end();
	
	// allow back gesture again
	this.active = false;
	
	// end action action is to stop the spinner
	this.statusSpinnerModel.spinning = false;
	this.controller.modelChanged(this.statusSpinnerModel);
	
	// update the screens data
	if (!this.simpleMessageUp) this.updateList();
	
	// show the data
	this.controller.get('pkgSpacer').style.display = "inline";
	this.controller.get('pkgListContainer').style.display = "inline";
	
	// and to show this menu again
	this.updateCommandMenu();
};
PkgListAssistant.prototype.simpleMessage = function(message)
{
	this.simpleMessageUp = true;
	this.controller.showAlertDialog(
	{
	    title:				$L("Packages"),
		allowHTMLMessage:	true,
		preventCancel:		true,
		message:			removeAuth(message),
	    choices:			[{label:$L("Ok"), value:'ok'}],
		onChoose:			this.simpleMessageOK.bindAsEventListener(this)
    });
};
PkgListAssistant.prototype.simpleMessageOK = function(value)
{
	if (value == 'ok')
	{
		this.updateList();
	}
	this.simpleMessageUp = false;
};
PkgListAssistant.prototype.actionMessage = function(message, choices, actions)
{
	this.controller.showAlertDialog(
	{
	    title:				$L("Packages"),
		allowHTMLMessage:	true,
		preventCancel:		true,
	    message:			removeAuth(message),
	    choices:			choices,
	    onChoose:			actions
    });
};
/* end functions called by the package model */


PkgListAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening(this.controller.sceneElement,	Mojo.Event.keypress,		this.keyHandler);
	this.controller.stopListening(this.searchElement,			Mojo.Event.propertyChange,	this.filterDelayHandler);
	this.controller.stopListening(this.listElement,				Mojo.Event.listTap,			this.listTapHandler);
	this.controller.stopListening(this.listElement,				Mojo.Event.listDelete, 		this.listSwipeHandler);
	this.controller.stopListening(this.listElement,				Mojo.Event.propertyChanged, this.pkgCheckedHandler);
	this.controller.stopListening(this.groupSourceElement,		Mojo.Event.tap,				this.menuTapHandler);
	this.controller.stopListening(this.backElement,				Mojo.Event.tap,				this.backTapHandler);
};

// Local Variables:
// tab-width: 4
// End:
