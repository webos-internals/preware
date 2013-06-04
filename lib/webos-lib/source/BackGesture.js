/**
	
	Add an event listener for keyup to document to listen for the custom "U+1200001" key on OwOS,
	"Back" key on webOS 2.x or for the ESC key on other platforms and call onbackbutton
	to be compatible with PhoneGap.

	When handling the onbackbutton event, inEvent.stopPropagation() and/or inEvent.preventDefault()
	are supported to stop the default behavior.
	
*/

(function() {
	enyo.dispatcher.listen(document, 'keyup', function(ev) {
		if (ev.keyCode == 27 || ev.keyIdentifier == "U+1200001"
				|| ev.keyIdentifier == "U+001B" || ev.keyIdentifier == "Back") {
			enyo.Signals.send('onbackbutton', ev);
		}
	});
})();
