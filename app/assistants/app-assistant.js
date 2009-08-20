function AppAssistant() {

}

AppAssistant.prototype.handleLaunch = function() {

	var stageName = 'catalog';
	var mainStageController = this.controller.getStageController(stageName);
	
	try
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
				stageController.pushScene("main");
			};
			
			// launch the stage
			this.controller.createStageWithCallback({name: stageName, lightweight: true}, f);
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, "AppAssistant#handleLaunch");
	}

}

AppAssistant.prototype.cleanup = function() {}
