enyo.depends(
	"$lib/layout",
	"$lib/onyx",	// To theme Onyx using Theme.less, change this line to $lib/onyx/source,
  "$lib/webos-ext", //adds eyno.webOS and enyo.webOS.ServiceRequest. Maybe that will not be needed on the final device?
	//"Theme.less",	// uncomment this line, and follow the steps described in Theme.less
	"App.css",
	"App.js",
  "model"
);
