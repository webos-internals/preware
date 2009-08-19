function AppViewAssistant(item)
{
	this.item = item;
	
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
	this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuModel);
	
	// setup app title
	this.controller.get('appTitle').innerHTML = this.item.Description;
	
	// temporary print app data
	var appData = 'Package: ' + this.item.Package + '<br/>\
				   Version: ' + this.item.Version + '<br/>\
				   Section: ' + this.item.Section.substr(0, 1).toUpperCase() + this.item.Section.substr(1) + '<br/>\
				   Maintainer: ' + this.item.Maintainer;
	if (this.item.SourceObj != undefined && this.item.SourceObj.Homepage)
	{
		appData += '<br/>Homepage: <a href="' + this.item.SourceObj.Homepage + '">Link</a>';
	}
	this.controller.get('appData').innerHTML = appData;
}

AppViewAssistant.prototype.updateCommandMenu = function(skipUpdate)
{
	// clear current model list
	this.cmdMenuModel.items = [];
	
	// push back button to model list
	// what do the old ladies know?
	//this.cmdMenuModel.items.push({label: $L('Back'), icon:'back', command: 'back'});
	
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
			apps[this.item.appNum].Update = false;
			this.item.Update = false;
			
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
			apps[this.item.appNum].Installed = true;
			this.item.Installed = true;
			
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
			apps[this.item.appNum].Update = false;
			apps[this.item.appNum].Installed = false;
			this.item.Update = false;
			this.item.Installed = false;
			
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
