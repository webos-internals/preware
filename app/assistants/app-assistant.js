// global packages object
var packages = new packagesModel();

// get the cookies
var prefs = new preferenceCookie();
var vers =  new versionCookie();

// stage names
var mainStageName = 'preware-main';
var dashStageName = 'preware-dash';

function AppAssistant() {}

AppAssistant.prototype.handleLaunch = function(params)
{
	var mainStageController = this.controller.getStageController(mainStageName);
	
	try
	{
		if (!params) 
		{
	        if (mainStageController) 
			{
				mainStageController.popScenesTo('main');
				mainStageController.activate();
			}
			else
			{
				this.controller.createStageWithCallback({name: mainStageName, lightweight: true}, this.launchFirstScene.bind(this));
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, "AppAssistant#handleLaunch");
	}
};

AppAssistant.prototype.launchFirstScene = function(controller)
{
	vers.init();
	if (vers.showStartupScene()) 
	{
		controller.pushScene('startup');
	}
	else
	{
		controller.pushScene('update', 'main', false);
	}
};

AppAssistant.prototype.cleanup = function() {};

// Local Variables:
// tab-width: 4
// End:
