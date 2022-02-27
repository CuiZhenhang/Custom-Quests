/// <reference path="./api.js"/>
ClientPacket.addPacket("refreshChapter", function(T){
	if(LocalData.team == T.team && QuestsUI_data.source && QuestsUI_data.chapter){
		System.chapter.set(QuestsUI_data.source, QuestsUI_data.chapter);
	}
});
var Core = {
	quest: {},
	clearData: function(player){
		try{
			if(!Team[player]) return;
			Data[Team[player]].main = {};
			Network.sendToAllClients("CustomQuests.Client.changeData", {list: [
				{key: [Team[player], "main"], times: 2, value: Data[Team[player]].main}
			]});
			for(let source in Core.quest[Team[player]]){
				for(let chapter in Core.quest[Team[player]][source]){
					Core.quest[Team[player]][source][chapter].forEach(function(v){
						if(v.info && v.info.input){
							v.info.input.forEach(function(qv, qk){
								if(Core.isFinishedInput(source, chapter, v.name, qk, player)) return;
								System.quest.getInputType(qv.type, "onDelete")({
									source: source,
									chapter: chapter,
									quest: v.name
								}, qv, {
									key: qk,
									team: Team[player],
									cause: "Delete input"
								});
							});
						}
					});
				}
			}
			Network.sendToAllClients("CustomQuests.Client.eval", {
				name: "refreshChapter",
				team: Team[player]
			});
			delete Core.quest[Team[player]];
			Core.loadAllQuests(player);
		}catch(e){
			Logger.Log("<CustomQuests> Error in Core.clearData:\n"+e, "ERROR");
		}
	},
	loadAllQuests: function(player){
		if(!Team[player]) return;
		if(Core.quest[Team[player]]) return;
		Core.quest[Team[player]] = {};
		for(let load_source in System.data){
			if(System.data[load_source].chapter)
			for(let load_chapter in System.data[load_source].chapter){
				if(System.data[load_source].chapter[load_chapter]){
					System.data[load_source].chapter[load_chapter].quest.forEach(function(v, k){
						Core.loadQuests(load_source, load_chapter, v, player);
					});
				}
			}
		}
	},
	loadQuests: function(source, chapter, v, player){
		try{
			switch(v.type){
				case "quest":
					if(CheckDefined([v.name, v.x, v.y, v.size, v.icon], 5)) return;
					if(!Team[player]) return;
					if(Core.isFinished(source, chapter, v.name, player)) return;
					if(!Core.quest[Team[player]]) Core.quest[Team[player]] = {};
					
					if(System.quest.getFather(source, chapter, v.name).every(function(fv, fk){
						return Core.isFinished(fv[0], fv[1], fv[2], player);
					})){
						if(!Core.quest[Team[player]][source]) Core.quest[Team[player]][source] = {};
						if(!Core.quest[Team[player]][source][chapter]) Core.quest[Team[player]][source][chapter] = [];
						Core.quest[Team[player]][source][chapter].push(v);
						if(v.info && v.info.input){
							v.info.input.forEach(function(qv, qk){
								System.quest.getInputType(qv.type, "onCreate")({
									source: source,
									chapter: chapter,
									quest: v.name
								}, qv, {
									key: qk,
									team: Team[player]
								});
							});
						}
					}
				break;
			};
		}catch(e){
			alert("<CustomQuests> Error in Core.loadQuests:\n"+e);
			Logger.Log("<CustomQuests> Error in Core.loadQuests:\n"+e, "ERROR");
		}
	},
	refreshQuests: function(source, chapter, quest, player){
		if(!player){
			if(!LocalData.team) return;
			if(Core.isFinished(source, chapter, quest, null)) return;
			runOnClientThread(function(){
				Network.sendToServer("CustomQuests.Server.call", {
					name: "Core.refreshQuests",
					params: [source, chapter, quest, "$player"]
				});
			});
			return;
		}
		if(!Team[player]) return;
		if(Core.isFinished(source, chapter, quest, player)) return;
		try{
			if(Core.quest[Team[player]][source][chapter].some(function(v, k){
				return v.name == quest;
			})) return;
		}catch(e){}
		Core.loadQuests(source, chapter, System.quest.get(source, chapter, quest), player);
	},
	finish: function(source, chapter, quest, key, player){
		if(!player){
			if(!LocalData.team) return;
			runOnClientThread(function(){
				Network.sendToServer("CustomQuests.Server.call", {
					name: "Core.finish",
					params: [source, chapter, quest, key, "$player"]
				});
			});
			return;
		}
		try{
			if(!Team[player] || !Data[Team[player]]) return;
			if(Core.isFinishedInput(source, chapter, quest, key, player)) return;
			
			var json_quest = System.quest.get(source, chapter, quest);
			var input = json_quest.info.input[key];

			System.quest.getInputType(input.type, "onDelete")({
				source: source,
				chapter: chapter,
				quest: quest
			}, input, {
				key: key,
				team: Team[player],
				cause: "Finish input"
			});

			if(!Data[Team[player]].main) Data[Team[player]].main = {};
			var main = Data[Team[player]].main;
			if(!main[source]) main[source] = {};
			if(!main[source][chapter]) main[source][chapter] = {};
			if(!main[source][chapter][quest]) main[source][chapter][quest] = {input: [], output: []};
			main[source][chapter][quest].input[key] = true;

			Network.sendToAllClients("CustomQuests.Client.changeData", {list: [
				{key: [Team[player], "main"], times: 2, value: main}
			]});
			Network.sendToAllClients("CustomQuests.Client.refreshQuest", {
				team: Team[player], source: source, chapter: chapter, quest: quest
			});
			Callback.invokeCallback("CustomQuests.finishInput", source, chapter, quest, key, input, player);
			
			if(Core.isFinished(source, chapter, quest, player)){
				Core.quest[Team[player]][source][chapter].some(function(v, k, self){
					if(v.name == quest){
						self.splice(k, 1);
						return true;
					}
				});
				System.quest.getChild(source, chapter, quest).forEach(function(v, k){
					Core.loadQuests(v[0], v[1], System.quest.get(v[0], v[1], v[2]), player);
				});

				Network.sendToAllClients("CustomQuests.Client.finishQuest", {
					team: Team[player], source: source, chapter: chapter, quest: quest
				});
				Callback.invokeCallback("CustomQuests.finishQuest", source, chapter, quest, json_quest, player);
			}
		}catch(e){
			Logger.Log("<CustomQuests> Error in Core.finish:\n"+e, "ERROR");
		}
	},
	receive: function(source, chapter, quest, key, info, player){
		if(!player){
			if(!LocalData.team) return;
			runOnClientThread(function(){
				Network.sendToServer("CustomQuests.Server.call", {
					name: "Core.receive",
					params: [source, chapter, quest, key, info, "$player"]
				});
			});
			return;
		}
		try{
			if(!Team[player] || !Data[Team[player]]) return;
			if(!Core.isFinished(source, chapter, quest, player)) return;
			if(Core.isGotOutput(source, chapter, quest, key, player)) return;

			var output = System.quest.get(source, chapter, quest).info.output[key];

			System.quest.getOutputType(output.type, "onReceive")({
				source: source,
				chapter: chapter,
				quest: quest
			}, output, {
				key: key,
				player: player,
				info: info
			});

			Data[Team[player]].main[source][chapter][quest].output[key] = true;

			Network.sendToAllClients("CustomQuests.Client.changeData", {list: [
				{key: [Team[player], "main"], times: 2, value: Data[Team[player]].main}
			]});
			Network.sendToAllClients("CustomQuests.Client.refreshQuest", {
				team: Team[player], source: source, chapter: chapter, quest: quest
			});
			Callback.invokeCallback("CustomQuests.receiveOutput", source, chapter, quest, key, output, player);
		}catch(e){
			Logger.Log("<CustomQuests> Error in Core.reveive:\n"+e, "ERROR");
		}
	},
	fastReceive: function(source, chapter, quest, player){
		if(!player){
			if(!LocalData.team) return;
			runOnClientThread(function(){
				Network.sendToServer("CustomQuests.Server.call", {
					name: "Core.fastReceive",
					params: [source, chapter, quest,"$player"]
				});
			});
			return;
		}
		try{
			if(!Team[player] || !Data[Team[player]]) return;
			if(!Core.isFinished(source, chapter, quest, player)) return;
			if(Core.isGot(source, chapter, quest, player)) return;
			
			var json_quest = System.quest.get(source, chapter, quest);
			var changed = [];

			if(!json_quest.info) return;
			if(!Array.isArray(json_quest.info.output)) return;

			json_quest.info.output.forEach(function(output, key){
				if(Core.isGotOutput(source, chapter, quest, key, player)) return;

				if(!System.quest.getOutputType(output.type, "onFastReceive")({
					source: source,
					chapter: chapter,
					quest: quest
				}, output, {
					key: key,
					player: player
				})) return;

				Data[Team[player]].main[source][chapter][quest].output[key] = true;
				changed.push([key, output]);
			});

			if(!changed.length) return;
			Network.sendToAllClients("CustomQuests.Client.changeData", {list: [
				{key: [Team[player], "main"], times: 2, value: Data[Team[player]].main}
			]});
			Network.sendToAllClients("CustomQuests.Client.refreshQuest", {
				team: Team[player], source: source, chapter: chapter, quest: quest
			});
			changed.forEach(function([key, output]){
				Callback.invokeCallback("CustomQuests.receiveOutput", source, chapter, quest, key, output, player);
			});
		}catch(e){
			Logger.Log("<CustomQuests> Error in Core.fastReceive:\n"+e, "ERROR");
		}
	},
	isFinishedInput: function(source, chapter, quest, key, player){
		var team = player ? Team[player] : LocalData.team;
		try{
			if(Data[team].main[source][chapter][quest].input[key]) return true;
			return false;
		}catch(e){
			return false;
		}
	},
	isGotOutput: function(source, chapter, quest, key, player){
		var team = player ? Team[player] : LocalData.team;
		try{
			if(Data[team].main[source][chapter][quest].output[key]) return true;
			return false;
		}catch(e){
			return false;
		}
	},
	isFinished: function(source, chapter, quest, player){
		var team = player ? Team[player] : LocalData.team;
		var temp = false;
		try{
			Data[team].main[source][chapter][quest];
			if(System.quest.get(source, chapter, quest).info.input.every(function(v, k){
				return Core.isFinishedInput(source, chapter, quest, k, player);
			})) temp = true;
		}catch(e){}
		return temp;
	},
	isGot: function(source, chapter, quest, player){
		var team = player ? Team[player] : LocalData.team;
		var temp = false;
		try{
			Data[team].main[source][chapter][quest];
			if(System.quest.get(source, chapter, quest).info.output.every(function(v, k){
				return Core.isGotOutput(source, chapter, quest, k, player);
			})) temp = true;
		}catch(e){}
		return temp;
	},
	isLocked_Local: function(source, chapter, quest){
		if(Core.isFinished(source, chapter, quest)) return false;
		if(System.quest.getFather(source, chapter, quest).every(function(v, k){
			return Core.isFinished(v[0], v[1], v[2]);
		})) return false;
		else return true;
	},
	getInventory: function(player){
		var package = [];
		var actor = new PlayerActor(player);
		for(var i = 0; i < 36; i++){
			package[i] = actor.getInventorySlot(i);
		}
		return package;
	},
	getSortInventory: function(player, package){
		if(!package) package = Core.getInventory(player);
		var temp = {};
		package.forEach(function(v, k){
			if(v.id != 0){
				if(temp[v.id+":"+v.data]){
					if(v.data != -1) temp[v.id+":-1"] += v.count;
					temp[v.id+":"+v.data] += v.count;
				} else {
					temp[v.id+":-1"] = v.count;
					temp[v.id+":"+v.data] = v.count;
				}
			}
		});
		return temp;
	},
	getExtraInventory: function(player, package){
		if(!package) package = Core.getInventory(player);
		var temp = {};
		package.forEach(function(v, k){
			if(v.extra && !v.extra.isEmpty()){
				if(temp[v.id+":"+v.data]){
					if(v.data != -1) temp[v.id+":-1"].push(v);
					temp[v.id+":"+v.data].push(v);
				} else {
					temp[v.id+":-1"] = [v];
					temp[v.id+":"+v.data] = [v];
				}
			}
		});
		return temp;
	},
	getTeam: function(player){
		if(player) return Team[player];
		return LocalData.team;
	},
	getPlayerForTeam: function(team){
		var temp = {};
		let playerList = Network.getConnectedPlayers();
		for(let i=playerList.length-1; i>=0; i--){
			if(Team[playerList[i]] == team){
				temp[playerList[i]] = true;
			}
		}
		return temp;
	}
};


Callback.addCallback("ServerPlayerLoaded", function(Uid){
	Updatable.addUpdatable({
		timer: 0,
		update: function(){
			this.timer++;
			if(Loaded[Uid]){
				Core.loadAllQuests(Uid);
				Network.getClientForPlayer(Uid).send("CustomQuests.Client.eval", {
					name: "message",
					text: ["§e<CustomQuests>§r ", "$CustomQuests.dialog"]
				});
				this.remove = true;
			} else if(this.timer >= 200){
				Network.getClientForPlayer(Uid).send("CustomQuests.Client.eval", {
					name: "message",
					text: ["§e<CustomQuests>§r ", "$Connection Timeout"]
				});
				this.remove = true;
			}
		}
	});
});

Callback.addCallback("ServerPlayerLeft", function(Uid){
	delete Loaded[Uid];
});

Callback.addCallback("ServerPlayerTick", function(Uid){
	if(Math.random()<1/10 && Core.quest && Team[Uid] && Core.quest[Team[Uid]]){
		try{
			var base_package = Core.getInventory(Uid);
			var package = Core.getSortInventory(Uid, base_package);
			var extra_package = Core.getExtraInventory(Uid, base_package);
			for(let source in Core.quest[Team[Uid]]){
				for(let chapter in Core.quest[Team[Uid]][source]){
					Core.quest[Team[Uid]][source][chapter].forEach(function(v){
						if(v.info && v.info.input){
							v.info.input.forEach(function(qv, qk){
								if(Core.isFinishedInput(source, chapter, v.name, qk, Uid)) return;
								System.quest.getInputType(qv.type, "onTick")({
									source: source,
									chapter: chapter,
									quest: v.name
								}, qv, {
									key: qk,
									player: Uid,
									package: package,
									extra_package: extra_package
								});
							});
						}
					});
				}
			}
		}catch(e){
			alert("<CustomQuests> Error in ServerPlayerTick Callback:\n"+e);
			Logger.Log("<CustomQuests> Error in ServerPlayerTick Callback:\n"+e, "ERROR");
		}
	}
});
