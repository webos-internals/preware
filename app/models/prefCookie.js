function prefCookie()
{
	this.cookie = false;
	this.prefs = false;
	this.load();
}

prefCookie.prototype.get = function(reload)
{
	try 
	{
		if (!this.prefs || reload) 
		{
			// setup our default preferences
			this.prefs = 
			{
				// Startup Group
				updateInterval: 'launch',
				lastUpdate: 0, // will be updated every time update is successful
				
				// Main Scene Group
				showLibraries: false,
				
				// List Scene Group
				listSort: 'default',
				listInstalled: false,
				
				// Background Group
				backgroundUpdates: 'disabled',
				autoInstallUpdates: false,
				
				// Hidden Advanced Group
				allowServiceUpdates: false
			};
			
			var cookieData = this.cookie.get();
			if (cookieData) 
			{
				for (i in cookieData) 
				{
					this.prefs[i] = cookieData[i];
				}
			}
			else 
			{
				this.put(this.prefs);
			}
		}
		
		return this.prefs;
	} 
	catch (e) 
	{
		Mojo.Log.logException(e, 'prefCookie#get');
	}
}

prefCookie.prototype.put = function(obj, value)
{
	try
	{
		this.load();
		if (value)
		{
			this.prefs[obj] = value;
			this.cookie.put(this.prefs);
		}
		else
		{
			this.cookie.put(obj);
		}
	} 
	catch (e) 
	{
		Mojo.Log.logException(e, 'prefCookie#put');
	}
}

prefCookie.prototype.load = function()
{
	try
	{
		if (!this.cookie) 
		{
			this.cookie = new Mojo.Model.Cookie('preferences');
		}
	} 
	catch (e) 
	{
		Mojo.Log.logException(e, 'prefCookie#load');
	}
}