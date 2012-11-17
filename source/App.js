// Preware App kind and main window.

enyo.kind({
	name: "App",
  //fit: true,
  kind: enyo.Control,
  //layoutKind: "FittableRowsLayout",
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
    {kind: "Panels", //draggable: false, wrap: false, 
          //narrowFit: true, fit: true, 
         // arrangerKind: "CollapsingArranger", 
          classes: "app-panels", 
         components: [
      { name: "MyStartPanel", content: "start" },
      { name: "MyStartPanel1", content: "start1" },
      { name: "MyStartPanel2", content: "start2" },
      {kind: "enyo.Scroller", fit: true, components: [
        { tag: "div", name: "tweetList" }
      ]}
    ]}
	],
  
  addTweet: function(inResult) {
    this.createComponent({
      kind: Tweet,
      container: this.$.tweetList,
      icon: inResult.profile_image_url,
      handle: inResult.from_user,
      text: inResult.text
    });
  },

  search: function() {
    var searchTerm = this.$.searchTerm.hasNode().value;
    var request = new enyo.JsonpRequest({
      url: "http://search.twitter.com/search.json",
      callbackName: "callback"
    });
    
    request.response(enyo.bind(this, "processSearchResults"));
    request.go({ q: searchTerm });
  },

  searchOnEnter: function(inSender, inEvent) {
    if (inEvent.keyCode === 13) {
      this.search();
      return true;
    }
  },

  processSearchResults: function(inRequest, inResponse) {
    if (!inResponse) {
      return;
    }
    this.$.tweetList.destroyClientControls();
    enyo.forEach(inResponse.results, this.addTweet, this);
    this.$.tweetList.render();
  }
});
