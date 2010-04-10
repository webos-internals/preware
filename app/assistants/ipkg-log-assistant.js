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
	this.controller.get('log-title').innerHTML = $L('IPKG Log');

	if (IPKGService.log == '') 
	{
		this.controller.get('logData').innerHTML = $L('<div class="noData">The log is empty.</div>');
	}
	else 
	{
		this.controller.get('logData').innerHTML = IPKGService.log;
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
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
};

IpkgLogAssistant.prototype.handleWindowResize = function(event)
{
	this.controller.get('logScroller').style.height = this.controller.stageController.window.innerHeight + 'px';
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
	                text: style+'<br><br>'+IPKGService.log
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
};

// Local Variables:
// tab-width: 4
// End:
