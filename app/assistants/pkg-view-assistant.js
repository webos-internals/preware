function PkgViewAssistant(item, listAssistant)
{
	// item of the list that was tapped
	// load it from the global package array based on the pkgNum in the list item
	if (item.pkgNum != undefined)
	{
		this.pkgNum = item.pkgNum;
		this.item = packages.packages[this.pkgNum];
	}
	else
	{
		this.item = item;
	}
	
	// save this for later
	this.listAssistant = listAssistant;
	
	// this is true when a package action is in progress
	this.active = false;
	
	// setup command menu
	this.cmdMenuModel = {items:[]};
	
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

PkgViewAssistant.prototype.setup = function()
{
	try
	{
		// clear log so it only shows stuff from this scene
		IPKGService.logClear();
		
		// setup menu
		this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
		
		// build command menu widget
		this.updateCommandMenu(true);
		this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
		
		// setup back tap
		if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') == 0 ||
			Mojo.Environment.DeviceInfo.modelNameAscii == 'Emulator')
			this.backElement = this.controller.get('back');
		else
			this.backElement = this.controller.get('header');
		this.backTapHandler = this.backTap.bindAsEventListener(this);
		this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);

		// setup PkgViewAssistant title and icon
		this.controller.get('title').innerHTML = this.item.title;
		this.item.iconFill(this.controller.get('icon'));
		
		// setup spinner widget
		this.spinnerModel = {spinning: false};
		this.controller.setupWidget('spinner', {spinnerSize: 'large'}, this.spinnerModel);
		
		// setup screenshot sideways scroller
		this.controller.setupWidget
		(
			'viewScroller',
			{},
			{mode: 'horizontal-snap'}
		);
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'pkg-view#setup');
	}
		
	// lastly... build screens data
	this.setupImages();
	this.setupData();
};

PkgViewAssistant.prototype.setupImages = function()
{
	try
	{
		// clear the div
		this.controller.get('scrollItems').innerHTML = '';
		
		// build scroll items html
		// screenshots for applications and patches
		// app icons for plugins and services
		var scrollItems = '';
		this.dependents = this.item.getDependent(false, true);

		if (packages.can(this.item.type, 'showScreenshots') && this.item.screenshots.length > 0) 
		{
			this.controller.get('scrollerContainer').className = 'palm-row screenshots';
			for (s = 0; s < this.item.screenshots.length; s++) 
			{
				scrollItems += '<img id="ss_' + s + '" class="screenshot" src="' + this.item.screenshots[s] + '" />';
			}
			
			// fill the screenshot div with data
			this.controller.get('scrollItems').innerHTML = scrollItems;
			
			// initialize listener
			this.screenshotTap = this.screenshotTapHandler.bindAsEventListener(this)
			
			// looping screenshots adding listeners
			for (s = 0; s < this.item.screenshots.length; s++) 
			{
				Mojo.Event.listen(this.controller.get('ss_' + s), Mojo.Event.tap, this.screenshotTap);
			}
		}
		else if (packages.can(this.item.type, 'showDependents') && this.dependents.length > 0) 
		{
			this.controller.get('scrollerContainer').className = 'palm-row apps';
			scrollItems += '<div class="appReset"></div>';
			for (d = 0; d < this.dependents.length && d < 30; d++) 
			{
				scrollItems += '<div id="app_' + this.dependents[d] + '" class="app' + (packages.packages[this.dependents[d]].isInstalled?(packages.packages[this.dependents[d]].hasUpdate?' update':' installed'):'') + '"><div class="sub"></div></div>';
			}
			if (this.dependents.length > 30)
			{
				scrollItems += '<div class="app text"><div class="sub">'+(this.dependents.length-30)+'<br/>More</div></div>';
			}
			
			// fill the screenshot div with data
			this.controller.get('scrollItems').innerHTML = scrollItems;
			
			// initialize listener
			this.appTap = this.appTapHandler.bindAsEventListener(this)
			
			// looping apps adding listeners and icon lazy-loader
			for (d = 0; d < this.dependents.length && d < 30; d++) 
			{
				Mojo.Event.listen(this.controller.get('app_' + this.dependents[d]), Mojo.Event.tap, this.appTap);
				packages.packages[this.dependents[d]].iconFill(this.controller.get('app_' + this.dependents[d]));
			}
		}
		else
		{
			this.controller.get('scrollerContainer').style.display = 'none';
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'pkg-view#setupImages');
	}
};
PkgViewAssistant.prototype.setupData = function()
{
	try
	{
		// clear the div
		this.controller.get('data').innerHTML = '';
		
		// build data html
		var data = '';
		var dataTemplate = 'pkg-view/dataRow';	
		var dataTemplate2 = 'pkg-view/dataRow2';	
		
		
		// add description
		if (this.item.description)
		{
			data += Mojo.View.render({object: {title: $L('Description'), data: this.item.description}, template: dataTemplate2});
		}
		
		// add changelog
		if (this.item.changelog)
		{
			data += Mojo.View.render({object: {title: $L('Changelog'), data: this.item.changelog}, template: dataTemplate2});
		}
		
		// add homepage
		if (this.item.homepage)
		{
			data += Mojo.View.render({object: {title: $L('Homepage'), data: '<a href="' + this.item.homepage + '">' + getDomain(this.item.homepage) + '</a>'}, template: dataTemplate});
		}
		
		// add maintainer(s)
		if (this.item.maintainer)
		{
			var dataM = '';
			for (var m = 0; m < this.item.maintainer.length; m++)
			{
				if (dataM != '')
				{
					dataM += ', ';
				}
				if (!this.item.maintainer[m].url)
				{
					dataM += this.item.maintainer[m].name.replace(' ', '&nbsp;');
				}
				else
				{
					dataM += '<a href="' + this.item.maintainer[m].url + '">' + this.item.maintainer[m].name.replace(' ', '&nbsp;') + '</a>';
				}
			}
			if (dataM)
			{
				data += Mojo.View.render({object: {title: (this.item.maintainer.length>1?$L('Maintainers'):$L('Maintainer')), data: dataM}, template: dataTemplate});
			}
		}
		
		// add version
		data += Mojo.View.render({object: {title: $L('Version'), data: this.item.version}, template: dataTemplate});
		
		// add date
		if (this.item.date)
		{
			data += Mojo.View.render({object: {title: $L('Last Updated'), data: formatDate(this.item.date)}, template: dataTemplate});
		}
		
		// add price
		if (this.item.price)
		{
			data += Mojo.View.render({object: {title: $L('Price'), data: '$'+this.item.price}, template: dataTemplate});
		}
		
		// add download size
		if (this.item.size)
		{
			data += Mojo.View.render({object: {title: $L('Download Size'), data: formatSize(this.item.size)}, template: dataTemplate});
		}
		
		// add installed information
		if (this.item.isInstalled)
		{
			// add installed version
			if (this.item.versionInstalled && this.item.hasUpdate)
			{
				data += Mojo.View.render({object: {title: $L('Installed Version'), data: this.item.versionInstalled}, template: dataTemplate});
			}
			
			// add installed date
			if (this.item.dateInstalled) 
			{
				data += Mojo.View.render({object: {title: $L('Installed'), data: formatDate(this.item.dateInstalled)}, template: dataTemplate});
			}
			
			// add installed size
			if (this.item.sizeInstalled) 
			{
				data += Mojo.View.render({object: {title: $L('Installed Size'), data: formatSize(this.item.sizeInstalled)}, template: dataTemplate});
			}
		}
		
		// add package id
		data += Mojo.View.render({object: {title: $L('Id'), data: this.item.pkg}, template: dataTemplate});
		
		// add license
		if (this.item.license) 
		{
			data += Mojo.View.render({object: {title: $L('License'), data: this.item.license}, template: dataTemplate});
		}
		
		// add package type
		data += Mojo.View.render({object: {title: $L('Type'), data: this.item.type}, template: dataTemplate});
		
		// add package category
		data += Mojo.View.render({object: {title: $L('Category'), data: this.item.category}, template: dataTemplate});
		
		// add package device
		if (this.item.devices.length) 
		{
		    data += Mojo.View.render({object: {title: (this.item.devices.length>1?$L('Devices'):$L('Device')), data: this.item.deviceString}, template: dataTemplate});
		}
		
		// add package country
		if (this.item.countries.length) 
		{
		    data += Mojo.View.render({object: {title: (this.item.countries.length>1?$L('Countries'):$L('Country')), data: this.item.countryString}, template: dataTemplate});
		}
		
		// add package language
		if (this.item.languages.length) 
		{
		    data += Mojo.View.render({object: {title: (this.item.languages.length>1?$L('Languages'):$L('Language')), data: this.item.languageString}, template: dataTemplate});
		}
		
		
		// add package feed
		data += Mojo.View.render({object: {title: (this.item.feeds.length>1?$L('Feeds'):$L('Feed')), data: this.item.feedString, rowStyle: 'last'}, template: dataTemplate});
		
		
		// fillin the div with data
		this.controller.get('data').innerHTML = data;
		
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'pkg-view#setupData');
	}
};

PkgViewAssistant.prototype.screenshotTapHandler = function(event)
{
	ssNum = event.srcElement.id.replace(/ss_/, '');
	// push the screenshots scene
	this.controller.stageController.pushScene('screenshots', this.item.screenshots, ssNum);
};
PkgViewAssistant.prototype.appTapHandler = function(event)
{
	appNum = event.srcElement.id.replace(/app_/, '');
	// push the pkg view scene
	this.controller.stageController.pushScene('pkg-view', packages.packages[appNum].getForList(), this.listAssistant);
};

PkgViewAssistant.prototype.updateCommandMenu = function(skipUpdate)
{
	// clear current model list
	this.cmdMenuModel.items = [];
	
	// this is to put space around the icons
	this.cmdMenuModel.items.push({});
	
	// if installed push the launch button first if its an application
	if (this.item.isInstalled && packages.can(this.item.type, 'launch'))
	{
		this.cmdMenuModel.items.push({label: $L('Launch'), command: 'do-launch'});
	}
	// if update, push button
	if (this.item.hasUpdate && packages.can(this.item.type, 'update'))
	{
		if (this.item.appCatalog)
		{
			this.cmdMenuModel.items.push({label: $L('Update'), command: 'do-redirect'});
		}
		else
		{
			this.cmdMenuModel.items.push({label: $L('Update'), command: 'do-update'});
		}
	}
	// if installed, push remove button 
	if (this.item.isInstalled)
	{
		this.cmdMenuModel.items.push({label: $L('Remove'), command: 'do-remove'});
	}
	// if not, push install button
	else
	{
		if (this.item.appCatalog)
		{
			this.cmdMenuModel.items.push({label: $L('Install'), command: 'do-redirect'});
		}
		else
		{
			this.cmdMenuModel.items.push({label: $L('Install'), command: 'do-install'});
		}
	}
	
	// this is to put space around the icons
	this.cmdMenuModel.items.push({});
	
	// push info button to items array
	// hide this for now
	//this.cmdMenuModel.items.push({label: $L('Info'), icon:'info', command: 'info'});
	
	// if we don't want to skip the update, update it
	if (!skipUpdate)
	{
		// update model
		this.controller.modelChanged(this.cmdMenuModel);
		
		// show the menu
		this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
	}
};

PkgViewAssistant.prototype.backTap = function(event)
{
	if (!this.active) {
		this.controller.stageController.popScene();
	}
};

PkgViewAssistant.prototype.handleCommand = function(event)
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
			// launch
			case 'do-launch':
				this.item.launch();
				break;
			
			// install
			case 'do-install':
				if (this.item.preInstallMessage)
				{
					this.controller.showAlertDialog(
					{
					    title:				this.item.title,
						allowHTMLMessage:	true,
					    message:			this.item.preInstallMessage,
					    choices:			[{label:$L('Ok'), value:'install'}, {label:$L('Cancel'), value:'cancel'}],
						onChoose:			this.doGetAppCatInstallStatus.bindAsEventListener(this)
				    });
				}
				else
				{
					this.doGetAppCatInstallStatus('install');
				}
				break;
			
			// update
			case 'do-update':
				if (this.item.preUpdateMessage)
				{
					this.controller.showAlertDialog(
					{
					    title:				this.item.title,
						allowHTMLMessage:	true,
					    message:			this.item.preUpdateMessage,
					    choices:			[{label:$L('Ok'), value:'update'}, {label:$L('Cancel'), value:'cancel'}],
						onChoose:			this.doGetAppCatInstallStatus.bindAsEventListener(this)
				    });
				}
				else
				{
					this.doGetAppCatInstallStatus('update');
				}
				break;
			
			// remove
			case 'do-remove':
				if (this.item.preRemoveMessage)
				{
					this.controller.showAlertDialog(
					{
					    title:				this.item.title,
						allowHTMLMessage:	true,
					    message:			this.item.preRemoveMessage,
					    choices:			[{label:$L('Ok'), value:'remove'}, {label:$L('Cancel'), value:'cancel'}],
						onChoose:			this.doGetAppCatInstallStatus.bindAsEventListener(this)
				    });
				}
				else
				{
					this.doGetAppCatInstallStatus('remove');
				}
				break;
			
			// install
			case 'do-redirect':
				this.item.doRedirect(this);
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

PkgViewAssistant.prototype.doGetAppCatInstallStatus = function(operation)
{
	if (operation == 'install' ||
		operation == 'update' ||
		operation == 'remove')
	{
		IPKGService.installStatus(this.doCheckAppCatInstalls.bindAsEventListener(this, operation));
	}
};

PkgViewAssistant.prototype.doCheckAppCatInstalls = function(response, operation)
{
    var installing = false;

    if (response.status.apps.length > 0) {
	for (var x = 0; x < response.status.apps.length; x++) {
	    // We're going to ignore "removing" here, because it's either modal or erroneous.
	    if ((response.status.apps[x].details.state == "ipk download current") ||
		(response.status.apps[x].details.state == "ipk download complete") ||
		(response.status.apps[x].details.state == "installing")) {
		installing = true;
	    }
	}
    }

    if (installing == false) {
	if (operation == 'install') {
	    this.item.doInstall(this);
	}
	else if (operation == 'update') {
	    this.item.doUpdate(this);
	}
	else if (operation == 'remove') {
	    this.item.doRemove(this);
	}
    }
    else {
	Mojo.Controller.errorDialog("An App Catalog background operation is in progress, please try again later.", this.controller.window);
    }
};

/* 
 * this functions are called by the package model when doing stuff
 * anywhere the package model will be installing stuff these functions are needed
 */
PkgViewAssistant.prototype.startAction = function()
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
	this.controller.get('viewDataContainer').style.display = "none";
	
	// and make sure the scene scroller is at the top
	this.controller.sceneScroller.mojo.scrollTo(0, 0);
};
PkgViewAssistant.prototype.displayAction = function(msg)
{
	this.controller.get('spinnerStatus').innerHTML = msg;
};
PkgViewAssistant.prototype.endAction = function()
{
	// we're done loading so let the device sleep if it needs to
	this.stayAwake.end();
	
	// allow back gesture again
	this.active = false;
	
	// end action action is to stop the spinner
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	
	// update the screens data
	this.setupData();
	
	// show the data
	this.controller.get('viewDataContainer').style.display = 'inline';
	
	// and to show this menu again
	this.updateCommandMenu();
};
PkgViewAssistant.prototype.simpleMessage = function(message)
{
	this.controller.showAlertDialog(
	{
	    title:				$L(this.item.type),
		allowHTMLMessage:	true,
	    message:			message,
	    choices:			[{label:$L('Ok'), value:''}],
		onChoose:			function(value){}
    });
};
PkgViewAssistant.prototype.actionMessage = function(message, choices, actions)
{
	this.controller.showAlertDialog(
	{
	    title:				$L(this.item.type),
		allowHTMLMessage:	true,
		preventCancel:		true,
	    message:			message,
	    choices:			choices,
	    onChoose:			actions
    });
};
/* end functions called by the package model */

PkgViewAssistant.prototype.cleanup = function(event)
{
	try
	{
		// cancel out any running subscription
		if (this.item.subscription) 
		{
			this.item.subscription.cancel();
		}
		
		this.controller.stopListening(this.backElement,  Mojo.Event.tap, this.backTapHandler);

		if (packages.can(this.item.type, 'showScreenshots') && this.item.screenshots.length > 0) 
		{
			// looping screenshots destroying listeners
			for (s = 0; s < this.item.screenshots.length; s++) 
			{
				Mojo.Event.stopListening(this.controller.get('ss_' + s), Mojo.Event.tap, this.screenshotTap);
			}
		}
		else if (packages.can(this.item.type, 'showDependents') && this.dependents.length > 0) 
		{
			// looping apps destroying listeners
		}
	}
	catch(e)
	{
		Mojo.Log.logException(e, 'pkg-view#cleanup');
	}
};

// Local Variables:
// tab-width: 4
// End:


