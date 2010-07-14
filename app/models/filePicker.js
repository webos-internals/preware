/*
 * filePicker
 * 
 * usage:
 * var f = new filePicker({
 * 
 * 		type: 'file',				// or folder, it changes the interface and what it returns
 * 									   defaults to file
 * 
 * 		onSelect: function,			// function that will be called upon completion,
 * 									   it will be passed either a file/folder based on type or false for a cancel
 * 									   this is the only required parameter
 * 
 * 		folder: '/media/internal/',	// initial folder location, notice the trailing slash!
 * 
 * 		pop: false,					// make truthy if you want the filePicker to pop its own stage for selecting,
 * 									   but it will do it automatically if no card is currently active, defaults to false
 * 
 * 		sceneTitle: 'Select File'	// title of scene, but since they all have defaults, this is optional
 * });
 * 
 * 
 */

function filePicker(params)
{
	filePicker.num++;
	this.num =					filePicker.num;
	
	this.topLevel =				'/media/internal/';
	
	this.params =				params;
	
	this.type =					(params.type ? params.type : 'file');
	this.onSelect =				params.onSelect;

	this.pop =					(params.pop ? params.pop : false);
	
	this.folder =				(params.folder ? params.folder : false);
		
	this.sceneTitle =			(params.sceneTitle ? params.sceneTitle : false);
	
	this.stageName =			'filePicker-' + this.num;
	this.sceneName =			this.type + '-picker';
	this.stageController =		false;
	this.assistant =			false;
	this.popped =				false;
	
	this.openFilePicker();
}

filePicker.prototype.listDirectory = function(dir)
{
	var json = JSON.parse(plugin.list_directory(dir));
	if (json && json.dir)
		return json.dir;
	else
		return [];
}
filePicker.prototype.statFile = function(file)
{
	return JSON.parse(plugin.stat_file(file));
}
filePicker.prototype.getDirectory = function(dir)
{
	// this function takes how the plugin works and makes it sane
	var returnArray = [];
	var d = this.listDirectory(dir);
	if (d.length > 0)
	{
		for (var f = 0; f < d.length; f++)
		{
			if (!d[f].match(filePicker.folderRegExp))
			{
				var file = this.statFile(dir + d[f]);
				if (file && file.st_size)
				{
					file.name = d[f];
					file.location = dir + d[f];
					returnArray.push(file);
				}
			}
		}
	}
	if (returnArray.length > 0)
	{
		returnArray.sort(function(a, b)
		{
			if (a.name && b.name)
			{
				strA = a.name.toLowerCase();
				strB = b.name.toLowerCase();
				return ((strA < strB) ? -1 : ((strA > strB) ? 1 : 0));
			}
			else
			{
				return -1;
			}
		});
	}
	return returnArray;
}
filePicker.prototype.getDirectories = function(dir)
{
	var returnArray = [];
	var d = this.getDirectory(dir);
	if (d.length > 0)
	{
		for (var f = 0; f < d.length; f++)
		{
			if (!d[f].name.match(filePicker.folderRegExp) && d[f].st_size == 32768)
			{
				returnArray.push(d[f]);
			}
		}
	}
	return returnArray;
}

filePicker.prototype.ok = function(value)
{
	this.onSelect(value);
}
filePicker.prototype.cancel = function()
{
	this.onSelect(false);
}


filePicker.prototype.openFilePicker = function()
{
	if (this.pop)
	{
		this.popFilePicker();
	}
	else
	{
		this.stageController = Mojo.Controller.appController.getActiveStageController('card');
	    if (this.stageController)
		{
			this.stageController.pushScene({name: this.sceneName, disableSceneScroller: (this.type=='file'?true:false)}, this);
		}
		else
		{
			this.popFilePicker();
		}
	}
}
filePicker.prototype.popFilePicker = function()
{
	this.stageController = Mojo.Controller.appController.getStageController(this.stageName);
	
    if (this.stageController)
	{
		var scenes = this.stageController.getScenes();
		if (scenes[0].sceneName == this.sceneName && scenes.length > 1)
		{
			this.stageController.popScenesTo(this.sceneName);
		}
		this.stageController.activate();
	}
	else
	{
		var f = function(controller)
		{
			controller.pushScene({name: this.sceneName, disableSceneScroller: (this.type=='file'?true:false)}, this);
			this.popped = true;
		};
		Mojo.Controller.appController.createStageWithCallback({name: this.stageName, lightweight: true}, f.bind(this));
	}
}
filePicker.prototype.setAssistant = function(assistant)
{
	this.assistant = assistant;
}
filePicker.prototype.close = function()
{
	if (this.popped)
	{
		Mojo.Controller.appController.closeStage(this.stageName);
	}
	else
	{
		this.stageController.popScene();
	}
}


filePicker.num = 0;

filePicker.parseFileString = function(f)
{
	return f.replace(/\/media\/internal\//i, 'USB/');
}
filePicker.parseFileStringForId = function(p)
{
	return p.toLowerCase().replace(/\//g, '-').replace(/ /g, '-').replace(/\./g, '-');
}
filePicker.folderRegExp = new RegExp(/^\./);