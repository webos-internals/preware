// global packages object
var packages = new packagesModel();

// global feeds object
var feeds = new feedsModel();

// get the cookies
var prefs = new preferenceCookie();
var vers =  new versionCookie();

// resource handler object
var rh = new resourceHandler(
{
	extension:		'ipk',
	mime:			'application/vnd.webos.ipk',
	addMessage:		'Preware is not associated to open application packages (.ipk files) from email or web.<br><br><b>Would you like to add preware to the association list for .ipk?</b>',
	activeMessage:	'Preware is not currently the default application for handling .ipk files.<br>Current Default: #{active}<br><br><b>Would you like to make Preware the default application?</b>',
});

var DeviceProfile =  new deviceProfile();
var PalmProfile =  new palmProfile();

// stage names
var mainStageName = 'preware-main';
var installStageName = 'preware-install';
var viewStageName = 'preware-view-';
var dashStageName = 'preware-dash';

function AppAssistant() {}

AppAssistant.prototype.handleLaunch = function(params)
{
	try
	{
		//alert('-----LAUNCHPARAMS-----');
		//for (var p in params) alert(p+': '+params[p]);
		if (!params || (params.source && params.source == 'updateNotification')) 
		{
			var mainStageController = this.controller.getStageController(mainStageName);
	        if (mainStageController)
			{
				var scenes = mainStageController.getScenes();
				if (scenes[0].sceneName == 'main')
				{
					mainStageController.popScenesTo('main');
				}
				
				mainStageController.activate();
			}
			else
			{
				this.controller.createStageWithCallback({name: mainStageName, lightweight: true}, this.launchFirstScene.bind(this));
			}
		}
		if ((params.type == 'install' && params.file) || params.target)
		{
			if (params.target) params.file = params.target;
			
			var installStageController = this.controller.getStageController(installStageName);
	        if (installStageController)
			{
				installStageController.popScenesTo('pkg-install');
				installStageController.delegateToSceneAssistant('updateText', params.file);
				installStageController.activate();
			}
			else
			{
				this.controller.createStageWithCallback({name: installStageName, lightweight: true}, this.launchInstallScene.bindAsEventListener(this, params.file));
			}
		}
		if ((params.type == 'view' && params.id) || params.viewPackage)
		{
			var id = params.viewPackage || params.id;
			var viewStageController = this.controller.getStageController(viewStageName + id);
	        if (viewStageController)
			{
				viewStageController.popScenesTo('pkg-load');
				viewStageController.activate();
			}
			else
			{
				this.controller.createStageWithCallback({name: viewStageName + id, lightweight: true}, this.launchViewScene.bindAsEventListener(this, id));
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
AppAssistant.prototype.launchInstallScene = function(controller, file)
{
	controller.pushScene('pkg-install', file);
};
AppAssistant.prototype.launchViewScene = function(controller, id)
{
	controller.pushScene('pkg-load', id);
};

AppAssistant.prototype.cleanup = function() {};

// Local Variables:
// tab-width: 4
// End:
