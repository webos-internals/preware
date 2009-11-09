function MainAssistant()
{
	// subtitle random list
	this.randomSub = 
	[
		{weight: 30, text: 'The Advanced Homebrew Installer'},
		{weight: 20, text: 'Applications, Themes and Patches'},
		{weight: 15, text: 'The Open Standard Installer'},
		{weight: 15, text: 'The Universal Application Installer'},
		{weight: 15, text: 'Accessing All Open Standard Feeds'},
		{weight:  2, text: 'Random Taglines Are Awesome'},
		{weight:  2, text: 'We Know Palm Loves Preware'},
		{weight:  2, text: 'Now With More Cowbell'},
		{weight:  2, text: 'We Did It First'}
	];
	
	// setup list model
	this.mainModel = {items:[]};
	
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
				label: "Manage Feeds",
				command: 'do-feeds'
			},
			{
				label: "Help",
				command: 'do-help'
			}
		]
	};
}

MainAssistant.prototype.setup = function()
{
	// get elements
	this.versionElement =	this.controller.get('version');
	this.subTitleElement =	this.controller.get('subTitle');
	this.listElement =		this.controller.get('mainList');
	
	// handlers
	this.listTapHandler =		this.listTap.bindAsEventListener(this);
	
	// set version string random subtitle
	this.versionElement.innerHTML = "v" + Mojo.Controller.appInfo.version;
	this.subTitleElement.innerHTML = this.getRandomSubTitle();
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	// update list
	this.updateList(true);
	
	// setup widget
	this.controller.setupWidget('mainList', { itemTemplate: "main/rowTemplate", swipeToDelete: false, reorderable: false }, this.mainModel);
	this.controller.listen(this.listElement, Mojo.Event.listTap, this.listTapHandler);
}
MainAssistant.prototype.activate = function(event)
{
	if (this.firstActivate)
	{
		this.updateList();
	}
	this.firstActivate = true;
}

MainAssistant.prototype.listTap = function(event)
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
		
		if (prefs.get().showAvailableTypes) 
		{
			
			if (prefs.get().showTypeApplication) 
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
			}
			if (prefs.get().showTypeTheme) 
			{
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
			}
			if (prefs.get().showTypePatch) 
			{
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
			if (prefs.get().showTypeOther) 
			{
				this.mainModel.items.push(
				{
					name: $L('Available Other'),
					style: 'disabled',
					scene: 'pkg-groups',
					pkgGroup: ['types', 'feeds'],
					pkgList: 'other',
					pkgType: '',
					pkgFeed: '',
					pkgCat: '',
					pkgCount: 0
				});
			}
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
			this.listElement.mojo.noticeUpdatedItems(0, this.mainModel.items);
			this.listElement.mojo.setLength(this.mainModel.items.length);
		}
		
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#updateList');
		this.alertMessage('updateList Error', e);
	}
}

MainAssistant.prototype.getRandomSubTitle = function()
{
	// loop to get total weight value
	var weight = 0;
	for (var r = 0; r < this.randomSub.length; r++)
	{
		weight += this.randomSub[r].weight;
	}
	
	// random weighted value
	var rand = Math.floor(Math.random() * weight);
	//alert('rand: ' + rand + ' of ' + weight);
	
	// loop through to find the random title
	for (var r = 0; r < this.randomSub.length; r++)
	{
		if (rand <= this.randomSub[r].weight)
		{
			return this.randomSub[r].text;
		}
		else
		{
			rand -= this.randomSub[r].weight;
		}
	}
	
	// if no random title was found (for whatever reason, wtf?) return first and best subtitle
	return this.randomSub[0].text;
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
				
			case 'do-feeds':
				this.controller.stageController.pushScene('configs');
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

MainAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening(this.listElement, Mojo.Event.listTap, this.listTapHandler);
}
