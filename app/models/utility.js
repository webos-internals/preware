// formats a timestamp to a readable date
formatDate = function(date)
{
	var dateObj = new Date(date * 1000);
	var toReturn = '';
	var pm = false;
	
	toReturn += (dateObj.getMonth() + 1) + '/' + dateObj.getDate() + '/' + String(dateObj.getFullYear()).substring(2) + ' ';
	
	if (dateObj.getHours() > 12) pm = true;
	
	if (!pm)
	{
		if (dateObj.getHours() < 1) toReturn += '12';
		if (dateObj.getHours() > 0) toReturn += dateObj.getHours();
		toReturn += ':';
		if (dateObj.getMinutes() < 10) toReturn += '0'
		toReturn += dateObj.getMinutes() + ' AM';
	}
	else
	{
		toReturn += (dateObj.getHours() - 12) + ':';
		if (dateObj.getMinutes() < 10) toReturn += '0'
		toReturn += dateObj.getMinutes() + ' PM';
	}
	
	return toReturn;
};

// condences bytes to a better rate
formatSize = function(size)
{
	var toReturn = size + $L(" B");
	var formatSize = size;
	
	if (formatSize > 1024)
	{
		formatSize = (Math.round((formatSize / 1024) * 100) / 100);
		toReturn = formatSize + $L(" KB");
	}
	if (formatSize > 1024)
	{
		formatSize = (Math.round((formatSize / 1024) * 100) / 100);
		toReturn = formatSize + $L(" MB");
	}
	// I don't think we need to worry about GB here...
	
	// return formatted size
	return toReturn;
};

// formats a url to something that can be a link
getDomain = function(url)
{
	var r = new RegExp("^(?:http(?:s)?://)?([^/]+)");
	var match = url.match(r);
	if (match) 
	{
		var stripped = match[1].replace(/www./, '');
		return stripped;
	}
	return 'Link';
};

// trim function
trim = function(str)
{
	return str.replace(/^\s*/, "").replace(/\s*$/, "");
};

// function to get the webos version
getWebOSVersion = function()
{
	//alert('----------');
	returnVersion = 0;
	var buildInfo = palmGetResource("/etc/palm-build-info");
	var lines = buildInfo.split(/\n/);
	var lineRegExp = new RegExp(/^[\s]*([^=]*)=[\s]*(.*)[\s]*$/);
	var verRegExp = new RegExp(/^[\D]*([0-9.]*)(.*)$/);
	for (var l = 0; l < lines.length; l++)
	{
		//alert(l + ': ' + lines[l]);
		var match = lineRegExp.exec(lines[l]);
		if (match) 
		{
			//for (var m = 0; m < match.length; m++) alert('  ' + m + ': ' + match[m]);
			if (match[1] == 'PRODUCT_VERSION_STRING')
			{
				//alert('MATCHED');
				var ver = verRegExp.exec(match[2]);
				if (ver) 
				{
					//for (var v = 0; v < ver.length; v++) alert('    ' + v + ': ' + ver[v]);
					if (ver[1]) 
					{
						returnVersion = ver[1];
					}
				}
			}
		}
	}
	
	return returnVersion; 
};

// Local Variables:
// tab-width: 4
// End:
