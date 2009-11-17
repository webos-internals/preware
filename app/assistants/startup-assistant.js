function StartupAssistant()
{
	// on first start, this message is displayed, along with the current version message from below
	this.firstMessage = 'Here are some tips for first-timers:<ul><li>Preware will take some time to download the data for all your enabled package feeds</li><li>Select the "Preferences" menu item to change how often the feeds are updated</li><li>Customize the main screen using the "Show Available Types" preference options</li><li>Select the "Manage Feeds" menu item to enable just your desired package feeds</li><li>To search, just start typing in the "List of Everything"</li></ul>We hope you enjoy all of the many Applications, Themes and Patches that Preware makes available.<br>Please consider making a <a href=http://www.webos-internals.org/wiki/WebOS_Internals:Site_support>donation</a> if you wish to show your appreciation.';
	
	// on new version start
	this.newMessages =
	[
		{
			version: '0.9.9',
			log:
			[
				'MASSIVE LISTING SPEED BOOST!'
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
				label: "Preferences",
				command: 'do-prefs'
			},
			{
				label: "Help",
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
				label: "Ok, I've read this. Let's continue ...",
				command: 'do-continue'
			},
			{}
		]
	};
}

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
		this.titleContainer.innerHTML = 'Welcome To Preware';
	}
	else if (vers.isNew) 
	{
		this.titleContainer.innerHTML = 'Preware Changelog';
	}
	
	
	// build data
	var html = '';
	if (vers.isFirst)
	{
		html += '<div class="text">' + this.firstMessage + '</div>';
	}
	if (vers.isNew)
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
	
	// set data
	this.dataContainer.innerHTML = html;
	
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	// set command menu
	this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
	
	// set this scene's default transition
	this.controller.setDefaultTransition(Mojo.Transition.zoomFade);
}
StartupAssistant.prototype.activate = function(event)
{
	// start continue button timer
	this.timer = this.controller.window.setTimeout(this.showContinue.bind(this), 5 * 1000);
}

StartupAssistant.prototype.showContinue = function()
{
	// show the command menu
	this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
}
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
			
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
		}
	}
}
