// we load these global objects here because this scene is the first to get pushed to the stack...
// But it probably doesn't matter...

// global items object
var packages = new packagesModel();

// holds the preferences cookie
var prefs = new preferenceCookie();

function AppAssistant() {}

var mainStageName = 'preware-main';
var dashStageName = 'preware-dash';

AppAssistant.prototype.handleLaunch = function(params)
{
	var mainStageController = this.controller.getStageController(mainStageName);
	
	try
	{
		if (!params) 
		{
	        if (mainStageController) 
			{
				// if it exists, just bring it to the front by focusing its window.
				mainStageController.popScenesTo("main");
				mainStageController.activate();
			}
			else
			{
				// launch the stage
				this.controller.createStageWithCallback({name: mainStageName, lightweight: true}, this.launchFirstScene.bind(this));
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, "AppAssistant#handleLaunch");
	}
}

AppAssistant.prototype.launchFirstScene = function(controller)
{
	controller.pushScene("update", "main", false);
}

AppAssistant.prototype.cleanup = function() {}
