*STUFF RIPPED FROM webos-ports-lib THAT WAS NOT IN webos-lib*

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

A variant of the PortsHeader that contains an animated, expandable search bar. onSearch is fired based on the 'instant' member variable. If true, it will fire every time the text is changed, otherwise it will fire when the user presses enter or the field loses focus after modification. Setting the 'submitCloses' variable to true will close the search box in this situation.

**Example:**

     {kind: "PortsSearch",
     title: "SearchyFooApp",
     instant: false,
     submitCloses: true,
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
     
##ProgressOrb

A circular variant of the onyx progress bar with an button in the center. Uses an enyo.Animator for smooth transitions between values.
Published properties are value, min and max.
This is an enyo2 reimagining of the progress indicator from the webOS 2.x Browser.

**Example:**

     {name: "FooOrb",
     kind: "ProgressOrb",
     style: "position: absolute; right: 8px; bottom: 8px;",
     content: "O",
     onButtonTap: "buttonTapped"},
     buttonTapped: function(inSender, inEvent) {
	this.$.FooOrb.setValue(this.$.FooOrb.value + 100);
     },

##CrossAppUI

Ported from the non-published set of Enyo 1 APIs to Enyo2, CrossAppUI takes a 'path' parameter (the HTML file to open) and displays it inside your application.
The child application can pass stringified JSON prefixed with 'enyoCrossAppResult=' up to the CrossAppUI via the 'message' event (window scope). CrossAppUI will strip off the prefix, parse it into an object and fire onResult. This is intended to be used as a base class for app-in-app kinds, such as FilePicker (see below).

NOTE: Under webOS 3.x, this will only work with certain palm applications such as FilePicker and System Updates. Awaiting confirmation for Open webOS.

**message Event Example:**
     "enyoCrossAppResult={\"result\":[{\"fullPath\":\"/path/to/selected/file.foo\",\"iconPath\":\"/var/luna/extractfs//path/to/selected/file.foo:0:0:\",\"attachmentType\":\"image\",\"dbId\":\"++ILuOICkjNDQaUP\"}]}"

**Corresponding onResult Output:**
     {"fullPath":"/path/to/selected/file.foo","iconPath":"/var/luna/extractfs//path/to/selected/file.foo:0:0:","attachmentType":"image","dbId":"++ILuOICkjNDQaUP"}

**Example:**

     {kind:"CrossAppUI", style: "width: 100%; height: 100%;", path: "/path/to/app/html.html", onResult: "handleResult"}

##FilePicker

Ported across from Enyo 1, this is a CrossAppUI kind that points to the built-in webOS filepicker. The onPickFile event is called when the file is chosen.

**onPickFile Output:**
     {"fullPath":"/path/to/selected/file.foo","iconPath":"/var/luna/extractfs//path/to/selected/file.foo:0:0:","attachmentType":"image","dbId":"++ILuOICkjNDQaUP"}

**Example:**
     {name: "ImagePicker", kind: "FilePicker", fileType:["image"], onPickFile: "selectedImageFile"}
