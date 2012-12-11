// Preware App kind and main window.
/*global enyo */

enyo.kind({
	name: "preware.App",
  //fit: true,
  kind: enyo.Control,
  layoutKind: "FittableRowsLayout",
  classes: "onyx", 
	components:[
    //initialize preware toolbare with preware in it and a search field + button.
     {kind: "onyx.MoreToolbar", components: [
       {content: "Preware" },
       {kind: "onyx.InputDecorator", style: "position:absolute; right:0px", components: [
         {kind: "onyx.Input", name: "searchTerm", placeholder: "Search packet", onkeydown: "searchOnEnter"},
         {kind: "Image", src: "assets/search-input-search.png", ontap: "search"}
       ]}
     ]},
    //want to have Panels that are "cards" on phones (<800px width) and sliding stuff otherwise.
    {kind: "Panels", draggable: true, wrap: false, 
          narrowFit: true, fit: true, 
          arrangerKind: "CollapsingArranger", 
          classes: "app-panels", 
         components: [
         { content: "placeholder panel" }
    ]}
	]
});
