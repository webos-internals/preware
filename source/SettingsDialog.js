/*jslint sloppy: true */
/*global enyo, onyx, preware, $L, formatDate, convertStringToBool */
//shows a dialog that allows the user to change settings.

//TODO: check if these settings really have an effect... ;)
//TODO: AppMenu can open over this PopUp.. urgs.. :(

enyo.kind({
	name: "SettingsDialog",
	classes: "enyo-popup",
	//TODO: someone with more design skills than me should optimize that... :(
	style: "padding: 30px; width: 90%; height: 90%;",
	kind: "onyx.Popup",
	//kind: "enyo.Control",
	centered: true,
	modal: true,
	floating: true,
	autoDismiss: false,
	scrim: true,
	scrimWhenModal: false,
	components: [
		{kind: "enyo.Scroller", components: [
			{kind: "onyx.Groupbox", components: [
				{kind: "onyx.GroupboxHeader", content: $L("Startup")},
				{kind: "enyo.FittableColumns", components: [
					{tag: "div", content: $L("Update Feeds"), fit: true},
					{kind: "onyx.PickerDecorator", onSelect: "updatePolicySelected", components: [
						{},
						{kind: "onyx.Picker", name: "updatePolicyPicker", style: "width: 200px;", components: [
							{content: $L("Every Launch"), value: "launch", active: true},
							{content: $L("Once Daily"), value: "daily"},
							{content: $L("Manually Only"), value: "manual"},
							{content: $L("Ask At Launch"), value: "ask"}
						]}
					]}
				]},
				{kind: "enyo.FittableColumns", components: [
					{tag: "div", content: $L("Last Update"), fit: true},
					{king: "enyo.Control", tag: "div", name: "lastUpdateField", content: $L("Never") }
				]},
				{kind: "enyo.FittableColumns", components: [
					{tag: "div", content: $L("Scan unknown packages"), fit: true},
					{kind: "onyx.ToggleButton", name: "scanUnknownToggle", onChange: "scanUnknownChanged"}
				]},
				{kind: "enyo.FittableColumns", components: [
					{tag: "div", content: $L("Check .ipk association"), fit: true},
					{kind: "onyx.ToggleButton", name: "checkIPKAssociationToggle", onChange: "checkIPKAssociationChanged"}
				]}
			]}, //end of startup group
			{kind: "onyx.Groupbox", components: [
				{kind: "onyx.GroupboxHeader", content: $L("Actions")},
				{kind: "enyo.FittableColumns", components: [
					{tag: "div", content: $L("Use App Tuckerbox"), fit: true},
					{kind: "onyx.ToggleButton", name: "useTuckerboxToggle", onChange: "useTuckerboxChanged"}
				]},
				{kind: "enyo.FittableColumns", components: [
					{tag: "div", content: $L("Ignore device compat."), fit: true},
					{kind: "onyx.ToggleButton", name: "ignoreDeviceCompatToggle", onChange: "ignoreDeviceCompatChanged"}
				]}
			]}, //end of action group
			// we don't really do that on the 'main scene'. Maybe we will never.
			// {kind: "onyx.groupbox", components: [
				// {kind: "onyx.groupboxheader", content: $l("main scene")},
				// {kind: "enyo.fittablecolumns", components: [
					// {tag: "div", content: $l("show available types"), fit: true},
					// {kind:"onyx.togglebutton", onchange: "showavailabletypeschanged"}
				// ]}
			// ]}, //end of main scene group
			{kind: "onyx.Groupbox", components: [
				{kind: "onyx.GroupboxHeader", content: $L("Package display")}, //formerly list scene
				{kind: "enyo.FittableColumns", components: [
					{tag: "div", content: $L("Search Descriptions"), fit: true},
					{kind: "onyx.ToggleButton", name: "searchDescriptionsToggle", onChange: "searchDescriptionsChanged"}
				]},
				{kind: "enyo.FittableColumns", components: [
					{tag: "div", content: $L("Default sort"), fit: true},
					{kind: "onyx.PickerDecorator", onSelect: "sortPolicySelected", components: [
						{},
						{kind: "onyx.Picker", name: "sortPolicyPicker", style: "width: 200px;", components: [
							{content: $L("Category Default"), value: 'default', active: true},
							{content: $L("Alphabetically"), value: 'alpha'},
							{content: $L("Last Updated"), value: 'date'},
							{content: $L("Price"), value: 'price'}
						]}
					]}
				]},
				//we don't have a second row, right? Omitted that config.
				{kind: "enyo.FittableColumns", components: [
					{tag: "div", content: $L("Installed is available"), fit: true},
					{kind: "onyx.ToggleButton", name: "installedIsAvailableToggle", onChange: "installIsAvailableChanged"}
				]}
			]}, //end of list scene group
			{kind: "onyx.Button", style: "margin:5px;font-size:24px;float:center;", content: $L("Close"), ontap: "closePopup"}
		]}
	],
	create: function (inSender, inEvent) {
		this.inherited(arguments);
		this.updateValues();
	},
	updateValues: function () {
		var i, items, cookie = preware.PrefCookie.get();
		
		if (!cookie) {
			enyo.error("SettingsDialog#updateValues: Cookie was empty.");
			return;
		}
		
		//string => bool conversion in the following is necessary, because "false" evaluates to true in JS.
		
		//startup group values:
		items = this.$.updatePolicyPicker.getClientControls();
		for (i = 0; i < items.length; i += 1) {
			if (items[i].value === cookie.updateInterval) {
				this.$.updatePolicyPicker.setSelected(items[i]);
				break;
			}
		}
		if (cookie.lastUpdate) {
			this.$.lastUpdateField.content = formatDate(cookie.lastUpdate);
		}
		this.$.scanUnknownToggle.setValue(convertStringToBool(cookie.fixUnknown));
		this.$.checkIPKAssociationToggle.setValue(convertStringToBool(cookie.resourceHandlerCheck));
		
		//actions group values:
		this.$.useTuckerboxToggle.setValue(convertStringToBool(cookie.useTuckerbox));
		this.$.ignoreDeviceCompatToggle.setValue(convertStringToBool(cookie.ignoreDevices));
		
		//package display group values:
		this.$.searchDescriptionsToggle.setValue(convertStringToBool(cookie.searchDesc));
		items = this.$.sortPolicyPicker.getClientControls();
		for (i = 0; i < items.length; i += 1) {
			if (items[i].value === cookie.listSort) {
				this.$.sortPolicyPicker.setSelected(items[i]);
				break;
			}
		}
		this.$.installedIsAvailableToggle.setValue(convertStringToBool(cookie.listInstalled));
	},
	//handlers
	closePopup: function (inSender, inEvent) {
		this.hide();
	},
	updatePolicySelected: function (inSender, inEvent) {
		preware.PrefCookie.put("updateInterval", inEvent.selected.value);
	},
	scanUnknownChanged: function (inSender, inEvent) {
		preware.PrefCookie.put("fixUnknown", inEvent.value);
	},
	checkIPKAssociationChanged: function (inSender, inEvent) {
		preware.PrefCookie.put("resourceHandlerCheck", inEvent.value);
	},
	useTuckerboxChanged: function (inSender, inEvent) {
		preware.PrefCookie.put("useTuckerbox", inEvent.value);
	},
	ignoreDeviceCompatChanged: function (inSender, inEvent) {
		preware.PrefCookie.put("ignoreDevices", inEvent.value);
	},
	showAvailableTypesChanged: function (inSender, inEvent) {
		preware.PrefCookie.put("showAvailableTypes", inEvent.value);
	},
	searchDescriptionsChanged: function (inSender, inEvent) {
		preware.PrefCookie.put("searchDesc", inEvent.value);
	},
	sortPolicySelected: function (inSender, inEvent) {
		preware.PrefCookie.put("listSort", inEvent.selected.value);
	},
	installIsAvailableChanged: function (inSender, inEvent) {
		preware.PrefCookie.put("listInstalled", inEvent.value);
	}
});