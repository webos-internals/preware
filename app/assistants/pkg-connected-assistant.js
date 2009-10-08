function PkgConnectedAssistant(pkg, deps)
{
	this.pkg = pkg;
	this.deps = deps;
}

PkgConnectedAssistant.prototype.setup = function()
{
	this.controller.get('test').innerHTML = 'This scene sucks right now!<br>QUICK! BACK GESTURE!!<br>DON\'T LOOK AT MY UGLYNESS!!!!<br><br>' + this.pkg + '<br><br>' + this.deps;
}

PkgConnectedAssistant.prototype.activate = function(event) {}
PkgConnectedAssistant.prototype.deactivate = function(event) {}
PkgConnectedAssistant.prototype.cleanup = function(event) {}
