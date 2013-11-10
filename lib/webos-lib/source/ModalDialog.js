enyo.kind({
	name: "enyo.ModalDialog",
	kind: onyx.Popup,
	modal: true,
	autoDismiss: false,
	openAtCenter: function() {
		this.setCentered(true);
		
		this.show();
	}
});