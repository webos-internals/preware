packageModel.prototype.errorLogFunction = function(value)
{
	if (value == 'view-log')
	{
		this.assistant.controller.stageController.pushScene({name: 'ipkg-log', disableSceneScroller: true});
	}
	return;
};
packageModel.prototype.actionFunction = function(value, type)
{
	if (value == 'ok') 
	{
		this.runFlags(type);
	}
	else
	{
		// we should still rescan...
		if (!prefs.get().avoidBugs && type != 'remove') 
		{
			this.subscription = IPKGService.rescan(function(){});
		}
	}
	this.assistant.endAction();
	return;
};
packageModel.prototype.actionMessage = function(type)
{
	var msg = '';
	if (this.flags[type].RestartJava) 
	{
		msg += $L("<b>Java Restart Is Required</b><br /><i>Once you press Ok your device will lose network connection and be unresponsive until it is done restarting.</i><br />");
	}
	if (this.flags[type].RestartLuna) 
	{
		msg += $L("<b>Luna Restart Is Required</b><br /><i>Once you press Ok all your open applications will be closed while luna restarts.</i><br />");
	}
	if ((this.flags[type].RestartJava && this.flags[type].RestartLuna) || this.flags[type].RestartDevice) 
	{
		msg = $L("<b>Device Restart Is Required</b><br /><i>You will need to restart your device to be able to use the package that you just installed.</i><br />");
	}
	return msg;
};
