function AppViewAssistant(item, listAssistant)
{
	// item of the list that was tapped
	this.item = item;
	
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
	
	// setup app title
	this.controller.get('appTitle').innerHTML = this.item.Description;
	
	
	// build appData
	var appData = '';
	var dataTemplate = 'app-view/dataRow';
	appData += Mojo.View.render({object: {title: 'Package', data: this.item.Package}, template: dataTemplate});
	if (this.item.SourceObj != undefined && this.item.SourceObj.LastUpdated)
	{
		appData += Mojo.View.render({object: {title: 'Last Update', data: this.formatDate(this.item.SourceObj.LastUpdated)}, template: dataTemplate});
	}
	appData += Mojo.View.render({object: {title: 'Version', data: this.item.Version}, template: dataTemplate});
	appData += Mojo.View.render({object: {title: 'Download Size', data: this.formatSize(this.item.Size)}, template: dataTemplate});
	appData += Mojo.View.render({object: {title: 'Category', data: this.item.Section}, template: dataTemplate});
	appData += Mojo.View.render({object: {title: 'Maintainer', data: this.item.Maintainer}, template: dataTemplate});
	if (this.item.SourceObj != undefined && this.item.SourceObj.Homepage)
	{
		appData += Mojo.View.render({object: {title: 'Homepage', data: '<a href="' + this.item.SourceObj.Homepage + '">Link</a>'}, template: dataTemplate});
	}
	
	
	// fillin the div
	this.controller.get('appData').innerHTML = appData;
	
	
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
	if (this.item.Update)
	{
		this.cmdMenuModel.items.push({label: $L('Update'), command: 'do-update'});
	}
	// if installed, push remove button 
	if (this.item.Installed)
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
				// hide commands
				this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
				
				// call install service
				this.updateSubscription = IPKGService.install(this.onUpdate.bindAsEventListener(this), this.item.Package, this.item.Description);
				break;
				
			// install
			case 'do-install':
				// hide commands
				this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
				
				// call install service
				this.installSubscription = IPKGService.install(this.onInstall.bindAsEventListener(this), this.item.Package, this.item.Description);
				break;
				
			// remove
			case 'do-remove':
				// hide commands
				this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
				
				// call remove service
				this.removeSubscription = IPKGService.remove(this.onRemove.bindAsEventListener(this), this.item.Package, this.item.Description);
				break;
				
			// info popup
			case 'info':
				this.controller.showAlertDialog({
				    onChoose: function(value) {},
				    title: $L("Info"),
				    message: 'Version: ' + this.item.Version,
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
			packages.apps[this.item.appNum].Update = false;
			this.item.Update = false;
			
			// tell the list assistant it should reload the list when we return to it
			this.listAssistant.setReload();
			
			// cancel the subscription
			this.updateSubscription.cancel();
			
			// rescan luna to show or hide the app
			IPKGService.rescan(function(){});
			
			// message
			var msg = 'Application Updated Completed';
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
			packages.apps[this.item.appNum].Installed = true;
			this.item.Installed = true;
			
			// tell the list assistant it should reload the list when we return to it
			this.listAssistant.setReload();
			
			// cancel the subscription
			this.installSubscription.cancel();
			
			// rescan luna to show or hide the app
			IPKGService.rescan(function(){});
			
			// message
			var msg = 'Application Install Completed';
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
			packages.apps[this.item.appNum].Update = false;
			packages.apps[this.item.appNum].Installed = false;
			this.item.Update = false;
			this.item.Installed = false;
			
			// tell the list assistant it should reload the list when we return to it
			this.listAssistant.setReload();
			
			// cancel the subscription
			this.removeSubscription.cancel();
			
			// rescan luna to show or hide the app
			IPKGService.rescan(function(){});
			
			// message
			var msg = 'Application Removal Completed';
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
	    title: $L("Application"),
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

AppViewAssistant.prototype.cleanup = function(event) {

    if (this.updateSubscription) {
	this.updateSubscription.cancel();
    }

    if (this.installSubscription) {
	this.installSubscription.cancel();
    }

    if (this.removeSubscription) {
	this.removeSubscription.cancel();
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

