function IpkgLogAssistant()
{
	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: $L("Email IPKG Log"),
				command: 'do-emailLog'
			},
			{
				label: $L("Help"),
				command: 'do-help'
			}
		]
	};
};

IpkgLogAssistant.prototype.setup = function()
{
	this.controller.get('title').innerHTML = $L("IPKG Log");

	// setup back tap
	if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') == 0 ||
		Mojo.Environment.DeviceInfo.modelNameAscii == 'Emulator')
		this.backElement = this.controller.get('back');
	else
		this.backElement = this.controller.get('header');

	this.backTapHandler = this.backTap.bindAsEventListener(this);
	this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);

	if (IPKGService.log == '') 
	{
		this.controller.get('logData').innerHTML = $L("<div class=\"noData\">The log is empty.</div>");
	}
	else 
	{
		this.controller.get('logData').innerHTML = removeAuth(IPKGService.log);
	}
	
	this.controller.setupWidget
	(
		'logScroller',
		{ },
		{ mode: 'dominant' }
	);
	
	// listen to window resize
	this.windowResizeHandler = this.handleWindowResize.bindAsEventListener(this);
	this.controller.listen(this.controller.stageController.window, 'resize', this.windowResizeHandler);
	this.handleWindowResize();
	
	// setup command menu
	this.cmdMenuModel = {items:[]};
	this.cmdMenuModel.items.push({});
	this.cmdMenuModel.items.push({label: $L('Email IPKG Log'), icon: 'send', command: 'do-emailLog'});
	this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
	
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
};

IpkgLogAssistant.prototype.handleWindowResize = function(event)
{
	this.controller.get('logScroller').style.height = this.controller.stageController.window.innerHeight + 'px';
};

IpkgLogAssistant.prototype.backTap = function(event)
{
	this.controller.stageController.popScene();
};

IpkgLogAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-emailLog':
				this.emailLog();
				break;
				
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
				
			default:
				break;
		}
	}
};
IpkgLogAssistant.prototype.emailLog = function()
{
	var style = '<style>'+
				'.container { border: 2px solid #000; margin-bottom: 5px; }'+
				'.title { text-transform: capitalize; font-weight: bold; font-size: 20px; border-bottom: 1px solid #000; }'+
				'.stdOut div { color: #0c0; }'+
				'.stdErr div { color: #c00; }'+
				'</style>';
	this.controller.serviceRequest
	(
    	"palm://com.palm.applicationManager",
		{
	        method: 'open',
	        parameters:
			{
	            id: "com.palm.app.email",
	            params:
				{
	                summary: "Preware IPKG Log",
	                text: '<html><body>'+style+'<br><br>'+IPKGService.log+'</body></html>'
	            }
	        }
	    }
	); 
};

IpkgLogAssistant.prototype.activate = function(event) {};
IpkgLogAssistant.prototype.deactivate = function(event) {};
IpkgLogAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening(this.controller.stageController.window, 'resize', this.windowResizeHandler);
	this.controller.stopListening(this.backElement, Mojo.Event.tap, this.backTapHandler);
};

// Local Variables:
// tab-width: 4
// End:
