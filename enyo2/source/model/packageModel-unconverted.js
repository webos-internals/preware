packageModel.prototype.doInstall = function(assistant, multi, skipDeps)
{
	try 
	{
		// save assistant
		this.assistant = assistant;
		
		// check dependencies and do multi-install
		if (!skipDeps) 
		{
			this.assistant.displayAction($L("Checking Dependencies"));
			var deps = this.getDependenciesRecursive(true); // true to get "just needed" packages
			if (deps.length > 0) 
			{
				packages.checkMultiInstall(this, deps, assistant);
				return;
			}
		}
		
		// start action
		if (multi != undefined)
		{
			this.assistant.displayAction($L("Downloading / Installing<br />") + this.title);
			
			// call install service
			this.subscription = IPKGService.install(this.onInstall.bindAsEventListener(this, multi), this.filename, this.location.replace(/ /g, "%20"));
		}
		else
		{
			this.assistant.displayAction($L("Downloading / Installing"));
			
			this.assistant.startAction();
			
			// call install service
			this.subscription = IPKGService.install(this.onInstall.bindAsEventListener(this), this.filename, this.location.replace(/ /g, "%20"));
		}
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#doInstall');
	}
};
packageModel.prototype.doUpdate = function(assistant, multi, skipDeps)
{
	try 
	{
		// save assistant
		this.assistant = assistant;
		
		// check dependencies and do multi-install
		if (!skipDeps) 
		{
			this.assistant.displayAction($L("Checking Dependencies"));
			var deps = this.getDependenciesRecursive(true); // true to get "just needed" packages
			if (deps.length > 0) 
			{
				packages.checkMultiInstall(this, deps, assistant);
				return;
			}
		}
		
		// start action
		if (multi != undefined)
		{
			this.assistant.displayAction($L("Downloading / Updating<br />") + this.title);

			if (packages.can(this.type, 'updateAsReplace'))
			{
				this.subscription = IPKGService.replace(this.onUpdate.bindAsEventListener(this, multi), this.pkg, this.filename, this.location.replace(/ /g, "%20"));
				this.assistant.displayAction('Downloading / Replacing<br />' + this.title);
			}
			else
			{
				this.subscription = IPKGService.install(this.onUpdate.bindAsEventListener(this, multi), this.filename, this.location.replace(/ /g, "%20"));
			}
		}
		else
		{
			this.assistant.displayAction($L("Downloading / Updating"));

			this.assistant.startAction();
		
			if (packages.can(this.type, 'updateAsReplace'))
			{
				this.subscription = IPKGService.replace(this.onUpdate.bindAsEventListener(this), this.pkg, this.filename, this.location.replace(/ /g, "%20"));
				this.assistant.displayAction($L("Downloading / Replacing"));
			}
			else
			{
				this.subscription = IPKGService.install(this.onUpdate.bindAsEventListener(this), this.filename, this.location.replace(/ /g, "%20"));
			}
		}
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#doUpdate');
	}
};
packageModel.prototype.doRemove = function(assistant, skipDeps)
{
	try 
	{
		// save assistant
		this.assistant = assistant;
		
		// check dependencies and do multi-install
		if (!skipDeps)
		{
			this.assistant.displayAction($L("Checking Dependencies"));
			var deps = this.getDependent(true); // true to get "just installed" packages
			if (deps.length > 0) 
			{
				packages.checkMultiRemove(this, deps, assistant);
				return;
			}
		}
		
		// start action
		this.assistant.displayAction($L("Removing"));
		this.assistant.startAction();
		
		// call remove service
		this.subscription = IPKGService.remove(this.onRemove.bindAsEventListener(this), this.pkg);
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'packageModel#doRemove');
	}
};

packageModel.prototype.onInstall = function(payload, multi)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload);
		
		if (!payload) 
		{
			var msg = $L("Error Installing: Communication Error");
			var msgError = true;
		}
		else 
		{
			if (!payload.returnValue)
			{
				var msg = $L("Error Installing: No Further Information");
				var msgError = true;
			}
			if (payload.stage == "failed")
			{
				var msg = $L("Error Installing: See IPKG Log");
				var msgError = true;
			}
			else if (payload.stage == "status")
			{
				this.assistant.displayAction($L("Downloading / Installing<br />") + payload.status);
				return;
			}
			else if (payload.stage == "completed")
			{
				// update info
				this.isInstalled = true;
				
				// cancel the subscription
				this.subscription.cancel();
				
				// message
				var msg = this.type + $L(" installed");
				
				// do finishing stuff
				if (multi != undefined) 
				{
					packages.doMultiInstall(multi+1);
					return;
				}
				else
				{
					if (this.hasFlags('install')) 
					{
						this.assistant.actionMessage(
							msg + ':<br /><br />' + this.actionMessage('install'),
							[{label:$L("Ok"), value:'ok'}, {label:$L("Later"), value:'skip'}],
							this.actionFunction.bindAsEventListener(this, 'install')
						);
						return;
					}
					else
					{
						// we run this anyways to get the rescan
						this.runFlags('install');
					}
				}
				
			}
			// we keep this around for services without flags that have a javarestart in their scripts
			// of course, it might get here on accident, but thats a risk we'll have to take for now [2]
			else if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				// update info
				this.isInstalled = true;
				
				// cancel the subscription
				this.subscription.cancel();
				
				// message
				var msg = this.type + $L(" installed");
				var msgError = true;
				
				if (multi != undefined) 
				{
					packages.doMultiInstall(multi + 1);
					return;
				}
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
		Mojo.Log.logException(e, 'packageModel#onInstall');
	}
};
packageModel.prototype.onUpdate = function(payload, multi)
{
	try 
	{
		// log payload for display
		IPKGService.logPayload(payload);
		
		if (!payload) 
		{
			var msg = $L("Error Updating: Communication Error");
			var msgError = true;
		}
		else
		{
			if (!payload.returnValue)
			{
				var msg = $L("Error Updating: No Further Information");
				var msgError = true;
			}
			if (payload.stage == "failed")
			{
				var msg = $L("Error Updating: See IPKG Log");
				var msgError = true;
			}
			else if (payload.stage == "status")
			{
				this.assistant.displayAction($L("Downloading / Updating<br />") + payload.status);
				return;
			}
			else if (payload.stage == "completed")
			{
				// update info
				this.hasUpdate = false;
				
				// cancel the subscription
				this.subscription.cancel();
				
				// message
				var msg = this.type + $L(" updated");
				
				// do finishing stuff
				if (multi != undefined) 
				{
					packages.doMultiInstall(multi + 1);
					return;
				}
				else 
				{
					if (this.hasFlags('update')) 
					{
						this.assistant.actionMessage(
							msg + ':<br /><br />' + this.actionMessage('update'),
							[{label:$L("Ok"), value:'ok'}, {label:$L("Later"), value:'skip'}],
							this.actionFunction.bindAsEventListener(this, 'update')
						);
						return;
					}
					else
					{
						// we run this anyways to get the rescan
						this.runFlags('update');
					}
				}
				
			}
			// we keep this around for services without flags that have a javarestart in their scripts
			// of course, it might get here on accident, but thats a risk we'll have to take for now
			else if (payload.errorText == "org.webosinternals.ipkgservice is not running.")
			{
				// update info
				this.hasUpdate = false;
				
				// cancel the subscription
				this.subscription.cancel();
				
				// message
				var msg = this.type + $L(" updated");
				var msgError = true;
				
				if (multi != undefined) 
				{
					packages.doMultiInstall(multi + 1);
					return;
				}
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
		Mojo.Log.logException(e, 'packageModel#onUpdate');
	}
};
packageModel.prototype.onRemove = function(payload)
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
