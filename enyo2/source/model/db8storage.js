/*global enyo */

enyo.kind({
	name: "DbService"
	//TODO: see how to get that over from enyo1 / old webos to open webos or if this is already..
});

var preware2Domain = "org.webosinternals.preware2";

//TODO: uncomment this.$.XYZ.call lines if DbService is implemented..
enyo.singleton({
	name: "preware.db8Storage",
	kinds: [ {
							//id is set in DbService kind.
						 owner: preware2Domain,
						 indexes: [
							 { name: "display", props: [ {name: "display", type: "single", tokenize: "all", collate: "primary"}] }
						 ] } ],
	components: [
		{kind: "DbService", dbKind: preware2Domain + ".justType:1", onFailure: "dbFailure", onSuccess: "dbSuccess", components: [
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
		var permObj = [{"type":"db.kind","object":preware2Domain +".justType:1", "caller":"com.palm.launcher", "operations":{"read":"allow"}}];
		//this.$.putPermission.call({permissions: permObj});
	},
	putArray: function(array) {
		this.$.putData.call({objects: array});
	},
	deleteAll: function(callback) {
		//this.$.deleteAllData.call({query: {from: preware2Domain + ".justType:1"}});
		//TODO: remove this, if DbService is implemented!!!
		enyo.error("db8storage.deleteAll is only a stub.");
		this.callback = callback;
	},
	deleteAllSuccess: function(inSender, inResponse) {
		enyo.log("Delete all success.");
		if (this.callback) {
			this.callback({success: true});
		}
	},
	deleteAllFailure: function(inSender, inError, inRequest) {
		enyo.error("delete all failure: ", inError);
		if (this.callback) {
			this.callback({success: false});
		}
	},
	dbSuccess: function(inSender, inRequest) {
		enyo.log("DB8 operation " + JSON.stringify(inRequest) + " success.");
	},
	dbFailure: function(inSender, inError, inRequest) {
		enyo.error("db8Failure: ", inError);
	}
});
