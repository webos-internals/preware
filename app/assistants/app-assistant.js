function AppAssistant() {}

var mainStageName = 'preware-main';
var dashStageName = 'preware-dash';

AppAssistant.prototype.handleLaunch = function(params) {

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
				var f = function(stageController)
				{
					stageController.pushScene("update", "main", false);
				};
				
				// launch the stage
				this.controller.createStageWithCallback({name: mainStageName, lightweight: true}, f);
			}
		}
			
	}
	catch (e)
	{
		Mojo.Log.logException(e, "AppAssistant#handleLaunch");
	}

}

AppAssistant.prototype.cleanup = function() {}
