/// <reference path="./translation.js"/>
/// <reference path="../lib/ChargeItem.js"/>
/// <reference path="../lib/Base64.js"/>

IMPORT("ChargeItem");
IMPORT("Base64");

var Color = android.graphics.Color;
var Book = {}, Data = {}, Team = {}, Loaded = {}, EditorList = {};
var LocalData = {team: null};
var Setting = {
	UIsize: __config__.getNumber("setting.UIsize").floatValue(),
	padding: __config__.getNumber("setting.padding").floatValue(),
	path: __config__.getString("save.path"),
	dev: __config__.getBool("save.dev"),
	enableEditing: __config__.getBool("server.enableEditing")
};

;(function(){
	if(!(Setting.UIsize%1 == 0 && 0 <= Setting.UIsize && Setting.UIsize <= 2)){
		Setting.UIsize = 1;
		__config__.set("setting.UIsize", 1);
		__config__.save();
	}
	var temp_change = false;
	if(typeof(Setting.padding) != "number"){
		Setting.padding = 60;
		temp_change = true;
	} else if(Setting.padding < 20){
		Setting.padding = 20;
		temp_change = true;
	} else if(Setting.padding > 200){
		Setting.padding = 200;
		temp_change = true;
	}
	if(temp_change){
		__config__.set("setting.padding", Setting.padding);
		__config__.save();
	}
})();
Saver.addSavesScope("CustomQuests",
	function read(scope){
		if(!scope) return;
		if(scope.data) Data = scope.data;
		if(scope.book) Book = scope.book;
		if(scope.editorlist) EditorList = scope.editorlist;
	},
	function save(){
		return {
			book: Book,
			data: Data,
			editorlist: EditorList
		};
	}
);


//function
var Encrypt = new Base64().encode;

var GetUuid = function(){
	return ("xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx").replace(/[xy]/g, function(c){
		var r = Math.random() * 16 | 0,
			v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	})+"_";
};

var CheckDefined = function(arr, length){
	for(var i = 0; i < length; i++){
		if(arr[i] === void 0){
			return true;
		}
	}
	return false;
};

var TransferId = function(id, onServer){
	if(!id) return 0;
	if(typeof(id) == "number"){
		return onServer ? id : Network.serverToLocalId(id);
	} else try{
		return eval(id);
	}catch(e){
		return 0;
	}
};

var TransferItem = function(item, onServer){
	if(typeof item != "object") return {};
	var temp_item = {
		id: TransferId(item.id, onServer),
		count: item.count || 1,
		data: item.data || 0,
		extra: null
	};
	if(item.extra){
		temp_item.extra = new ItemExtraData();
		item.extra.forEach(function(v, k){
			if(!v.type) return;
			switch(v.type){
				case "Name":
					temp_item.extra.setCustomName(v.value);
				break;
				case "Enchant":
					temp_item.extra.addEnchant(eval(v.key), v.value);
				break;
				case "Energy":
					ChargeItemRegistry.setEnergyStored(temp_item, v.value);
				break;
				default: 
					if(temp_item.extra["put"+v.type]){
						temp_item.extra["put"+v.type](v.key, v.value);
					}
			}
		});
	}
	return temp_item;
};

var DeTransferId = function(id){return ""};
var DeTransferItem = function(item){return {}};
;(function(){
	var DeId = {};
	Callback.addCallback("PostLoaded", function(){
		new java.lang.Thread(new java.lang.Runnable({
			run: function(){
				for(let name in VanillaItemID) DeId[VanillaItemID[name]] = "VanillaItemID." + name;
				for(let name in VanillaBlockID) DeId[VanillaBlockID[name]] = "VanillaBlockID." + name;
				for(let name in ItemID) DeId[ItemID[name]] = "ItemID." + name;
				for(let name in BlockID) DeId[BlockID[name]] = "BlockID." + name;
			}
		})).start();
	});
	DeTransferId = function(id){
		return DeId[id] || String(id);
	};
	DeTransferItem = function(item){
		if(typeof item != "object") return {};
		var temp_item = {
			id: DeTransferId(item.id),
			count: item.count,
			data: item.data,
			extra: null
		}
		if(item.extra && !item.extra.isEmpty()){
			temp_item.extra = [];
			alert("custom name: " + item.extra.getCustomName());

			var enchants = item.extra.getEnchants();
			for(let id in enchants){
				temp_item.extra.push({
					type: "Enchant",
					key: Number(id),
					value: enchants[id]
				});
			}

			var energyType = ChargeItemRegistry.getItemData(item.id).energy;
			var energy = ChargeItemRegistry.getEnergyStored(item, energyType);
			if(energy){
				temp_item.extra.push({
					type: "Energy",
					value: energy
				});
			}
		}
		return temp_item;
	}
})();


var Logic = function(a, operator, b){
	switch(operator){
		case "=": return a==b;
		case "==": return a==b;
		case "<": return a<b;
		case ">": return a>b;
		case "<=": return a<=b;
		case ">=": return a>=b;
		case "!=": return a!=b;
		default: return false;
	}
};

var CheckExtraItem = function(item, extra){
	var temp = true;
	if(extra && item.extra && !item.extra.isEmpty()){
		extra.forEach(function(v){
			if(!temp) return;
			switch(v.type){
				case "Name":
					if(item.extra.getCustomName() != v.value){
						temp = false;
					}
				break;
				case "Enchant":
					if(!Logic(item.extra.getEnchantLevel(v.key), v.operator, v.value)){
						temp = false;
					}
				break;
				case "Energy":
					if(!Logic(item.extra.getInt("energy"), v.operator, v.value)){
						temp = false;
					}
				break;
				default:
					if(item.extra["get"+v.type]){
						if(!Logic(item.extra["get"+v.type](v.key || null), v.operator, v.value)){
							temp = false;
						}
					}
			}
		});
		return temp;
	} else return false;
};

ServerPacket.addPacket("setTeam", function(client, T){
	Team[client.getPlayerUid()] = T.team;
});
var RefreshLocalData = function(){
	var temp = {};
	for(var i in Data){
		if(Data[i] && Data[i].member && Data[i].member[Player.get()]){
			temp.team = i;
		}
	}
	if(temp.team != LocalData.team){
		LocalData.team = temp.team;
		Network.sendToServer("CustomQuests.Server.eval", {
			name: "setTeam",
			team: LocalData.team
		});
		var elem = QuestsUI.team.getContent().elements;
		if(LocalData.team){
			elem["ui_text"].text = TranAPI.translate("You are on this team: ")+LocalData.team;
			elem["ui_text_0"].text = TranAPI.translate("Quit the team");
			elem["ui_text_1"].text = TranAPI.translate("Invitation Password");
		} else {
			elem["ui_text"].text = TranAPI.translate("You didn't join any team.");
			elem["ui_text_0"].text = TranAPI.translate("Create a team");
			elem["ui_text_1"].text = TranAPI.translate("Join a team");
		}
	}
};

var ReadPath = function(path){
	try{
		if(FileTools.isExists(path+"contents.json")){
			var json = FileTools.ReadJSON(path+"contents.json");
			if(json.main){
				json.main.forEach(function(v_chapter, k_chapter){
					if(typeof(v_chapter) == "string"){
						json.main[k_chapter] = FileTools.ReadJSON(path+v_chapter) || {};
					}
					if(json.main[k_chapter].quest){
						json.main[k_chapter].quest.forEach(function(v_quest, k_quest){
							if(typeof(v_quest) == "string"){
								json.main[k_chapter].quest[k_quest] = FileTools.ReadJSON(path+v_quest) || {};
							}
						});
					}
				});
				return json;
			} else return {};
		} else if(FileTools.isExists(path+"CustomQuests.json")){
			var json = FileTools.ReadJSON(path+"CustomQuests.json");
			if(json.main) return json;
			else return {};
		} else {
			alert("<CustomQuests> Failed to ReadPath:\nThere is no files: "+path);
			Logger.Log("<CustomQuests> Failed to ReadPath:\nThere is no files: "+path, "WARN");
		}
	}catch(e){
		alert("<CustomQuests> Error in ReadPath:\n"+e);
		Logger.Log("<CustomQuests> Error in ReadPath:\n"+e, "ERROR");
		return {};
	}
};

var PreCalc = function(jsonMain){};
;(function(){
	var Graph = function(){
		this.num_node = 0, this.map = {}, this.value = [0];
		this.num_edge = 0, this.to = [0], this.dis = [0], this.next = [0], this.head = [0];
		this.queue = {
			head: 0, tail: 0, value: [],
			push: function(value){this.value[this.tail++] = value},
			pop: function(){return this.value[this.head++]},
			empty: function(){return this.head == this.tail}
		};
		
		this.getNode = function(value){
			if(!this.map[value]) this.map[value] = ++this.num_node;
			return this.map[value];
		};
		this.addEdge = function(from, to, dis){
			from = this.getNode(from);
			to = this.getNode(to);
			this.num_edge++;
			this.to[this.num_edge] = to;
			this.dis[this.num_edge] = dis;
			this.next[this.num_edge] = this.head[from];
			this.head[from] = this.num_edge;
		};
		this.setValue = function(node, dis){
			node = this.getNode(node);
			this.value[node] = dis;
			this.queue.push(node);
		};
		this.getValue = function(node){
			return this.value[this.getNode(node)];
		};
		this.bfs = function(){
			var u,v;
			while(!this.queue.empty()){
				u = this.queue.pop();
				for(var i = this.head[u]; i; i = this.next[i]){
					v = this.to[i];
					this.value[v] = this.value[u] + this.dis[i];
					this.queue.push(v);
				}
			}
		};
	};
	var checkXYSize = function(param){
		if(typeof param == "number") return true;
		if(!Array.isArray(param)) return false;
		if(typeof param[0] != "string") return false;
		if(typeof param[1] != "number") return false;
		return true;
	};

	PreCalc = function(jsonMain){
		if(typeof jsonMain != "object") return;
		if(!Array.isArray(jsonMain.main)){
			jsonMain.main = [];
			return;
		}
		jsonMain.main = jsonMain.main.filter(function(jsonChapter){
			if(typeof jsonChapter != "object") return false;
			if(typeof jsonChapter.name != "string") return false;
			if(typeof jsonChapter.icon != "object") return false;
			if(!Array.isArray(jsonChapter.quest)) return false;
			
			var graph = {x: new Graph(), y: new Graph(), size: new Graph()};
			jsonChapter.quest = jsonChapter.quest.filter(function(jsonQuest){
				if(typeof jsonQuest != "object") return false;
				if(typeof jsonQuest.name != "string") return false;
				switch(jsonQuest.type){
					case "quest":
						if(!checkXYSize(jsonQuest.x)) return false;
						if(!checkXYSize(jsonQuest.y)) return false;
						if(!checkXYSize(jsonQuest.size)) return false;
						if(typeof jsonQuest.icon != "object") return false;
						
						if(typeof jsonQuest.x == "number") graph.x.setValue(jsonQuest.name, jsonQuest.x);
						else graph.x.addEdge(jsonQuest.x[0], jsonQuest.name, jsonQuest.x[1]);
						if(typeof jsonQuest.y == "number") graph.y.setValue(jsonQuest.name, jsonQuest.y);
						else graph.y.addEdge(jsonQuest.y[0], jsonQuest.name, jsonQuest.y[1]);
						if(typeof jsonQuest.size == "number") graph.size.setValue(jsonQuest.name, jsonQuest.size);
						else graph.size.addEdge(jsonQuest.size[0], jsonQuest.name, jsonQuest.size[1]);

						if(typeof jsonQuest.tag != "object") jsonQuest.tag = {};
						jsonQuest.tag.x = jsonQuest.x;
						jsonQuest.tag.y = jsonQuest.y;
						jsonQuest.tag.z = jsonQuest.z;
					break;
					case "custom":
						if(typeof jsonQuest.value != "object") return false;
					break;
					default: return false;
				}
				return true;
			});
			graph.x.bfs();
			graph.y.bfs();
			graph.size.bfs();
			jsonChapter.quest.forEach(function(jsonQuest){
				if(jsonQuest.type != "quest") return;
				jsonQuest.x = graph.x.getValue(jsonQuest.name) || 0;
				jsonQuest.y = graph.y.getValue(jsonQuest.name) || 0;
				jsonQuest.size = graph.size.getValue(jsonQuest.name) || 0;
			});
			delete graph.x;
			delete graph.y;
			delete graph.size;
			return true;
		});
	};
})();

var Debounce = function(func, wait, func2, ths){
	if(typeof func != "function") return func;
	if(typeof wait != "number" || isNaN(wait)) return func;
	var time = 0;

	return function(){
		if(new Date() >= time){
			time = Number(new Date()) + wait*50;
			return func.apply(ths, arguments);
		} else {
			time = Number(new Date()) + wait*50;
			if(typeof func2 == "function") return func2.apply(ths, arguments);
		}
	};
};

var HaveKeys = function(obj, keys){
	if(typeof obj != "object") return false;
	if(!Array.isArray(keys)) return false;
	return keys.some(function(key){
		return obj[key] !== void 0;
	});
};
