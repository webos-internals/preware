function packageModel()
{
	this.apps = [];
	this.categories = [];
}

packageModel.prototype.load = function(payload)
{
	// clear out our current data (incase this is a re-update)
	this.apps = [];
	this.categories = [];
	
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
			this.apps.push(payload.info[x]);
		}
		else
		{
			// check if its newer
			var newer = this.versionNewer(this.apps[appNum].Version, payload.info[x].Version);
			
			// if they're both not installed, and this is newer, replace the old one
			if (payload.info[x].Status.include('not-installed') &&
				this.apps[appNum].Status.include('not-installed') &&
				newer)
			{
				this.apps[appNum] = payload.info[x];
				continue;
			}
			
			// if the new one is not installed and the old one is, and its older, update the old one
			if (!payload.info[x].Status.include('not-installed') &&
				this.apps[appNum].Status.include('not-installed') &&
				!newer)
			{
				this.apps[appNum].Installed = true;
				this.apps[appNum].Update = true;
				this.apps[appNum].VersionOld = payload.info[x].Version;
				continue;
			}
			
			// if the new one is not installed but the old one is, and this is newer, replace the old one
			if (!payload.info[x].Status.include('not-installed') &&
				this.apps[appNum].Status.include('not-installed') &&
				newer)
			{
				payload.info[x].Installed = true;
				payload.info[x].Update = false;
				this.apps[appNum] = payload.info[x];
				continue;
			}
		}
	}
	
	// sort the packages
	this.apps.sort(function(a, b)
	{
		if (a.Description && b.Description) return ((a.Description.toLowerCase() < b.Description.toLowerCase()) ? -1 : ((a.Description.toLowerCase() > b.Description.toLowerCase()) ? 1 : 0));
		else return -1;
	});
	
	// add package categorys to global category list
	for (var a = 0; a < this.apps.length; a++) 
	{
		var catNum = this.categoryInList(this.apps[a].Section);
		if (catNum === false) 
		{
			// push new category
			this.categories.push({name: this.apps[a].Section, count: 1});
		}
		else
		{
			// increment category count
			this.categories[catNum].count++;
		}
	}
	
	// sort categories
	this.categories.sort(function(a, b)
	{
		// this needs to be lowercase for sorting.
		if (a.name.toLowerCase() && b.name.toLowerCase()) return ((a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : ((a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : 0));
		else return -1;
	});
	
}

packageModel.prototype.versionNewer = function(one, two)
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

packageModel.prototype.appInList = function(pkg)
{
	if (this.apps.length > 0)
	{
		for (var a = 0; a < this.apps.length; a++)
		{
			if (this.apps[a].Package == pkg) 
			{
				return a;
			}
		}
	}
	return false;
}

packageModel.prototype.categoryInList = function(cat)
{
	if (this.categories.length > 0) 
	{
		for (var c = 0; c < this.categories.length; c++) 
		{
			if (this.categories[c].name == cat) 
			{
				return c;
			}
		}
	}
	return false;
}

packageModel.prototype.getApps = function(item)
{
	var returnArray = [];
	
	// build list from global array
	for (var a = 0; a < this.apps.length; a++) 
	{
		// default to not pusing it
		var pushIt = false;
		
		// all
		if (item.list == 'all') pushIt = true;
		
		// updates
		if (item.list == 'updates' && this.apps[a].Update) pushIt = true;
		
		// installed
		if (item.list == 'installed' && this.apps[a].Installed) pushIt = true;
		
		// category
		if (item.list == 'category' && item.category == this.apps[a].Section) pushIt = true;
		
		// push it to the list if we should
		if (pushIt) 
		{
			// check for icon in SourceObj
			var tmpApp = this.apps[a];
			
			// add the appNum so we can update it when changed by the view scene
			tmpApp.appNum = a;
			
			// set this to nothing so we can fill it in later
			tmpApp.RowClass = '';
			
			if (tmpApp.SourceObj != undefined && tmpApp.SourceObj.Icon)
			{
				tmpApp.RowClass += ' img';
				tmpApp.ListIconImg = '<img src="' + tmpApp.SourceObj.Icon + '" />';
			}
			
			if (tmpApp.Installed && !tmpApp.Update &&
				item.list != 'updates' &&
				item.list != 'installed') 
			{
				tmpApp.RowClass += ' installed';
			}
			if (tmpApp.Update && item.list != 'updates') 
			{
				tmpApp.RowClass += ' update';
			}
			
			// push
			returnArray.push(tmpApp);
		}
	}
	
	return returnArray;
}
