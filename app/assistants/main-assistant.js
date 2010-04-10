function MainAssistant()
{
	// subtitle random list
	this.randomSub = 
	[
		{weight: 30, text: $L('The Advanced Homebrew Installer')},
		{weight: 20, text: $L('Applications, Themes and Patches')},
		{weight: 15, text: $L('The Open Standard Installer')},
		{weight: 15, text: $L('The Universal Application Installer')},
		{weight: 15, text: $L('Accessing All Open Standard Feeds')},
		{weight:  2, text: $L('Random Taglines Are Awesome')},
		{weight:  2, text: $L('We Know Palm Loves Preware')},
		{weight:  2, text: $L('Now With More Cowbell')},
		{weight:  2, text: $L('We will get to v1.0... Eventually')}
	];
	
	// setup list model
	this.mainModel = {items:[]};
	
	// setup search model
	this.searchModel = { value: '' };
	this.searchText = '';
	
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

MainAssistant.prototype.setup = function()
{	
	this.controller.get('main-title').innerHTML = $L('Preware');
	this.controller.get('version').innerHTML = $L('v0.0.0');
	this.controller.get('subTitle').innerHTML = $L('The Open Source Installer');
	this.controller.get('subSearch').innerHTML = $L('Press Enter To Search');

	// get elements
	this.searchContainer =	this.controller.get('searchContainer');
	this.searchWidget =		this.controller.get('searchWidget');
	this.headerContainer =	this.controller.get('headerContainer');
	this.titleElement =		this.controller.get('main-title');
	this.versionElement =	this.controller.get('version');
	this.subTitleElement =	this.controller.get('subTitle');
	this.listElement =		this.controller.get('mainList');
	
	// handlers
	this.searchKeyHandler =			this.searchKey.bindAsEventListener(this);
	this.generalKeyHandler =		this.generalKey.bindAsEventListener(this);
	this.listTapHandler =			this.listTap.bindAsEventListener(this);
	this.searchElementLoseFocus	=	this.searchFocus.bind(this);
	
	// set version string random subtitle
	this.titleElement.innerHTML = Mojo.Controller.appInfo.title;
	this.versionElement.innerHTML = "v" + Mojo.Controller.appInfo.version;
	this.subTitleElement.innerHTML = this.getRandomSubTitle();
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	// setup search widget
    this.controller.setupWidget
	(
		'searchWidget', 
		{
			modelProperty: 'value',
			inputName: 'searchElement',
			autoFocus: false,
			multiline: false,
			enterSubmits: true,
			requiresEnterKey: true,
			modifierState: Mojo.Widget.sentenceCase,
			focusMode: Mojo.Widget.focusInsertMode
		}, 
		this.searchModel
	);
	this.controller.listen(this.searchWidget, Mojo.Event.propertyChange, this.searchKeyHandler);
	this.controller.listen(this.controller.sceneElement, Mojo.Event.keypress, this.generalKeyHandler);
	this.controller.listen(this.controller.sceneElement, Mojo.Event.keyup, this.generalKeyHandler);
	
	// update list
	this.updateList(true);
	
	// setup widget
	this.controller.setupWidget('mainList', { itemTemplate: "main/rowTemplate", swipeToDelete: false, reorderable: false }, this.mainModel);
	this.controller.listen(this.listElement, Mojo.Event.listTap, this.listTapHandler);
};
MainAssistant.prototype.activate = function(event)
{
	if (this.firstActivate)
	{
		if (packages.dirtyFeeds)
		{
			this.controller.showAlertDialog(
			{
			    title:				$L('Preware'),
				allowHTMLMessage:	true,
			    message:			'You have recently changed the feeds. You should update the package list.',
			    choices:			[{label:$L('Do It Now'), value:'ok'}, {label:$L('Later'), value:'skip'}],
				onChoose:			this.dirtyFeedsResponse.bindAsEventListener(this)
		    });
		}
		this.updateList();		
	}
	else
	{
		this.searchElement = this.searchWidget.querySelector('[name=searchElement]');
	}
	this.firstActivate = true;
};
MainAssistant.prototype.dirtyFeedsResponse = function(value)
{
	if (value == "ok")
	{
		this.controller.stageController.swapScene({name: 'update', transition: Mojo.Transition.crossFade}, 'main', true);
	}
	else
	{
		packages.dirtyFeeds = false;
	}
};

MainAssistant.prototype.generalKey = function(event)
{
	this.searchText = this.searchWidget.mojo.getValue();
	
	// if its a valid character
	if (event.originalEvent && this.searchText == '' &&
		((event.originalEvent.charCode && Mojo.Char.isValidWrittenChar(event.originalEvent.charCode)) ||
		(event.originalEvent.keyCode && Mojo.Char.isValidWrittenChar(event.originalEvent.keyCode)))) 
	{
		// display and focus search field
		this.headerContainer.style.display = 'none';
		this.searchContainer.style.display = '';
		this.controller.sceneScroller.mojo.revealTop(this.searchContainer);
		this.controller.listen(this.searchElement, 'blur', this.searchElementLoseFocus);
		this.searchWidget.mojo.focus();
	}
	else if (this.searchText == '')
	{
		// reidsplay the title text
		this.searchWidget.mojo.blur();
		this.searchContainer.style.display = 'none';
		this.headerContainer.style.display = '';
		this.controller.stopListening(this.searchElement, 'blur', this.searchElementLoseFocus);
	}
};
MainAssistant.prototype.searchKey = function(event)
{
	// check for enter to push scene
	if (event.originalEvent && Mojo.Char.isEnterKey(event.originalEvent.keyCode) &&
		event.value != '') 
	{
		this.controller.stageController.pushScene
		(
			'pkg-list', 
			{
				name:     $L('List of Everything'),
				pkgList:  'all',
				pkgType:  'all',
				pkgFeed:  'all',
				pkgCat:   'all',
			},
			this.searchText
		);
		this.searchText = '';
		this.generalKey({});
	}
};
MainAssistant.prototype.searchFocus = function(event)
{
	if (this.searchElement)
	{
		this.searchWidget.mojo.setValue('');
		this.generalKey({});
	}
};

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
};
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
					scene:    'pkg-groups',
					pkgGroup: ['categories','feeds'],
					pkgList:  'all',
					pkgType:  'Theme',
					pkgFeed:  '',
					pkgCat:   '',
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
		
		this.mainModel.items.push(
		{
			name:     $L('Saved Package List'),
			style:    'disabled',
			scene:    'pkg-list',
			pkgList:  'saved',
			pkgType:  'all',
			pkgFeed:  'all',
			pkgCat:   'all',
		});
		
		// if we have packages we need to get out list counts
		if (packages.packages.length > 0)
		{
			// '-2' so we don't add a count to the everything list or saved package list
			for (var i = 0; i < (this.mainModel.items.length-2); i++)
			{
				var count = packages.getPackages(this.mainModel.items[i]).length;
				if (count > 0) 
				{
					this.mainModel.items[i].style = 'showCount';
					this.mainModel.items[i].pkgCount = count;
				}
			}
			
			// enable everything list
			this.mainModel.items[(this.mainModel.items.length-2)].style = false;

			// enable saved packages list
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
};

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
};

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
				
			case 'do-luna':
				this.controller.stageController.pushScene('luna');
				break;
				
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
		}
	}
};

MainAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening(this.listElement, Mojo.Event.listTap, this.listTapHandler);
	this.controller.stopListening(this.searchWidget, Mojo.Event.propertyChange, this.searchKeyHandler);
	this.controller.stopListening(this.controller.sceneElement, Mojo.Event.keypress, this.generalKeyHandler);
	this.controller.stopListening(this.controller.sceneElement, Mojo.Event.keyup, this.generalKeyHandler);
	if (this.searchElement) this.controller.stopListening(this.searchElement, 'blur', this.searchElementLoseFocus);
};

// Local Variables:
// tab-width: 4
// End:
