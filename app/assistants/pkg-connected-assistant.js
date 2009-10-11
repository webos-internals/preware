function PkgConnectedAssistant(type, pkg, pkgs)
{
	this.type = type;
	this.pkg =  pkg;
	this.pkgs = pkgs;
	
	this.listModel = {items:[]};
}

PkgConnectedAssistant.prototype.setup = function()
{
	// hide this by default
	this.controller.get('pkgSingle').style.display = 'none';
	
	// set title
	if (this.type == 'install')		this.controller.get('listTitle').innerHTML = 'Packages That This Need';
	else if (this.type == 'remove') this.controller.get('listTitle').innerHTML = 'Packages That Need This';
	
	// load single
	this.loadSingle();
	
	// setup list attributes
	this.listAttributes = 
	{
		itemTemplate: "pkg-connected/rowTemplate",
		swipeToDelete: false,
		reorderable: false,
		onItemRendered: this.itemRendered.bind(this)
	};
	
	// load packages
	this.loadList();
	
	// setup list widget
	this.controller.setupWidget('pkgList', this.listAttributes, this.listModel);
}

PkgConnectedAssistant.prototype.loadSingle = function()
{
	if (this.pkg) 
	{
		var pkgForList = this.pkg.getForList();
		var html = Mojo.View.render({object: pkgForList, template: 'pkg-connected/pkgTemplate'});
		this.controller.get('pkgSingle').innerHTML = html;
		this.pkg.iconFill(this.controller.get('icon-' + pkgForList.pkgNum));
		
		this.controller.get('pkgSingle').style.display = '';
		this.controller.get('pkgSpacer').style.height = '118px';
		this.controller.get('topFade').style.top = '115px';
	}
}

PkgConnectedAssistant.prototype.loadList = function()
{
	this.listModel.items = [];
	
	if (this.pkgs.length > 0)
	{
		for (var p = 0; p < this.pkgs.length; p++)
		{
			this.listModel.items.push(packages.packages[this.pkgs[p]].getForList());
		}
	}
}

PkgConnectedAssistant.prototype.itemRendered = function(listWidget, itemModel, itemNode)
{
	packages.packages[itemModel.pkgNum].iconFill(this.controller.get('icon-' + itemModel.pkgNum));
}

PkgConnectedAssistant.prototype.activate = function(event) {}
PkgConnectedAssistant.prototype.deactivate = function(event) {}
PkgConnectedAssistant.prototype.cleanup = function(event) {}
