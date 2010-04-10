/* 
 * This class is for handling service calls to com.palm.power
 * to make sure the service stays away when we're using it
 * like during startup and installation/update/removal
 */


function stayAwake()
{
	try
	{
		// setup stuff
		this.isStarted = false;
		this.appId = 'org.webosinternals.preware-serviceAction';
		this.duration   = '900000'; // 15 minute in milliseconds
		//this.duration = '60000';  //  1 minute
		//this.duration = '30000';  // 30 seconds
		//this.duration = '1000';   //  1 seconds
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'stayAwake#initialize');
	}
};

stayAwake.prototype.start = function()
{
	try
	{
		if (!this.isStarted) 
		{
			this.isStarted = true;
			var request = new Mojo.Service.Request('palm://com.palm.power/com/palm/power', 
			{
				method: 'activityStart',
				parameters: 
				{
					id: this.appId,
					duration_ms: this.duration
				},
				onSuccess: this.startHandler.bind(this),
				onFailure: this.startHandler.bind(this)
			});
			return request;
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'stayAwake#start');
	}
	return false;
};

stayAwake.prototype.startHandler = function(response)
{
	try
	{
		/*
		alert('---- startHandler ----');
		for (r in response)
		{
			alert(r + ': ' + response[r]);
		}
		*/
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'stayAwake#startHandler');
	}
};

stayAwake.prototype.end = function()
{
	try
	{
		if (this.isStarted) 
		{
			this.isStarted = false;
			var request = new Mojo.Service.Request('palm://com.palm.power/com/palm/power', 
			{
				method: 'activityEnd',
				parameters: 
				{
					id: this.appId
				},
				onSuccess: this.endHandler.bind(this),
				onFailure: this.endHandler.bind(this)
			});
			return request;
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'stayAwake#end');
	}
	return false;
};

stayAwake.prototype.endHandler = function(response)
{
	try
	{
		/*
		alert('---- endHandler ----');
		for (r in response)
		{
			alert(r + ': ' + response[r]);
		}
		*/
	}
	catch (e)
	{
		Mojo.Log.logException(e, 'stayAwake#endHandler');
	}
};

// Local Variables:
// tab-width: 4
// End:
