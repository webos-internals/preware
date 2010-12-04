function FilePickerAssistant(picker)
{
	this.picker = picker;
	
	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: "Preferences",
				command: 'do-prefs'
			},
			{
				label: "Help",
				command: 'do-help'
			}
		]
	};
	
	this.cmdMenuModel =
	{
		label: $L('Menu'),
		items: []
	};
	
	this.animationDuration = .05;
	
	this.movingBack = false;
	this.selectedFile = false;
	this.selected = false;
	this.folderTree = [];
	this.initialTree = 0;
}
FilePickerAssistant.prototype.setup = function()
{
	// set theme
	this.controller.document.body.className = prefs.get().theme;

	this.picker.setAssistant(this);
	
    this.flickHandler = this.flickHandler.bindAsEventListener(this);

	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	if (this.picker.sceneTitle) this.controller.get('header').update(this.picker.sceneTitle);
	else this.controller.get('header').update($L('Select A File'));
	
	this.folderHolder = this.controller.get('folderHolder');
	
	this.updateCommandMenu(true);
	this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
	
	this.initialData();
}

FilePickerAssistant.prototype.initialData = function()
{
	try
	{
		this.addFolder(this.picker.topLevel, this.folderHolder, true);
		
		var tmp = this.picker.folder.replace(this.picker.topLevel, '').split('/');
		var build = this.picker.topLevel;
		if (tmp.length > 0)
		{
			for (var t = 0; t < tmp.length; t++)
			{
				if (tmp[t])
				{
					build += tmp[t];
					this.folderTap(false, build);
					build += '/';
				}
			}
			this.initialTree = this.folderTree.length;
		}
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'file-picker#initialData');
	}
}
FilePickerAssistant.prototype.activate = function(event)
{
	if (!this.alreadyActivated)
	{
		
	}
	this.alreadyActivated = true;
}

FilePickerAssistant.prototype.addFolder = function(folder, parent, initial)
{
	var tpl = 'file-picker/folder-container';
	var folderId = filePicker.parseFileStringForId(folder);
	var prevFolderId = false;
	
	var html = Mojo.View.render({object: {folder: folderId, left: (initial?0:321), location: (this.picker.root ? folder : filePicker.parseFileString(folder))}, template: tpl});
	parent.insert({bottom: html});
	this.folderTree.push(folder);
	
	if (this.folderTree[this.folderTree.length-2]) prevFolderId = filePicker.parseFileStringForId(this.folderTree[this.folderTree.length-2]);
	
	this.picker.getDirectory(folder, this.addFolderPart2.bindAsEventListener(this, folderId, prevFolderId, initial));
}
FilePickerAssistant.prototype.addFolderPart2 = function(data, folderId, prevFolderId, initial)
{
	if (data.length > 0)
	{
		for (var d = 0; d < data.length; d++)
		{
			this.addRow({name: data[d].name, location: data[d].location, isFolder: (data[d].type == 'directory' ? true : false), rowClass: (d == data.length-1?'last':'')}, this.controller.get('list' + folderId));
		}
	}
	
	this.controller.setupWidget('scroller'+folderId, {mode: 'vertical'}, {});
	this.controller.instantiateChildWidgets(this.controller.get('folder'+folderId));
	
    this.controller.listen('folder'+folderId, Mojo.Event.flick, this.flickHandler);
	
	if (!initial && prevFolderId)
	{
		Mojo.Animation.animateStyle(
		    this.controller.get('folder' + prevFolderId),
		    'left',
		    'linear',
			{from: 0, to: -321, duration: this.animationDuration}
		);
		Mojo.Animation.animateStyle(
		    this.controller.get('folder' + folderId),
		    'left',
		    'linear',
			{from: 321, to: 0, duration: this.animationDuration, currentValue: 321}
		);
	}
}
FilePickerAssistant.prototype.addRow = function(data, parent)
{
	var tpl = 'file-picker/file-row';
	var fileId = filePicker.parseFileStringForId(data.location);
	
	var html = Mojo.View.render({object: {name: data.name, file: fileId, rowClass: data.rowClass, iconClass: (data.isFolder?'folderIcon':'fileIcon')}, template: tpl});
	parent.insert({bottom: html});
	
	if (data.isFolder)
	{
		this.controller.listen('file' + fileId, Mojo.Event.tap, this.folderTap.bindAsEventListener(this, data.location));
	}
	else
	{
		this.controller.listen('file' + fileId, Mojo.Event.tap, this.fileTap.bindAsEventListener(this, data.location));
	}
}

FilePickerAssistant.prototype.folderTap = function(event, location)
{
	this.addFolder(location+'/', this.folderHolder);
	this.selectFile(false);
}
FilePickerAssistant.prototype.back = function()
{
	if (this.folderTree.length > 1)
	{
		this.selectFile(false);
		this.movingBack = true;
		Mojo.Animation.animateStyle(
		    this.controller.get('folder' + filePicker.parseFileStringForId(this.folderTree[this.folderTree.length-1])),
		    'left',
		    'linear',
			{from: 0, to: 321, duration: this.animationDuration,
			onComplete: this.delFolder.bind(this)}
		);
		Mojo.Animation.animateStyle(
		    this.controller.get('folder' + filePicker.parseFileStringForId(this.folderTree[this.folderTree.length-2])),
		    'left',
		    'linear',
			{from: -321, to: 0, duration: this.animationDuration}
		);
	}
}
FilePickerAssistant.prototype.delFolder = function(e)
{
	e.remove();
	this.folderTree = this.folderTree.without(this.folderTree[this.folderTree.length-1]);
	if (this.folderTree.length < this.initialTree)
	{
		this.initialTree = this.folderTree.length;
	}
	this.movingBack = false;
}
FilePickerAssistant.prototype.fileTap = function(event, location)
{
	this.selectFile(location);
}
FilePickerAssistant.prototype.selectFile = function(file)
{
	if (this.selectedFile)
	{
		var tmpCN = this.controller.get('file' + filePicker.parseFileStringForId(this.selectedFile)).className;
		this.controller.get('file' + filePicker.parseFileStringForId(this.selectedFile)).className = tmpCN.replace(/check/g, '');
	}
	this.selectedFile = file;
	if (this.selectedFile)
	{
		var tmpCN = this.controller.get('file' + filePicker.parseFileStringForId(this.selectedFile)).className;
		this.controller.get('file' + filePicker.parseFileStringForId(this.selectedFile)).className = tmpCN + ' check';
	}
	this.updateCommandMenu();
}

FilePickerAssistant.prototype.flickHandler = function(event)
{
	event.stop();
	if (event.velocity.x > 500 && this.folderTree.length > 1 && !this.movingBack)
	{
		this.back();
	}
}

FilePickerAssistant.prototype.updateCommandMenu = function(skipUpdate)
{
	this.cmdMenuModel.items = [];
	this.cmdMenuModel.items.push({});
	
	if (this.selectedFile)
	{
		this.cmdMenuModel.items.push({
			label: $L('Ok'),
			command: 'ok',
			width: 100
		});
	}
	else
	{
		this.cmdMenuModel.items.push({
			label: $L('Ok'),
			disabled: true,
			command: 'ok',
			width: 100
		});
	}
	
	this.cmdMenuModel.items.push({
		label: $L('Cancel'),
		command: 'cancel',
		width: 100
	});
	
	this.cmdMenuModel.items.push({});
	
	if (!skipUpdate)
	{
		this.controller.modelChanged(this.cmdMenuModel);
		this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
	}		
}
FilePickerAssistant.prototype.handleCommand = function(event)
{
	if(event.type == Mojo.Event.back || event.type == Mojo.Event.forward)
	{
		if (this.folderTree.length > this.initialTree && !this.movingBack)
		{
			event.preventDefault();
			event.stopPropagation();
			this.back();
		}
		else if (this.movingBack)
		{
			event.preventDefault();
			event.stopPropagation();
		}
	}
	else if(event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
				
			case 'do-prefs':
				this.controller.stageController.pushScene('preferences');
				break;
				
			case 'ok':
				this.selected = true;
				this.picker.ok(this.selectedFile);
				this.picker.close();
				break;
				
			case 'cancel':
				this.selected = true;
				this.picker.cancel();
				this.picker.close();
				break;
		}
	}
}
FilePickerAssistant.prototype.cleanup = function(event)
{
	if (!this.selected)
		this.picker.cancel();
}
