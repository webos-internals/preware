/*global enyo, IPKGService, FilePicker */
/*
 * filePicker
 * 
 * usage:
 * var f = new filePicker({
 * 
 *		type: 'file',				// or folder, it changes the interface and what it returns
 *										 defaults to file
 * 
 *		onSelect: function,			// function that will be called upon completion,
 *										 it will be passed either a file/folder based on type or false for a cancel
 *										 this is the only required parameter
 * 
 *		root: false,				//	weather or not to allow access to root
 * 
 *		folder: '/media/internal/',	// initial folder location, notice the trailing slash!
 * 
 *		extensions: ['jpg','png'],	// (file type only) array of extensions to list (lowercase extensions only)
 *									// ['ext'] for single extension
 *									// [] for all extensions (DEFAULT)
 * 
 *		pop: false,					// make truthy if you want the filePicker to pop its own stage for selecting,
 *										 but it will do it automatically if no card is currently active, defaults to false
 * 
 *		sceneTitle: 'Select File'	// title of scene, but since they all have defaults, this is optional
 * });
 * 
 * 
 */
enyo.kind({
	name: "preware.FilePicker",
	published: {
		num: 0,
		type: 'file',
		root: false,
		topLevel: this.root ? '/' : '/media/internal/',
		pop: false,
		folder: this.topLevel,
		extensions: [],
		sceneTitle: false,
		stageName: false,
		sceneName: false,
		popped: false
		//gestrichen:		this.stageController =		false;
	//this.assistant =			false;		
	},
	events: {
		onListingDone: "", //inEvent will have results: [array of files], success: true / false, directory: string (orignal directory)
		onSelect: ""			 //inEvent will have value: selected value, success: true / false
	},
	statics: {
		num: 0,
		folderRegExp: new RegExp(/^\./),
		fileRegExp: new RegExp('^(.+)/([^/]+)$'),
		extensionRegExp: new RegExp(/\.([^\.]+)$/)
	},
	create: function() {
		this.inherited(arguments);
		FilePicker.num += 1;
		this.num = FilePicker.num;
		if (!this.stageName) {
			this.stageName = "filePicker-"+this.num;
		}
		if (!this.sceneName) {
			this.sceneName = this.type + "-picker";
		}
		this.openFilePicker();
	},
	getDirectory: function(dir) {
		IPKGService.getDirListing(this.parseDirectory.bind(this, dir), dir);
	}, 
	parseDirectory: function(dir, payload) {
		var returnArray = [], c;
		if (payload.contents.length > 0) {
			for (c = 0; c < payload.contents.length; c += 1) {
				if (!payload.contents[c].name.match(FilePicker.folderRegExp)
						 && ((this.validExtension(payload.contents[c].name) && payload.contents[c].type === 'file') || payload.contents[c].type !== 'file')) {
					returnArray.push({
						name: payload.contents[c].name,
						type: payload.contents[c].type,
						location: dir + payload.contents[c].name
					});
				}
			} //end for
		} //end if payload.contents
		
		//sort array
		if (returnArray.length > 0) {
			returnArray.sort(function(a, b) {
				var strA, strB;
				if (a.name && b.name) {
					strA = a.name.toLowerCase();
					strB = b.name.toLowerCase();
					return ((strA < strB) ? -1 : ((strA > strB) ? 1 : 0));
				} 
				return -1;
			});
		}
		this.doListingDone({results: returnArray, directory: dir, success: true});
	},
	getDirectories: function(dir) {
		IPKGService.getDirListing(this.parseDirectories.bind(this, dir), dir);
	},
	parseDirectories: function(dir, payload) {
		var returnArray = [], c;
		if (payload.contents.length > 0) {
			for (c = 0; c < payload.contents.length; c += 1) {
				if (!payload.contents[c].name.match(FilePicker.folderRegExp) && payload.contents[c].type === 'directory') {
					returnArray.push({
						name: payload.contents[c].name,
						type: payload.contents[c].type,
						location: dir + payload.contents[c].name
					});
				}
			} //end for
		} //end if payload.contents
		
		//sort array
		if (returnArray.length > 0) {
			returnArray.sort(function(a, b) {
				var strA, strB;
				if (a.name && b.name) {
					strA = a.name.toLowerCase();
					strB = b.name.toLowerCase();
					return ((strA < strB) ? -1 : ((strA > strB) ? 1 : 0));
				} 
				return -1;
			});
		}
		this.doListingDone({results: returnArray, directory: dir, success: true});
	},
	ok: function(value) {
		this.doSelect({value: value, success: true});
	},
	cancel: function() {
		this.doSelect({value: false, success: false});
	},
	validExtension: function(name) {
		var match;
		if (this.extensions.length > 0) {
			match = FilePicker.extensionRegExp.exec(name);
			if (match && match.length > 1) {
				if (this.extensions.include(match[1].toLowerCase())) {
					return true;
				}
			}
			//no extension did match or no extension at all => false
			return false;
		} 
		//have no extensions filter, so everything is accepted.
		return true;
	},
	parseFileString: function(f) {
		return f.replace(/\/media\/internal\//i, 'USB/');
	},
	parseFileStringForId: function(p) {
		return p.toLowerCase().replace(/\//g, '-').replace(/ /g, '-').replace(/\./g, '-');
	},
	getFileName: function(p) {
		var match = FilePicker.fileRegExp.exec(p);
		if (match && match.length > 1) {
			return match[2];
		}
		return p;
	}
});


/*
somoe mojo stuff below.. not sure how to convert that, yet... stage stuff is very much gone. So I need to better undestand how this is used
do come up with something that will work in the enyo gui. Probably I won't need that at all.

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

*/
