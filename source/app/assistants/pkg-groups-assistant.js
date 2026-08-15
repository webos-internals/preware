function PkgGroupsAssistant(item)
{
	// the item passed by the parent scene
	this.item = item;
	
	/*
	alert('-- group --');
	alert('group: '+this.item.pkgGroup)
	alert('list:  '+this.item.pkgList);
	alert('type:  '+this.item.pkgType);
	alert('feed:  '+this.item.pkgFeed);
	alert('cat:   '+this.item.pkgCat);
	*/
	
	// remove this style business or it will screw up everything as its passed along
	this.item.style = false;
	
	// setup blank list model
	this.listModel = {items:[]};
	
	// setup command menu
	this.cmdMenuModel = {items:[]};
	
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
};

PkgGroupsAssistant.prototype.setup = function()
{
	// get elements
	this.titleElement =		this.controller.get('groupTitle');
	this.listElement =		this.controller.get('groupList');
	
	// handlers
	this.listTapHandler =	this.listTap.bindAsEventListener(this);
	
	// setup back tap
	if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') == 0 ||
		Mojo.Environment.DeviceInfo.modelNameAscii == 'Emulator')
		this.backElement = this.controller.get('back');
	else
		this.backElement = this.controller.get('header');
	this.backTapHandler = this.backTap.bindAsEventListener(this);
	this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);

	// setup list title
	this.titleElement.innerHTML = this.item.name;
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	// build list
	this.buildList(true);
	
	// setup list widget
	this.controller.setupWidget('groupList', { itemTemplate: "pkg-groups/rowTemplate", swipeToDelete: false, reorderable: false }, this.listModel);
	this.controller.listen(this.listElement, Mojo.Event.listTap, this.listTapHandler);
	
	// Set up a command menu
	this.updateCommandMenu(true);
	
	// setup sort command menu widget
	this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
	
	// set this scene's default transition
	this.controller.setDefaultTransition(Mojo.Transition.zoomFade);
};
PkgGroupsAssistant.prototype.activate = function(event)
{
	
	if (this.firstActivate)
	{
		this.buildList();
	}
	this.firstActivate = true;
	
};

PkgGroupsAssistant.prototype.listTap = function(event, swap)
{
	try 
	{
		var newItem =
		{
			name:     this.item.name,
			pkgGroup: this.item.pkgGroup,
			pkgList:  this.item.pkgList,
			pkgType:  this.item.pkgType,
			pkgFeed:  this.item.pkgFeed,
			pkgCat:   this.item.pkgCat
		};
		
		switch (this.item.pkgGroup[0])
		{
			case 'types':
				newItem.pkgType = event.item.name;
				break;
			case 'feeds':
				newItem.pkgFeed = event.item.name;
				break;
			case 'categories':
				newItem.pkgCat  = event.item.name;
				break;
			default: break; // this really, really shouldn't ever happen
		}
		
		if (newItem.pkgType && newItem.pkgCat || newItem.pkgType && newItem.pkgFeed && newItem.pkgCat)
		{
			if (swap) 
			{
				//this.controller.stageController.swapScene('pkg-list', newItem);
				this.controller.stageController.swapScene({name: 'pkg-list', transition: Mojo.Transition.crossFade}, newItem);
			}
			else 
			{
				this.controller.stageController.pushScene('pkg-list', newItem);
			}
		}
		else
		{
			var catFound = false
			var newPkgGroup = [];
			
			if (newItem.pkgGroup.length > 1) 
			{
				for (var g = 1; g < newItem.pkgGroup.length; g++) 
				{
					newPkgGroup.push(newItem.pkgGroup[g]);
					if (newItem.pkgGroup[g] == 'categories')
					{
						catFound = true;
					}
				}
			}
			
			if (!catFound)
			{
				if (newItem.pkgType) 
				{
					var newPkgGroup = ['categories'];
				}
				else
				{
					var newPkgGroup = [];
				}
				if (newItem.pkgGroup.length > 1) 
				{
					for (var g = 1; g < newItem.pkgGroup.length; g++) 
					{
						newPkgGroup.push(newItem.pkgGroup[g]);
					}
				}
			}
			
			newItem.pkgGroup = newPkgGroup;
			
			if (swap) 
			{
				//this.controller.stageController.swapScene('pkg-groups', newItem);
				this.controller.stageController.swapScene({name: 'pkg-groups', transition: Mojo.Transition.crossFade}, newItem);
			}
			else 
			{
				this.controller.stageController.pushScene('pkg-groups', newItem);
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'pkg-groups#listTap');
		this.alertMessage('pkg-groups Exception: ' + e);
	}
};
PkgGroupsAssistant.prototype.buildList = function(skipUpdate)
{
	this.listModel.items = [];
	this.listModel.items = packages.getGroups(this.item);
	
	// pop the scene if its empty
	if ((this.listModel.items.length < 1 ||
		(this.listModel.items.length < 2 && this.item.pkgGroup[0] == 'categories')))
	{
		this.controller.stageController.popScene();
	}
	else if (this.listModel.items.length == 1)
	{
		// this.listTap({item: this.listModel.items[0]}, true);
	}
	else if (this.listModel.items.length == 2 && this.item.pkgGroup[0] == 'categories')
	{
		// this.listTap({item: this.listModel.items[1]}, true);
	}
	
	if (!skipUpdate) 
	{
		this.listElement.mojo.noticeUpdatedItems(0, this.listModel.items);
		this.listElement.mojo.setLength(this.listModel.items.length);
	}
};

PkgGroupsAssistant.prototype.updateCommandMenu = function(skipUpdate)
{
	
	// clear current model list
	this.cmdMenuModel.items = [];
	
	// this is to put space around the icons
	this.cmdMenuModel.items.push({});
	
	
	// start our sort item to the first of the array
	var sortItem = {items: [], toggleCmd: this.item.pkgGroup[0]};
	
	// loop group array and add the buttons if there is more then 1 button
	if (this.item.pkgGroup.length > 1)
	{
		for (var g = 0; g < this.item.pkgGroup.length; g++)
		{
			sortItem.items.push({label: $L(this.item.pkgGroup[g].substr(0, 1).toUpperCase() + this.item.pkgGroup[g].substr(1)), command: this.item.pkgGroup[g]});
		}
		// we want to sort this so the order isn't changed when the grouping is
		sortItem.items.sort(function(a, b)
		{
			if (a.command && b.command)
			{
				return ((a.command < b.command) ? -1 : ((a.command > b.command) ? 1 : 0));
			}
			else
			{
				return -1;
			}
		});
	}
	else
	{
		this.cmdMenuModel.items.push({label: $L(this.item.pkgGroup[0].substr(0, 1).toUpperCase() + this.item.pkgGroup[0].substr(1)), command: this.item.pkgGroup[0], disabled: true});
	}
	
	// push the sort item
	this.cmdMenuModel.items.push(sortItem);
	
	
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

PkgGroupsAssistant.prototype.backTap = function(event)
{
	this.controller.stageController.popScene();
};

PkgGroupsAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'types':
			case 'feeds':
			case 'categories':
				if (this.item.pkgGroup[0] !== event.command) 
				{
					var newPkgGroup = [event.command];
					if (this.item.pkgGroup.length > 1) 
					{
						for (var g = 0; g < this.item.pkgGroup.length; g++) 
						{
							if (this.item.pkgGroup[g] !== event.command) 
							{
								newPkgGroup.push(this.item.pkgGroup[g]);
							}
						}
					}
					this.item.pkgGroup = newPkgGroup;
					//this.controller.stageController.swapScene('pkg-groups', this.item);
					this.controller.stageController.swapScene({name: 'pkg-groups', transition: Mojo.Transition.crossFade}, this.item);
				}
				break;
			
			case 'do-prefs':
				this.controller.stageController.pushScene('preferences');
				break;
			
			case 'do-update':
				this.controller.stageController.swapScene({name: 'update', transition: Mojo.Transition.crossFade}, 'pkg-groups', true, this.item);
				break;
			
			case 'do-feeds':
				this.controller.stageController.pushScene('configs');
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

PkgGroupsAssistant.prototype.alertMessage = function(message)
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

PkgGroupsAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening(this.listElement, Mojo.Event.listTap, this.listTapHandler);
	this.controller.stopListening(this.backElement, Mojo.Event.tap, this.backTapHandler);
};

// Local Variables:
// tab-width: 4
// End:
