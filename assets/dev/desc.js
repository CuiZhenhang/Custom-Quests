/// <reference path="./ui.js"/>
var getRecipeUI = function(item, isUsage){
	alert(TranAPI.translate("Please enable RecipeViewer!"));
};
ModAPI.addAPICallback("RecipeViewer", function(RecipeViewer){
	if(RecipeViewer.RecipeTypeRegistry && RecipeViewer.RecipeTypeRegistry.openRecipePageByItem){
		getRecipeUI = function(item, isUsage){
			if(item.data >= 0){
				if(RecipeViewer.RecipeTypeRegistry.openRecipePageByItem(item.id, item.data, isUsage))
					alert(TranAPI.translate("Recipe not found"));
			} else {
				if(RecipeViewer.RecipeTypeRegistry.openRecipePageByItem(item.id, -1, isUsage))
					if(RecipeViewer.RecipeTypeRegistry.openRecipePageByItem(item.id, 0, isUsage))
						alert(TranAPI.translate("Recipe not found"));
			}
		};
	} else getRecipeUI = function(item, isUsage){
		alert(TranAPI.translate("Please update RecipeViewer!"));
	};
});

var Desc = {
	input: {
		"item": function(params){
			var cont = QuestsUI.descUI.getContent();
			var uuid = GetUuid();
			var item = TransferItem(params);
			
			QuestsUI.newElements.descUI.forEach(function(v){cont.elements[v] = null});
			QuestsUI.newElements.descUI = [];
			RefreshGUI(QuestsUI.descUI, 0);
			
			cont.drawing[1].text = TranAPI.translate("Quests Type: ")+"item";
			QuestsUI.newElements.descUI.push("slot", uuid+"recipe", "recipe_text", "name", "id", "data", "count");
			cont.elements["slot"] = {type: "slot", visual: true, bitmap: "slot_1", x: 20, y: 20, z: 1, size: 200, source: item};
			cont.elements[uuid+"recipe"] = {type: "button", x: 20, y: 240, z: 1, bitmap: "button_1", scale: 4, clicker: {
				onClick: Debounce(function(){ getRecipeUI(item, false) }, 10),
				onLongClick: Debounce(function(){ getRecipeUI(item, true) }, 10)
			}};
			cont.elements["recipe_text"] = {type: "text", x: 120, y: 240, z: 2, font: {color: Color.BLACK, size: 40, align: 1},
				text: TranAPI.translate("Recipe")};
			cont.elements["name"] = {type: "text", x: 240, y: 90, font: {color: Color.WHITE, size: 40},
				text: (TranAPI.translate("name: ")+Item.getName(item.id, item.data))};
			cont.elements["id"] = {type: "text", x: 240, y: 150, font: {color: Color.WHITE, size: 40},
				text: (TranAPI.translate("id: ")+item.id)};
			cont.elements["data"] = {type: "text", x: 240, y: 210, font: {color: Color.WHITE, size: 40},
				text: (TranAPI.translate("data: ")+(params.data >= 0 ? params.data : TranAPI.translate("any")))};
			cont.elements["count"] = {type: "text", x: 240, y: 270, font: {color: Color.WHITE, size: 40},
				text: (TranAPI.translate("count: ")+item.count)};
			var height = 320;
			if(params.extra){
				params.extra.forEach(function(v, k){
					switch(v.type){
						case "Name":
							QuestsUI.newElements.descUI.push("name_1");
							cont.elements["name_1"] = {type: "text", x: 240, y: height+10,
								font: {color: Color.WHITE, size: 40},
								text: (TranAPI.translate("name: ")+v.value)};
							height += 60;
						break;
						case "Enchant":
							QuestsUI.newElements.descUI.push("enchant_"+k);
							cont.elements["enchant_"+k] = {type: "text", x: 240, y: height+10,
								font: {color: Color.WHITE, size: 40},
								text: (TranAPI.translate("enchant: ")+v.key+" "+v.operator+v.value)};
							height += 60;
						break;
						case "Energy":
							QuestsUI.newElements.descUI.push("energy");
							cont.elements["energy"] = {type: "text", x: 240, y: height+10,
								font: {color: Color.WHITE, size: 40},
								text: (TranAPI.translate("energy: ")+v.operator+v.value)};
							height += 60;
						break;
						default:
							if((new ItemExtraData())["put"+v.type]){
								QuestsUI.newElements.descUI.push("extra_"+k);
								cont.elements["extra_"+k] = {type: "text", x: 240, y: height+10,
									font: {color: Color.WHITE, size: 40},
									text: (TranAPI.translate("extra: ")+v.key+v.operator+v.value)};
								height += 60;
							}
					}
				})
			}
			
			QuestsUI.descUI.getLocation().scrollY = Math.max(height, UI.getScreenHeight());
			RefreshGUI(QuestsUI.descUI, 1);
			QuestsUI.descUI.open();
		},
		"item_group": function(params){
			var ths = this;
			var cont = QuestsUI.descUI.getContent();
			var uuid = GetUuid();
			var item_group = params.items.map(function(v){
				return TransferItem(v);
			});
			
			QuestsUI.newElements.descUI.forEach(function(v){cont.elements[v] = null});
			QuestsUI.newElements.descUI = [];
			RefreshGUI(QuestsUI.descUI, 0);
			
			var height = 100;
			cont.drawing[1].text = TranAPI.translate("Quests Type: ")+"item_group";
			item_group.forEach(function(item, k){
				QuestsUI.newElements.descUI.push(uuid+"slot_"+k, "text_"+k);
				cont.elements[uuid+"slot_"+k] = {type: "slot", visual: true, bitmap: "slot_1",
					x: 20, y: height+10, z: 1, size: 80, source: item, clicker: {
					onClick: Debounce(function(){ ths["item"](params.items[k]) }, 10)
				}};
				cont.elements["text_"+k] = {type: "text", x: 110, y: height+30, font: {color: Color.WHITE, size: 40},
					text: (TranAPI.translate("name: ")+Item.getName(item.id, item.data))};
				height += 100;
			});
			
			QuestsUI.descUI.getLocation().scrollY = Math.max(height, UI.getScreenHeight());
			RefreshGUI(QuestsUI.descUI, 1);
			QuestsUI.descUI.open();
		},
		"exp": function(params){
			var cont = QuestsUI.descUI.getContent();
			
			QuestsUI.newElements.descUI.forEach(function(v){cont.elements[v] = null});
			QuestsUI.newElements.descUI = [];
			RefreshGUI(QuestsUI.descUI, 0);
			
			cont.drawing[1].text = TranAPI.translate("Quests Type: ")+"exp";
			QuestsUI.newElements.descUI.push("text");
			cont.elements["text"] = {
				type: "text", x: 20, y: 130, font: {color: Color.WHITE, size: 40},
				text: (TranAPI.translate("exp: ")+params.value)
			};
			
			QuestsUI.descUI.getLocation().scrollY = Math.max(200, UI.getScreenHeight());
			RefreshGUI(QuestsUI.descUI, 1);
			QuestsUI.descUI.open();
		},
		"level": function(params){
			var cont = QuestsUI.descUI.getContent();
			
			QuestsUI.newElements.descUI.forEach(function(v){cont.elements[v] = null});
			QuestsUI.newElements.descUI = [];
			RefreshGUI(QuestsUI.descUI, 0);
			
			cont.drawing[1].text = TranAPI.translate("Quests Type: ")+"level";
			QuestsUI.newElements.descUI.push("text");
			cont.elements["text"] = {
				type: "text", x: 20, y: 130, font: {color: Color.WHITE, size: 40},
				text: (TranAPI.translate("level: ")+params.value)
			};
			
			QuestsUI.descUI.getLocation().scrollY = Math.max(200, UI.getScreenHeight());
			RefreshGUI(QuestsUI.descUI, 1);
			QuestsUI.descUI.open();
		}
	},
	output: {
		"item": function(params){
			var cont = QuestsUI.descUI.getContent();
			var uuid = GetUuid();
			var item = TransferItem(params);
			
			QuestsUI.newElements.descUI.forEach(function(v){cont.elements[v] = null});
			QuestsUI.newElements.descUI = [];
			RefreshGUI(QuestsUI.descUI, 0);
			
			cont.drawing[1].text = TranAPI.translate("Reward Type: ")+"item";
			QuestsUI.newElements.descUI.push("slot", uuid+"recipe", "recipe_text", "name", "id", "data", "count");
			cont.elements["slot"] = {type: "slot", visual: true, bitmap: "slot_1", x: 20, y: 20, z: 1, size: 200, source: item};
			cont.elements[uuid+"recipe"] = {type: "button", x: 20, y: 240, z: 1, bitmap: "button_1", scale: 4, clicker: {
				onClick: Debounce(function(){ getRecipeUI(item, false) }, 10),
				onLongClick: Debounce(function(){ getRecipeUI(item, true) }, 10)
			}};
			cont.elements["recipe_text"] = {type: "text", x: 120, y: 240, z: 2, font: {color: Color.BLACK, size: 40, align: 1},
				text: TranAPI.translate("Recipe")};
			cont.elements["name"] = {type: "text", x: 240, y: 90, font: {color: Color.WHITE, size: 40},
				text: (TranAPI.translate("name: ")+Item.getName(item.id, item.data))};
			cont.elements["id"] = {type: "text", x: 240, y: 150, font: {color: Color.WHITE, size: 40},
				text: (TranAPI.translate("id: ")+item.id)};
			cont.elements["data"] = {type: "text", x: 240, y: 210, font: {color: Color.WHITE, size: 40},
				text: (TranAPI.translate("data: ")+item.data)};
			cont.elements["count"] = {type: "text", x: 240, y: 270, font: {color: Color.WHITE, size: 40},
				text: (TranAPI.translate("count: ")+item.count)};
			var height = 320;
			if(params.extra){
				params.extra.forEach(function(v, k){
					switch(v.type){
						case "Name":
							QuestsUI.newElements.descUI.push("name_1");
							cont.elements["name_1"] = {type: "text", x: 240, y: height+10,
								font: {color: Color.WHITE, size: 40},
								text: (TranAPI.translate("name: ")+v.value)};
							height += 60;
						break;
						case "Enchant":
							QuestsUI.newElements.descUI.push("enchant_"+k);
							cont.elements["enchant_"+k] = {type: "text", x: 240, y: height+10,
								font: {color: Color.WHITE, size: 40},
								text: (TranAPI.translate("enchant: ")+v.key+" :"+v.value)};
							height += 60;
						break;
						case "Energy":
							QuestsUI.newElements.descUI.push("energy");
							cont.elements["energy"] = {type: "text", x: 240, y: height+10,
								font: {color: Color.WHITE, size: 40},
								text: (TranAPI.translate("energy: ")+v.value)};
							height += 60;
						break;
						default:
							if((new ItemExtraData())["put"+v.type]){
								QuestsUI.newElements.descUI.push("extra_"+k);
								cont.elements["extra_"+k] = {type: "text", x: 240, y: height+10,
									font: {color: Color.WHITE, size: 40},
									text: (TranAPI.translate("extra: ")+v.key+" : "+v.value)};
								height += 60;
							}
					}
				});
			}
			
			QuestsUI.descUI.getLocation().scrollY = Math.max(height, UI.getScreenHeight());
			RefreshGUI(QuestsUI.descUI, 1);
			QuestsUI.descUI.open();
		},
		"random_item": function(params){
			var ths = this;
			var cont = QuestsUI.descUI.getContent();
			var uuid = GetUuid();
			var item_group = params.items.map(function(v){
				return TransferItem(v);
			});
			var tot = 0;
			params.items.forEach(function(item, _k){tot += item.weight || 0});
			
			QuestsUI.newElements.descUI.forEach(function(v){cont.elements[v] = null});
			QuestsUI.newElements.descUI = [];
			RefreshGUI(QuestsUI.descUI, 0);
			
			var height = 100;
			cont.drawing[1].text = TranAPI.translate("Reward Type: ")+"random_item";
			item_group.forEach(function(item, k){
				QuestsUI.newElements.descUI.push(uuid+"slot_"+k, "text_"+k, "text_1_"+k);
				cont.elements[uuid+"slot_"+k] = {type: "slot", visual: true, bitmap: "slot_1",
					x: 20, y: height+10, z: 1, size: 80, source: item, clicker: {
					onClick: Debounce(function(){ ths["item"](params.items[k]) }, 10)
				}};
				cont.elements["text_"+k] = {type: "text", x: 110, y: height+20, font: {color: Color.WHITE, size: 40},
					text: (TranAPI.translate("name: ")+Item.getName(item.id, item.data))};
				cont.elements["text_1_"+k] = {type: "text", x: 110, y: height+65, font: {color: Color.WHITE, size: 25},
					text: (TranAPI.translate("probability: ")+(Math.round(params.items[k].weight/tot*10000)/100)+"%")};
				height += 100;
			});
			
			QuestsUI.descUI.getLocation().scrollY = Math.max(height, UI.getScreenHeight());
			RefreshGUI(QuestsUI.descUI, 1);
			QuestsUI.descUI.open();
		},
		"select_item": function(params){
			var ths = this;
			var cont = QuestsUI.descUI.getContent();
			var uuid = GetUuid();
			var item_group = params.items.map(function(v){
				return TransferItem(v);
			});
			
			QuestsUI.newElements.descUI.forEach(function(v){cont.elements[v] = null});
			QuestsUI.newElements.descUI = [];
			RefreshGUI(QuestsUI.descUI, 0);
			
			var height = 100;
			cont.drawing[1].text = TranAPI.translate("Reward Type: ")+"select_item";
			item_group.forEach(function(item, k){
				QuestsUI.newElements.descUI.push(uuid+"slot_"+k, "text_"+k);
				cont.elements[uuid+"slot_"+k] = {type: "slot", visual: true, bitmap: "slot_1",
					x: 20, y: height+10, z: 1, size: 80, source: item, clicker: {
					onClick: Debounce(function(){ ths["item"](params.items[k]) }, 10)
				}};
				cont.elements["text_"+k] = {type: "text", x: 110, y: height+30, font: {color: Color.WHITE, size: 40},
					text: (TranAPI.translate("name: ")+Item.getName(item.id, item.data))};
				height += 100;
			});
			
			QuestsUI.descUI.getLocation().scrollY = Math.max(height, UI.getScreenHeight());
			RefreshGUI(QuestsUI.descUI, 1);
			QuestsUI.descUI.open();
		},
		"exp": function(params){
			var cont = QuestsUI.descUI.getContent();
			
			QuestsUI.newElements.descUI.forEach(function(v){cont.elements[v] = null});
			QuestsUI.newElements.descUI = [];
			RefreshGUI(QuestsUI.descUI, 0);
			
			cont.drawing[1].text = TranAPI.translate("Reward Type: ")+"exp";
			QuestsUI.newElements.descUI.push("text");
			cont.elements["text"] = {
				type: "text", x: 20, y: 130, font: {color: Color.WHITE, size: 40},
				text: (TranAPI.translate("exp: ")+params.value)
			};
			
			QuestsUI.descUI.getLocation().scrollY = Math.max(200, UI.getScreenHeight());
			RefreshGUI(QuestsUI.descUI, 1);
			QuestsUI.descUI.open();
		},
		"level": function(params){
			var cont = QuestsUI.descUI.getContent();
			
			QuestsUI.newElements.descUI.forEach(function(v){cont.elements[v] = null});
			QuestsUI.newElements.descUI = [];
			RefreshGUI(QuestsUI.descUI, 0);
			
			cont.drawing[1].text = TranAPI.translate("Reward Type: ")+"level";
			QuestsUI.newElements.descUI.push("text");
			cont.elements["text"] = {
				type: "text", x: 20, y: 130, font: {color: Color.WHITE, size: 40},
				text: (TranAPI.translate("level: ")+params.value)
			};
			
			QuestsUI.descUI.getLocation().scrollY = Math.max(200, UI.getScreenHeight());
			RefreshGUI(QuestsUI.descUI, 1);
			QuestsUI.descUI.open();
		},
		"command": function(params){
			var cont = QuestsUI.descUI.getContent();
			
			QuestsUI.newElements.descUI.forEach(function(v){cont.elements[v] = null});
			QuestsUI.newElements.descUI = [];
			RefreshGUI(QuestsUI.descUI, 0);
			
			var height = 100;
			cont.drawing[1].text = TranAPI.translate("Reward Type: ")+"level";
			params.commands.forEach(function(cmd, k){
				QuestsUI.newElements.descUI.push("text_"+k);
				cont.elements["text_"+k] = {
					type: "text", x: 20, y: height+10, font: {color: Color.WHITE, size: 40},
					text: cmd
				};
				height += 60;
			});
			
			QuestsUI.descUI.getLocation().scrollY = Math.max(height, UI.getScreenHeight());
			RefreshGUI(QuestsUI.descUI, 1);
			QuestsUI.descUI.open();
		}
	}
};