function helpData()
{
}

helpData.get = function(lookup)
{
	if (helpData.lookup[lookup])
	{
		return helpData.lookup[lookup];
	}
	else
	{
		return { title: lookup.replace(/_/g, " ").replace(/-/g, " "), data: 'This section isn\'t setup. Call a Programmer! Tell Him: "'+lookup+'"s.' };
	}
	return false; // this shouldn't happen
}

helpData.lookup = 
{
	'theme':
	{
		title: $L('Theme'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	
	
	'updateInterval':
	{
		title: $L('Update Feeds'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	'lastUpdate':
	{
		title: $L('Last Update'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	'fixUnknown':
	{
		title: $L('Scan Unknown Packages'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	'resourceHandlerCheck':
	{
		title: $L('Check .ipk Association'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	
	
	'avoidBugs':
	{
		title: $L('Avoid webOS Bugs'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	
	
	'showAvailableTypes':
	{
		title: $L('Show Available Types'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	'showTypeApplication':
	{
		title: $L('Show Applications'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	'showTypeTheme':
	{
		title: $L('Show Themes'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	'showTypePatch':
	{
		title: $L('Show Patches'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	'showTypeOther':
	{
		title: $L('Show Other Types'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	
	
	'searchDesc':
	{
		title: $L('Search Descriptions'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	'listSort':
	{
		title: $L('Default Sort'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	'secondRow':
	{
		title: $L('Second Line'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	'listInstalled':
	{
		title: $L('Installed Is Available'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	'onlyShowFree':
	{
		title: $L('Only Show Free Apps'),
		data: $L('This section has no help yet - you can contribute some!')
	},
	
	'onlyShowEnglish':
	{
		title: $L('Only SHow English Apps'),
		data: $L('This section has no help yet - you can contribute some!')
	}
	
	
	
};