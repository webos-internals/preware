function AppGroupsAssistant(item)
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

AppGroupsAssistant.prototype.setup = function()
{
	// build list model
	this.buildList();
	
	// pop the scene if its 
	if (this.listModel.items.length < 1)
	{
		this.controller.stageController.popScene();
	}
	
	// setup list widget
	this.controller.setupWidget('groupList', { itemTemplate: "app-groups/rowTemplate", swipeToDelete: false, reorderable: false }, this.listModel);
	Mojo.Event.listen(this.controller.get('groupList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	
	// Set up a command menu
	this.updateCommandMenu(true);
	
	// setup sort command menu widget
	this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
	
	// setup menu that is no menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, { visible: false });
}

AppGroupsAssistant.prototype.listTapHandler = function(event)
{
	if (this.item.groupBy == 'categories')
	{
		this.controller.stageController.pushScene('app-list', {list: 'category', category: event.item.name, name: "WebOS Applications"});
	}
	else if (this.item.groupBy == 'feeds')
	{
		this.controller.stageController.pushScene('app-list', {list: 'feed', feed: event.item.name, name: "WebOS Applications"});
	}
}

AppGroupsAssistant.prototype.updateCommandMenu = function(skipUpdate)
{
	
	// clear current model list
	this.cmdMenuModel.items = [];
	
	// this is to put space around the icons
	this.cmdMenuModel.items.push({});
	
	// push the sort selector
	this.cmdMenuModel.items.push({items: [{label: $L('Categories'), command: 'categories'}, {label: $L('Feeds'),  command: 'feeds'}], toggleCmd: this.item.groupBy});
	
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

AppGroupsAssistant.prototype.buildList = function()
{
	this.listModel.items = [];
	
	if (this.item.groupBy == 'categories') 
	{
		for (var c = 0; c < packages.categories.length; c++) 
		{
			if (packages.categories[c].name != packages.patchCategory) 
			{
				this.listModel.items.push(
				{
					name: packages.categories[c].name,
					category: packages.categories[c].name,
					count: packages.categories[c].count
				});
			}
		}
	}
	else if (this.item.groupBy == 'feeds')
	{
		for (var f = 0; f < packages.feeds.length; f++) 
		{
			this.listModel.items.push(
			{
				name: packages.feeds[f].name,
				feed: packages.feeds[f].name,
				count: packages.feeds[f].count
			});
		}
	}
}

// handle sort toggle commands
AppGroupsAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'categories':
			case 'feeds':
				this.item.groupBy = event.command;
				this.controller.stageController.swapScene('app-groups', this.item);
				break;
				
			default:
				break;
		}
	}
};

AppGroupsAssistant.prototype.activate = function(event) {}

AppGroupsAssistant.prototype.deactivate = function(event) {}

AppGroupsAssistant.prototype.cleanup = function(event)
{
	// clean up our listeners
	Mojo.Event.stopListening(this.controller.get('groupList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
}
