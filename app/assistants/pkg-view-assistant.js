function PkgViewAssistant(item, listAssistant)
{
	// item of the list that was tapped
	// load it from the global package array based on the pkgNum in the list item
	this.pkgNum = item.pkgNum;
	this.item = packages.packages[this.pkgNum];
	
	// save this for later
	this.listAssistant = listAssistant;
	
	// setup command menu
	this.cmdMenuModel =
	{
		label: $L('Menu'), 
		items: []
	};
	
	// this is for storing the log
	this.ipkglog = '';
}

PkgViewAssistant.prototype.setup = function()
{
	// build command menu
	this.updateCommandMenu(true);
	
	// setup command menu widget
	this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
	
	// setup PkgViewAssistant title and icon
	this.controller.get('title').innerHTML = this.item.title;
	if (this.item.icon)
	{
		this.controller.get('icon').innerHTML = '<img src="' + this.item.icon + '" />';
	}
	
	// spinner model
	this.spinnerModel = {spinning: false};
	
	// setup spinner widget
	this.controller.setupWidget('spinner', {spinnerSize: 'large'}, this.spinnerModel);
	
	// setup screenshot sideways scroller
	this.controller.setupWidget
	(
		'viewScroller',
		{},
		{mode: 'horizontal-snap'}
	);
	
	// setup menu model
	var menuModel =
	{
		visible: true,
		items: [{
			label: "IPKG Log...",
			command: 'do-showLog'
		}]
	}
	
	// setup widget
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, menuModel);
	
	// lastly... build screens data
	this.setupImages();
	this.setupData();
}

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
		this.dependents = this.item.getDependent();
		if ((this.item.type == 'Application' || this.item.type == 'Patch') &&
			this.item.screenshots.length > 0) 
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
		else if ((this.item.type == 'Service' || this.item.type == 'Plugin') &&
				this.dependents.length > 0) 
		{
			this.controller.get('scrollerContainer').className = 'palm-row apps';
			scrollItems += '<div class="appReset"></div>';
			for (d = 0; d < this.dependents.length; d++) 
			{
				scrollItems += '<div class="app' + (packages.packages[this.dependents[d]].isInstalled?(packages.packages[this.dependents[d]].hasUpdate?' update':' installed'):'') + '">';
				scrollItems += '<div class="sub"></div>';
				scrollItems += '<img id="app_' + this.dependents[d] + '" src="' + (packages.packages[this.dependents[d]].icon?packages.packages[this.dependents[d]].icon:'images/noIcon.png') + '" />';
				scrollItems += '</div>';
			}
			
			// fill the screenshot div with data
			this.controller.get('scrollItems').innerHTML = scrollItems;
			
			// initialize listener
			this.appTap = this.appTapHandler.bindAsEventListener(this)
			
			// looping apps adding listeners
			for (d = 0; d < this.dependents.length; d++) 
			{
				Mojo.Event.listen(this.controller.get('app_' + this.dependents[d]), Mojo.Event.tap, this.appTap);
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
}
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
		
		if (this.item.description)
		{
			data += Mojo.View.render({object: {title: 'Description', data: this.item.description}, template: dataTemplate2});
		}
		if (this.item.homepage)
		{
			data += Mojo.View.render({object: {title: 'Homepage', data: '<a href="' + this.item.homepage + '">' + getDomain(this.item.homepage) + '</a>'}, template: dataTemplate});
		}
		data += Mojo.View.render({object: {title: 'Maintainer', data: this.item.maintainer}, template: dataTemplate});
		data += Mojo.View.render({object: {title: 'Version', data: this.item.version}, template: dataTemplate});
		if (this.item.date)
		{
			data += Mojo.View.render({object: {title: 'Last Updated', data: formatDate(this.item.date)}, template: dataTemplate});
		}
		data += Mojo.View.render({object: {title: 'Download Size', data: formatSize(this.item.size)}, template: dataTemplate});
		if (this.item.isInstalled)
		{
			if (this.item.versionInstalled && this.item.hasUpdate)
			{
				data += Mojo.View.render({object: {title: 'Installed Version', data: this.item.versionInstalled}, template: dataTemplate});
			}
			if (this.item.dateInstalled) 
			{
				data += Mojo.View.render({object: {title: 'Installed', data: formatDate(this.item.dateInstalled)}, template: dataTemplate});
			}
			if (this.item.sizeInstalled) 
			{
				data += Mojo.View.render({object: {title: 'Installed Size', data: formatSize(this.item.sizeInstalled)}, template: dataTemplate});
			}
		}
		data += Mojo.View.render({object: {title: 'Id', data: this.item.pkg}, template: dataTemplate});
		data += Mojo.View.render({object: {title: 'Type', data: this.item.type}, template: dataTemplate});
		data += Mojo.View.render({object: {title: 'Category', data: this.item.category}, template: dataTemplate});
		data += Mojo.View.render({object: {title: 'Feed' + (this.item.feeds.length>1?'s':''), data: this.item.feedString, rowStyle: 'last'}, template: dataTemplate});
		
		// fillin the div with data
		this.controller.get('data').innerHTML = data;
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'pkg-view#setupData');
	}
}

PkgViewAssistant.prototype.screenshotTapHandler = function(event)
{
	ssNum = event.srcElement.id.replace(/ss_/, '');
	// push the screenshots scene
	this.controller.stageController.pushScene('screenshots', this.item.screenshots, ssNum);
}
PkgViewAssistant.prototype.appTapHandler = function(event)
{
	appNum = event.srcElement.id.replace(/app_/, '');
	// push the pkg view scene
	this.controller.stageController.pushScene('pkg-view', packages.packages[appNum].getForList(), this.listAssistant);
}

PkgViewAssistant.prototype.updateCommandMenu = function(skipUpdate)
{
	// clear current model list
	this.cmdMenuModel.items = [];
	
	// this is to put space around the icons
	this.cmdMenuModel.items.push({});
	
	// if installed push the launch button first if its an application
	if (this.item.isInstalled && this.item.type == "Application")
	{
		this.cmdMenuModel.items.push({label: $L('Launch'), command: 'do-launch'});
	}
	// if update, push button, but only if this isn't a patch
	if (this.item.hasUpdate && this.item.type != "Patch")
	{
		this.cmdMenuModel.items.push({label: $L('Update'), command: 'do-update'});
	}
	// if installed, push remove button 
	if (this.item.isInstalled)
	{
		this.cmdMenuModel.items.push({label: $L('Remove'), command: 'do-remove'});
	}
	// if not, push install button
	else
	{
		this.cmdMenuModel.items.push({label: $L('Install'), command: 'do-install'});
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
}
PkgViewAssistant.prototype.handleCommand = function(event)
{
	if(event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			
			// display ipkg log
			case 'do-showLog':
				this.controller.showDialog(
				{
					template: 'pkg-view/ipkgLogDialog',
					assistant: new IPKGLogDialogAssistant(this)
				});
				break;
				
			// launch
			case 'do-launch':
				this.item.launch();
				break;
				
			// install
			case 'do-install':
				this.item.doInstall(this);
				break;
				
			// update
			case 'do-update':
				this.item.doUpdate(this);
				break;
				
			// remove
			case 'do-remove':
				this.item.doRemove(this);
				break;
				
			default:
				// this shouldn't happen
				break;
		}
	}
}


/* 
 * this functions are called by the package model when doing stuff
 * anywhere the package model will be installing stuff these functions are needed
 */
PkgViewAssistant.prototype.startAction = function()
{
	// start action is to hide this menu
	this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
	
	// to update the spinner
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	
	// and to hide the data while we do the action
	this.controller.get('viewDataContainer').style.display = "none";
	
	// and make sure the scene scroller is at the top
	this.controller.sceneScroller.mojo.scrollTo(0, 0);
}
PkgViewAssistant.prototype.displayAction = function(msg)
{
	this.controller.get('spinnerStatus').innerHTML = msg;
}
PkgViewAssistant.prototype.endAction = function()
{
	// end action action is to stop the spinner
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	
	// update the screens data
	this.setupData();
	
	// show the data
	this.controller.get('viewDataContainer').style.display = 'inline';
	
	// go ahead and tell the list it needs to update 
	this.listAssistant.setReload();
	
	// and to show this menu again
	this.updateCommandMenu();
}
PkgViewAssistant.prototype.ipkgLog = function(payload)
{
	if (payload.stage)
	{
		if (this.ipkglog != '') this.ipkglog += '<div class="palm-dialog-separator"></div>';
		this.ipkglog += '<div class="title">' + payload.stage + '</div>';
		var stdPlus = false;
		if (payload.errorCode || payload.errorText)
		{
			stdPlus = true;
			this.ipkglog += '<div class="stdErr">';
			this.ipkglog += '<b>' + payload.errorCode + '</b>: '
			this.ipkglog += payload.errorText;
			this.ipkglog += '</div>';
		}
		
		if (payload.stdOut && payload.stdOut.length > 0)
		{
			stdPlus = true;
			this.ipkglog += '<div class="stdOut">';
			for (var s = 0; s < payload.stdOut.length; s++)
			{
				this.ipkglog += '<div>' + payload.stdOut[s] + '</div>';
			}
			this.ipkglog += '</div>';
		}
		
		if (payload.stdErr && payload.stdErr.length > 0)
		{
			stdPlus = true;
			this.ipkglog += '<div class="stdErr">';
			for (var s = 0; s < payload.stdErr.length; s++)
			{
				this.ipkglog += '<div>' + payload.stdErr[s] + '</div>';
			}
			this.ipkglog += '</div>';
		}
		
		if (!stdPlus)
		{
			this.ipkglog += '<div class="msg">No Output.</div>';
		}
	}
	/*
	// debug display
	alert('--- IPKG Log ---');
	for (p in payload)
	{
		alert(p + ': ' + payload[p]);
	}
	*/
}
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
}
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
}
/* end functions called by the package model */


PkgViewAssistant.prototype.activate = function(event) {}
PkgViewAssistant.prototype.deactivate = function(event) {}

PkgViewAssistant.prototype.cleanup = function(event)
{
	// cancel out any running subscription
    if (this.item.subscription)
	{
		this.item.subscription.cancel();
    }
	
	if ((this.item.type == 'Application' || this.item.type == 'Patch') &&
		this.item.screenshots.length > 0) 
	{
		// looping screenshots destroying listeners
		for (s = 0; s < this.item.screenshots.length; s++) 
		{
			Mojo.Event.stopListening(this.controller.get('ss_' + s), Mojo.Event.tap, this.screenshotTap);
		}
	}
	else if ((this.item.type == 'Service' || this.item.type == 'Plugin') &&
			this.dependents.length > 0) 
	{
		// looping apps destroying listeners
	}
}



// IPKG Log Dialog Assistant
function IPKGLogDialogAssistant(sceneAssistant)
{
	// we'll need this later
	this.sceneAssistant = sceneAssistant;
}
IPKGLogDialogAssistant.prototype.setup = function(widget)
{
	this.widget = widget;
	
	// load log
	this.sceneAssistant.controller.get('logData').innerHTML = (this.sceneAssistant.ipkglog != '' ? this.sceneAssistant.ipkglog : 'No Log');
	
	// start scroller widget
	this.sceneAssistant.controller.setupWidget
	(
		'logScroller',
		{ },
		{ mode: 'dominant' }
	);
	
	// setup close button
	this.sceneAssistant.controller.setupWidget
	(
		'closeButton',
		this.attributes = {},
		this.model =
		{
			buttonLabel: "Ok",
			buttonClass: "palm-button",
			disabled: false
		}
	);
	
	// start listening to close button
	Mojo.Event.listen(this.sceneAssistant.controller.get('closeButton'), Mojo.Event.tap, this.close.bindAsEventListener(this));
	
}
IPKGLogDialogAssistant.prototype.close = function(event)
{
	// stop listening to close button
	Mojo.Event.stopListening(this.sceneAssistant.controller.get('closeButton'), Mojo.Event.tap, this.close.bindAsEventListener(this));
	
	// hide the widget
	this.widget.mojo.close();
}


