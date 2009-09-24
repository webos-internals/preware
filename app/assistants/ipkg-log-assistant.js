function IpkgLogAssistant() {}

IpkgLogAssistant.prototype.setup = function()
{
	if (IPKGService.log == '') 
	{
		this.controller.get('logData').innerHTML = '<div class="noData">The log is empty.</div>';
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
	this.controller.listen(this.controller.stageController.window, 'resize', this.handleWindowResize.bindAsEventListener(this));
	this.handleWindowResize();
	
	// setup menu that is no menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, { visible: false });
}

IpkgLogAssistant.prototype.handleWindowResize = function(event)
{
	this.controller.get('logScroller').style.height = this.controller.stageController.window.innerHeight + 'px';
}

IpkgLogAssistant.prototype.activate = function(event) {}
IpkgLogAssistant.prototype.deactivate = function(event) {}
IpkgLogAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening(this.controller.stageController.window, 'resize', this.handleWindowResize.bindAsEventListener(this));
}
