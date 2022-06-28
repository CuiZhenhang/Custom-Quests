/// <reference path="./Utils.js"/>

ServerPacket.addPacket("setTeam", function(client, T){
	Team[client.getPlayerUid()] = T.team;
});
ClientPacket.addPacket("message", function(T){
	if(!Array.isArray(T.text)) return;
	let msg = "";
	T.text.forEach(function(str){
		if(str[0] == "$") str = TranAPI.translate(str.replace("$", ""));
		msg += str;
	});
	Game.message(msg);
});
ClientPacket.addPacket("alert", function(T){
	if(!Array.isArray(T.text)) return;
	let msg = "";
	T.text.forEach(function(str){
		if(str[0] == "$") str = TranAPI.translate(str.replace("$", ""));
		msg += str;
	});
	alert(msg);
});


Network.addServerPacket("CustomQuests.Server.eval", function(client, T){
	ServerPacket.callPacket(T.name, [client, T]);
});
Network.addServerPacket("CustomQuests.Server.call", function(client, T){
	if(!T.name || !T.params) return;
	var arr = T.name.split("."), base = {};
	switch(arr[0]){
		case "System": base = System; break;
		case "Core": base = Core; break;
		case "Editor": base = Editor; break;
		default: return;
	}
	for(var i = 1; i < arr.length-1; i++){
		base = base[arr[i]];
		if(!base) return;
	}
	var func = base[arr[arr.length-1]]; 
	if(typeof func != "function") return;
	T.params.forEach(function(v, k, self){if(v == "$player") self[k] = client.getPlayerUid()});
	func.apply(base, T.params);
});


Network.addClientPacket("CustomQuests.Client.eval", function(T){
	ClientPacket.callPacket(T.name, [T]);
});
Network.addClientPacket("CustomQuests.Client.call", function(T){
	if(!T.name || !T.params) return;
	var arr = T.name.split("."), base = {};
	switch(arr[0]){
		case "System": base = System; break;
		case "Core": base = Core; break;
		case "Editor": base = Editor; break;
		default: return;
	}
	for(var i = 1; i < arr.length-1; i++){
		base = base[arr[i]];
		if(!base) return;
	}
	var func = base[arr[arr.length-1]]; 
	if(typeof func != "function") return;
	func.apply(base, T.params);
});
