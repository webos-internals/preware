function PkgInstallAssistant()
{
	// this is true when a package action is in progress
	this.active = false;
	
	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: $L("IPKG Log"),
				command: 'do-showLog'
			},
			{
				label: $L("Help"),
				command: 'do-help'
			}
		]
	}
	
	// load stayawake class
	this.stayAwake = new stayAwake();
};

PkgInstallAssistant.prototype.setup = function()
{
	// clear log so it only shows stuff from this scene
	IPKGService.logClear();
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	// setup spinner widget
	this.spinnerModel = {spinning: false};
	this.controller.setupWidget('spinner', {spinnerSize: 'large'}, this.spinnerModel);
	
};

PkgInstallAssistant.prototype.handleCommand = function(event)
{
	if(event.type == Mojo.Event.back)
	{
		if (this.active) 
		{
			event.preventDefault();
			event.stopPropagation();
		}      
	}
	else if(event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-showLog':
				this.controller.stageController.pushScene({name: 'ipkg-log', disableSceneScroller: true});
				break;
				
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
				
			default:
				// this shouldn't happen
				break;
		}
	}
};

/* 
 * this functions are called by the package model when doing stuff
 * anywhere the package model will be installing stuff these functions are needed
 */
PkgInstallAssistant.prototype.startAction = function()
{
	// this is the start of the stayawake class to keep it awake till we're done with it
	this.stayAwake.start();
	
	// set this to stop back gesture
	this.active = true;
	
	// to update the spinner
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	
	// and to hide the data while we do the action
	this.controller.get('formContainer').style.display = "none";
	
	// and make sure the scene scroller is at the top
	this.controller.sceneScroller.mojo.scrollTo(0, 0);
};
PkgInstallAssistant.prototype.displayAction = function(msg)
{
	this.controller.get('spinnerStatus').innerHTML = msg;
};
PkgInstallAssistant.prototype.endAction = function()
{
	// we're done loading so let the phone sleep if it needs to
	this.stayAwake.end();
	
	// allow back gesture again
	this.active = false;
	
	// end action action is to stop the spinner
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	
	// show the data
	this.controller.get('formContainer').style.display = 'inline';
};
PkgInstallAssistant.prototype.simpleMessage = function(message)
{
	this.controller.showAlertDialog(
	{
	    title:				$L(this.item.type),
		allowHTMLMessage:	true,
	    message:			message,
	    choices:			[{label:$L('Ok'), value:''}],
		onChoose:			function(value){}
    });
};
PkgInstallAssistant.prototype.actionMessage = function(message, choices, actions)
{
	this.controller.showAlertDialog(
	{
	    title:				$L(this.item.type),
		allowHTMLMessage:	true,
		preventCancel:		true,
	    message:			message,
	    choices:			choices,
	    onChoose:			actions
    });
};
/* end functions called by the package model */

PkgInstallAssistant.prototype.cleanup = function(event)
{
	try
	{
		
	}
	catch(e)
	{
		Mojo.Log.logException(e, 'pkg-install#cleanup');
	}
};

// Local Variables:
// tab-width: 4
// End:


