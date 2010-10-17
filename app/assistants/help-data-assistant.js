function HelpDataAssistant(data)
{
	this.data = data;
};

HelpDataAssistant.prototype.setup = function()
{
	this.controller.get('help-title').innerHTML = this.data.title;
	this.controller.get('data').innerHTML = this.data.data;
	
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {visible: false});
	
};
HelpDataAssistant.prototype.activate = function(event)
{
	if (this.controller.stageController.setWindowOrientation)
	{
    	this.controller.stageController.setWindowOrientation("up");
	}
};
HelpDataAssistant.prototype.deactivate = function(event) {};
HelpDataAssistant.prototype.cleanup = function(event) {};

// Local Variables:
// tab-width: 4
// End:
