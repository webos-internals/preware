onRemove = function(payload)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload);
		
		if (!payload) 
		{
			var msg = $L("Error Removing: Communication Error");
			var msgError = true;
		}
		else
		{
			if (!payload.returnValue)
			{
				var msg = $L("Error Removing: No Further Information");
				var msgError = true;
			}
			if (payload.stage == "failed")
			{
				var msg = $L("Error Removing: See IPKG Log");
				var msgError = true;
			}
			else if (payload.stage == "status")
			{
				this.assistant.displayAction($L("Removing<br />") + payload.status);
				return;
			}
			else if (payload.stage == "completed")
			{
				// update info
				this.hasUpdate = false;
				this.isInstalled = false;
				
				// cancel the subscription
				this.subscription.cancel();
				
				// message
				var msg = this.type + $L(" removed");
				
				// do finishing stuff
				if (this.hasFlags('remove')) 
				{
					this.assistant.actionMessage(
						msg + ':<br /><br />' + this.actionMessage('remove'),
						[{label:$L("Ok"), value:'ok'}, {label:$L("Later"), value:'skip'}],
						this.actionFunction.bindAsEventListener(this, 'remove')
					);
					return;
				}
				else
				{
					// we run this anyways to get the rescan
					this.runFlags('remove');
				}
			}
			// we keep this around for services without flags that have a javarestart in their scripts
			// of course, it might get here on accident, but thats a risk we'll have to take for now
			else if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				// update info
				//this.hasUpdate = false;
				//this.isInstalled = false;
				
				// cancel the subscription
				this.subscription.cancel();
				
				// message
				var msg = this.type + $L(" removal probably failed");
				var msgError = true;
			}
			else return;
		}
		
		if (msgError)
		{
			this.assistant.actionMessage(
				msg,
				[{label:$L("Ok"), value:'ok'}, {label:$L("IPKG Log"), value:'view-log'}],
				this.errorLogFunction.bindAsEventListener(this)
			);
		}
		else
		{
			this.assistant.simpleMessage(msg);
		}
		
		this.assistant.endAction();
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#onRemove');
	}
};

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
packageModel.prototype.hasFlags = function(type)
{
	if (this.flags[type].RestartLuna || this.flags[type].RestartJava || this.flags[type].RestartDevice) 
	{
		return true;
	}
	return false;
};
packageModel.prototype.runFlags = function(type)
{
	try 
	{
		if ((this.flags[type].RestartJava && this.flags[type].RestartLuna) || this.flags[type].RestartDevice) 
		{
			this.subscription = IPKGService.restartdevice(function(){});
		}
		if (this.flags[type].RestartJava) 
		{
			this.subscription = IPKGService.restartjava(function(){});
		}
		if (this.flags[type].RestartLuna) 
		{
			this.subscription = IPKGService.restartluna(function(){});
		}
		// this is always ran...
		if (!prefs.get().avoidBugs && type != 'remove')
		{
			this.subscription = IPKGService.rescan(function(){});
		}
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#runFlags');
	}
};
