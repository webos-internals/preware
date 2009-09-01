function ScreenshotsAssistant(screenshots, current)
{
	this.screenshots = screenshots;
	this.current = parseInt(current);
}

ScreenshotsAssistant.prototype.setup = function()
{
	try
	{
		this.controller.setupWidget
		(
			'screenshotView',
			{}, 
			{
				onLeftFunction: this.wentLeft.bind(this),
				onRightFunction: this.wentRight.bind(this)
			}
		);
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'screenshots#setup');
	}
}

ScreenshotsAssistant.prototype.wentLeft = function()
{
	try
	{
		if (this.current > 0) 
		{
			this.current--;
			
			if (this.current > 0 && this.screenshots[this.current - 1]) 
			{
				this.controller.get('screenshotView').mojo.leftUrlProvided(this.screenshots[this.current - 1]);
			}
			
			this.controller.get('screenshotView').mojo.centerUrlProvided(this.screenshots[this.current]);
			
			if (this.screenshots[this.current + 1]) 
			{
				this.controller.get('screenshotView').mojo.rightUrlProvided(this.screenshots[this.current + 1]);
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'screenshots#wentLeft');
	}
}
ScreenshotsAssistant.prototype.wentRight = function()
{
	try
	{
		if (this.current < (this.screenshots.length - 1)) 
		{
			this.current++;
			
			if (this.current > 0 && this.screenshots[this.current - 1]) 
			{
				this.controller.get('screenshotView').mojo.leftUrlProvided(this.screenshots[this.current - 1]);
			}
			
			this.controller.get('screenshotView').mojo.centerUrlProvided(this.screenshots[this.current]);
			
			if (this.screenshots[this.current + 1]) 
			{
				this.controller.get('screenshotView').mojo.rightUrlProvided(this.screenshots[this.current + 1]);
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'screenshots#wentRight');
	}
}

ScreenshotsAssistant.prototype.activate = function(event)
{
	try
	{
		if (this.controller.window.PalmSystem)
		{
			this.controller.window.PalmSystem.enableFullScreenMode(true);
		}
		
		if (this.current > 0 && this.screenshots[this.current - 1]) 
		{
			this.controller.get('screenshotView').mojo.leftUrlProvided(this.screenshots[this.current - 1]);
		}
		
		this.controller.get('screenshotView').mojo.centerUrlProvided(this.screenshots[this.current]);
		
		if (this.screenshots[this.current + 1]) 
		{
			this.controller.get('screenshotView').mojo.rightUrlProvided(this.screenshots[this.current + 1]);
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'screenshots#activate');
	}
}

ScreenshotsAssistant.prototype.deactivate = function(event)
{
	try
	{
		if (this.controller.window.PalmSystem)
		{
			this.controller.window.PalmSystem.enableFullScreenMode(false);
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'screenshots#deactivate');
	}
}

ScreenshotsAssistant.prototype.cleanup = function(event) {}
