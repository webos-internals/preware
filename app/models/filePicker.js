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
 * 		extensions: ['jpg','png'],	// (file type only) array of extensions to list (lowercase extensions only)
 * 									// ['ext'] for single extension
 * 									// [] for all extensions (DEFAULT)
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
	this.folder =				(params.folder ? params.folder : this.topLevel);
	this.extensions =			(params.extensions ? params.extensions : []);
	this.sceneTitle =			(params.sceneTitle ? params.sceneTitle : false);
	
	this.stageName =			'filePicker-' + this.num;
	this.sceneName =			this.type + '-picker';
	this.stageController =		false;
	this.assistant =			false;
	this.popped =				false;
	
	this.openFilePicker();
}

filePicker.prototype.getDirectory = function(dir, callback)
{
	IPKGService.getDirListing(this.parseDirectory.bindAsEventListener(this, dir, callback), dir);
}
filePicker.prototype.parseDirectory = function(payload, dir, callback)
{
	var returnArray = [];
	if (payload.contents.length > 0)
	{
		for (var c = 0; c < payload.contents.length; c++)
		{
			if (!payload.contents[c].name.match(filePicker.folderRegExp)
			&& ((this.validExtension(payload.contents[c].name) && payload.contents[c].type == 'file') || payload.contents[c].type != 'file'))
			{
				returnArray.push({
					name: payload.contents[c].name,
					type: payload.contents[c].type,
					location: dir + payload.contents[c].name
				});
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
	callback(returnArray);
}
filePicker.prototype.getDirectories = function(dir)
{
	// this for folderpicker...
	var returnArray = [];
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

filePicker.prototype.validExtension = function(name)
{
	if (this.extensions.length > 0)
	{
		var match = filePicker.extensionRegExp.exec(name);
		if (match && match.length > 1)
		{
			if (this.extensions.include(match[1].toLowerCase()))
			{
				return true;
			}
		}
	}
	else
	{
		return true;
	}
	// eh?
	return false;
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
filePicker.getFileName = function(p)
{
	var match = filePicker.fileRegExp.exec(p);
	if (match && match.length > 1)
	{
		return match[2];
	}
	return p;
}
filePicker.folderRegExp = new RegExp(/^\./);
filePicker.fileRegExp = new RegExp('^(.+)/([^/]+)$');
filePicker.extensionRegExp = new RegExp(/\.([^\.]+)$/);
