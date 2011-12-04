// formats a timestamp to a readable date
formatDate = function(date)
{
	var toReturn = '';
	if (date)
	{
		var dateObj = new Date(date * 1000);
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

// removeAuth function
removeAuth = function(str)
{
	return str
	.replace(new RegExp('http://[^@/]+@','gm'), 'http://user:pass@')
	.replace(new RegExp('-H "Device-Id: [^"]+" ','gm'), "")
	.replace(new RegExp('-H "Auth-Token: [^"]+" ','gm'), "")
	;
};

// trim function
trim = function(str)
{
	return str.replace(/^\s*/, "").replace(/\s*$/, "");
};

// tells you if val is "numeric"
isNumeric = function(val)
{
	if (isNaN(parseFloat(val)))
	{
		return false;
	}
	return true
}


// Local Variables:
// tab-width: 4
// End:
