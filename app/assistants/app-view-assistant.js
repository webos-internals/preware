function AppViewAssistant(item, listAssistant)
{
	// item of the list that was tapped
	this.item = item;
	
	// assistant of parent list scene
	this.listAssistant = listAssistant;
	
	// setup command menu
	this.cmdMenuModel =
	{
		label: $L('Menu'), 
		items: []
	};
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
	if (this.item.SourceObj != undefined && this.item.SourceObj['Last-Updated'])
	{
		appData += Mojo.View.render({object: {title: 'Last Update', data: this.formatDate(this.item.SourceObj['Last-Updated'])}, template: dataTemplate});
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
				
			// update
			case 'do-update':
				// hide commands
				this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
				
				// call install service
				IPKGService.install(this.onUpdate.bindAsEventListener(this), this.item.Package);
				break;
				
			// install
			case 'do-install':
				// hide commands
				this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
				
				// call install service
				IPKGService.install(this.onInstall.bindAsEventListener(this), this.item.Package);
				break;
				
			// remove
			case 'do-remove':
				// hide commands
				this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
				
				// call remove service
				IPKGService.remove(this.onRemove.bindAsEventListener(this), this.item.Package);
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
		else 
		{
			//console.log('updated');

			// update global and local info
			packages.apps[this.item.appNum].Update = false;
			this.item.Update = false;
			
			// tell the list assistant it should reload the list when we return to it
			this.listAssistant.setReload();
			
			// rescan luna to show or hide the app
			IPKGService.rescan(function(){});
			
			// message
			var msg = 'Application Updated';
		}
	}
	
	// show message
	this.serviceMessage(msg);
	
	// update command menu
	this.updateCommandMenu();
}

AppViewAssistant.prototype.onInstall = function(payload)
{
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
		else 
		{
			//console.log('installed');
			
			// update global and local info
			packages.apps[this.item.appNum].Installed = true;
			this.item.Installed = true;
			
			// tell the list assistant it should reload the list when we return to it
			this.listAssistant.setReload();
			
			// rescan luna to show or hide the app
			IPKGService.rescan(function(){});
			
			// message
			var msg = 'Application Installed';
		}
	}
	
	// show message
	this.serviceMessage(msg);
	
	// update command menu
	this.updateCommandMenu();
}

AppViewAssistant.prototype.onRemove = function(payload)
{
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
		else 
		{
			//console.log('removed');
			
			// update global and local info
			packages.apps[this.item.appNum].Update = false;
			packages.apps[this.item.appNum].Installed = false;
			this.item.Update = false;
			this.item.Installed = false;
			
			// tell the list assistant it should reload the list when we return to it
			this.listAssistant.setReload();
			
			// rescan luna to show or hide the app
			IPKGService.rescan(function(){});
			
			// message
			var msg = 'Application Removed';
		}
	}
	
	// show message
	this.serviceMessage(msg);
			
	// update command menu
	this.updateCommandMenu();
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

AppViewAssistant.prototype.cleanup = function(event) {}
