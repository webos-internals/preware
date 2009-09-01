function AppViewAssistant(item, listAssistant)
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

AppViewAssistant.prototype.setup = function()
{
	// build command menu
	this.updateCommandMenu(true);
	
	// setup command menu widget
	this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
	
	// setup app title and icon
	this.controller.get('title').innerHTML = this.item.title;
	if (this.item.icon) 
	{
		this.controller.get('icon').innerHTML = '<img src="' + this.item.icon + '" />';
	}
	
	
	
	// build screenshot html
	var screenshots = '';
	if (this.item.screenshots.length > 0) 
	{
		for (s = 0; s < this.item.screenshots.length; s++) 
		{
			screenshots += '<img id="ss_' + s + '" class="screenshot" src="' + this.item.screenshots[s] + '" />';
		}
		
		// fill the screenshot div with data
		this.controller.get('screenshots').innerHTML = screenshots;
		
		// initialize listener
		this.screenshotTap = this.screenshotTapHandler.bindAsEventListener(this)
		
		// looping screenshots adding listeners
		for (s = 0; s < this.item.screenshots.length; s++) 
		{
			Mojo.Event.listen(this.controller.get('ss_' + s), Mojo.Event.tap, this.screenshotTap);
		}
	}
	else
	{
		this.controller.get('scrollerContainer').style.display = 'none';
	}
	
	
	
	// build data html
	var data = '';
	var dataTemplate = 'app-view/dataRow';	
	var dataTemplate2 = 'app-view/dataRow2';	
	
	if (this.item.description)
	{
		data += Mojo.View.render({object: {title: 'Description', data: this.item.description}, template: dataTemplate2});
		alert(this.item.description);
	}
	if (this.item.date)
	{
		data += Mojo.View.render({object: {title: 'Last Updated', data: this.formatDate(this.item.date)}, template: dataTemplate});
	}
	data += Mojo.View.render({object: {title: 'Version', data: this.item.version}, template: dataTemplate});
	data += Mojo.View.render({object: {title: 'Download Size', data: this.formatSize(this.item.size)}, template: dataTemplate});
	data += Mojo.View.render({object: {title: 'Maintainer', data: this.item.maintainer}, template: dataTemplate});
	if (this.item.homepage)
	{
		data += Mojo.View.render({object: {title: 'Homepage', data: '<a href="' + this.item.homepage + '">Link</a>'}, template: dataTemplate});
	}
	if (this.item.isInstalled)
	{
		if (this.item.dateInstalled) 
		{
			data += Mojo.View.render({object: {title: 'Installed', data: this.formatDate(this.item.dateInstalled)}, template: dataTemplate});
		}
		if (this.item.sizeInstalled) 
		{
			data += Mojo.View.render({object: {title: 'Installed Size', data: this.formatSize(this.item.sizeInstalled)}, template: dataTemplate});
		}
		if (this.item.versionInstalled && this.item.hasUpdate)
		{
			data += Mojo.View.render({object: {title: 'Installed Version', data: this.item.versionInstalled}, template: dataTemplate});
		}
	}
	data += Mojo.View.render({object: {title: 'Category', data: this.item.category}, template: dataTemplate});
	data += Mojo.View.render({object: {title: 'Package', data: this.item.pkg, rowStyle: 'last'}, template: dataTemplate});
	
	// fillin the div with data
	this.controller.get('data').innerHTML = data;
	
	
	
	// setup screenshot sideways scroller
	this.controller.setupWidget
	(
		'screenshotScroller',
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

AppViewAssistant.prototype.screenshotTapHandler = function(event)
{
	ssNum = event.srcElement.id.replace(/ss_/, '');
	// push the screenshots scene
	this.controller.stageController.pushScene('screenshots', this.item.screenshots, ssNum);
}

AppViewAssistant.prototype.updateCommandMenu = function(skipUpdate)
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
AppViewAssistant.prototype.handleCommand = function(event)
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
					template: 'app-view/ipkgLogDialog',
					assistant: new IPKGLogDialogAssistant(this)
				});
				break;
				
			// update
			case 'do-update':
				// temporary message for unsupported actions
				if (this.item.type == 'Service' || this.item.type == 'Plugin')
				{
					this.serviceMessage('Preware doesn\'t currently support updates to ' + this.item.type.toLowerCase() + 's. Please use WebOS Quick Install to update this ' + this.item.type.toLowerCase() + '. (We plan to support it in Preware by v1.0.0)');
					return;
				}
				else if (this.item.type == 'Patch')
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
				if (this.item.type == 'Service' || this.item.type == 'Plugin')
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

AppViewAssistant.prototype.onUpdate = function(payload)
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
		if (payload.returnVal > 0) 
		{
			//console.log('update error');
			
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
			
			// rescan luna to show or hide the app
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

AppViewAssistant.prototype.onInstall = function(payload)
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
		if (payload.returnVal > 0)
		{
			//console.log('install error');
			
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
			
			// rescan luna to show or hide the app
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

AppViewAssistant.prototype.onRemove = function(payload)
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
		if (payload.returnVal > 0)
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
			
			// rescan luna to show or hide the app
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

AppViewAssistant.prototype.ipkgLog = function(payload)
{
	if (payload.stage)
	{
		if (this.ipkglog != '') this.ipkglog += '<div class="palm-dialog-separator"></div>';
		this.ipkglog += '<div class="title">' + payload.stage + '</div>';
		
		var stdPlus = false;
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
}

AppViewAssistant.prototype.serviceMessage = function(message)
{
	this.controller.showAlertDialog({
	    onChoose: function(value) {},
	    title: $L(this.item.type),
	    message: message,
	    choices:[{label:$L('Ok'), value:""}]
    });
}

AppViewAssistant.prototype.formatDate = function(date)
{
	var dateObj = new Date(date * 1000);
	var toReturn = '';
	var pm = false;
	
	toReturn += (dateObj.getMonth() + 1) + '/' + dateObj.getDate() + '/' + dateObj.getFullYear() + ' ';
	
	if (dateObj.getHours() > 12) pm = true;
	
	if (!pm)
	{
		toReturn += dateObj.getHours() + ':';
		if (dateObj.getMinutes() < 10) toReturn += '0'
		toReturn += dateObj.getMinutes() + ' AM';
	}
	else
	{
		toReturn += (dateObj.getHours() - 12) + ':';
		if (dateObj.getMinutes() < 10) toReturn += '0'
		toReturn += dateObj.getMinutes() + ' PM';
	}
	
	return toReturn;
}

AppViewAssistant.prototype.formatSize = function(size)
{
	var toReturn = size + ' B';
	var formatSize = size;
	
	if (formatSize > 1024)
	{
		formatSize = (Math.round((formatSize / 1024) * 100) / 100);
		toReturn = formatSize + ' KB';
	}
	if (formatSize > 1024)
	{
		formatSize = (Math.round((formatSize / 1024) * 100) / 100);
		toReturn = formatSize + ' MB';
	}
	// I don't think we need to worry about GB here...
	
	// return formatted size
	return toReturn;
}

AppViewAssistant.prototype.reScan = function()
{
	var request = new Mojo.Service.Request("palm://com.palm.applicationManager", {
		method: 'rescan',
		onSuccess: function(payload) { alert('rescan success'); },
		onFailure: function(payload) { alert('rescan error'); }
	});
}

AppViewAssistant.prototype.activate = function(event) {}

AppViewAssistant.prototype.deactivate = function(event) {}

AppViewAssistant.prototype.cleanup = function(event)
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
	
	if (this.item.screenshots.length > 0) 
	{
		// looping screenshots destroying listeners
		for (s = 0; s < this.item.screenshots.length; s++) 
		{
			Mojo.Event.stopListening(this.controller.get('ss_' + s), Mojo.Event.tap, this.screenshotTap);
		}
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

