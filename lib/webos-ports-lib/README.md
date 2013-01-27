#webos-ports-lib

*A selection of additional enyo2 kinds to aid development for Open webOS*

##PortsHeader

An onyx.Toolbar that displays the app icon, a custom title and an optional random tagline.

**Example:**

     {kind: "PortsHeader",
     title: "FooApp",
     taglines: [
          "My foo-st app",
          "Banana boat.",
          "Fweeeeeeep. F'tang."
     ]}

##PortsSearch

A variant of the PortsHeader that contains an animated, expandable search bar. onSearch is fired every time the field receives input, passing it's contents through via inEvent.value.

**Example:**

     {kind: "PortsSearch",
     title: "SearchyFooApp",
     taglines: [
          "My foo-st app",
          "Banana boat.",
          "Fweeeeeeep. F'tang."
     ],
     onSearch: "searchFieldChanged"}
     
##CoreNavi

An in-app gesture area that can be used for debugging. Emulates the Open webOS back gesture by default, set fingerTracking to true in order to emulate the new Finger Tracking API events. Only shows itself on non-palm platforms, so it's safe to ship with your app.

     //KeyUp-based Gesture
     components: [
     	{kind: "Signals", onkeyup: "handleKeyUp"},
     	{kind: "CoreNavi", fingerTracking: false}
     ],
     handleKeyUp: function(inSender, inEvent) {
	if(inEvent.keyIdentifier == "U+1200001") {
		//Do Stuff
	}
     }
     
     //Finger Tracking API
     components: [
     	{kind: "Signals",
	onCoreNaviDragStart: "handleCoreNaviDragStart",
	onCoreNaviDrag: "handleCoreNaviDrag",
	onCoreNaviDragFinish: "handleCoreNaviDragFinish"}
     	{kind: "Panels",
     	arrangerKind: "CarouselArranger",
     	components:[
     		{content: "Foo"},
     		{content: "Bar"},
     		{content: "DecafIsBad"},
     	]},
     	{kind: "CoreNavi", fingerTracking: true}
     ],
     handleCoreNaviDragStart: function(inSender, inEvent) {
     	this.$.CoreNaviPanels.dragstartTransition(inEvent);
     },
     handleCoreNaviDrag: function(inSender, inEvent) {
     	this.$.CoreNaviPanels.dragTransition(inEvent);
     },
     handleCoreNaviDragFinish: function(inSender, inEvent) {
     	this.$.CoreNaviPanels.dragfinishTransition(inEvent);
     },
	

**Example:** 

##BackGesture

A function that listens for the webOS Back Gesture and fires the onbackbutton signal. Both 2.x and Open webOS are supported, as well as phonegap and the Esc key on desktop browsers.

**Example:**

     {kind: "enyo.Signals", onbackbutton: "handleBackGesture"}
