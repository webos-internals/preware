function AppAssistant() {

}

AppAssistant.prototype.handleLaunch = function() {

	try {

		if (Mojo.Controller.appInfo.noWindow) {

			var f = function(stageController) {

				stageController.pushScene("main");

			};

			var stageName = "catalog-" + Date.now();
			this.controller.createStageWithCallback({name: stageName, lightweight: true}, f);

		} else if(params.banner) {

			Mojo.Log.warn("Notifications not yet implemented.");

		}

	} catch (e) {

		Mojo.Log.logException(e, "AppAssistant#handleLaunch");

	}

}

AppAssistant.prototype.cleanup = function() {

}