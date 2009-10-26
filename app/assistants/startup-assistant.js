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
				'Other awesome stuff not yet listed here'
			]
		},
		{
			version: '0.9.5',
			log:
			[
				'Added helpful text to update scene',
				'Added dependency update support',
				'Ignore "offline root" message in IPKG Log beacuse it\'s not an error'
			]
		},
		{
			version: '0.9.4',
			log:
			[
				'asdf',
				'asdf'
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
	
	
	// set title
	if (vers.isFirst) 
	{
		this.controller.get('title').innerHTML = 'Welcome To Preware';
	}
	else if (vers.isNew) 
	{
		this.controller.get('title').innerHTML = 'Preware Changelog';
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
	this.controller.get('data').innerHTML = html;
	
	
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

StartupAssistant.prototype.deactivate = function(event) {}
StartupAssistant.prototype.cleanup = function(event) {}
