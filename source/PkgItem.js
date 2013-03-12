/*global enyo */
enyo.kind({
	name: "preware.PkgItem",
	kind: enyo.Control,
	components: [
		{ kind: enyo.Image, name: "icon" }
	],
	
	// this function will return an object ready for inclusion in the list widget
packageModel.prototype.getForList = function(item)
{
	var listObj = {};
	
	try
	{
		listObj.pkg = this.pkg;
		listObj.title = this.title;
		listObj.date = this.date;
		listObj.price = this.price;
		
		listObj.pkgNum = packages.packageInList(this.pkg);
		
		listObj.rowClass = '';
		
		// include description if we need it for searching.
		if (prefs.get().searchDesc && this.description)
		{
			listObj.description = this.description.stripTags();
		}
		
		listObj.sub = '';
		var secondOptions = prefs.get().secondRow.split(',');
		for (s = 0; s < secondOptions.length; s++)
		{
			if (s > 0) listObj.sub += ' - ';
			switch (secondOptions[s])
			{
				case 'id':
					listObj.sub += this.pkg;
					break;
					
				case 'version':
					if (item && item.pkgList == 'installed' && this.isInstalled && this.versionInstalled) 
					{
						listObj.sub += 'v' + this.versionInstalled;
					}
					else
					{
						listObj.sub += 'v' + this.version;
					}
					break;
					
				case 'maint':
					var tempM = '';
					for (var m = 0; m < this.maintainer.length; m++) 
					{
						if (tempM != '') 
						{
							tempM += ', ';
						}
						tempM += this.maintainer[m].name;
					}
					if (tempM == '')
					{
						tempM = '<i>Unknown</i>';
					}
					listObj.sub += tempM;
					break;
					
				case 'date':
					if (this.date) 
					{
						listObj.sub += formatDate(this.date);
					}
					else
					{
						listObj.sub += "<i>Unknown Date</i>";
					}
					break;
					
				case 'price':
					if (this.price)
					{
						listObj.sub += '$'+this.price;
					}
					else
					{
						listObj.sub += "<i>Free</i>";
					}
					break;
					
				case 'feed':
					listObj.sub += this.feedString;
					break;
					
				case 'device':
					if (this.deviceString) {
							listObj.sub += this.deviceString;
					}
					else {
						listObj.sub += "<i>All Devices</i>";
					}
					break;
					
				case 'country':
					if (this.countryString) {
							listObj.sub += this.countryString;
					}
					else {
						listObj.sub += "<i>All Countries</i>";
					}
					break;
					
				case 'language':
					if (this.languageString) {
							listObj.sub += this.languageString;
					}
					else {
						listObj.sub += "<i>All Languages</i>";
					}
					break;
					
				case 'license':
					if (this.license)
					{
						listObj.sub += this.license;
					}
					else
					{
						if (this.appCatalog) 
						{
							listObj.sub += "<i>App Catalog</i>";
						}
						else
						{
							listObj.sub += "<i>Unknown License</i>";
						}
					}
					break;
			}
		}
		
		if (item) 
		{
			if (this.isInstalled && !this.hasUpdate &&
				item.pkgList != 'updates' &&
				item.pkgList != 'installed')
			{
				listObj.rowClass += ' installed';
			}
			if (this.hasUpdate && item.pkgList != 'updates')
			{
				listObj.rowClass += ' update';
			}
		}
		else
		{
			if (this.isInstalled && !this.hasUpdate)
			{
				listObj.rowClass += ' installed';
			}
			if (this.hasUpdate)
			{
				listObj.rowClass += ' update';
			}
		}
		
		if (prefs.get().rodMode)
		{
			if (listObj.title.toLowerCase().substr(-2) != 'ah')
			{
				if (listObj.title.toLowerCase().substr(-2) == 'er' || listObj.title.toLowerCase().substr(-2) == 'or')
					listObj.title = listObj.title.substr(0, listObj.title.length - 2);
				else if (listObj.title.toLowerCase().substr(-1) == 'a')
					listObj.title = listObj.title.substr(0, listObj.title.length - 1);
				
				if (listObj.title.substr(-1).match(/[A-Z]*/) != '') listObj.title += 'AH';
				else listObj.title += 'ah';
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'packageModel#getForList');
	}
	
	return listObj;
};

	iconFill: function(target) {
		if (this.icon) {
			if (this.iconImg.local) {
				//this.iconImg.loaded = true;
				target.style.backgroundImage = 'url(images/localIcon.png)';
				return;
			}
			if (this.iconImg.loaded) {
				target.style.backgroundImage = 'url(' + this.icon + ')';
			} else if (this.iconImg.loading) {
				this.iconImg.target = target;
			} else {
				this.iconImg.target = target;
				this.doIconFill();
			}
		}
	},


iconInit: function() {
		if (this.icon) {
			this.addComponent({ kind: "enyo.Image", name: "icon", src: this.icon, onload: "iconOnLoad"});
			this.iconImg.loading = true;
			this.iconImg.object = this.$.icon;
		}	
	},
	
	iconOnLoad: function() {
		this.iconImg.object.onload = undefined; // remove the listener
		this.iconImg.loaded = true;
		this.iconImg.loading = false;
		if (this.iconImg.target) {
			this.iconImg.target.style.backgroundImage = 'url(' + this.icon + ')';
		}
		this.iconImg.target = false;
	},
	
});
