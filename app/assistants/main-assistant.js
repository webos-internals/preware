function MainAssistant()
{
	// subtitle random list
	this.randomSub = 
	[
		'The Open Standard Installer',
		'The Advanced Homebrew Installer',
		'The Universal Application Installer',
		'Accessing All Open Standard Feeds',
		'The Advanced Homebrew Installer' // double billing
	]
	
	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: "Preferences",
				command: 'do-prefs'
			},
			{
				label: "Update Feeds",
				command: 'do-update'
			},
			{
				label: "Help",
				command: 'do-help'
			}
		]
	}
}

MainAssistant.prototype.setup = function()
{
	
	// set version string random subtitle
	this.controller.get('version').innerHTML = "v" + Mojo.Controller.appInfo.version;
	this.controller.get('subTitle').innerHTML = this.randomSub[Math.floor(Math.random() * this.randomSub.length)];
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	// setup list widget
	this.mainModel = { items: [] };
	
	// update list
	this.updateList(true);
	
	// setup widget
	this.controller.setupWidget('mainList', { itemTemplate: "main/rowTemplate", swipeToDelete: false, reorderable: false }, this.mainModel);
	Mojo.Event.listen(this.controller.get('mainList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));

}

MainAssistant.prototype.activate = function(event)
{
	if (this.firstActivate)
	{
		this.updateList();
	}
	this.firstActivate = true;
}

MainAssistant.prototype.listTapHandler = function(event)
{
	if (event.item.scene === false || event.item.style == 'disabled') 
	{
		// no scene or its disabled, so we won't do anything
	}
	else
	{
		// push the scene
		this.controller.stageController.pushScene(event.item.scene, event.item);
	}
}

// this is called to update the list (namely the counts and styles)
MainAssistant.prototype.updateList = function(skipUpdate)
{
	try 
	{
		// clear main list model of its items
		this.mainModel.items = [];
		
		this.mainModel.items.push(
		{
			name:     $L('Package Updates'),	// displays in list
			style:    'disabled',				// class for use in the list display
			scene:    'pkg-list',				// scene that will be pushed on tap 
			pkgList:  'updates',				// 
			pkgType:  'all',					// 
			pkgFeed:  'all',					// 
			pkgCat:   'all',					// 
			pkgCount: 0							// count of pkgs for display in list, will only display if style is set to 'showCount'
		});
		
		if (!prefs.get().showAllTypes) 
		{
			this.mainModel.items.push(
			{
				name:     $L('Available Applications'),
				style:    'disabled',
				scene:    'pkg-groups',
				pkgGroup: ['categories','feeds'],
				pkgList:  'all',
				pkgType:  'Application',
				pkgFeed:  '',
				pkgCat:   '',
				pkgCount: 0
			});
			
			this.mainModel.items.push(
			{
				name:     $L('Available Themes'),
				style:    'disabled',
				scene:    'pkg-list',
				pkgList:  'all',
				pkgType:  'Theme',
				pkgFeed:  'all',
				pkgCat:   'all',
				pkgCount: 0
			});
			
			this.mainModel.items.push(
			{
				name:     $L('Available Patches'),
				style:    'disabled',
				scene:    'pkg-groups',
				pkgGroup: ['categories'],
				pkgList:  'all',
				pkgType:  'Patch',
				pkgFeed:  'all',
				pkgCat:   '',
				pkgCount: 0
			});
		}
		else
		{
			this.mainModel.items.push(
			{
				name:     $L('Available Packages'),
				style:    'disabled',
				scene:    'pkg-groups',
				pkgGroup: ['types','feeds'],
				pkgList:  'all',
				pkgType:  '',
				pkgFeed:  '',
				pkgCat:   '',
				pkgCount: 0
			});
		}
		
		this.mainModel.items.push(
		{
			name:     $L('Installed Packages'),
			style:    'disabled',
			scene:    'pkg-groups',
			pkgGroup: ['types'],
			pkgList:  'installed',
			pkgType:  '',
			pkgFeed:  'all',
			pkgCat:   'all',
			pkgCount: 0
		});
		
		this.mainModel.items.push(
		{
			name:     $L('List of Everything'),
			style:    'disabled',
			scene:    'pkg-list',
			pkgList:  'all',
			pkgType:  'all',
			pkgFeed:  'all',
			pkgCat:   'all',
		});
		
		// if we have packages we need to get out list counts
		if (packages.packages.length > 0)
		{
			// '-1' so we don't add a count to the everything list
			for (var i = 0; i < (this.mainModel.items.length-1); i++)
			{
				var count = packages.getPackages(this.mainModel.items[i]).length;
				if (count > 0) 
				{
					this.mainModel.items[i].style = 'showCount';
					this.mainModel.items[i].pkgCount = count;
				}
			}
			
			// enable everything list
			this.mainModel.items[(this.mainModel.items.length-1)].style = false;
		}
		
		if (!skipUpdate) 
		{
			// update list widget
			this.controller.get('mainList').mojo.noticeUpdatedItems(0, this.mainModel.items);
			this.controller.get('mainList').mojo.setLength(this.mainModel.items.length);
		}
		
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#updateList');
		this.alertMessage('updateList Error', e);
	}
}

MainAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-prefs':
				this.controller.stageController.pushScene('preferences');
				break;
	
			case 'do-update':
				this.controller.stageController.swapScene({name: 'update', transition: Mojo.Transition.crossFade}, 'main', true);
				break;
				
			case 'do-showLog':
				this.controller.stageController.pushScene({name: 'ipkg-log', disableSceneScroller: true});
				break;
				
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
		}
	}
}

MainAssistant.prototype.deactivate = function(event) {}
MainAssistant.prototype.cleanup = function(event) {}
