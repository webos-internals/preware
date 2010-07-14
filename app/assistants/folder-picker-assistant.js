function FolderPickerAssistant(picker)
{
	this.picker = picker;
	
	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			Mojo.Menu.editItem,
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
	
	this.selectedFolder = this.picker.folder;
	this.selected = false;
	this.loadedFolders = [];
}
FolderPickerAssistant.prototype.setup = function()
{
	// set theme
	this.controller.document.body.className = prefs.get().theme;

	this.picker.setAssistant(this);

	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	this.list = this.controller.get('list');
	if (this.picker.sceneTitle) this.controller.get('header').update(this.picker.sceneTitle);
	else this.controller.get('header').update('Select A Folder');
	
	this.updateCommandMenu(true);
	this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
	
	this.initialData();
}

FolderPickerAssistant.prototype.initialData = function()
{
	this.addRow({name: 'USB Partition', location: this.picker.topLevel, rowClass: 'single'}, this.list);
}
FolderPickerAssistant.prototype.activate = function(event)
{
	if (!this.alreadyActivated)
	{
		this.tap(false, this.picker.topLevel, true);
		if (this.selectedFolder)
		{
			var tmp = this.selectedFolder.replace(this.picker.topLevel, '').split('/');
			var build = this.picker.topLevel;
			if (tmp.length > 0)
			{
				for (var t = 0; t < tmp.length; t++)
				{
					if (tmp[t])
					{
						build += tmp[t] + '/';
						if (!tmp[t+1])
						{
							this.tap(false, build);
						}
						else
						{
							this.tap(false, build, true);
						}
					}
				}
			}
			this.controller.sceneScroller.mojo.scrollTo(
				0,
				0-(this.controller.get('folder' + filePicker.parseFileStringForId(this.selectedFolder)).cumulativeOffset().top-(this.controller.window.innerHeight-110)),
				false);
		}
		else
		{
			this.controller.sceneScroller.mojo.revealTop();
		}

	}
	this.alreadyActivated = true;
}

FolderPickerAssistant.prototype.addRow = function(data, parent)
{
	var tpl = 'folder-picker/folder-row';
	var folderId = filePicker.parseFileStringForId(data.location);
	
	var html = Mojo.View.render({object: {name: data.name, folder: folderId, rowClass: data.rowClass}, template: tpl});
	parent.insert({bottom: html});
	
	this.controller.listen('folder' + folderId, Mojo.Event.tap, this.tap.bindAsEventListener(this, data.location));
}


FolderPickerAssistant.prototype.tap = function(event, folder, initial)
{
	if (event) event.stop();
	var folderId = filePicker.parseFileStringForId(folder);
	var drawer = this.controller.get('list' + folderId);
	
	if (!this.loadedFolders.include(folder))
	{
		var data = this.picker.getDirectories(folder);
		if (data.length > 0)
		{
			for (var d = 0; d < data.length; d++)
			{
				this.addRow({name: data[d].name, location: data[d].location+'/', rowClass: (d == data.length-1?'last':'')}, drawer, false);
			}
			this.loadedFolders.push(folder);
			this.controller.setupWidget('list' + folderId, {modelProperty: 'open', unstyled: true}, {open: (initial?true:false)});
			this.controller.instantiateChildWidgets(this.list);
			if (!initial) drawer.mojo.setOpenState(true);
		}
	}
	else
	{
		drawer.mojo.toggleState();
	}
	
	var tmpCN = this.controller.get('folder' + folderId).className;
	if (drawer.mojo && drawer.mojo.getOpenState())
	{
		this.controller.get('folder' + folderId).className = tmpCN + ' open';
	}
	else
	{
		this.controller.get('folder' + folderId).className = tmpCN.replace(/open/g, '');
	}
	
	if (!initial)
	{
		this.selectFolder(folder);
	}
}
FolderPickerAssistant.prototype.selectFolder = function(folder)
{
	if (this.selectedFolder)
	{
		var tmpCN = this.controller.get('folder' + filePicker.parseFileStringForId(this.selectedFolder)).className;
		this.controller.get('folder' + filePicker.parseFileStringForId(this.selectedFolder)).className = tmpCN.replace(/check/g, '');
	}
	this.selectedFolder = folder;
	if (this.selectedFolder)
	{
		var tmpCN = this.controller.get('folder' + filePicker.parseFileStringForId(this.selectedFolder)).className;
		this.controller.get('folder' + filePicker.parseFileStringForId(this.selectedFolder)).className = tmpCN + ' check';
	}
	this.updateCommandMenu();
}

FolderPickerAssistant.prototype.updateCommandMenu = function(skipUpdate)
{
	this.cmdMenuModel.items = [];
	this.cmdMenuModel.items.push({});
	
	if (this.selectedFolder)
	{
		this.cmdMenuModel.items.push({
			label: 'Ok',
			command: 'ok',
			width: 100
		});
	}
	else
	{
		this.cmdMenuModel.items.push({
			label: 'Ok',
			disabled: true,
			command: 'ok',
			width: 100
		});
	}
	
	this.cmdMenuModel.items.push({
		label: 'Cancel',
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
FolderPickerAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
				
			case 'do-prefs':
				this.controller.stageController.pushScene('preferences-general');
				break;
				
			case 'ok':
				this.selected = true;
				this.picker.ok(this.selectedFolder);
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
FolderPickerAssistant.prototype.cleanup = function(event)
{
	if (!this.selected)
		this.picker.cancel();
}
