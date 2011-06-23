function HelpDataAssistant(data)
{
	this.data = data;
};

HelpDataAssistant.prototype.setup = function()
{
	this.controller.get('help-title').innerHTML = this.data.title;
	this.controller.get('data').innerHTML = this.data.data;
	
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {visible: false});
	
	// setup icon
	this.iconElement = this.controller.get('icon');
	this.iconTapHandler = this.iconTap.bindAsEventListener(this);
	this.controller.listen(this.iconElement, Mojo.Event.tap, this.iconTapHandler);

};

HelpDataAssistant.prototype.iconTap = function(event)
{
	if (Mojo.Environment.DeviceInfo.modelNameAscii == 'TouchPad') this.controller.stageController.popScene();
};

HelpDataAssistant.prototype.activate = function(event)
{
	if (this.controller.stageController.setWindowOrientation)
	{
    	this.controller.stageController.setWindowOrientation("up");
	}
};
HelpDataAssistant.prototype.deactivate = function(event) {};
HelpDataAssistant.prototype.cleanup = function(event) {
	this.controller.stopListening(this.iconElement,  Mojo.Event.tap,
								  this.iconTapHandler);
};

// Local Variables:
// tab-width: 4
// End:
