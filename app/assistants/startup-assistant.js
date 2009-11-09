function StartupAssistant()
{
	// on first start, this message is displayed, along with the current version message from below
	this.firstMessage = 'Here is the message displayed to the user on first launch. Welcome to preware, etc, etc, here is some other helpful random information.' +
						'When this is not a first launch, and a launch after an update, this message won\'t be visible, only the changelog below.';
	
	// on new version start
	this.newMessages =
	[
		{
			version: '0.9.6',
			log:
			[
				'Added this startup scene right here',
				'Fixed packages with multiple maintainers',
				'Loads extended appinfo and control file information for "unknown" packages',
				'Changed default list second-line to version + maintainer',
				'No back-gestures during package actions'
			]
		},
		{
			version: '0.9.5',
			log:
			[
				'Added helpful text to update scene',
				'Added initial dependency update support',
				'Ignore "offline root" message in IPKG Log beacuse it\'s not an error'
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
				label: "Ok, I've read this. Lets Continue",
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
