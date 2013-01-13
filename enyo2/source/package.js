enyo.depends(
	"$lib/layout",
	"$lib/onyx",	// To theme Onyx using Theme.less, change this line to $lib/onyx/source,
	//"Theme.less",	// uncomment this line, and follow the steps described in Theme.less
	"$lib/webos-ports-lib",
	//"$lib/webos-ext", //adds enyo.webOS and enyo.webOS.ServiceRequest. Maybe that will not be needed on the final device?
	"App.css",
	"App.js",
	"model"
);
