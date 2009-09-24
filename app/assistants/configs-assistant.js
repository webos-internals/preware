function ConfigsAssistant() {}

ConfigsAssistant.prototype.setup = function()
{
	
	
	// setup menu that is no menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, { visible: false });
}

ConfigsAssistant.prototype.activate = function(event) {}
ConfigsAssistant.prototype.deactivate = function(event) {}
ConfigsAssistant.prototype.cleanup = function(event) {}
