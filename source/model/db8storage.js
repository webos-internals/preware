/*global enyo */

enyo.kind({
  name: "DbService"
  //TODO: see how to get that over from enyo1 / old webos to open webos or if this is already..
});

//TODO: uncomment this.$.XYZ.call lines if DbService is implemented..
enyo.singleton({
  name: "preware.db8Storage",
  domain: "org.webosinternals.preware2",
  events: {
    onDeleteAllFinished: "" //will set inEvent.success to false or true.
  },
  kinds: [ {
              //id is set in DbService kind.
             owner: this.domain,
             indexes: [
               { name: "display", props: [ {name: "display", type: "single", tokenize: "all", collate: "primary"}] }
             ] } ],
  components: [
    {kind: "DbService", dbKind: this.domain + ".justType:1", onFailure: "dbFailure", onSuccess: "dbSuccess", components: [
      {name: "putOneKind", method: "putKind"},
      {name: "putPermission", method: "putPermissions"},
      {name: "putData", method: "put"},
      {name: "deleteAllData", method: "del", onSuccess: "deleteAllSuccess", onFailure: "deleteAllFailure"}
    ]}
  ],
  create: function() {
    this.inherited(arguments);
    
    this.putKinds();
    this.setupJustType();
  },
  putKinds: function() {
    var i;
    for (i = 0; i < this.kinds.length; i += 1) {
      //this.$.putOneKind.call(this.kinds[i]);
    }
  },
  setupJustType: function() {
    var permObj = [{"type":"db.kind","object":this.domain +".justType:1", "caller":"com.palm.launcher", "operations":{"read":"allow"}}];
    //this.$.putPermission.call({permissions: permObj});
  },
  putArray: function(array) {
    this.$.putData.call({objects: array});
  },
  deleteAll: function() {
    //this.$.deleteAllData.call({query: {from: this.domain + ".justType:1"}});
    //TODO: remove this, if DbService is implemented!!!
    enyo.error("faking delete all success!");
    this.doDeleteAll({success: false});
  },
  deleteAllSuccess: function() {
    enyo.log("Delete all success.");
    this.doDeleteAll({success: true});
  },
  deleteAllFailure: function(inSender, inError, inRequest) {
    enyo.error("delete all failure: ", inError);
    this.doDeleteAll({success: false});
  },
  dbSuccess: function(inSender, inRequest) {
    enyo.log("DB8 operation " + JSON.stringify(inRequest) + " success.");
  },
  dbFailure: function(inSender, inError, inRequest) {
    enyo.error("db8Failure: ", inError);
  }
});
