	/* *** Type Conditions ***
	 * launch			// can be launched by luna, makes the button appear in the view scene
	 * update			// can be updated (installed over the top of the old version) this also makes the button appear in the view scene
	 * updateAsReplace	// is updated by removing then reinstalling
	 * showScreenshots	// may have screenshots that should be displayed, for view scene
	 * showDependents	// may have dependent packages that should be displayed, for view scene
	 */
/*global enyo */

enyo.singleton({
	name: "preware.typeConditions",
	// major types
	Application:
	{
		launch: true,
		update: true,
		showScreenshots: true,
		showDependents: true
	},
	Service:
	{
		update: true,
		showDependents: true
	},
	Plugin:
	{
		update: true,
		showDependents: true
	},
	Kernel:
	{
		update: true,
		updateAsReplace: true,
		showDependents: true
	},
	"Kernel Module":
	{
		update: true,
		updateAsReplace: true,
		showDependents: true
	},
	Patch:
	{
		update: true,
		updateAsReplace: true,
		showScreenshots: true,
		showDependents: true
	},
	Font:
	{
		update: true,
		updateAsReplace: true,
		showScreenshots: true,
		showDependents: true
	},
	Theme:
	{
		update: true,
		updateAsReplace: true,
		showScreenshots: true
	},
	
	// secondary types
	Feed:
	{
		update: true
	},
	Optware:
	{
		update: true,
		showDependents: true
	},
	'Linux Application':
	{
		update: true,
		showDependents: true
	},
	'Linux Daemon':
	{
		update: true,
		showDependents: true
	},
	'System Utilities':
	{
		update: true,
		showDependents: true
	},
	'OS Application':
	{
		update: true,
		updateAsReplace: true,
		showDependents: true
	},
	'OS Daemon':
	{
		update: true,
		updateAsReplace: true,
		showDependents: true
	},
	// unknown (used by actual unknown type, and any other type without values)
	'Unknown': {},
	// package (used by manual single-file installer)
	'Package': {}
});
