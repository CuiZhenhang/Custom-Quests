/// <reference path="./Utils.js"/>
/** @type { packetHelper<[client: NetworkClient, T: {[key: string]: unknown}]> } */
const ServerPacket = new Utils.packetHelper()
/** @type { packetHelper<[T: {[key: string]: unknown}]> } */
const ClientPacket = new Utils.packetHelper()

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


//run on Server
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
Network.addServerPacket("CustomQuests.Server.changeData", function(client, T){
	if(T && T.list){
		T.list.forEach(function(v){
			if(v && v.key && v.times){
				try{
					var temp=Data;
					for(var i=0; i<v.times-1; i++) temp=temp[v.key[i]];
					temp[v.key[v.times-1]]=v.value;
				}catch(e){}
			}
		});
	}
});
Network.addServerPacket("CustomQuests.Server.setTeam", function(client, T){
	if(T && T.type){
		if(T.type == "create"){
			var temp_arr = [];
			if(!Data[T.team]){
				Data[T.team] = {member: {}, main: {}};
				temp_arr.push({key: [T.team], times: 1, value: Data[T.team]});
			}
			Data[T.team].member[client.getPlayerUid()] = true;
			Team[client.getPlayerUid()] = T.team;
			temp_arr.push({key: [T.team, "member", client.getPlayerUid()], times: 3, value: true});
			Network.sendToAllClients("CustomQuests.Client.changeData", {list: temp_arr});
		} else if(T.type == "exit"){
			if(Network.getConnectedPlayers().length < 2){
				client.send("CustomQuests.Client.eval", {
					name: "alert",
					text: ["$You can't quit the team."]
				});
				return;
			}
			Data[T.team].member[client.getPlayerUid()] = null;
			Team[client.getPlayerUid()] = null;
			var temp = true;
			for(var i in Data[T.team].member){
				if(Data[T.team].member[i]){
					temp = false;
					break;
				}
			}
			if(temp){
				Data[T.team] = null;
				Network.sendToAllClients("CustomQuests.Client.changeData", {list: [
					{key: [T.team], times: 1, value: null}
				]});
			} else {
				Network.sendToAllClients("CustomQuests.Client.changeData", {list: [
					{key: [T.team, "member", client.getPlayerUid()], times: 3, value: null}
				]});
			}
		} else if(T.type == "join"){
			var temp = false;
			for(var i in Data){
				if(Data[i] && Encrypt(i) == T.password){
					temp = true;
					Data[i].member[client.getPlayerUid()] = true;
					Team[client.getPlayerUid()] = i;
					Network.sendToAllClients("CustomQuests.Client.changeData", {list: [
						{key: [i, "member", client.getPlayerUid()], times: 3, value: true}
					]});
					break;
				}
			}
			client.send("CustomQuests.Client.eval", {
				name: "alert",
				text: [temp ? "$Succeed to join the team" : "$Fail to join the team"]
			});
		}
		Core.loadAllQuests(client.getPlayerUid());
	}
});

//run on Client
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
ServerPacket.addPacket("setLoaded", function(client, T){
	Loaded[client.getPlayerUid()] = true;
});
Network.addClientPacket("CustomQuests.Client.init", function(T){
	if(T && T.data && T.json){
		Data = T.data;
		RefreshLocalData();
		Editor.loadData_Local(T.json);
		Network.sendToServer("CustomQuests.Server.eval", {name: "setLoaded"});
	}
});
Network.addClientPacket("CustomQuests.Client.reload", function(T){
	if(T && T.json){
		Editor.loadData_Local(T.json);
		Network.sendToServer("CustomQuests.Server.call", {name: "Editor.loadAllQuests", params: ["$player"]});
	}
});
Network.addClientPacket("CustomQuests.Client.changeData", function(T){
	if(T && T.list){
		var changed = false;
		T.list.forEach(function(v){
			if(v && v.key && v.times){
				try{
					var temp=Data;
					for(var i=0; i<v.times-1; i++) temp=temp[v.key[i]];
					temp[v.key[v.times-1]]=v.value;
					changed = true;
				}catch(e){}
			}
		});
		if(changed) RefreshLocalData();
	}
});
Network.addClientPacket("CustomQuests.Client.refreshQuest", function(T){
	if(T && T.team == LocalData.team){
		if(T.source === QuestsUI_data.source && T.chapter === QuestsUI_data.chapter){
			System.chapter.set(T.source, T.chapter);
		}
	}
});
Network.addClientPacket("CustomQuests.Client.finishQuest", function(T){
	if(T && T.team == LocalData.team){
		if(System.showInfo[T.source]){
			var name = "";
			try{
				name = System.quest.get(T.source, T.chapter, T.quest).info.display_name;
			}catch(e){}
			Game.message("§e<CustomQuests>§r "+TranAPI.translate("Task completed: ")
				+"§a["+TranAPI.TAT(name, T.source, T.chapter, T.quest, "name")+"§a]");
		}
	}
});
