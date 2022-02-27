/// <reference path="./network.js"/>
var System = {
	data: {}, showInfo: {},
	open: function(source, ismenu){
		if(source != QuestsUI_data.source) System.setSource(source);
		if(ismenu){
			QuestsUI.menu.open();
		} else if(LocalData.team){
			QuestsUI.main.open();
		} else {
			alert(TranAPI.translate("Sorry, you must join a team first."));
			QuestsUI.team.open();
		}
	},
	openForPlayer: function(player, source, ismenu){
		Network.getClientForPlayer(player).send("CustomQuests.Client.call", {
			name: "System.open",
			params: [source, ismenu]
		});
	},
	addSource: function(source, json, showInfo){
		if(!source || !json || !json.main) return;
		json.main.forEach(function(v, k){
			System.chapter.add(source, v);
		});
		if(!System.data[source]) return;
		System.data[source].info = json.info || {};
		System.showInfo[source] = Boolean(showInfo);
	},
	setSource: function(source){
		if(!System.data[source]) return;
		QuestsUI_data.source = source;
		QuestsUI_data.chapter = null;
		var ScreenHeight = UI.getScreenHeight();
		var num = 0;
		var mxnum = Math.floor((1.1*ScreenHeight-60)*1000/Setting.padding/800);
		var elem = QuestsUI.parentUI_1.getContent().elements;
		var elem1 = QuestsUI.chapterUI.getContent().elements;
		var uuid = GetUuid();
		
		QuestsUI.questUI.close();
		QuestsUI.chapterUI.close();
		QuestsUI.newElements.parentUI_1.forEach(function(v){elem[v] = null});
		QuestsUI.newElements.parentUI_1 = [];
		RefreshGUI(QuestsUI.parentUI_1, 0);
		QuestsUI.newElements.chapterUI.forEach(function(v){elem1[v] = null});
		QuestsUI.newElements.chapterUI = [];
		RefreshGUI(QuestsUI.chapterUI, 0);
		
		for(let chapter in System.data[source].chapter){
			let json = System.data[source].chapter[chapter];
			
			QuestsUI.newElements.chapterUI.push(uuid+"chapter_"+chapter);
			elem1[uuid+"chapter_"+chapter] = {
				type: "slot", x: 200*(num%5), y: 160*Math.floor(num/5)+100, source: TransferItem(json.icon),
				size: 160, visual: true, bitmap: json.icon.bitmap || "button", clicker: {
					onClick: Debounce(function(){ System.chapter.set(source, json.name) }, 10),
					onLongClick: source == "Default" ? Debounce(function(){ Editor.editChapter(json.name) }, 10) : null
			}};
			if(num < mxnum){
				QuestsUI.newElements.parentUI_1.push(uuid+"chapter_"+chapter);
				elem[uuid+"chapter_"+chapter] = {
					type: "slot", x: 0, y: 800*num, source: TransferItem(json.icon),
					size: 800, visual: true, bitmap: json.icon.bitmap || "button", clicker: {
						onClick: Debounce(function(){ System.chapter.set(source, json.name) }, 10),
						onLongClick: source == "Default" ? Debounce(function(){ Editor.editChapter(json.name) }, 10) : null
				}};
			}
			num++;
		}
		if(num <= mxnum){
			elem["more"].y = Math.max(num*800, ScreenHeight*1000/Setting.padding);
			QuestsUI.parentUI_1.getContent().drawing[1].y = Math.max(num*800, ScreenHeight*1000/Setting.padding);
			QuestsUI.parentUI_1.getLocation().scrollY = Math.max(num*800/1000*Setting.padding, ScreenHeight-60);
		} else {
			elem["more"].y = mxnum*800;
			QuestsUI.parentUI_1.getContent().drawing[1].y = Math.max((mxnum+1)*800, ScreenHeight*1000/Setting.padding);
			QuestsUI.parentUI_1.getLocation().scrollY = Math.max((mxnum+1)*800/1000*Setting.padding, ScreenHeight-60);
		}
		var inter_height = 160*Math.floor((num-1)/5)+260;
		QuestsUI.chapterUI.getContent().drawing[1].height = Math.max(inter_height, (ScreenHeight-60)*1000/(Setting.padding*5));
		QuestsUI.chapterUI.getContent().drawing[2].y = Math.max(inter_height, (ScreenHeight-60)*1000/(Setting.padding*5));
		QuestsUI.chapterUI.getLocation().scrollY = Math.max(inter_height/1000*Setting.padding, ScreenHeight-60);
		
		System.chapter.clearGUI();
		QuestsUI.main.getContent().drawing[2].text = TranAPI.TAT(System.data[source].info.display_name, source, null, null, "name");
		QuestsUI.parentUI.getContent().drawing[1].bitmap = System.data[source].info.background || "chapter_bg";
		RefreshGUI(QuestsUI.parentUI_1, 1);
		RefreshGUI(QuestsUI.chapterUI, 1);
	},
	deleteSource: function(source, onServer){
		if(QuestsUI_data.source == source && !onServer){
			QuestsUI_data.source = null;
			QuestsUI_data.chapter = null;
			QuestsUI.main.close();
			System.chapter.clearGUI();
		}
		delete System.data[source];
		delete System.showInfo[source];
	},
	/**
	 * Same as [[System.quest.setInputType]]
	 */
	setInputType: function(type, params){
		System.quest.setInputType(type, params);
	},
	/**
	 * Same as [[System.quest.setOutputType]]
	 */
	setOutputType: function(type, params){
		System.quest.setOutputType(type, params);
	},
	chapter: {
		add: function(source, json){
			if(!source || !json || !json.name) return;
			if(!System.data[source]){
				System.data[source] = {
					father: {},
					child: {},
					chapter: {},
					info: {}
				};
			}
			if(!System.data[source].father[json.name]) System.data[source].father[json.name] = {};
			if(!System.data[source].child[json.name]) System.data[source].child[json.name] = {};
			System.data[source].chapter[json.name] = json;
			json.quest.forEach(function(v, k){
				if(!CheckDefined([v.name, v.x, v.y, v.size, v.icon], 5)){
					if(!System.data[source].father[json.name][v.name])
						System.data[source].father[json.name][v.name] = [];
					if(v.father) v.father.forEach(function(fv, fk){
						if(typeof(fv) == "string") fv = [source, json.name, fv];
						if(!fv[0]) fv[0] = source;
						if(!fv[1]) fv[1] = json.name;
						if(fv[2]){
							System.data[source].father[json.name][v.name].push(fv);
							if(!System.data[fv[0]]) System.data[fv[0]] = {
								father: {},
								child: {},
								chapter: {},
								info: {}
							};
							if(!System.data[fv[0]].child[fv[1]])
								System.data[fv[0]].child[fv[1]] = {};
							if(!System.data[fv[0]].child[fv[1]][fv[2]])
								System.data[fv[0]].child[fv[1]][fv[2]] = [];
							System.data[fv[0]].child[fv[1]][fv[2]].push([source, json.name, v.name]);
						}
					});
				}
			});
		},
		set: function(source, chapter){
			if(!System.data[source]) return;
			if(!System.data[source].chapter[chapter]) return;
			QuestsUI_data.chapter = chapter;
			var num = 0;
			var mxnum = Math.floor((1.1*UI.getScreenHeight()-60)*1000/Setting.padding/800);
			var cont = QuestsUI.parentUI.getContent();
			for(var i in System.data[source].chapter){
				if(i == chapter) break;
				num++;
			}
			
			QuestsUI.questUI.close();
			QuestsUI.chapterUI.close();
			
			if(num < mxnum) QuestsUI.parentUI_1.getContent().drawing[1].y = 800*num;
			else QuestsUI.parentUI_1.getContent().drawing[1].y = 800*mxnum;
			QuestsUI.chapterUI.getContent().drawing[2].x = 200*(num%5)+160;
			QuestsUI.chapterUI.getContent().drawing[2].y = 160*Math.floor(num/5)+100;
			QuestsUI.main.getContent().drawing[2].text =
				TranAPI.TAT(System.data[source].info.display_name, source, null, null, "name")+" ━ "+
				TranAPI.TAT(System.data[source].chapter[chapter].display_name, source, chapter, null, "name");
			System.chapter.clearGUI();
			System.data[source].chapter[chapter].quest.forEach(function(v, k){
				switch(v.type){
					case "quest":
						if(!CheckDefined([v.name, v.x, v.y, v.size, v.icon], 5)){
							System.quest.addGUI(source, chapter, v.name, v);
						}
					break;
					case "custom":
						if(!CheckDefined([v.name, v.value], 2)){
							try {
								cont.elements["custom_"+v.name] = typeof v.value == "object" ? v.value : JSON.parse(v.value);
								QuestsUI.newElements.parentUI.push("custom_"+v.name);
							} catch(e){}
						}
					break;
				}
			});
		},
		clearGUI: function(){
			var cont = QuestsUI.parentUI.getContent();
			QuestsUI.newElements.parentUI.forEach(function(v){cont.elements[v] = null});
			QuestsUI.newElements.parentUI = [];
			cont.drawing.splice(2);
			RefreshGUI(QuestsUI.parentUI, 0);
		}
	},
	quest: {
		input: {},
		output: {},
		setInputType: function(type, params){
			if(typeof params != "object") return;
			if(!this.input[type]) this.input[type] = {};
			if(params.getGui) this.input[type].getGui = params.getGui;
			if(params.onTick) this.input[type].onTick = params.onTick;
			if(params.onCreate || params.onCreated) this.input[type].onCreate = params.onCreate || params.onCreated;
			if(params.onDelete || params.onDeleted) this.input[type].onDelete = params.onDelete || params.onDeleted;
		},
		getInputType: function(type, name){
			if(!this.input[type]) return function(){};
			if(!this.input[type][name]) return function(){};
			return this.input[type][name];
		},
		setOutputType: function(type, params){
			if(typeof params != "object") return;
			if(!this.output[type]) this.output[type] = {};
			if(params.getGui) this.output[type].getGui = params.getGui;
			if(params.onReceive || params.onReceived) this.output[type].onReceive = params.onReceive || params.onReceived;
			if(params.onFastReceive || params.onFastReceived) this.output[type].onFastReceive = params.onFastReceive || params.onFastReceived;
		},
		getOutputType: function(type, name){
			if(!this.output[type]) return function(){};
			if(!this.output[type][name]) return function(){};
			return this.output[type][name];
		},
		addQuestUIElement: function(key, element){
			if(!key || !element) return;
			QuestsUI.newElements.questUI.push(key);
			QuestsUI.questUI.getContent().elements[key] = element;
		},
		getQuestUI: function(source, chapter, quest, info, icon){
			if(!info && !icon){
				let json_quest = System.quest.get(source, chapter, quest);
				if(!json_quest) return;
				info = json_quest.info;
				icon = json_quest.icon;
				if(HaveKeys(json_quest.icon_locked, ["bitmap", "id"]) && Core.isLocked_Local(source, chapter, quest)) temp_icon = json_quest.icon_locked;
				if(HaveKeys(json_quest.icon_finished, ["bitmap", "id"]) && Core.isFinished(source, chapter, quest)) temp_icon = json_quest.icon_finished;
			}
			if(!info) info = {};
			if(!info.input) info.input = [];
			if(!info.output) info.output = [];
			if(!icon) icon = {};
			QuestsUI_data.quest = quest;
			var quan = Math.max(info.input.length, info.output.length);
			var loca = QuestsUI.questUI.getLocation();
			var cont = QuestsUI.questUI.getContent();
			var desc = TranAPI.TAT(info.text, source, chapter, quest, "description").split("\n");
			var height = (280+Math.floor(quan/5-0.1)*100+50*desc.length)*(600/1000);
			var uuid = GetUuid();

			QuestsUI.chapterUI.close()
			QuestsUI.FatherChildUI.close();
			QuestsUI.descUI.close();
			QuestsUI.selectUI.close();
			QuestsUI.newElements.questUI.forEach(function(v){cont.elements[v] = null});
			QuestsUI.newElements.questUI = [];
			RefreshGUI(QuestsUI.questUI, 0);
			
			loca.scrollY = height;
			loca.height = Math.min(height, UI.getScreenHeight());
			loca.y = (UI.getScreenHeight()-height)/2;
			cont.drawing[1].height = 1000*height/600;
			cont.drawing[2].text = TranAPI.TAT(info.display_name, source, chapter, quest, "name");
			cont.drawing[4].y1 = 250+Math.floor(quan/5-0.1)*100;
			cont.drawing[4].y2 = 250+Math.floor(quan/5-0.1)*100;
			cont.drawing[5].y2 = 250+Math.floor(quan/5-0.1)*100;
			cont.elements["slot"].bitmap = icon.bitmap || "slot_0";
			cont.elements["slot"].source = TransferItem(icon);
			
			desc.forEach(function(v, k){
				System.quest.addQuestUIElement("desc_"+k, {
					type: "text", text: v, font: {color: Color.BLACK, size: 40},
					x: 20, y: 260+Math.floor(quan/5-0.1)*100+50*k,
				});
			});
			info.input.forEach(function(v, k){
				System.quest.getInputType(v.type, "getGui")({
					source: source,
					chapter: chapter,
					quest: quest
				}, v, {
					key: k,
					x: 96*(k%5)+20,
					y: 100*Math.floor(k/5)+160,
					name: uuid+"input_"+k,
					addElement: System.quest.addQuestUIElement
				});
			});
			info.output.forEach(function(v, k){
				System.quest.getOutputType(v.type, "getGui")({
					source: source,
					chapter: chapter,
					quest: quest
				}, v, {
					key: k,
					x: 96*(k%5)+520,
					y: 100*Math.floor(k/5)+160,
					name: uuid+"output_"+k,
					addElement: System.quest.addQuestUIElement
				});
			});
			RefreshGUI(QuestsUI.questUI, 1);
			QuestsUI.questUI.open();
		},
		addGUI: function(source, chapter, quest, {x, y, size, icon, icon_locked, icon_finished, father, hidden, info}){
			if(!father) father = [];
			var elem = QuestsUI.parentUI.getContent().elements;
			var uuid = GetUuid();
			var locked = Core.isLocked_Local(source, chapter, quest);
			var finished = Core.isFinished(source, chapter, quest);
			
			if(hidden && locked) return;

			var temp_icon = icon, darken = locked;
			if(locked && HaveKeys(icon_locked, ["bitmap", "id"]) ) temp_icon = icon_locked;
			if(finished && HaveKeys(icon_finished, ["bitmap", "id"]) ) temp_icon = icon_finished;

			QuestsUI.newElements.parentUI.push(uuid+"quest_main_"+quest, "quest_got_"+quest, "quest_dot_"+quest);
			elem[uuid+"quest_main_"+quest] = {
				type: "slot", visual: true, bitmap: temp_icon.bitmap || "slot_0", refresh: true,
				x: x, y: y, z: 1, size: size, source: TransferItem(temp_icon), darken: darken, clicker: {
					onClick: Debounce(function(){ System.quest.getQuestUI(source, chapter, quest, info, temp_icon) }, 10),
					onLongClick: source == "Default" ? Debounce(function(){ Editor.editQuest(chapter, quest) }, 10) : null
			}};
			elem["quest_got_"+quest] = {
				type: "image", x: x+3/4*size, y: y-size/12, z: 2, width: size/3, height: size/3,
				bitmap: finished ? (Core.isGot(source, chapter, quest) ? "clear" : "remind") :  "clear"
			};
			elem["quest_dot_"+quest] = {
				type: "image", x: x+3/4*size, y: y+3/4*size, z: 2, width: size*5/16, height: size*5/16,
				bitmap: (locked || finished) ? "clear" : "dot_blue"
			};
			father.forEach(function(v, k){
				if(typeof(v) == "string") v = [source, chapter, v];
				System.quest.setChild(v, [source, chapter, quest], v[3]);
			});
		},
		setChild: function(father, child, width){
			if(!father[0]) father[0] = child[0];
			if(!father[1]) father[1] = child[1];
			if(!father[2]) return;
			if(father[0] == child[0] && father[1] == child[1] && father[2] == child[2]) return;
			
			if(father[0] == child[0] && father[1] == child[1]){
				var quest1 = System.quest.get(father[0], father[1], father[2]);
				var finished1 = Core.isFinished(father[0], father[1], father[2]);
				var locked1 = Core.isLocked_Local(father[0], father[1], father[2]);

				var quest2 = System.quest.get(child[0], child[1], child[2]);
				var finished2 = Core.isFinished(child[0], child[1], child[2]);
				var locked2 = Core.isLocked_Local(child[0], child[1], child[2]);
				
				var color;
				if(locked1) color = "#383838";//black
				else {
					if(finished1){
						if(finished2) color = "#6AEE6A";//green
						else {
							if(locked2) color = "#EE82EE";//purple
							else color = "#33FFFF";//blue
						}
					} else color = "#EE82EE";//purple
				}
				if(quest1.hidden && locked1){
					color = "#00000000";
				} else if(quest2.hidden && (color == "#383838" || color == "#EE82EE")){
					color = "#00000000";
				}
				QuestsUI.parentUI.getContent().drawing.push({
					type: "line", width: width || 5, color: Color.parseColor(color),
					x1: quest1.x+(quest1.size/2), y1: quest1.y+(quest1.size/2),
					x2: quest2.x+(quest2.size/2), y2: quest2.y+(quest2.size/2)
				});
			}
		},
		get: function(source, chapter, quest){
			var temp = {};
			try{
				System.data[source].chapter[chapter].quest.some(function(v, k){
					if(v.name == quest && !CheckDefined([v.name, v.x, v.y, v.size, v.icon], 5)){
						temp = v;
						return true;
					}
				});
			}catch(e){
				Logger.Log("<CustomQuests> Error in System.quest.get:\n"+e, "ERROR");
			}
			return temp;
		},
		isExist: function(source, chapter, quest){
			try{
				return System.data[source].chapter[chapter].quest.some(function(v){
					return v.name == quest;
				});
			}catch(e){
				Logger.Log("<CustomQuests> Error in System.quest.isExist:\n"+e, "ERROR");
				return false;
			}
		},
		getFather: function(source, chapter, quest){
			try{
				return (System.data[source].father[chapter][quest] || []).filter(function(v){
					return System.quest.isExist(v[0], v[1], v[2]);
				});
			}catch(e){
				Logger.Log("<CustomQuests> Error in System.quest.getFather:\n"+e, "ERROR");
				return [];
			}
		},
		getChild: function(source, chapter, quest){
			try{
				return (System.data[source].child[chapter][quest] || []).filter(function(v){
					return System.quest.isExist(v[0], v[1], v[2]);
				});
			}catch(e){
				Logger.Log("<CustomQuests> Error in System.quest.getChild:\n"+e, "ERROR");
				return [];
			}
		},
		getFatherChildUI: function(list){
			var elem = QuestsUI.FatherChildUI.getContent().elements;
			var uuid = GetUuid();
			
			QuestsUI.chapterUI.close();
			QuestsUI.FatherChildUI.close();
			QuestsUI.newElements.FatherChildUI.forEach(function(v){elem[v] = null});
			QuestsUI.newElements.FatherChildUI = [];
			RefreshGUI(QuestsUI.FatherChildUI, 0);
			
			var sum_y = 1;
			for(let temp_source in list){
				QuestsUI.newElements.FatherChildUI.push("button_"+temp_source, "text_"+temp_source);
				elem["button_"+temp_source] = {
					type: "button", x: 0, y: 200*sum_y, z: 1, bitmap: "button_source", scale: 10
				};
				elem["text_"+temp_source] = {
					type: "text", x: 20, y: 200*sum_y+60, z: 2, font: {color: Color.BLACK, size: 80},
					text: TranAPI.TAT(System.data[temp_source].info.display_name, temp_source, null, null, "name")
				};
				sum_y++;
				for(let temp_chapter in list[temp_source]){
					QuestsUI.newElements.FatherChildUI.push(
						"button_"+temp_source+":"+temp_chapter,
						"text_"+temp_source+":"+temp_chapter
					);
					elem["button_"+temp_source+":"+temp_chapter] = {
						type: "button", x: 0, y: 200*sum_y, z: 1, bitmap: "button_chapter", scale: 10
					};
					elem["text_"+temp_source+":"+temp_chapter] = {
						type: "text", x: 120, y: 200*sum_y+60, z: 2, font: {color: Color.BLACK, size: 80},
						text: TranAPI.TAT(System.data[temp_source].chapter[temp_chapter].display_name,
							temp_source, temp_chapter, null, "name")
					};
					sum_y++;
					for(let temp_quest in list[temp_source][temp_chapter]){
						if(!list[temp_source][temp_chapter][temp_quest]) continue;
						let name = "";
						try{
							name = System.quest.get(temp_source, temp_chapter, temp_quest).info.display_name;
						}catch(e){}
						QuestsUI.newElements.FatherChildUI.push(
							uuid+"button_"+temp_source+":"+temp_chapter+":"+temp_quest,
							"text_"+temp_source+":"+temp_chapter+":"+temp_quest,
							"finished_"+temp_source+":"+temp_chapter+":"+temp_quest
						);
						elem[uuid+"button_"+temp_source+":"+temp_chapter+":"+temp_quest] = {
							type: "button", x: 0, y: 200*sum_y, z: 1, bitmap: "button_quest", scale: 10, clicker: {
								onClick: Debounce(function(){ alert(TranAPI.TAT(name, temp_source, temp_chapter, temp_quest, "name")) }, 10),
								onLongClick: Debounce(function(){
									if(QuestsUI_data.source != temp_source) return;
									Dialog({
										title: TranAPI.translate("Warn"),
										text: TranAPI.translate("Are you sure to open this quest?")
									}, function(){
										if(QuestsUI_data.chapter != temp_chapter) System.chapter.set(temp_source, temp_chapter);
										QuestsUI.FatherChildUI.close();
										System.quest.getQuestUI(temp_source, temp_chapter, temp_quest);
									})
								})
						}};
						elem["text_"+temp_source+":"+temp_chapter+":"+temp_quest] = {
							type: "text", x: 220, y: 200*sum_y+60, z: 2, font: {color: Color.BLACK, size: 80},
							text: TranAPI.TAT(name, temp_source, temp_chapter, temp_quest, "name")
						};
						elem["finished_"+temp_source+":"+temp_chapter+":"+temp_quest] = {
							type: "image", x: 800, y: 200*sum_y+200-200*16/22, z: 3, width: 200, height: 200*16/22,
							bitmap: Core.isFinished(temp_source, temp_chapter, temp_quest) ? "finished" : "clear"
						};
						sum_y++;
					}
				}
			}
			QuestsUI.FatherChildUI.getContent().drawing[1].height = Math.max(UI.getScreenHeight()*5, sum_y*200);
			QuestsUI.FatherChildUI.getLocation().scrollY = Math.max((sum_y*200)/5, UI.getScreenHeight());
			RefreshGUI(QuestsUI.FatherChildUI, 1);
			QuestsUI.FatherChildUI.open();
		},
		getFatherUI: function(source, chapter, quest){
			var list = {};
			System.quest.getFather(source, chapter, quest).forEach(function(v, k){
				if(!list[v[0]]) list[v[0]] = {};
				if(!list[v[0]][v[1]]) list[v[0]][v[1]] = {};
				if(!list[v[0]][v[1]][v[2]]) list[v[0]][v[1]][v[2]] = true;
			});
			QuestsUI.FatherChildUI.getContent().drawing[2].text = TranAPI.translate("Parent Quests");
			QuestsUI.FatherChildUI.getLocation().x = 0;
			System.quest.getFatherChildUI(list);
		},
		getChildUI: function(source, chapter, quest){
			var list = {};
			System.quest.getChild(source, chapter, quest).forEach(function(v, k){
				if(!list[v[0]]) list[v[0]] = {};
				if(!list[v[0]][v[1]]) list[v[0]][v[1]] = {};
				if(!list[v[0]][v[1]][v[2]]) list[v[0]][v[1]][v[2]] = true;
			});
			QuestsUI.FatherChildUI.getContent().drawing[2].text = TranAPI.translate("Sub Quests");
			QuestsUI.FatherChildUI.getLocation().x = 800;
			System.quest.getFatherChildUI(list);
		},
	},
};
