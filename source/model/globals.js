//TODO: we maybe want to get rid of this.. right now I have no idea how to get the data that I configure here dynamically.
/*global enyo */

//TODO: move this somewhere more appropriate.
String.prototype.include = function (pattern) {
	return this.indexOf(pattern) > -1;
}

enyo.singleton({
	name: "preware.Globals",
	published: {
		appVersion: "0.2"
	}
});
