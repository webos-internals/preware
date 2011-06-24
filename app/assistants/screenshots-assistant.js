function ScreenshotsAssistant(screenshots, current)
{
	this.screenshots = screenshots;
	this.current = parseInt(current);
};

ScreenshotsAssistant.prototype.setup = function()
{
	try
	{
		// setup back tap
		this.backElement = this.controller.get('back');
		this.backTapHandler = this.backTap.bindAsEventListener(this);
		this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);
		
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
			this.getSizeInfo(this.screenshots[this.current]);
			
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
			this.getSizeInfo(this.screenshots[this.current]);
			
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

ScreenshotsAssistant.prototype.getSizeInfo = function(ss) {
	var img;
	img = document.createElement('img');
	img.src = ss;
	img.onload = function() {
		var ssRatio = img.height / img.width,
			windowRatio = Mojo.Environment.DeviceInfo.screenHeight / Mojo.Environment.DeviceInfo.screenWidth,
			scaleWidth, scaleHeight;
		if (ssRatio < windowRatio) {
			scaleWidth = Mojo.Environment.DeviceInfo.screenWidth;
			scaleHeight = parseInt((scaleWidth * ssRatio), 10);
		} else {
			scaleHeight = Mojo.Environment.DeviceInfo.screenHeight;
			scaleWidth = parseInt((scaleHeight / ssRatio), 10);
		}
		this.controller.get('screenshotView').mojo.manualSize(scaleWidth,scaleHeight);
	}.bind(this);
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

		this.controller.get('ss-scene').style.width = Mojo.Environment.DeviceInfo.screenWidth + 'px';
		this.controller.get('ss-scene').style.height = Mojo.Environment.DeviceInfo.screenHeight + 'px';
		this.getSizeInfo(this.screenshots[this.current]);

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

ScreenshotsAssistant.prototype.backTap = function(event)
{
	this.controller.stageController.popScene();
};

ScreenshotsAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening(this.backElement, Mojo.Event.tap, this.backTapHandler);
};

// Local Variables:
// tab-width: 4
// End:

