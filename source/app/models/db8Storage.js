function db8Storage(){
	this.domain = "org.webosinternals.preware";
	this.kinds = [
		{
			"kindID": this.domain + ".justType:1",
			"indices": [
				{"name": "display", "props": [
					{"name": "display", "type":"single", "tokenize": "all", "collate": "primary"}
				]}

				//{"name": "secondary", "props": [{"name": "secondary", "type":"single"}]},
				//{"name": "id", "props": [{"name": "id", "type":"single"}]}
			]
		}
	]
	this.putKinds();
	this.setupJustType();
}
db8Storage.prototype.putKinds = function(){
	/*new Mojo.Service.Request("palm://com.palm.db/", {
			method: "delKind",
			parameters: { 
				"id":this.kinds[0].kindID	
			},
			onSuccess: function() { 
				Mojo.Log.info("delKind success!");	
			},
			onFailure: function(e) { 
				Mojo.Log.error("delKind failure! Err = " + JSON.stringify(e));
			}
	});*/
	for(var i = 0; i < this.kinds.length; i++){
		new Mojo.Service.Request("palm://com.palm.db/", {
			method: "putKind",
			parameters: { 
				"id":this.kinds[i].kindID, 
				"owner":this.domain,
				"indexes": this.kinds[i].indices
			},
			onSuccess: function() { 
				Mojo.Log.info("putKind success!");	
			},
			onFailure: function(e) { 
				Mojo.Log.error("putKind failure! Err = " + JSON.stringify(e));
			}
		});
	}
}
db8Storage.prototype.setupJustType = function(){
	var permObj = [{"type":"db.kind","object":this.domain +".justType:1", "caller":"com.palm.launcher", "operations":{"read":"allow"}}];
	new Mojo.Service.Request("palm://com.palm.db/", {
			method: "putPermissions",
			parameters: {"permissions":permObj},
			onSuccess: function() { Mojo.Log.info("DB permission granted successfully!");},
			onFailure: function() { Mojo.Log.error("DB failed to grant permissions!");}
	});
}

db8Storage.prototype.putArray = function(array){
	new Mojo.Service.Request("palm://com.palm.db/", {
		method: "put",
		parameters: { 
			"objects": array
		},
		onSuccess: function() { 
			Mojo.Log.info("Put success!");	
		}.bind(this),
		onFailure: function(e) { 
			Mojo.Log.error("Put failure! Err = " + JSON.stringify(e));
		}
	});
};

db8Storage.prototype.deleteAll = function(callback){
	new Mojo.Service.Request("palm://com.palm.db/", {
		method: "del",
		parameters: { 
			"query": {from: this.domain + ".justType:1"}
		},
		onSuccess: function() { 
			Mojo.Log.info("Delete success!");
			if (callback)
				callback();
		},
		onFailure: function(e) { 
			Mojo.Log.error("Delete failure! Err = " + JSON.stringify(e));
		}
	});
};