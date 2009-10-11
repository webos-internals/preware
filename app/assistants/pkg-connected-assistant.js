function PkgConnectedAssistant(type, pkg, pkgs)
{
	// load this stuff for use later
	this.type = type;
	this.pkg =  pkg;
	this.pkgs = pkgs;
	
	// list model
	this.listModel = {items:[]};
	
	// setup command menu
	this.cmdMenuModel =
	{
		label: $L('Menu'), 
		items: []
	};
	
	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: "IPKG Log",
				command: 'do-showLog'
			},
			{
				label: "Help",
				command: 'do-help'
			}
		]
	}
	
	// load stayawake class
	this.stayAwake = new stayAwake();
}

PkgConnectedAssistant.prototype.setup = function()
{
	// clear log so it only shows stuff from this scene
	IPKGService.logClear();
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	// hide this by default
	this.controller.get('pkgSingle').style.display = 'none';
	
	// set title
	if (this.type == 'install')		this.controller.get('listTitle').innerHTML = 'Packages Needed To Install This';
	else if (this.type == 'remove') this.controller.get('listTitle').innerHTML = 'Packages That Depend On This';
	
	// load single
	this.loadSingle();
	
	// setup list attributes
	this.listAttributes = 
	{
		itemTemplate: "pkg-connected/rowTemplate",
		swipeToDelete: false,
		reorderable: false,
		onItemRendered: this.itemRendered.bind(this)
	};
	
	// load packages
	this.loadList();
	
	// setup list widget
	this.controller.setupWidget('pkgList', this.listAttributes, this.listModel);
	
	// setup tap handler (to view the individual packages)
	Mojo.Event.listen(this.controller.get('pkgList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	
	// build command menu widget
	this.updateCommandMenu(true);
	this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
}

PkgConnectedAssistant.prototype.activate = function(event)
{
	if (this.firstActivate)
	{
		this.updateList();
	}
	this.firstActivate = true;
}

PkgConnectedAssistant.prototype.loadSingle = function()
{
	if (this.pkg) 
	{
		var pkgForList = this.pkg.getForList();
		var html = Mojo.View.render({object: pkgForList, template: 'pkg-connected/pkgTemplate'});
		this.controller.get('pkgSingle').innerHTML = html;
		this.pkg.iconFill(this.controller.get('icon-' + pkgForList.pkgNum));
		
		this.controller.get('pkgSingle').style.display = '';
		this.controller.get('pkgSpacer').style.height = '113px';
		this.controller.get('topFade').style.top = '110px';
	}
}

PkgConnectedAssistant.prototype.loadList = function()
{
	this.listModel.items = [];
	
	if (this.pkgs.length > 0)
	{
		for (var p = 0; p < this.pkgs.length; p++)
		{
			this.listModel.items.push(packages.packages[this.pkgs[p]].getForList());
		}
	}
}

PkgConnectedAssistant.prototype.listTapHandler = function(event)
{
	// push pkg view scene with this items info
	this.controller.stageController.pushScene('pkg-view', event.item, this);
}

PkgConnectedAssistant.prototype.updateCommandMenu = function(skipUpdate)
{
	// clear current model list
	this.cmdMenuModel.items = [];
	
	// this is to put space around the icons
	this.cmdMenuModel.items.push({});
	
	// if type is for multi-install push install button 
	if (this.type == 'install')
	{
		this.cmdMenuModel.items.push({label: $L('Install All'), command: 'do-install'});
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
}

PkgConnectedAssistant.prototype.handleCommand = function(event)
{
	if(event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-install':
				//packages.startMultiInstall(this.pkg, this.pkgs, this);
				break;
			
			case 'do-showLog':
				this.controller.stageController.pushScene({name: 'ipkg-log', disableSceneScroller: true});
				break;
				
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
				
			default:
				// this shouldn't happen
				break;
		}
	}
}

PkgConnectedAssistant.prototype.itemRendered = function(listWidget, itemModel, itemNode)
{
	packages.packages[itemModel.pkgNum].iconFill(this.controller.get('icon-' + itemModel.pkgNum));
}

PkgConnectedAssistant.prototype.activate = function(event) {}
PkgConnectedAssistant.prototype.deactivate = function(event) {}
PkgConnectedAssistant.prototype.cleanup = function(event) {}
