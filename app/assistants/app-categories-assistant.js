function AppCategoriesAssistant(item)
{
	this.item = item;
	this.categoryModel = {items:[]};
}

AppCategoriesAssistant.prototype.setup = function()
{
	// build category model
	for (var c = 0; c < packages.categories.length; c++) 
	{
		this.categoryModel.items.push(
		{
			name: packages.categories[c].name,
			count: packages.categories[c].count
		});
	}
	
	// setup list widget
	this.controller.setupWidget('categoryList', { itemTemplate: "app-categories/rowTemplate", swipeToDelete: false, reorderable: false }, this.categoryModel);
	Mojo.Event.listen(this.controller.get('categoryList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
}

AppCategoriesAssistant.prototype.listTapHandler = function(event)
{
	this.controller.stageController.pushScene('app-list', {list: 'category', category: event.item.name, name: "WebOS Applications"});
}


AppCategoriesAssistant.prototype.activate = function(event) {}

AppCategoriesAssistant.prototype.deactivate = function(event) {}

AppCategoriesAssistant.prototype.cleanup = function(event)
{
	// clean up our listeners
	Mojo.Event.stopListening(this.controller.get('categoryList'), Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
}
