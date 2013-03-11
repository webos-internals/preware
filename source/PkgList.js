/*global enyo */

enyo.kind({
	name: "preware.PkgList",
	kind: enyo.FittableRows,
	classes: "onyx enyo-fit",
	components: [
		//gui components...
		//currently no "titleElement"...
		{ name: "pkgList", fit: true, kind: "enyo.List",
			multiSelect: false, classes: "enyo-fit list", onSetupItem: "setupItem", 
			ontap: "listTapped",
			components: [
			{name: "item", classes: "enyo-border-box list-item", components: [
				{name: "description" }
			]}
		]}
	],
	item: {},
	active: false,
	packages: [],
	listModel: {items: []},
	groupMenu: false,
	searchTimer: false,
	searching: false,
	searchText: "",
	currentSort: "",
	multiButton: "",
	create: function() {
		this.inherited(arguments);
				
		// load stayawake class
		this.stayAwake = new stayAwake();
	},
	doShow: function(item, searchText, currentSort) {
		this.item = item;
		this.searchText = searchText;
		
		//set sorting:
		if (currentSort) {
			this.currentSort = currentSort;
		} else {
			var pref = preware.PrefCookie.get().listSort;
			if (pref === "alpha" || pref === "date" || pref === "price") {
				this.currentSort = pref;
			} else { //"default" or empty
				if ((this.item.pkgList === 'installed')  || (this.item.pkgList === 'saved')) {
					this.currentSort = 'alpha';
				} else if((this.item.pkgCat === 'all') ||
					 ((this.item.pkgFeed !== 'all') && (this.item.pkgFeed !== ''))) {
					this.currentSort = 'date';
				} else {
					this.currentSort = 'alpha';
				}
			}
		}
		
		//TODO: think about multibutton.. how to do that in enyo2?
		//initial multibutton option
		this.multiButton = (packages.stagedPkgs === false ? '' : 'multi');
		
		//TODO: menu has to go, too..
		// setup menu
		this.menuModel = {
			visible: true,
			items:
			[
				{
					label: $L("Preferences"),
					command: 'do-prefs'
				},
				{
					label: $L("Update Feeds"),
					command: 'do-update'
				},
				{
					label: $L("Manage Feeds"),
					command: 'do-feeds'
				},
				{
					label: $L("Luna Manager"),
					command: 'do-luna'
				},
				{
					label: $L("Help"),
					command: 'do-help'
				}
			]
		};

		// clear log so it only shows stuff from this scene
		preware.IPKGService.logClear();
	}
});
