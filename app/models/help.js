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
		data: $L('This changes the entire look of the app. The options themselves should be self-explanatory')
	},
	
	
	
	'updateInterval':
	{
		title: $L('Update Feeds'),
		data: $L('This changes the frequency in which feeds are updated from the web. The feeds will always be loaded on every start. This simply determines if the feeds are updated before they\'re loaded.<ul><li><b>Every Launch</b> - Always update every time you open preware.</li><li><b>Once Daily</b> - Only update if it\'s been 24 hours since the last time the feeds were updated.</li><li><b>Manually Only</b> - Will never update feeds at start. It will only update when you trigger it manually from the prewares main scene.</li><li><b>Ask At Launch</b> - Asks you at launch whether or not you want to update the feeds this load.</li></ul>')
	},
	
	'lastUpdate':
	{
		title: $L('Last Update'),
		data: $L('This displays the date the last time the feeds were downloaded from the web.')
	},
	
	'fixUnknown':
	{
		title: $L('Scan Unknown Packages'),
		data: $L('This will scan the "appinfo.js" file for installed apps that are not in any of the feeds. This way you still get some information about the app. This stops "This is a webOS application." from being listed as installed.')
	},
	
	'resourceHandlerCheck':
	{
		title: $L('Check .ipk Association'),
		data: $L('When this is on, Preware will check to see if it is the default handler for ipkg files, and will ask the user to rectify that if it is not.')
	},
	
	
	
	'avoidBugs':
	{
		title: $L('Avoid webOS Bugs'),
		data: $L('Preware initially used ipkg to install packages, and would use a method called "rescan" to update the launcher with new application icons. This method had since been abandoned by Palm and started to cause unintended consequences (like causing email to think you have nothing setup, or no notifications for new SMS messages). When "Avoid webOS Bugs" is on, the default, Preware will use webOS package install service methods which do not cause the same problems that rescan does. But Palm may block us from using this in the future, so this fallback option is here.')
	},
	
	
	
	'showAvailableTypes':
	{
		title: $L('Show Available Types'),
		data: $L('When on, Only shows "Available Packages" on the main scene, and allows you to branch into the different types from there.<br>When off, it will open up the options to choose which package types are linked directly from the main scene.')
	},
	
	'showTypeApplication':
	{
		title: $L('Show Applications'),
		data: $L('When on, "Available Applications" will appear on the main scene.')
	},
	
	'showTypeTheme':
	{
		title: $L('Show Themes'),
		data: $L('When on, "Available Themes" will appear on the main scene.')
	},
	
	'showTypePatch':
	{
		title: $L('Show Patches'),
		data: $L('When on, "Available Patches" will appear on the main scene.')
	},
	
	'showTypeOther':
	{
		title: $L('Show Other Types'),
		data: $L('When on, "Available Other" will appear on the main scene. It will include anything which doesn\'t fit into any of the other categories (like kernels, linux apps, etc.)')
	},
	
	
	
	'searchDesc':
	{
		title: $L('Search Descriptions'),
		data: $L('With this turned on, package searches performed in preware (usually by just starting to type in list scenes or the main scene) will also search descriptions for what you typed in. It takes a little longer, but sometimes gets you better results.')
	},
	
	'listSort':
	{
		title: $L('Default Sort'),
		data: $L('This allows you to change the default sort for lists of packages.<ul><li><b>Category Default</b> - Use the default sorts that we feel fit best for each of the package lists.</li><li><b>Alphabetically</b> - Sorts them alphabetically by package name, obviously.</li><li><b>Last Updated</b> - Sorts by the date the package was last updated.</li><li><b>Price</b> - Again, this one is pretty obvious.</li></ul>')
	},
	
	'secondRow':
	{
		title: $L('Second Line'),
		data: $L('This selects what package data appears in the package lists under the packages title.')
	},
	
	'listInstalled':
	{
		title: $L('Installed Is Available'),
		data: $L('When this option is on, packages that are installed appear in the "Available Packages" and lists like it. With it off, they only appear in the installed list or updates when applicable.')
	},
	
	'onlyShowFree':
	{
		title: $L('Only Show Free Apps'),
		data: $L('This option ignores all packages that cost money (catalog apps) and only displays the free ones.')
	},
	
	'onlyShowEnglish':
	{
		title: $L('Only Show English Apps'),
		data: $L('When on, preware will only show english apps.')
	}
	
	
	
};