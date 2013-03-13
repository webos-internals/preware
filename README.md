Summary
=======
Preware is a webOS on-device homebrew installer. 

Preware in enyo 2
=========

First step is to convert needed stuff from preware/app/model to enyo. The status is as follows:

Working:
- prefs cookie should be working (tested in browser)
- basic IPKGService communictation (version, device id, tested on TouchPad)

Implemented (but untested):
- more complex IPKGService communication
- deviceProfile.js
- feeds.js
- palmProfile.js
- help.js

only Partly-Implemented:
- db8storage (used for just type)
- packageModel.js (renamed from package.js)
- filePicker.js (does some Mojo stuff to display stuff.. need to replace that)

not implemented at all:
- packages.js
- resourceHandler.js
- stayAwake.js
- utility.js (will cause crashes in packageModel.js!)

On the GUI side there is not much there, now... just some buttons to test and some ugly log output.
App.js tries to load feeds like update-assistant does..
