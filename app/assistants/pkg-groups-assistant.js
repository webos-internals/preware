function PkgGroupsAssistant(item)
{
	// the item passed by the parent scene
	this.item = item;
	
	// setup blank list model
	this.listModel = {items:[]};
	
	// setup command menu
	this.cmdMenuModel =
	{
		label: $L('Menu'), 
		items: []
	};
}

PkgGroupsAssistant.prototype.setup = function()
{
	// setup list title
	this.controller.get('groupTitle').innerHTML = this.item.name;
	
	// build list model
	this.buildList();
	
	// pop the scene if its 
	if (this.listModel.items.length < 1)
	{
		this.controller.stageController.popScene();
	}
	
	// setup list widget
	this.controller.setupWidget('groupList', { itemTemplate: "pkg-groups/rowTemplate", swipeToDelete: false, reorderable: false }, this.listModel);
	Mojo.Event.listen(this.controller.get('groupList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	
	// Set up a command menu
	this.updateCommandMenu(true);
	
	// setup sort command menu widget
	this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
	
	// setup menu that is no menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, { visible: false });
}

PkgGroupsAssistant.prototype.listTapHandler = function(event)
{
	this.item.pkgGroup = event.item.name;
	this.controller.stageController.pushScene('pkg-list', this.item);
}

PkgGroupsAssistant.prototype.updateCommandMenu = function(skipUpdate)
{
	
	// clear current model list
	this.cmdMenuModel.items = [];
	
	// this is to put space around the icons
	this.cmdMenuModel.items.push({});
	
	
	// start our sort item
	var sortItem = {items: [], toggleCmd: this.item.list};
	
	// push the sort selector for type grouping
	if (this.item.pkgType == 'all') 
	{
		sortItem.items.push({label: $L('Types'), command: 'types'});
	}
	
	// push default sort selectors
	sortItem.items.push({label: $L('Categories'), command: 'categories'});
	sortItem.items.push({label: $L('Feeds'), command: 'feeds'});
	
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
}

PkgGroupsAssistant.prototype.buildList = function()
{
	this.listModel.items = [];
	
	this.listModel.items = packages.getGroups(this.item);
}

// handle sort toggle commands
PkgGroupsAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'categories':
			case 'feeds':
			case 'types':
				if (this.item.list !== event.command) 
				{
					this.item.list = event.command;
					this.controller.stageController.swapScene('pkg-groups', this.item);
				}
				break;
				
			default:
				break;
		}
	}
};

PkgGroupsAssistant.prototype.activate = function(event) {}

PkgGroupsAssistant.prototype.deactivate = function(event) {}

PkgGroupsAssistant.prototype.cleanup = function(event)
{
	// clean up our listeners
	Mojo.Event.stopListening(this.controller.get('groupList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
}
