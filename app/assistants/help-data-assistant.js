function HelpDataAssistant(data)
{
	this.data = data;
};

HelpDataAssistant.prototype.setup = function()
{
	this.controller.get('help-title').innerHTML = this.data.title;
	this.controller.get('data').innerHTML = this.data.data;
	
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {visible: false});
	
	// setup back tap
	this.backElement = this.controller.get('icon');
	this.backTapHandler = this.backTap.bindAsEventListener(this);
	this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);

};

HelpDataAssistant.prototype.backTap = function(event)
{
	this.controller.stageController.popScene();
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
	this.controller.stopListening(this.backElement,  Mojo.Event.tap, this.backTapHandler);
};

// Local Variables:
// tab-width: 4
// End:
