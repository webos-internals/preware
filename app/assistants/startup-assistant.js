function StartupAssistant()
{
	// on first start, this message is displayed, along with the current version message from below
	var firstMessage = ['Here is the message displayed to the user on first launch'];
	
	// on new version start
	var newMessage =
	{
		'0.9.6':['Here is whats new in 0.9.6'],
		'0.9.5':['Here is whats new in 0.9.5'],
		'0.9.4':['Here is whats new in 0.9.4'],
		'0.9.3':['Here is whats new in 0.9.3'],
		'0.9.2':['Here is whats new in 0.9.2'],
		'0.9.1':['Here is whats new in 0.9.1'],
		'0.9.0':['Here is whats new in 0.9.0'],
	};
	
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
			{label: "Ok, I've read this. Lets Continue", command: 'do-continue'},
			{}
		]
	};
}

StartupAssistant.prototype.setup = function()
{
	// set theme because this can be the first scene pushed
	this.controller.document.body.className = prefs.get().theme;
	
	
	// set title
	this.controller.get('title').innerHTML = 'Welcome To Preware';
	
	// set data
	this.controller.get('data').innerHTML = 'This is a temporary message...<br><br>You will be able to continue in 5 seconds.';
	
	
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
