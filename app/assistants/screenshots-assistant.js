function ScreenshotsAssistant(screenshots, current)
{
	this.screenshots = screenshots;
	this.current = parseInt(current);
};

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
		
		// setup menu that is no menu
		this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, { visible: false });
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'screenshots#setup');
	}
};

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
};
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
};

/*// for whatever reason i cant get this to work
ScreenshotsAssistant.prototype.orientationChanged = function(orientation)
{
	switch (orientation)
	{
		case 'left':
		case 'right':
			this.controller.get('screenshotView').className = 'sideways';
			break;
			
		case 'up':
		case 'down':
			this.controller.get('screenshotView').className = '';
			break;
	}
};
*/

ScreenshotsAssistant.prototype.activate = function(event)
{
	try
	{
		/*// for whatever reason i cant get this to work
		if (this.controller.stageController.setWindowOrientation) {
        	this.controller.stageController.setWindowOrientation("free");
    	}
    	*/
		
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
};

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
};

ScreenshotsAssistant.prototype.cleanup = function(event) {};

// Local Variables:
// tab-width: 4
// End:

