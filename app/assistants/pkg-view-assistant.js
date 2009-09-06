function PkgViewAssistant(item, listAssistant)
{
	// item of the list that was tapped
	// load it from the global package array based on the pkgNum in the list item
	this.pkgNum = item.pkgNum;
	this.item = packages.packages[this.pkgNum];
	
	// assistant of parent list scene
	this.listAssistant = listAssistant;

	// subscription for update
	this.updateSubscription = null;
	
	// subscription for install
	this.installSubscription = null;
	
	// subscription for remove
	this.removeSubscription = null;
	
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
		for (d = 0; d < this.dependents.length; d++) 
		{
			scrollItems += '<div id="app_' + this.dependents[d] + '" class="app' + (packages.packages[this.dependents[d]].isInstalled?(packages.packages[this.dependents[d]].hasUpdate?' update':' installed'):'') + '">';
			scrollItems += '<div class="sub"></div>';
			scrollItems += '<img src="' + (packages.packages[this.dependents[d]].icon?packages.packages[this.dependents[d]].icon:'images/noIcon.png') + '" />';
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
	
	// push back button to model list
	// what do the old ladies know?
	//this.cmdMenuModel.items.push({label: $L('Back'), icon:'back', command: 'back'});
	
	// this is to put space around the icons
	this.cmdMenuModel.items.push({});
	
	// if update, push button
	if (this.item.hasUpdate)
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

// this function handles the commands from the commandMenu
PkgViewAssistant.prototype.handleCommand = function(event)
{
	if(event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			// pop the scene
			//case 'back':
			//	this.controller.stageController.popScene();
			//	break;
			
			// display ipkg log
			case 'do-showLog':
				this.controller.showDialog(
				{
					template: 'pkg-view/ipkgLogDialog',
					assistant: new IPKGLogDialogAssistant(this)
				});
				break;
				
			// update
			case 'do-update':
				// temporary message for unsupported actions
				if ((this.item.type == 'Service' || this.item.type == 'Plugin') && !prefs.get().allowServiceUpdates)
				{
					this.serviceMessage('Preware doesn\'t currently support updates to ' + this.item.type.toLowerCase() + 's. Please use WebOS Quick Install to update this ' + this.item.type.toLowerCase() + '. (We plan to support it in Preware by v1.0.0)');
					return;
				}
				else if ((this.item.type == 'Patch') && !prefs.get().allowServiceUpdates)
				{
					this.serviceMessage('Preware doesn\'t currently support updates to patches. Instead, you should remove the current version, and then install the new version. (We plan to support it in Preware by v1.0.0)');
					return;
				}
			
				// hide commands
				this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
				
				// call install service
				this.updateSubscription = IPKGService.install(this.onUpdate.bindAsEventListener(this), this.item.pkg, this.item.title);
				break;
				
			// install
			case 'do-install':
				// hide commands
				this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
				
				// call install service
				this.installSubscription = IPKGService.install(this.onInstall.bindAsEventListener(this), this.item.pkg, this.item.title);
				break;
				
			// remove
			case 'do-remove':
				// temporary message for unsupported actions
				if ((this.item.type == 'Service' || this.item.type == 'Plugin') && !prefs.get().allowServiceUpdates)
				{
					this.serviceMessage('Preware doesn\'t currently support removal of ' + this.item.type.toLowerCase() + 's. Please use WebOS Quick Install to remove this ' + this.item.type.toLowerCase() + '. (We plan to support it in Preware by v1.0.0)');
					return;
				}
				
				// hide commands
				this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
				
				// call remove service
				this.removeSubscription = IPKGService.remove(this.onRemove.bindAsEventListener(this), this.item.pkg, this.item.title);
				break;
				
			// info popup
			case 'info':
				this.controller.showAlertDialog({
				    onChoose: function(value) {},
				    title: $L("Info"),
				    message: 'Version: ' + this.item.version,
				    choices:[{label:$L('Ok'), value:""}]
			    });
				break;
				
			default:
				// this shouldn't happen
				break;
		}
	}
}

PkgViewAssistant.prototype.onUpdate = function(payload)
{
	// log payload for display
	this.ipkgLog(payload);
	
	if (!payload) 
	{
		//console.log('update fail');
		
		// message
		var msg = 'Service Error Updating';
	}
	else
	{
		if (payload.returnVal > 0) // keep this around for ipkgservice < 0.8.2
		{
			//console.log('update error');
			
			// message
			var msg = 'Error Updating';
		}
		if (!payload.returnValue)
		{
			//console.log('remove error');
			
			// message
			var msg = 'Error Updating';
		}
		else if (payload.stage == "completed" || payload.errorText == "org.webosinternals.ipkgservice is not running.")
		{
			//console.log('updated');

			// update global and local info
			packages.packages[this.pkgNum].hasUpdate = false;
			this.item.hasUpdate = false;
			
			// tell the list assistant it should reload the list when we return to it
			this.listAssistant.setReload();
			
			// cancel the subscription
			this.updateSubscription.cancel();
			
			// rescan luna to show or hide the pkg
			IPKGService.rescan(function(){});
			
			// message
			var msg = this.item.type + ' Update Completed';
		}
		else return;
	}
	
	// show message
	this.serviceMessage(msg);
	
	// update command menu
	this.updateCommandMenu();
}

PkgViewAssistant.prototype.onInstall = function(payload)
{
	// log payload for display
	this.ipkgLog(payload);
	
	if (!payload) 
	{
		//console.log('install fail');
			
		// message
		var msg = 'Service Error Installing';
	}
	else 
	{
		if (payload.returnVal > 0) // keep this around for ipkgservice < 0.8.2
		{
			//console.log('install error');
			
			// message
			var msg = 'Error Installing';
		}
		if (!payload.returnValue)
		{
			//console.log('remove error');
			
			// message
			var msg = 'Error Installing';
		}
		else if (payload.stage == "completed" || payload.errorText == "org.webosinternals.ipkgservice is not running.")
		{
			//console.log('installed');
			
			// update global and local info
			packages.packages[this.pkgNum].isInstalled = true;
			this.item.isInstalled = true;
			
			// tell the list assistant it should reload the list when we return to it
			this.listAssistant.setReload();
			
			// cancel the subscription
			this.installSubscription.cancel();
			
			// rescan luna to show or hide the pkg
			IPKGService.rescan(function(){});
			
			// message
			var msg = this.item.type + ' Install Completed';
		}
		else return;
	}
	
	// show message
	this.serviceMessage(msg);
	
	// update command menu
	this.updateCommandMenu();
}

PkgViewAssistant.prototype.onRemove = function(payload)
{
	// log payload for display
	this.ipkgLog(payload);
	
	if (!payload) 
	{
		//console.log('remove fail');
			
		// message
		var msg = 'Service Error Removing';
	}
	else
	{
		if (payload.returnVal > 0) // keep this around for ipkgservice < 0.8.2
		{
			//console.log('remove error');
			
			// message
			var msg = 'Error Removing';
		}
		if (!payload.returnValue)
		{
			//console.log('remove error');
			
			// message
			var msg = 'Error Removing';
		}
		else if (payload.stage == "completed" || payload.errorText == "org.webosinternals.ipkgservice is not running.")
		{
			//console.log('removed');
			
			// update global and local info
			packages.packages[this.pkgNum].hasUpdate = false;
			packages.packages[this.pkgNum].isInstalled = false;
			this.item.hasUpdate = false;
			this.item.isInstalled = false;
			
			// tell the list assistant it should reload the list when we return to it
			this.listAssistant.setReload();
			
			// cancel the subscription
			this.removeSubscription.cancel();
			
			// rescan luna to show or hide the pkg
			IPKGService.rescan(function(){});
			
			// message
			var msg = this.item.type + ' Removal Completed';
		}
		else return;
	}
	
	// show message
	this.serviceMessage(msg);
			
	// update command menu
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
		
		if (payload.stdOut.length > 0)
		{
			stdPlus = true;
			this.ipkglog += '<div class="stdOut">';
			for (var s = 0; s < payload.stdOut.length; s++)
			{
				this.ipkglog += '<div>' + payload.stdOut[s] + '</div>';
			}
			this.ipkglog += '</div>';
		}
		
		if (payload.stdErr.length > 0)
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
	
	/*// debug display
	alert('--- IPKG Log ---');
	for (p in payload)
	{
		alert(p + ': ' + payload[p]);
	}
	*/
	
}

PkgViewAssistant.prototype.serviceMessage = function(message)
{
	this.controller.showAlertDialog({
	    onChoose: function(value) {},
	    title: $L(this.item.type),
	    message: message,
	    choices:[{label:$L('Ok'), value:""}]
    });
}

PkgViewAssistant.prototype.reScan = function()
{
	var request = new Mojo.Service.Request("palm://com.palm.applicationManager", {
		method: 'rescan',
		onSuccess: function(payload) { alert('rescan success'); },
		onFailure: function(payload) { alert('rescan error'); }
	});
}

PkgViewAssistant.prototype.activate = function(event) {}

PkgViewAssistant.prototype.deactivate = function(event) {}

PkgViewAssistant.prototype.cleanup = function(event)
{
    if (this.updateSubscription)
	{
		this.updateSubscription.cancel();
    }
    if (this.installSubscription)
	{
		this.installSubscription.cancel();
    }
    if (this.removeSubscription)
	{
		this.removeSubscription.cancel();
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
