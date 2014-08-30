function StartupAssistant(changelog)
{
	this.justChangelog = changelog;
	
    // on first start, this message is displayed, along with the current version message from below
    this.firstMessage = $L("Here are some tips for first-timers:<ul><li>Preware will take some time to download the data for all your enabled package feeds</li><li>Select the \"Preferences\" menu item to change how often the feeds are updated</li><li>Customize the main screen using the \"Show Available Types\" preference options</li><li>Select the \"Manage Feeds\" menu item to enable just your desired package feeds</li><li>To search, just start typing</li></ul>");
	
    this.secondMessage = $L("We hope you enjoy all of the many Applications, Themes and Patches that Preware makes available.<br>Please consider making a <a href=\"https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DCSMTCCGMH5NA\">donation</a> if you wish to show your appreciation.");
	
    // on new version start
    this.newMessages =
	[
	 {	 version: '1.9.13', log: [ 'Moved package feeds to ipkg.preware.net',
                                   'Updated birthday icon to remove the year number' ] },
	 {	 version: '1.9.12', log: [ 'Added support for WebOS Community Edition (WOCE) feeds by the WebOS Ports team from WebOS Internals' ] },
	 {	 version: '1.9.10', log: [ 'Updated German translations (courtesy of DiplPhy)' ] },
	 {	 version: '1.9.9', log: [ 'Added Traditional Chinese translations (courtesy of tonyw)' ] },
	 {	 version: '1.9.8', log: [ 'Updated German translations (courtesy of DocZet)' ] },
	 {	 version: '1.9.7', log: [ 'Added support for secure package downloads' ] },
	 {	 version: '1.9.6', log: [ 'Added support for secure feed downloads' ] },
	 {	 version: '1.9.5', log: [ 'Fixed the window orientation for the blue question mark help items' ] },
	 {	 version: '1.9.4', log: [ 'Added disclaimer when installing apps marked incompatible with current device' ] },
	 {	 version: '1.9.2', log: [ 'Revamped feed downloading to give better error and status reporting' ] },
	 {	 version: '1.9.1', log: [ 'Fixed device identification of WiFi TouchPads' ] },
	 {	 version: '1.9.0', log: [ 'Added feed display and installation support for App Tuckerbox' ] },
	 {	 version: '1.8.7', log: [ 'Hide authentication information in the Manage Feeds display' ] },
	 {	 version: '1.8.6', log: [ 'Added support for displaying the Changelog and DeviceCompatibility fields' ] },
	 {	 version: '1.8.5', log: [ 'Fixed missing package information bug' ] },
	 {	 version: '1.8.4', log: [ 'Added some additional Second Line preference options' ] },
	 {	 version: '1.8.3', log: [ 'Please read http://testing.preware.org/ if you use the testing feeds' ] },
	 {	 version: '1.8.2', log: [ 'Fixed the removal of obsolete testing feeds' ] },
	 {	 version: '1.8.1', log: [ 'Remove the obsolete testing feeds when adding alpha or beta feeds' ] },
	 {	 version: '1.8.0', log: [ 'Disabled support for adding obsolete testing feeds' ] },
	 {	 version: '1.7.7', log: [ 'Enabled support for alpha and beta testing feeds' ] },
     {   version: '1.7.6', log: [ 'Larger screenshots on the TouchPad',
                                  'Pressed states for TouchPad back buttons',
                                  'Fixed search backspace on TouchPad' ] },
	 {	 version: '1.7.5', log: [ 'Fixed list rendering on TouchPad (courtesy of chpwn)' ] },
	 {	 version: '1.7.4', log: [ 'Removed catalog feed specific preferences (show only free/show only english)' ] },
	 {	 version: '1.7.3', log: [ 'Added support for font packages' ] },
	 {	 version: '1.7.2', log: [ 'Replaced the word phone with the word device in all messages' ] },
	 {   version: '1.7.1', log: [ 'Fixed fullscreen screenshot resizing on touchpad rotate (courtesy of Appsotutely)',
								  'Fixed dependent packages spinner location (courtesy of chpwn)' ] },
	 {   version: '1.7.0', log: [ 'Rolled up all the beta release features for a TouchPad-compatible public release' ] },
	 {	 version: '1.6.8', log: [ 'Enabled back tap on header for all devices' ] },
	 {	 version: '1.6.7', log: [ 'Fixed full-screen formatting of ipkg log screen' ] },
	 {	 version: '1.6.6', log: [ 'Preware is now fully compatible with the TouchPad, using the full screen area' ] },
	 {	 version: '1.6.5', log: [ 'Now useable on devices without a back gesture',
								  'Set the wget user-agent to Preware when retrieving indexes and packages' ] },
	 {	 version: '1.6.4', log: [ 'Fixed a problem when loading the saved packages list' ] },
	 {	 version: '1.6.3', log: [ 'Removed all HP webOS app catalog feeds from new installations of Preware' ] },
	 {	 version: '1.6.2', log: [ 'Added the clock themes feed (disabled by default)' ] },
	 {	 version: '1.6.0', log: [ 'webOS 2.x Just Type integration',
	 							  'Fixed package list ordering bug',
								  'Layout fixes for Pixi/Veer' ] },
	 {	 version: '1.5.9', log: [ 'Fixed parse errors resulting from packages with very large descriptions',
								  'Fixed problems with updates to app catalog apps' ] },
	 {	 version: '1.5.8', log: [ 'Moved blacklisting to feed load to speed up listing',
	 							  'Suggests a reload after changing the blacklist',
	 							  'Fixed homebrew feed/catalog feed same appid bug' ] },
	 {	 version: '1.5.7', log: [ 'Added check to make sure package has a title before trying to search it' ] },
	 {	 version: '1.5.6', log: [ 'Removed support for Visibility feed value - use a category filter to exclude Unavailable packages if desired' ] },
	 {	 version: '1.5.5', log: [ 'Added support for Visibility feed value',
	 							  'Fix display of screenshots from devices with a different resolution',
	 							  'Test fix for custom feed on network with no internet connection',
	 							  'Style updates for pre3 screen size' ] },
	 {	 version: '1.5.4', log: [ 'Updated French translations (courtesy of Clément)' ] },
	 {	 version: '1.5.3', log: [ 'Reinstated banner notification of manual saved package list update' ] },
	 {	 version: '1.5.2', log: [ 'Check if package dates are actually dates',
	 							  'Removed banner notification of saved package list being saved' ] },
	 {	 version: '1.5.1', log: [ 'Added support for optware testing feeds' ] },
	 {	 version: '1.5.0', log: [ 'You must upgrade to this version for full webOS 2.0 compatibility' ] },
	 {	 version: '1.4.9', log: [ 'Better compatibility with unknown future webOS versions' ] },
	 {	 version: '1.4.8', log: [ 'Now calls the correct software manager updates screen on webOS 2.0' ] },
	 {	 version: '1.4.7', log: [ 'Fixed update, install and remove status messages on webOS 2.0' ] },
	 {	 version: '1.4.6', log: [ 'New "App Catalog" theme preferences thanks to Garrett92C',
	 							  'Added support for "MaxWebOSVersion" in the feeds' ] },
	 {	 version: '1.4.5', log: [ 'Added support for identifying when running on a Pre 2 device' ] },
	 {	 version: '1.4.4', log: [ 'Updated the version check to support future webOS versions' ] },
	 {	 version: '1.4.2', log: [ 'Added Category as a blacklist option' ] },
	 {	 version: '1.4.1', log: [ 'Added a Changelog button to the Help scene' ] },
	 {
	     version: '1.4.0',
	     log:
	     [
		  'Added help to preferences scene',
		  'Fixed swipe-to-delete bug in blacklist',
		  'Updated Italian translations (courtesy of Darkmagister)',
		  'Added "Get Info" button to package install scene',
		  'Added "Send" button to ipkg log scene',
		  'Fixed bug when loading large package descriptions'
	      ]
	 },
	 {
	     version: '1.3.8',
	     log:
	     [
		  'Updated French translations (courtesy of Yannick LE NY)',
	      ]
	 },
	 {
	     version: '1.3.6',
	     log:
	     [
		  'Preware now supports installation of application package files (.ipk files) directly from URLs, email attachments, and local files.  Also supported are Send to Preware links on homebrew application gallery and news websites (this requires the Neato! application to also be installed)',
		  'If Preware continually asks you about file associations on every single launch, even after you have answered Yes to the questions it asks, then you may have a damaged file association table and will need to run the Emergency MimeTable Reset tool and then reboot to repair it',
	      ]
	 },
	 {
	     version: '1.3.5',
	     log:
	     [
		  'Updated German translations',
	      ]
	 },
	 {
	     version: '1.3.3',
	     log:
	     [
		  'Always ask the user before modifying the file association list',
	      ]
	 },
	 {
	     version: '1.3.1',
	     log:
	     [
		  'Check whether Preware is the default application for handling packages, and advise the user if it is not',
	      ]
	 },
	 {
	     version: '1.3.0',
	     log:
	     [
		  'Added Preware to the Default Applications list to allow for installing packages from email messages and the browser',
	      ]
	 },
	 {
	     version: '1.2.9',
	     log:
	     [
		  'Fixed the Saved Package List swipe to delete bug',
	      ]
	 },
	 {
	     version: '1.2.8',
	     log:
	     [
		  'Open the My Applications app catalog screen when multiple app catalog applications need updating',
	      ]
	 },
	 {
	     version: '1.2.7',
	     log:
	     [
		  'Fixed the Install Package problem when running on the emulator',
	      ]
	 },
	 {
	     version: '1.2.6',
	     log:
	     [
		  'Remove most of the curl download progress messages from the ipkg log (this fixes a buffer overrun crash)',
	      ]
	 },
	 {
	     version: '1.2.5',
	     log:
	     [
		  'Added "Ask At Launch" option to update preference',
		  'Added Blacklist',
		  'German Translation Updates',
		  'Fixed update banner problem',
		  'Fixed package with too many dependent packages problem'
	      ]
	 },
	 {
	     version: '1.2.4',
	     log:
	     [
		  'Added support for MinWebOSVersion feed value',
		  'Added support for DeviceCompatibility feed value',
		  'Added support for PreActionMessage feed values',
		  'Some bugfixes and better logging'
	      ]
	 },
	 {
	     version: '1.2.3',
	     log:
	     [
		  'Enable the Install Package feature to also work for incorrectly formatted filenames'
	      ]
	 },
	 {
	     version: '1.2.1',
	     log:
	     [
		  'Robustified the Install Package feature - will now run post-install scripts for all correctly formatted filenames (packageid_version_arch.ipk)'
	      ]
	 },
	 {
	     version: '1.2.0',
	     log:
	     [
	      'Added Install Package functionality, allowing installation of packages from URLs and local files',
	      'Moved Saved Package List from the main screen to the app menu'
	      ]
	 },
	 {
	     version: '1.1.7',
	     log:
	     [
	      'Added support for Kernel Modules'
	      ]
	 },
	 {
	     version: '1.1.5',
	     log:
	     [
	      'Use a gentler reboot procedure to allow open files to be flushed to disk'
	      ]
	 },
	 {
	     version: '1.1.4',
	     log:
	     [
	      'Fixed hang on package download failures'
	      ]
	 },
	 {
	     version: '1.1.2',
	     log:
	     [
	      'Added support for the ENABLE_TESTING_FEEDS Meta-Doctor feature',
	      'Removed the tag line about eventually reaching 1.0',
		  'Minor French translation updates, courtesy of Yannick LE NY'
	      ]
	 },
	 {
	     version: '1.1.1',
	     log:
	     [
	      'Added languages field in package descriptions',
	      'Added preference to only show packages with English descriptions'
	      ]
	 },
	 {
	     version: '1.1.0',
	     log:
	     [
	      'Fixed deletion of disabled feed configs',
	      'Fixed double execution of the post-install script',
	      'Alternate install method to avoid webOS bugs',
		  'No more rescan on remove',
		  'Fixed relaunch blank screen bug',
		  'Updated German and French translations, courtesy of Markus Leutwyler and Yannick LE NY',
	      'Added the version number to the underlying service and bumped the API version',
		  'Robustified the service upgrade process'
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
		  'Fixed "..." bug',
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
	var deviceTheme = '';
	if (Mojo.Environment.DeviceInfo.modelNameAscii == 'Pixi' ||
		Mojo.Environment.DeviceInfo.modelNameAscii == 'Veer')
		deviceTheme += ' small-device';
	if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') == 0 ||
		Mojo.Environment.DeviceInfo.modelNameAscii == 'Emulator')
		deviceTheme += ' no-gesture';
    this.controller.document.body.className = prefs.get().theme + deviceTheme;
	
    // get elements
    this.titleContainer = this.controller.get('title');
    this.dataContainer =  this.controller.get('data');

	if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') == 0 ||
		Mojo.Environment.DeviceInfo.modelNameAscii == 'Emulator')
		this.backElement = this.controller.get('back');
	else
		this.backElement = this.controller.get('header');
	
    // set title
	if (this.justChangelog)
	{
		this.titleContainer.innerHTML = $L('Changelog');
		// setup back tap
		this.backTapHandler = this.backTap.bindAsEventListener(this);
		this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);
	}
	else
	{
		this.controller.get('back').hide();
	    if (vers.isFirst) 
		{
		    this.titleContainer.innerHTML = $L("Welcome To Preware");
		}
	    else if (vers.isNew) 
		{
		    this.titleContainer.innerHTML = $L("Preware Changelog");
		}
	}
	
    // build data
    var html = '';
	if (this.justChangelog)
	{
		for (var m = 0; m < this.newMessages.length; m++) 
		{
		    html += Mojo.View.render({object: {title: 'v' + this.newMessages[m].version}, template: 'startup/changeLog'});
		    html += '<ul>';
		    for (var l = 0; l < this.newMessages[m].log.length; l++)
			{
				html += '<li>' + this.newMessages[m].log[l] + '</li>';
		    }
		    html += '</ul>';
		}
	}
	else
	{
		if (vers.isFirst)
		{
			html += '<div class="text">' + this.firstMessage + '</div>';
		}
	    if (vers.isNew)
		{
			if (!this.justChangelog)
			{
				html += '<div class="text">' + this.secondMessage + '</div>';
			}
			for (var m = 0; m < this.newMessages.length; m++) 
			{
			    html += Mojo.View.render({object: {title: 'v' + this.newMessages[m].version}, template: 'startup/changeLog'});
			    html += '<ul>';
			    for (var l = 0; l < this.newMessages[m].log.length; l++)
				{
					html += '<li>' + this.newMessages[m].log[l] + '</li>';
			    }
			    html += '</ul>';
			}
	    }
	}
	
    // set data
    this.dataContainer.innerHTML = html;
	
	
    // setup menu
    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	if (!this.justChangelog) {
	    // set command menu
	    this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
	}
	
    // set this scene's default transition
    this.controller.setDefaultTransition(Mojo.Transition.zoomFade);
};

StartupAssistant.prototype.activate = function(event)
{
	if (!this.justChangelog) {
		// start continue button timer
		this.timer = this.controller.window.setTimeout(this.showContinue.bind(this), 5 * 1000);
	}
};
StartupAssistant.prototype.showContinue = function()
{
    // show the command menu
    this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
};

StartupAssistant.prototype.backTap = function(event)
{
    if (this.justChangelog) {
		this.controller.stageController.popScene();
    }
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

StartupAssistant.prototype.cleanup = function(event)
{
	if (this.justChangelog)
		this.controller.stopListening(this.backElement,  Mojo.Event.tap, this.backTapHandler);
};

// Local Variables:
// tab-width: 4
// End:
