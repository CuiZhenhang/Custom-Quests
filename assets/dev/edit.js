/// <reference path="./core.js"/>
IDRegistry.genItemID("quest_book_editor");
Item.createItem("quest_book_editor", "Quests Editor Book", {name: "quest_book_editor"}, {stack: 1, isTech: true});
Item.registerUseFunction("quest_book_editor", function(coords, item, block, player){
	if(EditorList[player]) System.openForPlayer(player, "Default", true);
	else Network.getClientForPlayer(player).send("CustomQuests.Client.eval", {
		name: "alert",
		text: ["$You are not an editor!"]
	});
});


Callback.addCallback("ServerPlayerLoaded", function(Uid){
	Updatable.addUpdatable({
		timer: 0,
		update: function(){
			this.timer++;
			if(Loaded[Uid]){
				Editor.setEditor(Uid, EditorList[Uid]);
				this.remove = true;
			} else if(this.timer >= 200){
				this.remove = true;
			}
		}
	});
});

ClientPacket.addPacket("setEditor.enabled", function(T){
	Editor.enabled = Boolean(T.enabled);
});
Callback.addCallback("ServerPlayerTick", function(Uid){
	if(Math.random() >= 1/10) return;
	try{
		var temp = false;
		if(EditorList[Uid] && Entity.getCarriedItem(Uid).id == ItemID.quest_book_editor) temp = true;
		Network.getClientForPlayer(Uid).send("CustomQuests.Client.eval", {
			name: "setEditor.enabled",
			enabled: temp
		});
	}catch(e){
		alert("<CustomQuests> Error in ServerPlayerTick Callback:\n"+e);
		Logger.Log("<CustomQuests> Error in ServerPlayerTick Callback:\n"+e, "ERROR");
	}
});

Callback.addCallback("LocalTick", function(){
	if(Editor.ability && Player.getCarriedItem().id == ItemID.quest_book_editor){
		if(!Editor.enabled) Editor.enabled = true;
	} else if(Editor.enabled) Editor.enabled = false;
});


ClientPacket.addPacket("setEditor.ability", function(T){
	T.enabled = Boolean(T.enabled);
	Editor.ability = T.enabled;
	Item.setGlint(ItemID.quest_book_editor, T.enabled);
});
var Editor = {
	ability: false, enabled: false,
	data: {}, link: {},
	init: function(){
		if(!Editor.data.main) return;
		Editor.link = {};
		Editor.data.main.forEach(function(v_chapter, k_chapter, main){
			Editor.link[v_chapter.name] = {
				data: main[k_chapter],
				quest: {}
			};
			if(!main[k_chapter].quest) return;
			main[k_chapter].quest.forEach(function(v_quest, k_quest){
				Editor.link[v_chapter.name].quest[v_quest.name] = main[k_chapter].quest[k_quest];
			});
		});
	},
	save: function(develop){
		var suffix = ".json";
		var path = __dir__+Setting.path;
		var deleteDir = function(pth){
			if(!FileTools.isExists(pth)) return;
			var files = FileTools.GetListOfFiles(pth, suffix);
			for(var i in files) files[i].delete();
			files = FileTools.GetListOfDirs(pth);
			for(var i in files){
				if(files[i].isDirectory()){
					deleteDir(files[i].getPath());
				}
			}
		}
		deleteDir(path);
		if(!FileTools.isExists(path)) FileTools.mkdir(path);
		if(develop){
			var contents = {main: [], info: Editor.data.info};
			if(Editor.data.main) Editor.data.main.forEach(function(v_chapter, k_chapter){
				var path_chapter = "main/chapter"+String(k_chapter+1);
				var json_chapter = {
					name: v_chapter.name,
					display_name: v_chapter.display_name,
					icon: v_chapter.icon,
					quest: []
				};
				FileTools.mkdir(path+path_chapter);
				if(v_chapter.quest) v_chapter.quest.forEach(function(v_quest, k_quest){
					var path_quest = "/quest"+String(k_quest+1)+suffix;
					json_chapter.quest[k_quest] = path_chapter+path_quest;
					FileTools.WriteJSON(path+path_chapter+path_quest, v_quest, true);
				});
				contents.main[k_chapter] = path_chapter+suffix;
				FileTools.WriteJSON(path+path_chapter+suffix, json_chapter, true);
			});
			FileTools.WriteJSON(path+"contents"+suffix, contents, true);
		}
		FileTools.WriteJSON(path+"CustomQuests"+suffix, Editor.data);
	},
	loadData_Local: function(data){
		System.deleteSource("Default");
		System.addSource("Default", data, true);
		Editor.data = JSON.parse(JSON.stringify(data));
		Editor.init();
	},
	loadData: function(data){
		if(!Setting.enableEditing) return;
		
		Editor.data = data;
		Editor.save(Setting.dev);
		for(let team in Core.quest){
			if(typeof Core.quest[team]["Default"] != "object") continue;
			let player, playerList = Core.getPlayerForTeam(team);
			for(let i in playerList){
				if(playerList[i]){
					player = Number(i);
					break;
				}
			}
			if(!player) continue;
			for(let chapter in Core.quest[team]["Default"]){
				Core.quest[team]["Default"][chapter].forEach(function(v){
					if(v.info && v.info.input){
						v.info.input.forEach(function(qv, qk){
							if(Core.isFinishedInput("Default", chapter, v.name, qk, player)) return;
							System.quest.getInputType(qv.type, "onDelete")({
								source: "Default",
								chapter: chapter,
								quest: v.name
							}, qv, {
								key: qk,
								team: team,
								cause: "Reload Data"
							});
						});
					}
				});
			}
			delete Core.quest[team]["Default"];
		}
		DataJson = JSON.parse(JSON.stringify(data));
		System.deleteSource("Default", true);
		System.addSource("Default", JSON.parse(JSON.stringify(DataJson)), true);
		Network.sendToAllClients("CustomQuests.Client.reload", {json: data});
	},
	loadAllQuests: function(player){
		if(!Team[player]) return;
		if(typeof Core.quest[Team[player]] != "object") Core.quest[Team[player]] = {};
		if(Core.quest[Team[player]]["Default"]) return;
		Core.quest[Team[player]]["Default"] = {};
		if(System.data["Default"].chapter){
			for(let load_chapter in System.data["Default"].chapter){
				if(System.data["Default"].chapter[load_chapter]){
					System.data["Default"].chapter[load_chapter].quest.forEach(function(v, k){
						Core.loadQuests("Default", load_chapter, v, player);
					});
				}
			}
		}
	},
	setEditor: function(player, enabled){
		enabled = Boolean(enabled);
		if(enabled && !EditorList[player]){
			new PlayerActor(player).addItemToInventory(ItemID.quest_book_editor, 1, 0, null, true);
		}
		EditorList[player] = enabled;
		Network.getClientForPlayer(player).send("CustomQuests.Client.eval", {
			name: "setEditor.ability",
			enabled: enabled
		});
	},
	ui: {
		type: {},
		addType: function(type, func){
			if(typeof func != "function") return;
			this.type[type] = func;
		},
		getType: function(type){
			return this.type[type] || function(){};
		},
		newEditorUI: function(params){
			if(!params) return;
			var editorUI = new UI.Window({
				location: {x: 0, y: 0, width: 1000, height: UI.getScreenHeight(), scrollY: 0},
				drawing: [
					{type: "background", color: Color.parseColor("#AAAAAA")},
					{type: "frame", x: 0, y: 0, width: 1000, height: 80, bitmap: "frame", scale: 4},
					{type: "text", text: TranAPI.translate("Editor"), x: 40, y: 50, font: {size: 20, color: Color.BLACK}},
				],
				elements: {
					"close": {type: "button", x: 940, y: 20, bitmap: "X", bitmap2: "XPress", scale: 40/19, clicker: {
						onClick: Debounce(function(){ editorUI.close() }, 10)}},
					"save": {type: "button", x: 920-22*40/16, y: 20, bitmap: "finished", scale: 40/16, clicker: { 
						onClick: Debounce(function(){
								Dialog({
									title: TranAPI.translate("Warn"),
									text: TranAPI.translate("Are you sure to reload data?")
								}, function(){
									runOnClientThread(function(){
										Network.sendToServer("CustomQuests.Server.call", {
											name: "Editor.loadData",
											params: [Editor.data]
										});
									});
								});
							}, 200, function(){ alert(TranAPI.translate("Requests are much too frequent, you can do it again after 10 seconds.")) })}}
				}
			});
			editorUI.setCloseOnBackPressed(true);
			editorUI.setEventListener({onClose: function(){ editorUI = null; }});
			var draw = editorUI.getContent().drawing;
			var elem = editorUI.getContent().elements;
			var height = 90;
			var tot_height = 90;
			var uuid = GetUuid();

			params.forEach(function(param, index){
				if(!param) return;
				let isArray = Array.isArray(param.main);

				draw.push({
					type: "frame", bitmap: "frame_edit_head", scale: 2,
					x: 0, y: height, width: 1000, height: 40, index: index
				});
				elem[uuid+"text_"+index] = {
					type: "text", font: {color: (param.color == void 0) ? Color.BLACK : param.color, size: 24},
					text: TranAPI.TAT(param.text), y: height+8, keep: true,
					x: 20 + (isArray ? 50 : 0) + (param.must ? 0 : 50)
				};
				if(!param.must) elem[uuid+"delete_"+index] = {
					type: "button", x: 25 + (isArray ? 50 : 0), y: height+5,
					bitmap: "delete", scale: 30/20, keep: true, clicker: {
						onClick: Debounce(function(){
							Dialog({
								title: TranAPI.translate("Are you sure to delete it?"),
								text: TranAPI.translate("This operation is irreversible!")
							}, function(){
								param.onDelete(elem, uuid+"elem_"+index+"_");
							});
						}, 10) }
				};

				if(typeof param.getGui == "function"){
					param.getGui({
						index: index,
						x: 0,
						y: height,
						name: uuid+"elem_"+index+"_",
						elem: elem
					}, param);
				}

				if(isArray){
					var h = height+40;
					var opened = false;
					var iheight = 40*param.main.length;

					draw.push({
						type: "frame", bitmap: "frame_edit", scale: 2,
						x: 1000, y: h, width: 1000, height: iheight, index: index, iframe: true
					});
					
					elem[uuid+"button_"+index] = {
						type: "button",  x: 25, y: height+5, bitmap: "arrow_edit_0",
						scale: 30/40, keep: true, clicker: { onClick: Debounce(function(){
							if(opened){
								opened = false;
								elem[uuid+"button_"+index].bitmap = "arrow_edit_0";
								draw.forEach(function(v, k){
									if(!v) return;
									if((v.index || 0) > index) draw[k].y -= iheight;
									if(v.index === index && v.iframe) v.x = 1000;
								});
								for(var i in elem){
									if(!elem[i]) continue;
									var k = Number(i.split("_")[2]);
									if(k === index){
										if(!elem[i].keep) elem[i].x += 1000;
									} else if(k > index) elem[i].y -= iheight;
								}
								height -= iheight;
							} else {
								opened = true;
								elem[uuid+"button_"+index].bitmap = "arrow_edit_1";
								draw.forEach(function(v, k){
									if(!v) return;
									if((v.index || 0) > index) draw[k].y += iheight;
									if(v.index === index && v.iframe) v.x = 0;
								});
								for(var i in elem){
									if(!elem[i]) continue;
									var k = Number(i.split("_")[2]);
									if(k === index){
										if(!elem[i].keep) elem[i].x -= 1000;
									} else if(k > index) elem[i].y += iheight;
								}
								height += iheight;
							}
						}, 10)}
					};
					param.main.forEach(function(v, k){
						elem[uuid+"text_"+index+"_"+k] = {
							type: "text", text: TranAPI.TAT(v.text), x: 1020 + (v.must ? 0 : 50), y: h+40*k+10,
							font: {color: (v.color == void 0) ? Color.BLACK : v.color, size: 20}
						};
						if(!v.must) elem[uuid+"delete_"+index+"_"+k] = {
							type: "button", x: 1025, y: h+40*k+5, bitmap: "delete", scale: 30/20, clicker: { 
								onClick: Debounce(function(){
									if(typeof v.onDelete != "function") return;
									Dialog({
										title: TranAPI.translate("Are you sure to delete it?"),
										text: TranAPI.translate("This operation is irreversible!")
									}, function(){
										v.onDelete(elem, uuid+"elem_"+index+"_"+k+"_");
									});
								}, 10) }
						};
						if(typeof v.getGui == "function") v.getGui({
							index: index,
							key: k,
							x: 1000,
							y: h+40*k,
							name: uuid+"elem_"+index+"_"+k+"_",
							elem: elem
						}, v);
					});
					tot_height += iheight;
				}

				height += 43;
				tot_height += 43;
			});
			editorUI.getLocation().scrollY = Math.max(tot_height, UI.getScreenHeight());
			return editorUI;
		},
		getEditorUI: function(params, value){
			if(typeof params != "object") return;
			var arr = [];
			for(let i in params){
				let obj = {};
				this.getType(params[i].type)(params[i], obj, value, i, true);
				obj.text = (params[i].name === void 0) ? i : params[i].name;
				obj.color = params[i].must ? Color.BLACK : Color.GRAY;
				obj.must = params[i].must;
				arr.push(obj);
			}
			var ui = this.newEditorUI(arr);
			QuestsUI.questUI.close();
			ui.open();
			return ui;
		},
		getItem: function(func){
			if(typeof func != "function") return;
			var elem = QuestsUI.packageUI.getContent().elements;
			QuestsUI.packageUI.open();
			elem["function"].func = Debounce(function(index){
				var item = Player.getInventorySlot(index);
				Dialog({
					title: TranAPI.translate("Are you sure to choose this item?"),
					text: Item.getName(item.id, item.data) + "\n"
						+ TranAPI.translate("id: ") + item.id + "\n"
						+ TranAPI.translate("data: ") + item.data + "\n"
						+ TranAPI.translate("count: ") + item.count
				}, function(){
					QuestsUI.packageUI.close();
					func(item);
				});
			}, 10);
		},
		getSelectionUI: function(params, title){
			if(typeof params != "object") return;
			var elem = QuestsUI.selectionUI.getContent().elements;
			var loca = QuestsUI.selectionUI.getLocation();
			var height = 150;
			var uuid = GetUuid();

			QuestsUI.selectionUI.close();
			QuestsUI.newElements.selectionUI.forEach(function(v){elem[v] = null});
			QuestsUI.newElements.selectionUI = [];
			RefreshGUI(QuestsUI.selectionUI, 0);

			for(let i in params){
				if(typeof params[i] != "object") continue;
				QuestsUI.newElements.selectionUI.push(uuid+i+"_button", uuid+i+"_text");
				let func = params[i].func;
				elem[uuid+i+"_button"] = {
					type: "button", x: 0, y: height, z: 1, bitmap: "button_source", scale: 10, clicker: {
					onClick: Debounce(function(){
						if(func()) return;
						QuestsUI.selectionUI.close();
					}, 10)}
				};
				elem[uuid+i+"_text"] = {
					type: "text", text: params[i].text, x: 500, y: height+20, z: 2,
					font: {color: Color.BLACK, size: 80, align: 1}
				};
				height += 200;
			}

			QuestsUI.selectionUI.getContent().drawing[2].text = title || TranAPI.translate("Selection");
			height *= 400/1000;
			loca.scrollY = height;
			loca.height = Math.min(UI.getScreenHeight(), height);
			loca.y = (UI.getScreenHeight()-height)/2;
			RefreshGUI(QuestsUI.selectionUI, 1);
			QuestsUI.questUI.close();
			QuestsUI.selectionUI.open();
		}
	},
	create: function(){
		if(!Editor.ability){
			alert(TranAPI.translate("You are not an editor!"));
			return;
		}
		if(!Editor.enabled){
			alert(TranAPI.translate("Editor mode isn't enabled!"));
			return;
		}
		Editor.ui.getSelectionUI({
			"editSource": {text: TranAPI.translate("Edit source"), func: function(){
				if(QuestsUI_data.source != "Default"){
					alert(TranAPI.translate("You can only edit the source 'Default'"));
					return true;
				}
				Editor.editSource();
			}},
			"addChapter": {text: TranAPI.translate("Create chapter"), func: function(){
				if(QuestsUI_data.source != "Default"){
					alert(TranAPI.translate("You can only edit the source 'Default'"));
					return true;
				}
				GetInput({
					title: TranAPI.translate("Type in the name of the new chapter")
				}, function(keyword){
					if(!keyword) alert(TranAPI.translate("Failed: Please do not enter nothing."));
					else if(Editor.link[keyword]) alert(TranAPI.translate("Failed: The chapter already exists."));
					else Editor.addChapter(keyword);
				});
			}},
			"addQuest": {text: TranAPI.translate("Create quest"), func: function(){
				if(QuestsUI_data.source != "Default"){
					alert(TranAPI.translate("You can only edit the source 'Default'"));
					return true;
				}
				if(!QuestsUI_data.chapter || !Editor.link[QuestsUI_data.chapter]){
					alert(TranAPI.translate("Please select a chapter first."));
					return true;
				}
				GetInput({
					title: TranAPI.translate("Type in the name of the new quest")
				}, function(keyword){
					if(!keyword) alert(TranAPI.translate("Failed: Please do not enter nothing."));
					else if(Editor.link[QuestsUI_data.chapter].quest[keyword]) alert(TranAPI.translate("Failed: The quest already exists."));
					else Editor.addQuest(QuestsUI_data.chapter, keyword);
				});
			}}
		});
	},
	editSource: function(){
		if(!Editor.enabled) return;
		if(typeof Editor.data.info != "object") Editor.data.info = {};
		Editor.ui.getEditorUI({
			"display_name": {type: "text", must: true, name: TranAPI.translate("editor.source.display_name")},
			"background": {type: "string", name: TranAPI.translate("editor.source.background")}
		}, Editor.data.info);
	},
	addChapter: function(chapter){
		if(!Editor.enabled) return;
		if(!Array.isArray(Editor.data.main)) Editor.data.main = [];
		var len = Editor.data.main.push({
			name: chapter,
			display_name: {},
			icon: {},
			quest: []
		});
		Editor.link[chapter] = {data: Editor.data.main[len-1], quest: {}};
		Editor.editChapter(chapter);
	},
	editChapter: function(chapter){
		if(!Editor.enabled) return;
		if(!Editor.link[chapter]) return;
		Editor.ui.getEditorUI({
			"name": {type: "invalid", must: true, name: "name: "+chapter},
			"display_name": {type: "text", must: true, name: TranAPI.translate("editor.chapter.display_name")},
			"icon": {type: "icon", must: true, name: TranAPI.translate("editor.cahpter.icon")}
		}, Editor.link[chapter].data);
	},
	deleteChapter: function(chapter){
		if(!Editor.enabled) return;
		if(!Editor.link[chapter]) return;
		Editor.link[chapter] = null;
		if(!Array.isArray(Editor.data.main)) return;
		var index = Editor.data.main.findIndex(function(v){
			return v.name == chapter;
		});
		if(index == -1) return;
		Editor.data.main.splice(index, 1);
	},
	addQuest: function(chapter, quest){
		if(!Editor.enabled) return;
		if(!Editor.link[chapter]) return;
		if(typeof Editor.link[chapter].quest != "object") Editor.link[chapter].quest = {};
		if(!Array.isArray(Editor.link[chapter].data.quest)) Editor.link[chapter].data.quest = [];
		var len = Editor.link[chapter].data.quest.push({
			type: "quest",
			name: quest,
			x: 0, y: 0, size: 50,
			father: [],
			icon: {},
			hidden: false,
			info: {
				display_name: {},
				text: {},
				input: [],
				output: []
			}
		});
		Editor.link[chapter].quest[quest] = Editor.link[chapter].data.quest[len-1];
		Editor.editQuest(chapter, quest);
	},
	editQuest: function(chapter, quest){
		if(!Editor.enabled) return;
		if(!Editor.link[chapter] || !Editor.link[chapter].quest[quest]) return;
		if(Editor.link[chapter].quest[quest].type == "custom"){
			Editor.ui.getEditorUI({
				"name": {type: "invalid", must: true, name: "name: "+quest},
				"value": {type: "string", must: true, name: TranAPI.translate("editor.quest.value")}
			}, Editor.link[chapter].quest[quest]);
			return;
		}
		Editor.ui.getEditorUI({
			"name": {type: "invalid", must: true, name: "name: "+quest},
			"x": {type: "number", must: true, min: 0, max: 1000, name: TranAPI.translate("editor.quest.x")},
			"y": {type: "number", must: true, min: 0, max: 1000*9/16, name: TranAPI.translate("editor.quest.y")},
			"size": {type: "number", must: true, min: 0, max: 1000*9/16, name: TranAPI.translate("editor.quest.size")},
			"father": {type: "father", must: true, name: TranAPI.translate("editor.quest.father")},
			"icon": {type: "icon", must: true, name: TranAPI.translate("editor.quest.icon")},
			"icon_locked": {type: "icon", name: TranAPI.translate("editor.quest.icon_locked")},
			"icon_finished": {type: "icon", name: TranAPI.translate("editor.quest.icon_finished")},
			"hidden": {type: "boolean", name: TranAPI.translate("editor.quest.hidden")},
			"info": {type: "quest_info", must: true, name: TranAPI.translate("editor.quest.info")}
		}, Editor.link[chapter].quest[quest]);
	},
	deleteQuest: function(chapter, quest){
		if(!Editor.enabled) return;
		if(!Editor.link[chapter] || !Editor.link[chapter].quest[quest]) return;
		Editor.link[chapter].quest[quest] = null;
		if(!Array.isArray(Editor.link[chapter].data.quest)) return;
		var index = Editor.link[chapter].data.quest.findIndex(function(v){
			return v.name == quest;
		});
		if(index == -1) return;
		Editor.link[chapter].data.quest.splice(index, 1);
	}
};


Editor.ui.addType("boolean", function(param, target, value, key, keep){
	if(param.must && typeof value[key] != "boolean") value[key] = false;
	target.getGui = function({index, x, y, name, elem}){
		elem[name+"button"] = {
			type: "button", x: x+890, y: y+4, scale: 2, keep: keep,
			bitmap: value[key] ? "default_switch_on" : "default_switch_off",
			bitmap2: value[key] ? "default_switch_on_hover" : "default_switch_off_hover",
			clicker: {
				onClick: Debounce(function(){
					value[key] = !value[key];
					elem[name+"button"].bitmap = value[key] ? "default_switch_on" : "default_switch_off";
					elem[name+"button"].bitmap2 = value[key] ? "default_switch_on_hover" : "default_switch_off_hover";
				}, 10)}
		};
	};
	target.onDelete = function(elem, name){
		value[key] = false;
		elem[name+"button"].bitmap = "default_switch_off";
		elem[name+"button"].bitmap = "default_switch_off_hover";
	};
});

Editor.ui.addType("string", function(param, target, value, key, keep){
	if(param.must && typeof value[key] != "string") value[key] = "";
	target.getGui = function({index, x, y, name, elem}){
		elem[name+"text"] = {
			type: "text", x: x+880, y: y+10, text: value[key] || TranAPI.translate("undefined"),
			font: {color: Color.BLACK, size: 20, align: 2}, keep: keep
		};
		elem[name+"button"] = {
			type: "slot", x: x+900, y: y, size: 40, bitmap: "clear", keep: keep,
			source: {id: VanillaItemID.feather, count: 1}, clicker: {
				onClick: Debounce(function(){
					GetInput({
						hint: value[key] || TranAPI.translate("undefined"),
						text: value[key],
						title: TranAPI.translate("Please enter string:")
					}, function(keyword){
						value[key] = keyword;
						elem[name+"text"].text = keyword;
					});
				}, 10)
			}
		};
	};
	target.onDelete = function(elem, name){
		value[key] = void 0;
		elem[name+"text"].text = TranAPI.translate("undefined");
	};
});

Editor.ui.addType("number", function(param, target, value, key, keep){
	if(param.must && typeof value[key] != "number") value[key] = 0;
	target.getGui = function({index, x, y, name, elem}){
		if(typeof param.min != "number") param.min = -Infinity;
		if(typeof param.max != "number") param.max = Infinity;
		elem[name+"text"] = {
			type: "text", x: x+880, y: y+10, font: {color: Color.BLACK, size: 20, align: 2}, keep: keep,
			text: typeof value[key] == "number" ? String(value[key]) : TranAPI.translate("undefined")
		};
		elem[name+"button"] = {
			type: "slot", x: x+900, y: y, size: 40, bitmap: "clear", keep: keep,
			source: {id: VanillaItemID.feather, count: 1}, clicker: {
				onClick: Debounce(function(){
					GetInput({
						hint: typeof value[key] == "number" ? String(value[key]) : TranAPI.translate("undefined"),
						text: typeof value[key] == "number" ? String(value[key]) : null,
						title: TranAPI.translate("Please enter number:")+" [ "+param.min+" ~ "+param.max+" ]"
					}, function(keyword){
						var num = Number(keyword);
						if(isNaN(num)){
							alert(TranAPI.translate("Not a number"));
							return;
						}
						if(num < param.min || num > param.max || Math.abs(num) == Infinity){
							alert(TranAPI.translate("Out of range"));
							return;
						}
						value[key] = num;
						elem[name+"text"].text = String(num);
					});
				}, 10)
			}
		};
	};
	target.onDelete = function(elem, name){
		value[key] = void 0;
		elem[name+"text"].text = TranAPI.translate("undefined");
	};
});

Editor.ui.addType("id", function(param, target, value, key, keep){
	if(param.must && typeof value[key] != "string" && typeof value[key] != "number") value[key] = "0";
	target.getGui = function({index, x, y, name, elem}){
		elem[name+"text"] = {
			type: "text", x: x+880, y: y+10, font: {color: Color.BLACK, size: 20, align: 2},
			text: String(TransferId(value[key]))+" ("+(value[key] || "0")+") ", keep: keep
		};
		elem[name+"button"] = {
			type: "slot", x: x+900, y: y, size: 40, bitmap: "clear", keep: keep,
			source: {id: VanillaItemID.feather, count: 1}, clicker: {
				onClick: Debounce(function(){
					alert(TranAPI.translate("Please choose an item."))
					Editor.ui.getItem(function(item){
						value[key] = DeTransferId(item.id);
						elem[name+"text"].text = String(TransferId(value[key]))+" ("+(value[key] || "0")+") ";
					});
				}, 10)
			}
		};
	};
	target.onDelete = function(elem, name){
		value[key] = "0";
		elem[name+"text"] = "0 (0) ";
	};
});

Editor.ui.addType("extra", function(param, target, value, key, keep){
	if(param.must && !Array.isArray(value[key])) value[key] = [];
	target.getGui = function({index, x, y, name, elem}){
		elem[name+"button"] = {
			type: "slot", x: x+900, y: y, size: 40, bitmap: "clear", keep: keep,
			source: {id: VanillaItemID.feather, count: 1}, clicker: {
				onClick: Debounce(function(){
					alert(TranAPI.translate("Please choose an item."))
					Editor.ui.getItem(function(item){
						value[key] = DeTransferItem(item.id).extra;
					});
				}, 10)
			}
		};
	};
	target.onDelete = function(elem, name){
		value[key] = void 0;
	};
});

Editor.ui.addType("item", function(param, target, value, key, keep){
	if(typeof value[key] != "object") value[key] = {};
	var item = TransferItem(value[key]);
	target.getGui = function({index, x, y, name, elem}){
		elem[name+"slot"] = {
			type: "slot", x: x+900, y: y, size: 40, bitmap: "slot_0",
			keep: keep, source: item, clicker: {
				onClick: Debounce(function(){
					item = TransferItem(value[key]);
					elem[name+"slot"].source = item;
					Dialog({
						title: TranAPI.translate("Current item"),
						text: Item.getName(item.id, item.data) + "\n"
							+ TranAPI.translate("id: ") + item.id + "\n"
							+ TranAPI.translate("data: ") + (item.data >= 0 ? item.data : TranAPI.translate("any")) + "\n"
							+ TranAPI.translate("count: ") + item.count
					}, function(){});
				}, 10)
			}
		};
	};

	var params = {
		"id": {type: "id", name: TranAPI.translate("id: ")},
		"data": {type: "number", min: -1, name: TranAPI.translate("data: ")},
		"count": {type: "number", min: 1, name: TranAPI.translate("count: ")},
		"extra": {type: "extra", name: TranAPI.translate("extra: ")}
	};
	target.main = [];
	for(let i in params){
		let obj = {};
		Editor.ui.getType(params[i].type)(params[i], obj, value[key], i, false);
		obj.text = (params[i].name === void 0) ? i : params[i].name;
		obj.color = params[i].must ? Color.BLACK : Color.GRAY;
		obj.must = params[i].must;
		target.main.push(obj);
	}
});

Editor.ui.addType("icon", function(param, target, value, key, keep){
	if(typeof value[key] != "object") value[key] = {};
	var item = TransferItem(value[key]);
	target.getGui = function({index, x, y, name, elem}){
		elem[name+"slot"] = {
			type: "slot", x: x+900, y: y, size: 40, bitmap: value[key].bitmap || "slot_0",
			keep: keep, source: item, clicker: {
				onClick: Debounce(function(){
					item = TransferItem(value[key]);
					elem[name+"slot"].source = item;
					elem[name+"slot"].bitmap = value[key].bitmap || "slot_0";
					Dialog({
						title: TranAPI.translate("Current item"),
						text: Item.getName(item.id, item.data) + "\n"
							+ TranAPI.translate("id: ") + item.id + "\n"
							+ TranAPI.translate("data: ") + (item.data >= 0 ? item.data : TranAPI.translate("any")) + "\n"
							+ TranAPI.translate("count: ") + item.count
					}, function(){});
				}, 10)
			}
		};
	};
	target.onDelete = function(elem, name){
		target.main.forEach(function(v, k){
			if(v.onDelete) v.onDelete(elem, name+k+"_");
		});
		value[key] = {};
		item = {};
		elem[name+"slot"].source = item;
		elem[name+"slot"].bitmap = "slot_0";
	};

	var params = {
		"bitmap": {type: "string", name: TranAPI.translate("bitmap: ")},
		"id": {type: "id", name: TranAPI.translate("id: ")},
		"data": {type: "number", min: -1, name: TranAPI.translate("data: ")},
		"count": {type: "number", min: -1, name: TranAPI.translate("count: ")},
		"extra": {type: "extra", name: TranAPI.translate("extra: ")}
	};
	target.main = [];
	for(let i in params){
		let obj = {};
		Editor.ui.getType(params[i].type)(params[i], obj, value[key], i, false);
		obj.text = (params[i].name === void 0) ? i : params[i].name;
		obj.color = params[i].must ? Color.BLACK : Color.GRAY;
		obj.must = params[i].must;
		target.main.push(obj);
	}
});

Editor.ui.addType("create", function(param, target, value, key, keep){
	param.name = TranAPI.translate("Create");
	param.must = true;
	target.getGui = function({index, x, y, name, elem}){
		elem[name+"button"] = {
			type: "slot", x: x+900, y: y, size: 40, bitmap: "clear", keep: keep,
			source: {id: VanillaItemID.feather, count: 1}, clicker: {
				onClick: Debounce(param.onCreate, 10)
			}
		}
	};
});

Editor.ui.addType("text", function(param, target, value, key, keep){
	if(typeof value[key] != "object") value[key] = {};
	if(typeof value[key]["en"] != "string") value[key]["en"] = "";
	if(typeof value[key]["ru"] != "string") value[key]["ru"] = "";
	if(typeof value[key]["zh"] != "string") value[key]["zh"] = "";
	var ui, params = {
		"//": {type: "create", onCreate: function(){
			GetInput({
				title: TranAPI.translate("Create a translation"),
				hint: TranAPI.translate("Two-letter language code")+"\n"
					+TranAPI.translate("Current language: ")+Translation.getLanguage()
			}, function(keyword){
				if(!keyword) return;
				value[key][keyword] = "";
				params[keyword] = {type: "string"};
				var tmp = Editor.ui.getEditorUI(params, value[key]);
				ui.close();
				ui = tmp;
			});
		}},
		"en": null
	};
	for(let i in value[key]) params[i] = {type: "string"};
	params["en"].must = true;
	
	target.getGui = function({index, x, y, name, elem}){
		elem[name+"button"] = {
			type: "slot", x: x+900, y: y, size: 40, bitmap: "clear", keep: keep,
			source: {id: VanillaItemID.feather, count: 1}, clicker: {
				onClick: Debounce(function(){ ui = Editor.ui.getEditorUI(params, value[key]) }, 10)
			}
		}
	};
	target.onDelete = function(elem, name){
		value[key] = void 0;
	};
});
