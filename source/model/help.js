/*global enyo, $L */

enyo.singleton({
	name: "preware.HelpData",
	get: function(lookup) {
		if (this.lookup[lookup]) {
			return this.lookup[lookup];
		} else {
			return { title: lookup.replace(/_/g, " ").replace(/-/g, " "), data: 'This section isn\'t setup. Call a Programmer! Tell Him: "'+lookup+'"s.' };
		}
	},
	lookup: {
		'theme':
		{
			title: $L('Theme'),
			data: $L('This changes the entire look of the app. The options themselves should be self-explanatory.')
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
			data: $L('This will scan the \"appinfo.js\" file for installed apps that are not in any of the feeds. This way you still get some information about the app. This stops \"This is a webOS application.\" from being listed as installed.')
		},
		
		'resourceHandlerCheck':
		{
			title: $L('Check .ipk Association'),
			data: $L('When this is on, Preware will check to see if it is the default handler for ipkg files, and will ask the user to rectify that if it is not.')
		},
		
		'useTuckerbox':
		{
			title: $L('Use App Tuckerbox'),
			data: $L('App Tuckerbox is a homebrew app that allows you to register your device for direct access to information gathered from the HP App Catalog, Web and Beta feeds. When this option is on, Preware will install apps directly from the HP servers using information from these App Tuckerbox feeds. This may allow you to bypass device, region and carrier restrictions for free and previously purchased apps. This does not bypass purchase, and Preware cannot purchase apps. Note that your device must be registered with App Tuckerbox to access these feeds.')
		},
		
		'ignoreDevices':
		{
			title: $L('Ignore Device Compat.'),
			data: $L('Preware normally only shows apps that are compatible with your device. When this option is on, Preware will show all apps, regardless of device compatibility. Note that apps that are not compatible with your device may not operate correctly.')
		},
		
		'showAvailableTypes':
		{
			title: $L('Show Available Types'),
			data: $L('When off, only shows \"Available Packages\" on the main scene, and allows you to branch into the different types from there.<br>When oo, it will open up the options to choose which package types are linked directly from the main scene.')
		},
		
		'showTypeApplication':
		{
			title: $L('Show Applications'),
			data: $L('When on, \"Available Applications\" will appear on the main scene.')
		},
		
		'showTypeTheme':
		{
			title: $L('Show Themes'),
			data: $L('When on, \"Available Themes\" will appear on the main scene.')
		},
		
		'showTypePatch':
		{
			title: $L('Show Patches'),
			data: $L('When on, \"Available Patches\" will appear on the main scene.')
		},
		
		'showTypeOther':
		{
			title: $L('Show Other Types'),
			data: $L('When on, \"Available Other\" will appear on the main scene. It will include anything which doesn\'t fit into any of the other categories (like kernels, linux apps, etc.).')
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
			data: $L('When this option is on, packages that are installed appear in the \"Available Packages\" and lists like it. With it off, they only appear in the installed list or updates when applicable.')
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
		},
		
		'browseFromRoot':
		{
			title: $L('Browse From Root'),
			data: $L('When enabled, will allow you to browse outside /media/internal in the file picker for single package install.')
		}
	}
});
