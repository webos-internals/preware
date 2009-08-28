// global items object
var packages = new packageModel();

function MainAssistant()
{
	// subtitle random list
	this.randomSub = 
	[
		'The Open Standard Installer',
		'The Advanced Homebrew Installer',
		'The Advertising-Free Installer',
		'The Most Applications Available'
	];
	
	// holds the update cookie
	//updateCookie: false,
	
	// main list model
	this.mainModel = 
	{
		items: [
		{
			name: $L('Application Updates'),	// displays in list
			style: 'disabled',					// class for use in the list display
			scene: 'app-list',					// scene that will be pushed on tap 
			list: 'updates',					// variable used by the app-list scene to display the correct list other scenes will have different variables
			appCount: 0							// count of apps for display in list, will only display if style is set to 'showCount'
		},
		{
			name: $L('Available Applications'),
			style: 'disabled',
			scene: 'app-categories'
		},
		{
			name: $L('Available Patches'),
			style: 'disabled',
			list: 'category',
			category: packages.patchCategory,
			scene: 'app-list',
			appCount: 0
		},
		{
			name: $L('Installed Applications'),
			style: 'disabled',
			scene: 'app-list',
			list: 'installed',
			appCount: 0
		},
		{
			name: $L('List of Everything'),
			style: 'disabled',
			scene: 'app-list',
			list: 'all'
		}]
	};
	
	// spinner model
	this.spinnerModel = {spinning: true};
}

MainAssistant.prototype.setup = function()
{
	// set random subtitle
	this.controller.get('subTitle').innerHTML = this.randomSub[Math.floor(Math.random() * this.randomSub.length)];
	
	// set version string
	this.controller.get('version').innerHTML = "v" + Mojo.Controller.appInfo.version;
	
	// setup spinner model
	this.controller.setupWidget('spinner', {spinnerSize: 'large'}, this.spinnerModel);
	
	// setup list model
	this.controller.setupWidget('mainList', { itemTemplate: "main/rowTemplate", swipeToDelete: false, reorderable: false }, this.mainModel);
	Mojo.Event.listen(this.controller.get('mainList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	
	// hide the list while we update ipkg
	this.controller.get('mainList').style.display = "none";
	
	// start with checking the internet connection
	this.controller.get('spinnerStatus').innerHTML = "Checking Connection";
	this.controller.serviceRequest('palm://com.palm.connectionmanager', {
	    method: 'getstatus',
	    onSuccess: this.onConnection.bindAsEventListener(this),
	    onFailure: this.onConnection.bindAsEventListener(this)
	});

	// setup menu model
	var menuModel =
	{
		visible: true,
		items: [
		/*{ // we're hiding this crap for now since it doesn't do anything at all.
			label: "Update Feeds",
			command: 'do-update'
		},
		{
			label: "Preferences...",
			command: 'do-prefs'
		},*/
		{
			label: "List Configs...",
			command: 'do-configs'
		}]
	}
	
	// setup widget
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, menuModel);
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

MainAssistant.prototype.onConnection = function(response)
{
	if (response && response.returnValue === true && response.isInternetConnectionAvailable === true)
	{
		// initiate update if we have a connection
		this.controller.get('spinnerStatus').innerHTML = "Updating";
		IPKGService.update(this.onUpdate.bindAsEventListener(this));
	}
	else
	{
		// if not, go right to loading the app info
		this.controller.get('spinnerStatus').innerHTML = "Loading";
		IPKGService.info(this.onInfo.bindAsEventListener(this));
	}
}

MainAssistant.prototype.onUpdate = function(payload)
{
	if (!payload) 
	{
		// i dont know if this will ever happen, but hey, it might
		this.alertMessage('Preware', 'Update Error. The service probably isn\'t running.');
		this.hideSpinner();
	}
	else if (payload.errorCode == -1)
	{
		this.alertMessage('Preware', payload.errorText);
		this.hideSpinner();
	}
	else if (payload.returnVal != undefined) 
	{
		// its returned, but we don't really care if anything was actually updated
		//console.log(payload.returnVal);
		
		// lets call the function to update the global list of apps
		this.controller.get('spinnerStatus').innerHTML = "Loading";
		IPKGService.info(this.onInfo.bindAsEventListener(this));
	}
}

MainAssistant.prototype.onInfo = function(payload)
{
	if (!payload) 
	{
		this.alertMessage('Preware', 'Unable to get list of apps.');
		this.hideSpinner();
	}
	else
	{
		// send payload to items object
		packages.load(payload);
		
		// update the list
		this.updateList();
		
		// hide the spinner
		this.hideSpinner();
	}
}

// this is called to update the list (namely the counts and styles)
MainAssistant.prototype.updateList = function()
{
	// reset things we may have changed in the list
	this.mainModel.items[0].style = 'disabled';
	this.mainModel.items[0].appCount = 0;
	this.mainModel.items[1].appCount = 0;
	this.mainModel.items[2].style = 'disabled';
	this.mainModel.items[2].appCount = 0;
	this.mainModel.items[3].style = 'disabled';
	this.mainModel.items[3].appCount = 0;
	this.mainModel.items[4].style = false;
	
	// loop through apps to build counts for the list
	if (packages.apps.length > 0)
	{
		for (var a = 0; a < packages.apps.length; a++) 
		{
			if (packages.apps[a].Update)
			{
				this.addAppToList(0);
			}
			if (packages.apps[a].Installed)
			{
				this.addAppToList(3);
			}
			
			if (packages.apps[a].Section == packages.patchCategory)
			{
				this.addAppToList(2);
			}
			else
			{
				this.addAppToList(1);				
			}
		}
	}
	
	// update list widget
	this.controller.get('mainList').mojo.noticeUpdatedItems(0, this.mainModel.items);
}

// this function updates the list model by giving enabling it and adding an app
MainAssistant.prototype.addAppToList = function(id)
{
	this.mainModel.items[id].style = 'showCount';
	this.mainModel.items[id].appCount++;
}

// stops the spinner and displays the list
MainAssistant.prototype.hideSpinner = function()
{
	// stop and hide the spinner
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	
	// show the list
	this.controller.get('mainList').style.display = "inline";
}

MainAssistant.prototype.activate = function(event)
{
	// something may have been updated/installed/removed so lets update the list
	this.updateList();
}

MainAssistant.prototype.alertMessage = function(title, message)
{
	this.controller.showAlertDialog({
	    onChoose: function(value) {},
		allowHTMLMessage: true,
	    title: title,
	    message: message,
	    choices:[{label:$L('Ok'), value:""}]
    });
}

MainAssistant.prototype.handleCommand = function(event)
{

	if (event.type == Mojo.Event.command) {

		switch (event.command) {

		case 'do-update':
			break;

		case 'do-prefs':
			break;

		case 'do-configs':
			IPKGService.list_configs(this.onConfigs.bindAsEventListener(this));
			break;

		}

	}

}

MainAssistant.prototype.onConfigs = function(payload)
{
	var msg = "";
	for (var x = 0; x < payload.configs.length; x++)
	{
		for (p in payload.configs[x]) 
		{
			msg += '<b>' + p + '</b>: ' + payload.configs[x][p];
		}
	}
	this.alertMessage('IPKG Configs', '<div style="font-size: 14px;">' + msg + '</div>');
}

MainAssistant.prototype.deactivate = function(event) {}

MainAssistant.prototype.cleanup = function(event) {}
