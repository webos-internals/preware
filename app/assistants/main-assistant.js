// global arrays
var apps = [];
var cats = [];

function MainAssistant()
{
	// subtitle random list
	this.randomSub = 
	[
		'The Open Source Installer',
		'The App Installer For Users',
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
			style: false,
			scene: 'app-categories'
		},
		{
			name: $L('Available Patches'),
			style: 'disabled',
			scene: false
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
			style: false,
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
	
	var menuAttributes = {
            omitDefaultItems: true
	}

	var menuModel = {
			visible: true,
			items: [
		            {label: "Update Feeds", command: 'do-update'},
		            { label: "Preferences...", command: 'do-prefs' },
			        ]
	}
	
	this.controller.setupWidget(Mojo.Menu.appMenu, menuAttributes, menuModel);
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
		// if its not running, it actually never gets here, as it never returns
		Mojo.Controller.errorDialog('Update Error. The service probably isn\'t running.');
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
		Mojo.Controller.errorDialog('Unable to get list of apps.');
		this.hideSpinner();
	}
	else
	{
		for (var x = 0; x < payload.info.length; x++)
		{
			// check if Source is json object
			// basically, if it has a { in it, we'll assume its json data
			if (payload.info[x].Source != undefined && payload.info[x].Source.include('{')) 
			{
				payload.info[x].SourceObj = JSON.parse(payload.info[x].Source);
				
				// if the source object has a category, put it in the section field
				if (payload.info[x].SourceObj.Category)
				{
					payload.info[x].Section = payload.info[x].SourceObj.Category;
				}
			}
			
			var appNum = this.appInList(payload.info[x].Package);
			if (appNum === false) 
			{
				// add install variable
				if (payload.info[x].Status.include('not-installed')) 
				{
					payload.info[x].Installed = false;
				}
				else 
				{
					payload.info[x].Installed = true;
				}
				
				// add default no-update
				payload.info[x].Update = false;
				
				// add this package to global app list
				apps.push(payload.info[x]);
			}
			else
			{
				// check if its newer
				var newer = this.versionNewer(apps[appNum].Version, payload.info[x].Version);
				
				// if they're both not installed, and this is newer, replace the old one
				if (payload.info[x].Status.include('not-installed') &&
					apps[appNum].Status.include('not-installed') &&
					newer)
				{
					apps[appNum] = payload.info[x];
					continue;
				}
				
				// if the new one is not installed and the old one is, and its older, update the old one
				if (!payload.info[x].Status.include('not-installed') &&
					apps[appNum].Status.include('not-installed') &&
					!newer)
				{
					apps[appNum].Installed = true;
					apps[appNum].Update = true;
					apps[appNum].VersionOld = payload.info[x].Version;
					continue;
				}
				
				// if the new one is not installed but the old one is, and this is newer, replace the old one
				if (!payload.info[x].Status.include('not-installed') &&
					apps[appNum].Status.include('not-installed') &&
					newer)
				{
					payload.info[x].Installed = true;
					payload.info[x].Update = false;
					apps[appNum] = payload.info[x];
					continue;
				}
			}
		}
		
		// sort the packages
		apps.sort(function(a, b)
		{
			if (a.Description && b.Description) return ((a.Description.toLowerCase() < b.Description.toLowerCase()) ? -1 : ((a.Description.toLowerCase() > b.Description.toLowerCase()) ? 1 : 0));
			else return -1;
		});
		
		
		// add package categorys to global category list
		for (var a = 0; a < apps.length; a++) 
		{
			var catNum = this.catInList(apps[a].Section);
			if (catNum === false) 
			{
				// push new category
				cats.push({name: apps[a].Section, count: 1});
			}
			else
			{
				// increment category count
				cats[catNum].count++;
			}
		}
		
		// sort categories
		cats.sort(function(a, b)
		{
			// this needs to be lowercase for sorting.
			if (a.name.toLowerCase() && b.name.toLowerCase()) return ((a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : ((a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : 0));
			else return -1;
		});
		
		
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
	this.mainModel.items[3].style = 'disabled';
	this.mainModel.items[3].appCount = 0;
	
	// loop through apps to build counts for the list
	if (apps.length > 0)
	{
		for (var a = 0; a < apps.length; a++) 
		{
			if (apps[a].Update)
			{
				this.addAppToList(0);
			}
			if (apps[a].Installed)
			{
				this.addAppToList(3);
			}
			
			this.addAppToList(1);
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

// determines if one version number is newer then the other.
MainAssistant.prototype.versionNewer = function(one, two)
{
	// if one >= two returns false
	// if one < two returns true
	var v1 = one.split('.');
	var v2 = two.split('.');
	if (parseInt(v2[0]) > parseInt(v1[0])) return true; 
	else if (parseInt(v2[0]) == parseInt(v1[0]) && parseInt(v2[1]) > parseInt(v1[1])) return true;
	else if (parseInt(v2[0]) == parseInt(v1[0]) && parseInt(v2[1]) == parseInt(v1[1]) && parseInt(v2[2]) > parseInt(v1[2])) return true;
	return false;
}

// for checking if a package is already in the global list
MainAssistant.prototype.appInList = function(pkg)
{
	if (apps.length > 0)
	{
		for (var a = 0; a < apps.length; a++)
		{
			if (apps[a].Package == pkg) 
			{
				return a;
			}
		}
	}
	return false;
}

// for checking if a category is already in the global list
MainAssistant.prototype.catInList = function(cat)
{
	if (cats.length > 0) 
	{
		for (var c = 0; c < cats.length; c++) 
		{
			if (cats[c].name == cat) 
			{
				return c;
			}
		}
	}
	return false;
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

MainAssistant.prototype.handleCommand = function(event)
{

	if (event.type == Mojo.Event.command) {

		switch (event.command) {

		case 'do-update':
			break;

		case 'do-prefs':
			break;

		}

	}

}

MainAssistant.prototype.deactivate = function(event) {}

MainAssistant.prototype.cleanup = function(event) {}
