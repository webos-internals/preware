// global items object
var packages = new packagesModel();

function MainAssistant()
{
	// subtitle random list
	this.randomSub = 
	[
		'The Open Standard Installer',
		'The Advanced Homebrew Installer',
		'The Universal Application Installer',
		'Accessing All Open Standard Feeds',
		'The Advanced Homebrew Installer' // double billing
	];
	
	// holds the preferences cookie
	this.prefs = new prefCookie();
	
	// load stayawake class
	this.stayAwake = new stayAwake();
}

MainAssistant.prototype.setup = function()
{
	// set random subtitle
	this.controller.get('subTitle').innerHTML = this.randomSub[Math.floor(Math.random() * this.randomSub.length)];
	
	// set version string
	this.controller.get('version').innerHTML = "v" + Mojo.Controller.appInfo.version;
	
	// spinner model
	this.spinnerModel = {spinning: true};
	
	// setup spinner widget
	this.controller.setupWidget('spinner', {spinnerSize: 'large'}, this.spinnerModel);
	
	// setup list model
	this.mainModel = { items: [] };
	
	// setup list widget
	this.controller.setupWidget('mainList', { itemTemplate: "main/rowTemplate", swipeToDelete: false, reorderable: false }, this.mainModel);
	Mojo.Event.listen(this.controller.get('mainList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	
	// hide the list while we update ipkg
	this.controller.get('mainList').style.display = "none";

	// setup menu model
	var menuModel =
	{
		visible: true,
		items: [
		/*{ // we're hiding this crap for now since it doesn't do anything at all.
			label: "Update Feeds",
			command: 'do-update'
		},*/
		{
			label: "Preferences...",
			command: 'do-prefs'
		},
		{
			label: "List Configs...",
			command: 'do-configs'
		}]
	}
	
	// setup widget
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, menuModel);
	
	// this is the start of the stayawake class to keep it awake till we're done with it
	this.stayAwake.start();
	
	// start with checking the internet connection
	this.controller.get('spinnerStatus').innerHTML = "Checking Connection";
	this.controller.serviceRequest('palm://com.palm.connectionmanager', {
	    method: 'getstatus',
	    onSuccess: this.onConnection.bindAsEventListener(this),
	    onFailure: this.onConnection.bindAsEventListener(this)
	});
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
		// if not, go right to loading the pkg info
		this.controller.get('spinnerStatus').innerHTML = "Loading";
		IPKGService.info(this.onInfo.bindAsEventListener(this));
	}
}

MainAssistant.prototype.onUpdate = function(payload)
{
	try 
	{
		if (!payload) 
		{
			// i dont know if this will ever happen, but hey, it might
			this.alertMessage('Preware', 'Update Error. The service probably isn\'t running.');
			this.doneUpdating();
		}
		else if (payload.errorCode == -1)
		{
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.alertMessage('Preware', 'The Package Manager Service is not running. Did you remember to install it? If you did, perhaps you should try rebooting your phone.');
				this.doneUpdating();
			}
			else
			{
				this.alertMessage('Preware', payload.errorText);
				this.doneUpdating();
			}
		}
		else if (payload.returnVal != undefined) 
		{
			// its returned, but we don't really care if anything was actually updated
			//console.log(payload.returnVal);
			
			// lets call the function to update the global list of pkgs
			this.controller.get('spinnerStatus').innerHTML = "Loading";
			IPKGService.info(this.onInfo.bindAsEventListener(this));
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#onUpdate');
		this.alertMessage('onUpdate Error', e);
		
		// we're done here
		this.doneUpdating();
	}
}

MainAssistant.prototype.onInfo = function(payload)
{
	try 
	{
		if (!payload) 
		{
			this.alertMessage('Preware', 'Unable to get list of packages.');
			this.doneUpdating();
		}
		else if (payload.errorCode == -1) 
		{
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				this.alertMessage('Preware', 'The Package Manager Service is not running. Did you remember to install it? If you did, perhaps you should try rebooting your phone.');
				this.doneUpdating();
			}
			else
			{
				this.alertMessage('Preware', payload.errorText);
				this.doneUpdating();
			}
		}
		else 
		{
			this.controller.get('spinnerStatus').innerHTML = "Parsing";
			
			// send payload to items object
			packages.load(payload);
			
			// we're done here
			this.doneUpdating();
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#onInfo');
		this.alertMessage('onInfo Error', e);
		
		// we're done here
		this.doneUpdating();
	}
}

// this is called to update the list (namely the counts and styles)
MainAssistant.prototype.updateList = function()
{
	try 
	{
		// clear main list model of its items
		this.mainModel.items = [];
		
		this.mainModel.items.push(
		{
			name: $L('Available Updates'),	// displays in list
			style: 'disabled',				// class for use in the list display
			scene: 'pkg-list',				// scene that will be pushed on tap 
			pkgType: 'all',					// 
			pkgValue: 'updates',			// 
			pkgCount: 0						// count of pkgs for display in list, will only display if style is set to 'showCount'
		});
		
		this.mainModel.items.push(
		{
			name: $L('Available Applications'),
			style: 'disabled',
			scene: 'pkg-groups',
			list: 'categories',
			pkgType: 'Application',
			pkgValue: 'group',
			pkgCount: 0
		});
		
		this.mainModel.items.push(
		{
			name: $L('Available Patches'),
			style: 'disabled',
			scene: 'pkg-list',
			pkgType: 'Patch',
			pkgValue: 'all',
			pkgCount: 0
		});
		
		if (this.prefs.get().showOther)
		{
			this.mainModel.items.push(
			{
				name: $L('Available Plugins'),
				//style: 'disabled',
				scene: 'pkg-list',
				pkgType: 'Plugin',
				pkgValue: 'all',
				pkgCount: 0
			});
			
			this.mainModel.items.push(
			{
				name: $L('Available Services'),
				//style: 'disabled',
				scene: 'pkg-list',
				pkgType: 'Service',
				pkgValue: 'all',
				pkgCount: 0
			});
		}
		
		this.mainModel.items.push(
		{
			name: $L('Installed Packages'),
			style: 'disabled',
			scene: 'pkg-list',
			pkgType: 'all',
			pkgValue: 'installed',
			pkgCount: 0
		});
		
		this.mainModel.items.push(
		{
			name: $L('List of Everything'),
			style: 'disabled',
			scene: 'pkg-list',
			pkgType: 'all',
			pkgValue: 'all'
		});
		
		// loop through pkgs to build counts for the list
		if (packages.packages.length > 0)
		{
			for (var p = 0; p < packages.packages.length; p++) 
			{
				if (packages.packages[p].hasUpdate)
				{
					this.addPkgToList(0);
				}
				if (packages.packages[p].isInstalled)
				{
					if (this.prefs.get().showOther) 
					{
						this.addPkgToList(5);
					}
					else
					{
						this.addPkgToList(3);
					}
				}
				
				if (packages.packages[p].category == packages.patchCategory)
				{
					this.addPkgToList(2);
				}
				else
				{
					this.addPkgToList(1);				
				}
			}
			
			// enable everything list
			this.mainModel.items[(this.mainModel.items.length-1)].style = false;
			
		}
		
		// update list widget
		this.controller.get('mainList').mojo.noticeUpdatedItems(0, this.mainModel.items);
	 	this.controller.get('mainList').mojo.setLength(this.mainModel.items.length);
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'main#updateList');
		this.alertMessage('updateList Error', e);
	}
}

// this function updates the list model by giving enabling it and adding an pkg
MainAssistant.prototype.addPkgToList = function(id)
{
	this.mainModel.items[id].style = 'showCount';
	this.mainModel.items[id].pkgCount++;
}

// stops the spinner and displays the list
MainAssistant.prototype.doneUpdating = function()
{
	// stop and hide the spinner
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	
	// update the list
	this.updateList();
	
	// show the list
	this.controller.get('mainList').style.display = "inline";
	
	// we're done loading so let the phone sleep if it needs to
	this.stayAwake.end();
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
			this.controller.stageController.pushScene('preferences');
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
			msg += '<b>' + p + '</b>:<br />' + payload.configs[x][p];
		}
	}
	this.alertMessage('IPKG Configs', '<div style="font-size: 12px;">' + msg + '</div>');
}

MainAssistant.prototype.deactivate = function(event) {}

MainAssistant.prototype.cleanup = function(event)
{
	// should maybe stop the power timer?
	this.stayAwake.end();
}
