//TODO: implement saved packetlist. Old implementation used Mojo.Depot.
//I would suggest local storage for the packetlist.
//Nice would be db8 with _sync: true in the entries, so a backup on Palm Servers would happen. But how long will that still exist?

enyo.singleton({
	name: "preware.SavedPacketlist",
	load: function(callback) {
		enyo.error("preware.SavedPacketlist.load is only a stub.");
		/*
		try {
			this.doDisplayStatus({msg: $L("<strong>Reading Saved Package List</strong>")});
			this.savedDB = new Mojo.Depot
			({
				name:			"packageDB",
				version:		1,
				estimatedSize:	1048576,
				replace:		false
			},
				this.loadSavedOpenOK.bind(this),
				this.loadSavedError.bind(this));
		}
		catch (e)
		{
			Mojo.Log.logException(e, 'packagesModel#loadSaved');
		}
		return;
		*/
		if (callback) {
			callback({success: false});
		}
	},
	
	save: function(callback) {
		enyo.error("preware.SavedPacketlist.save is only a stub");
		
		//see below in the commented	code how the list was created earlier.
		
		if (callback) {
			callback({success: false});
		}
	}
	
	/* more stuff from the original implementation:
	
loadSavedOpenOK = function()
{
	try
	{
		this.savedDB.get("savedPackageList",
						 this.loadSavedGetOK.bind(this),
						 this.doneLoading.bind(this));
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#loadSavedOpenOK');
	}
	return;
};

loadSavedGetOK = function(savedPackageList)
{
	try
	{
		if (savedPackageList)
		{
			for (var p = 0; p < savedPackageList.length; p++)
			{
				var savedPkg = new packageModel(savedPackageList[p]);
				if (savedPkg)
				{
					var pkgNum = this.packageInList(savedPkg.pkg);
					var gblPkg = this.packages[pkgNum];
					if (gblPkg && (!gblPkg.appCatalog || prefs.get().useTuckerbox))
					{
						gblPkg.isInSavedList = true;
					}
				}
			}
			this.updateAssistant.displayAction($L("<strong>Complete!</strong>"));
			this.doneLoading();
		}
		else
		{
			Mojo.Log.info('No savedPackageList');
			this.loadSavedDefault(this.doneLoading.bind(this));
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#loadSavedGetOK');
		this.doneLoading();
	}
};

loadSavedDefault = function(callback)
{
	try
	{
		for (var p = 0; p < this.packages.length; p++) {
			if (this.packages[p].isInstalled && (!this.packages[p].appCatalog || prefs.get().useTuckerbox)) {
				//alert('Default ' + this.packages[p].pkg);
				//alert("isInstalled: " + this.packages[p].isInstalled);
				//alert("appCatalog: " + this.packages[p].appCatalog);
				this.packages[p].isInSavedList = true;
			}
			else {
				this.packages[p].isInSavedList = false;
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#loadSavedDefault');
	}
	this.savePackageList(callback);
};

loadSavedError = function(result)
{
	try
	{
		this.updateAssistant.errorMessage('Preware', $L("Unable to open saved packages database: ") + result,
											this.updateAssistant.doneUpdating);
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#loadSavedError');
	}
	return;
};

savePackageList = function(callback)
{
	try
	{
		var savedPackageList = [];
	
		for (var p = 0; p < this.packages.length; p++) {
			if (this.packages[p].isInSavedList) {
				var info = this.packages[p].infoSave();
				//alert('Save ' + this.packages[p].pkg);
				//alert('info.Package: ' + info.Package);
				//alert('info.Version: ' + info.Version);
				//alert('info.Size: ' + info.Size);
				//alert('info.Filename: ' + info.Filename);
				//alert('info.Description: ' + info.Description);
				//alert('info.Source: ' + info.Source);
				savedPackageList.push(info);
			}
		}
		
		this.savedDB.add("savedPackageList", savedPackageList,
						 function() {
							 if (callback) callback();
						 },
						 function() {
							 Mojo.Controller.getAppController().showBanner({
									 messageText:$L("Preware: Error writing Saved Package List"),
									 icon:'miniicon.png'
								 } , {source:'saveNotification'});
							 if (callback) callback();
						 });
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packagesModel#savePackageList');
		if (callback) callback();
	}
	return;
};

*/
});
