function StartupAssistant()
{
    // on first start, this message is displayed, along with the current version message from below
    this.firstMessage = $L("Here are some tips for first-timers:<ul><li>Preware will take some time to download the data for all your enabled package feeds</li><li>Select the \"Preferences\" menu item to change how often the feeds are updated</li><li>Customize the main screen using the \"Show Available Types\" preference options</li><li>Select the \"Manage Feeds\" menu item to enable just your desired package feeds</li><li>To search, just start typing</li></ul>");
	
    this.secondMessage = $L("We hope you enjoy all of the many Applications, Themes and Patches that Preware makes available.<br>Please consider making a <a href=\"https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DCSMTCCGMH5NA\">donation</a> if you wish to show your appreciation.");
	
    // on new version start
    this.newMessages =
	[
	 {
	     version: '1.0.3',
	     log:
	     [
	      'Fixed double execution of the post-install script',
	      'Alternate install method to avoid webOS bugs',
		  'No more rescan on remove',
		  'Fixed relaunch blank screen bug',
		  'Updated German and French translations'
	      ]
	 },
	 {
	     version: '1.0.0',
	     log:
	     [
	      'The Package Manager Service has been rewritten in C and incorporated into this single Preware package',
		  'Installing Preware 1.0.0 will remove the Package Manager Service as the last step of the upgrade process'
	      ]
	 },
	 {
	     version: '0.9.38',
	     log:
	     [
	      'Robustified the scanning of unknown packages, with the hope of preventing hangs',
	      'Added the ability to swipe delete items from the Saved Package List',
	      'Disabled the app catalog and themes feeds on first installation, but kept palm update feeds enabled',
	      'Added prerm conditionals to assist an easy transition from Preware Alpha back to Preware 1.0',
	      'Added support for the webos-kernels feed'
	      ]
	 },
	 {
	     version: '0.9.36',
	     log:
	     [
	      'Added additional Second Line preference values',
	      'Added additional keywords for global search',
	      'Search from the main screen',
		  'Fixed "..." bug.',
		  'Added ability to email IPKG Log',
		  'Fixed compression toggle in feed management so it actually works',
		  'Added warning message to new feed additions',
		  'Now forces user to fill in all fields to add a new feed',
		  'Added "dirty feeds" notification when returning to the main scene after adding or removing feeds',
		  'Added support for kernel packages'
	      ]
	 },
	 {
	     version: '0.9.35',
	     log:
	     [
	      'Added Saved Package List functionality for saving and restoring your list of installed packages',
	      'Updated German translations, courtesy of Markus Leutwyler (swisstomcat)',
	      'Restrict new feed names to lower case characters for consistency'
	      ]
	 },
	 {
	     version: '0.9.33',
	     log:
	     [
	      'Restricted input character set for new custom feed names',
	      'Fixed javascript timeout problem with large feeds'
	      ]
	 },
	 {
	     version: '0.9.31',
	     log:
	     [
	      'Renamed Fix Unknown Types to Scan Unknown Packages',
	      'Reports the id of the package being scannned'
	      ]
	 },
	 {
	     version: '0.9.30',
	     log:
	     [
	      'Added the ability to create new feeds and delete existing feeds',
	      'Now chooses the correct information to display for packages in multiple feeds',
	      'Fixes the bug in the only show free applications preference'
	      ]
	 },
	 {
	     version: '0.9.29',
	     log:
	     [
	      'Added option to search package descriptions instead of just the titles',
	      'Integrated Luna Manager into Preware, find it in the app menu',
	      'Fixed "Installed is Available" bug in "Available Other" list',
	      'No longer tries to update app catalog apps with "Update All"'
	      ]
	 },
	 {
	     version: '0.9.28',
	     log:
	     [
	      'Added support for displaying the countries for which an application is released'
	      ]
	 },
	 {
	     version: '0.9.27',
	     log:
	     [
	      'Now hides the price sort option when none of the loaded packages have any prices',
	      'Fixed a bug in update subscription handling'
	      ]
	 },
	 {
	     version: '0.9.26',
	     log:
	     [
	      'Fixed a bug in App Catalog background operation detection'
	      ]
	 },
	 {
	     version: '0.9.25',
	     log:
	     [
	      'Added a preference to only show free applications'
	      ]
	 },
	 {
	     version: '0.9.24',
	     log:
	     [
	      'Added protection against App Catalog installs clobbering the ipkg status file'
	      ]
	 },
	 {
	     version: '0.9.23',
	     log:
	     [
	      'Spanish translations added, courtesy of Ángel Prada (Malakun)'
	      ]
	 },
	 {
	     version: '0.9.22',
	     log:
	     [
	      'Italian translations added, courtesy of Federico Pietta (Darkmagister)'
	      ]
	 },
	 {
	     version: '0.9.21',
	     log:
	     [
	      'German translations added, courtesy of Volker Zota (DocZet) and Thomas Linden (debilator)',
	      'Fixed updating of Linux Daemons'
	      ]
	 },
	 {
	     version: '0.9.20',
	     log:
	     [
	      'Fixed an error in the French support which prevented Preware from loading'
	      ]
	 },
	 {
	     version: '0.9.19',
	     log:
	     [
	      'Localization support and French translations added, courtesy of Yannick LE NY',
	      'Fixed the OnFeeds split error, caused by zero length feed config files',
	      'Now continues to load the package feeds after an update error'
	      ]
	 },
	 {
	     version: '0.9.18',
	     log:
	     [
	      'Added second line options for feed, price & feed, and price & version & feed',
	      'Added reporting of each feed index file as it is being downloaded'
	      ]
	 },
	 {
	     version: '0.9.16',
	     log:
	     [
	      'Removed the partial app limit fix (obsolete as of webOS 1.3.5)'
	      ]
	 },
	 {
	     version: '0.9.15',
	     log:
	     [
	      'Added Palm App Catalog feeds, including price information'
	      ]
	 },
	 {
	     version: '0.9.14',
	     log:
	     [
	      'Added support for installation of signed packages without confirmation',
	      'Fixed the auto-configuration of disabled webos-patches feeds'
	      ]
	 },
	 {
	     version: '0.9.13',
	     log:
	     [
	      'Added "Update All" button to package updates list',
	      'Added ability to update Patches and Themes (It just replaces them)',
	      'Now allows all action flags to be skipped at users request',
	      'Added support for "RestartDevice" action flags',
	      'Minor change to error handling when updating feeds',
	      'Hopefully really truely fixed the darn recurring splash screen this time'
	      ]
	 },
	 {
	     version: '0.9.12',
	     log:
	     [
	      'Added fix for recurring splash screen'
	      ]
	 },
	 {
	     version: '0.9.11',
	     log:
	     [
	      'Added preference for enabling and disabling the partial app limit fix'
	      ]
	 },
	 {
	     version: '0.9.10',
	     log:
	     [
	      'Added support for theme categories'
	      ]
	 },
	 {
	     version: '0.9.9',
	     log:
	     [
	      'Massive listing speed boost!',
	      'Fixed the theme hanging problem caused by webOS 1.3.1'
	      ]
	 },
	 {
	     version: '0.9.8',
	     log:
	     [
	      'Serialised the gathering of data for Type:Unknown packages to fix the hangs'
	      ]
	 },
	 {
	     version: '0.9.7',
	     log:
	     [
	      'Added the preference to enable or disable fixing Type:Unknown packages'
	      ]
	 },
	 {
	     version: '0.9.6',
	     log:
	     [
	      'Fixed the display of packages with multiple maintainers',
	      'Now loads extended appinfo and control file information for "unknown" packages',
	      'Changed default list second-line to version + maintainer',
	      'No longer allows back-gestures during package operations',
	      'Multi-line package titles are now supported',
	      '"Show All Packages" changed to "Show Available Types" and now defaults to "No" for new users',
	      'Added this startup scene'
	      ]
	 }
	 ];
	
    // setup menu
    this.menuModel =
	{
	    visible: true,
	    items:
	    [
    {
	label: $L("Preferences"),
	command: 'do-prefs'
    },
    {
	label: $L("Luna Manager"),
	command: 'do-luna'
    },
    {
	label: $L("Help"),
	command: 'do-help'
    }
	     ]
	};
	
    // setup command menu
    this.cmdMenuModel =
	{
	    visible: false, 
	    items:
	    [
    {},
    {
	label: $L("Ok, I've read this. Let's continue ..."),
	command: 'do-continue'
    },
    {}
	     ]
	};
};

StartupAssistant.prototype.setup = function()
{
    // set theme because this can be the first scene pushed
    this.controller.document.body.className = prefs.get().theme;
	
    // get elements
    this.titleContainer = this.controller.get('title');
    this.dataContainer =  this.controller.get('data');
	
    // set title
    if (vers.isFirst) 
	{
	    this.titleContainer.innerHTML = $L("Welcome To Preware");
	}
    else if (vers.isNew) 
	{
	    this.titleContainer.innerHTML = $L("Preware Changelog");
	}
	
	
    // build data
    var html = '';
    if (vers.isFirst)
	{
	    html += '<div class="text">' + this.firstMessage + '</div>';
	}
    if (vers.isNew)
	{
	    html += '<div class="text">' + this.secondMessage + '</div>';
	    for (var m = 0; m < this.newMessages.length; m++)
		{
		    html += Mojo.View.render({object: {title: 'v' + this.newMessages[m].version}, template: 'startup/changeLog'});
		    html += '<ul class="changelog">';
		    for (var l = 0; l < this.newMessages[m].log.length; l++)
			{
			    html += '<li>' + this.newMessages[m].log[l] + '</li>';
			}
		    html += '</ul>';
		}
	}
	
    // set data
    this.dataContainer.innerHTML = html;
	
	
    // setup menu
    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
    // set command menu
    this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
	
    // set this scene's default transition
    this.controller.setDefaultTransition(Mojo.Transition.zoomFade);
};

StartupAssistant.prototype.activate = function(event)
{
    // start continue button timer
    this.timer = this.controller.window.setTimeout(this.showContinue.bind(this), 5 * 1000);
};
StartupAssistant.prototype.showContinue = function()
{
    // show the command menu
    this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
};
StartupAssistant.prototype.handleCommand = function(event)
{
    if (event.type == Mojo.Event.command)
	{
	    switch (event.command)
		{
		case 'do-continue':
		this.controller.stageController.swapScene({name: 'update', transition: Mojo.Transition.crossFade}, 'main', false);
		break;
			
		case 'do-prefs':
		this.controller.stageController.pushScene('preferences');
		break;
			
		case 'do-showLog':
		this.controller.stageController.pushScene({name: 'ipkg-log', disableSceneScroller: true});
		break;
				
		case 'do-luna':
		this.controller.stageController.pushScene('luna');
		break;
			
		case 'do-help':
		this.controller.stageController.pushScene('help');
		break;
		}
	}
};

// Local Variables:
// tab-width: 4
// End:
