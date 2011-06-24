function PkgConnectedAssistant(type, pkg, pkgs)
{
	// load this stuff for use later
	this.type = type;
	this.pkg =  pkg;
	this.pkgs = pkgs;
	
	// this is true when a package action is in progress
	this.active = false;
	
	// list model
	this.listModel = {items:[]};
	
	// setup command menu
	this.cmdMenuModel =
	{
		items: []
	};
	
	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: $L("IPKG Log"),
				command: 'do-showLog'
			},
			{
				label: $L("Help"),
				command: 'do-help'
			}
		]
	}
	
	// load stayawake class
	this.stayAwake = new stayAwake();
};

PkgConnectedAssistant.prototype.setup = function()
{
	this.controller.get('listTitle').innerHTML = $L("Connected Packages");
	
	// clear log so it only shows stuff from this scene
	IPKGService.logClear();
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	// hide this by default
	this.controller.get('pkgSingle').style.display = 'none';
	
	// setup back tap
	if (Mojo.Environment.DeviceInfo.modelNameAscii == 'TouchPad' ||
		Mojo.Environment.DeviceInfo.modelNameAscii == 'Emulator')
		this.backElement = this.controller.get('back');
	else
		this.backElement = this.controller.get('header');
	this.backTapHandler = this.backTap.bindAsEventListener(this);
	this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);

	// set title
	if (this.type == 'install')	this.controller.get('listTitle').innerHTML = $L("Packages To Be Installed / Updated");
	else if (this.type == 'remove') this.controller.get('listTitle').innerHTML = $L("Packages That Depend On This");
	
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
	
	// setup spinner widget
	this.spinnerModel = {spinning: false};
	this.controller.setupWidget('spinner', {spinnerSize: 'large'}, this.spinnerModel);
	
	// load packages
	this.loadList(true);
	
	// setup list widget
	this.controller.setupWidget('pkgList', this.listAttributes, this.listModel);
	
	// setup tap handler (to view the individual packages)
	Mojo.Event.listen(this.controller.get('pkgList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	
	// build command menu widget
	this.updateCommandMenu(true);
	this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
};

PkgConnectedAssistant.prototype.activate = function(event)
{
	if (this.firstActivate)
	{
		this.updateScene();
	}
	this.firstActivate = true;
};

PkgConnectedAssistant.prototype.updateScene = function()
{
	try
	{
		if (this.pkg)
		{
			if (this.type == 'install')
			{
				this.pkgs = this.pkg.getDependenciesRecursive(true);
			}
			else if (this.type == 'remove')
			{
				this.pkgs = this.pkg.getDependent(true);
			}
		}
		
		this.loadList();
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'pkg-connected#updateScene');
	}
};

PkgConnectedAssistant.prototype.loadSingle = function()
{
	if (this.pkg) 
	{
		var pkgForList = this.pkg.getForList(false);
		var html = Mojo.View.render({object: pkgForList, template: 'pkg-connected/pkgTemplate'});
		this.controller.get('pkgSingle').innerHTML = html;
		this.pkg.iconFill(this.controller.get('icon-' + pkgForList.pkgNum));
		
		this.controller.get('pkgSingle').style.display = '';
		this.controller.get('pkgSpacer').style.height = '113px';
		this.controller.get('topFade').style.top = '110px';
	}
};
PkgConnectedAssistant.prototype.loadList = function(skipUpdate)
{
	this.listModel.items = [];
	
	if (this.pkgs.length > 0)
	{
		for (var p = 0; p < this.pkgs.length; p++)
		{
			this.listModel.items.push(packages.packages[this.pkgs[p]].getForList(false));
		}
	}
	
	// if the list is empty, pop to previous scene
	if (this.listModel.items.length < 1)
	{
		this.controller.stageController.popScene();
	}
	
	// update list widget if skipUpdate isn't set to true
	if (!skipUpdate)
	{
		// reload list
		this.controller.get('pkgList').mojo.noticeUpdatedItems(0, this.listModel.items);
	 	this.controller.get('pkgList').mojo.setLength(this.listModel.items.length);
	}
};

PkgConnectedAssistant.prototype.listTapHandler = function(event)
{
	// push pkg view scene with this items info
	this.controller.stageController.pushScene('pkg-view', event.item, this);
};
PkgConnectedAssistant.prototype.itemRendered = function(listWidget, itemModel, itemNode)
{
	packages.packages[itemModel.pkgNum].iconFill(this.controller.get('icon-' + itemModel.pkgNum));
};

PkgConnectedAssistant.prototype.updateCommandMenu = function(skipUpdate)
{
	// clear current model list
	this.cmdMenuModel.items = [];
	
	// this is to put space around the icons
	this.cmdMenuModel.items.push({});
	
	// if type is for multi-install push install button 
	if (this.type == 'install')
	{
		this.cmdMenuModel.items.push({label: $L("Install / Update All"), command: 'do-install'});
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

PkgConnectedAssistant.prototype.backTap = function(event)
{
	if (!this.active) {
		this.controller.stageController.popScene();
	}
};

PkgConnectedAssistant.prototype.handleCommand = function(event)
{
	if(event.type == Mojo.Event.back)
	{
		if (this.active) 
		{
			event.preventDefault();
			event.stopPropagation();
		}      
	}
	else if(event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-install':
				packages.startMultiInstall(this.pkg, this.pkgs, this);
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
};

/* 
 * this functions are called by the package model when doing stuff
 * anywhere the package model will be installing stuff these functions are needed
 */
PkgConnectedAssistant.prototype.startAction = function()
{
	// this is the start of the stayawake class to keep it awake till we're done with it
	this.stayAwake.start();
	
	// set this to stop back gesture
	this.active = true;
	
	// start action is to hide this menu
	this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
	
	// to update the spinner
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	
	// and to hide the data while we do the action
	this.controller.get('header').style.display = "none";
	this.controller.get('pkgSingle').style.display = "none";
	this.controller.get('pkgSpacer').style.display = "none";
	this.controller.get('pkgListContainer').style.display = "none";
	
	// and make sure the scene scroller is at the top
	this.controller.sceneScroller.mojo.scrollTo(0, 0);
};
PkgConnectedAssistant.prototype.displayAction = function(msg)
{
	this.controller.get('spinnerStatus').innerHTML = msg;
};
PkgConnectedAssistant.prototype.endAction = function()
{
	// we're done loading so let the phone sleep if it needs to
	this.stayAwake.end();
	
	// allow back gesture again
	this.active = false;
	
	// end action action is to stop the spinner
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	
	// update the screens data
	if (!this.simpleMessageUp) this.updateScene();
	
	// show the data
	this.controller.get('header').style.display = "inline";
	this.controller.get('pkgSingle').style.display = "inline";
	this.controller.get('pkgSpacer').style.display = "inline";
	this.controller.get('pkgListContainer').style.display = "inline";
	
	// and to show this menu again
	this.updateCommandMenu();
};
PkgConnectedAssistant.prototype.simpleMessage = function(message)
{
	this.simpleMessageUp = true;
	this.controller.showAlertDialog(
	{
	    title:				$L("Connected Packages"),
		allowHTMLMessage:	true,
		preventCancel:		true,
	    message:			message,
	    choices:			[{label:$L("Ok"), value:'ok'}],
		onChoose:			this.simpleMessageOK.bindAsEventListener(this)
    });
};
PkgConnectedAssistant.prototype.simpleMessageOK = function(value)
{
	if (value == 'ok')
	{
		this.updateScene();
	}
	this.simpleMessageUp = false;
};
PkgConnectedAssistant.prototype.actionMessage = function(message, choices, actions)
{
	this.controller.showAlertDialog(
	{
	    title:				$L("Connected Packages"),
		allowHTMLMessage:	true,
		preventCancel:		true,
	    message:			message,
	    choices:			choices,
	    onChoose:			actions
    });
};
/* end functions called by the package model */

PkgConnectedAssistant.prototype.deactivate = function(event) {};
PkgConnectedAssistant.prototype.cleanup = function(event) {
	this.controller.stopListening(this.backElement, Mojo.Event.tap, this.backTapHandler);
};

// Local Variables:
// tab-width: 4
// End:
