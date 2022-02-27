/// <reference path="./edit.js"/>
var GetInput = function({hint, title, text, button}, func){
	UI.getContext().runOnUiThread(new java.lang.Runnable({run: function(){
		try{
			const editText = new android.widget.EditText(UI.getContext());
			editText.setHint(hint || " ");
			editText.setSingleLine(true);
			if(typeof text == "string") editText.setText(text);
			new android.app.AlertDialog.Builder(UI.getContext())
				.setTitle(title || " ")
				.setView(editText)
				.setPositiveButton(button || TranAPI.translate("Confirm"),
					new android.content.DialogInterface.OnClickListener({
						onClick: Debounce(function(){
							if(func) func(editText.getText().toString()+"");
						}, 10)
				}))
				.setNegativeButton(TranAPI.translate("Cancel"), null)
				.show();
		}catch(e){}
	}}));
};

var Dialog = function({title, text, button}, func){
	UI.getContext().runOnUiThread(new java.lang.Runnable({run: function(){
		try{
			new android.app.AlertDialog.Builder(UI.getContext())
				.setTitle(title || " ")
				.setMessage(text)
				.setPositiveButton(button || TranAPI.translate("Confirm"),
					new android.content.DialogInterface.OnClickListener({
						onClick: Debounce(function(){
							if(func) func();
						}, 10)
				}))
				.setNegativeButton(TranAPI.translate("Cancel"), null)
				.show();
		}catch(e){}
	}}));
}

var RefreshGUIType = function(size){
	Setting.UIsize = size;
	__config__.set("setting.UIsize", size);
	__config__.save();
	if(Setting.UIsize%1 == 0 && QuestsUI_data.location[Setting.UIsize]){
		QuestsUI.parentUI.getLocation().width = QuestsUI_data.location[Setting.UIsize].width;
		QuestsUI.parentUI.getLocation().scrollX = QuestsUI_data.location[Setting.UIsize].scrollX;
		QuestsUI.parentUI.getLocation().scrollY = QuestsUI_data.location[Setting.UIsize].scrollY;
		var elem = QuestsUI.parentUI.getContent().elements;
		QuestsUI.newElements.parentUI.forEach(function(v){
			if(elem[v] && elem[v].refresh){
				var temp = elem[v].size;
				elem[v].size = elem[v].size+Math.random()/1000000;
				if(elem[v].size == temp) elem[v].size = temp-1/1000000;
			}
		});
		QuestsUI.setting.getContent().elements["ui_text"].text = TranAPI.translate("GUI type: ")+
			TranAPI.translate(QuestsUI_data.location[Setting.UIsize].name);
	} else RefreshGUIType(1);
};

var RefreshGUI = function(ui, mode){
	if(!ui) return;
	if(mode){
		if(ui.isOpened()){
			ui.updateWindowLocation();
		}
	} else {
		ui.invalidateDrawing(false);
		ui.invalidateElements(false);
	}
};


var QuestsUI_bitmap = {
	"accept": "accept", "accept_grey": "accept_grey", "ach1_0": "ach1_0", "ach1_1": "ach1_1",
	"ach2_0": "ach2_0", "ach2_1": "ach2_1", "ach3_0": "ach3_0", "ach3_1": "ach3_1",
	"arrow_edit_0": "arrow_edit_0", "arrow_edit_1": "arrow_edit_1", "button": "button", "button_1": "button_1",
	"button_chapter": "button_chapter", "button_more": "button_more", "button_quest": "button_quest", "button_source": "button_source",
	"chapter_bg": "chapter_bg", "child": "child", "choose": "choose", "clear": "clear",
	"delete": "delete", "dot_blue": "dot_blue", "dot_green": "dot_green", "dot_grey": "dot_grey",
	"dot_red": "dot_red", "father": "father", "finished": "finished", "frame": "frame",
	"frame_edit": "frame_edit", "frame_edit_head": "frame_edit_head", "home": "home", "icon_command": "icon_command",
	"info": "info", "info_bg": "info_bg", "menu": "menu", "quest_exp_0": "quest_exp_0",
	"quest_exp_1": "quest_exp_1", "refresh": "refresh", "remind": "remind", "slot_0": "slot_0",
	"slot_1": "slot_1"
};

var QuestsUI_data = {
	source: null, chapter: null, quest: null, size: 1, hw: 9/16,
	location: [
		{name: "Small", width: (UI.getScreenHeight()-60)*16/9, scrollX: (UI.getScreenHeight()-60)*16/9, scrollY: UI.getScreenHeight()-60},
		{name: "Standard", width: 1000-Setting.padding, scrollX: 1000-Setting.padding, scrollY: (1000-Setting.padding)*9/16},
		{name: "Big", width: 1000-Setting.padding, scrollX: 2000-2*Setting.padding, scrollY: (2000-2*Setting.padding)*9/16}
	]
};

var QuestsUI = {
	newElements: {
		main: [],
		parentUI: [],
		parentUI_1: [],
		chapterUI: [],
		questUI: [],
		FatherChildUI: [],
		descUI: [],
		selectUI: [],
		selectionUI: []
	},
	menu: new UI.Window({
		location: {x: 500-(UI.getScreenHeight()-60)/(QuestsUI_data.hw+0.1)/2, y: 30, width: (UI.getScreenHeight()-60)/(QuestsUI_data.hw+0.1), height: UI.getScreenHeight()-60},
//location: width: x*hw+60+x/1000*100=ScreenHeight    (hw = bitmap.height/bitmap.width)
		drawing: [
			{type: "background", color: Color.parseColor("#00000000")},
			{type: "bitmap", bitmap: "menu", x: 0, y: 0, width: 1000, height: 1000/16*9},
		],
		elements: {
			"quest_button": {type: "button", x: 0, y: 1000*9/16, z: 1, bitmap: "button_1", scale: 5, clicker: {
				onClick: Debounce(function(){
					if(LocalData.team){
						QuestsUI.main.open();
						QuestsUI.menu.close();
					} else {
						alert(TranAPI.translate("Sorry, you must join a team first."));
					}
				}, 10)}},
			"team_button": {type: "button", x: 250, y: 1000*9/16, z: 1, bitmap: "button_1", scale: 5, clicker: {
				onClick: Debounce(function(){ QuestsUI.team.open(); QuestsUI.menu.close(); }, 10)}},
			"setting_button": {type: "button", x: 500, y: 1000*9/16, z: 1, bitmap: "button_1", scale: 5, clicker: {
				onClick: Debounce(function(){ QuestsUI.setting.open(); QuestsUI.menu.close(); }, 10)}},
			"exit_button": {type: "button", x: 750, y: 1000*9/16, z: 1, bitmap: "button_1", scale: 5, clicker: {
				onClick: Debounce(function(){ QuestsUI.menu.close() }, 10)}},
			"quest_text": {type: "text", text: TranAPI.translate("Quests"), x: 125, y: 1000*9/16+10, z: 2, font: {color: Color.BLACK, size: 40, align: 1}},
			"team_text": {type: "text", text: TranAPI.translate("Team"), x: 375, y: 1000*9/16+10, z: 2, font: {color: Color.BLACK, size: 40, align: 1}},
			"setting_text": {type: "text", text: TranAPI.translate("Settings"), x: 625, y: 1000*9/16+10, z: 2, font: {color: Color.BLACK, size: 40, align: 1}},
			"exit_text": {type: "text", text: TranAPI.translate("Exit"), x: 875, y: 1000*9/16+10, z: 2, font: {color: Color.BLACK, size: 40, align: 1}},
		}
	}),
	team: new UI.Window({
		drawing: [
			{type: "frame", x: 0, y: 0, width: 1000, height: UI.getScreenHeight(), bitmap: "frame", scale: 0},
			{type: "frame", x: 0, y: 0, width: 1000, height: 60, bitmap: "frame", scale: 4},
			{type: "text", text: TranAPI.translate("Team"), x: 100, y: 40, width: 100, height: 40, font: {color: Color.BLACK}},
		],
		elements: {
			"close": {type: "button", x: 947, y: 12, bitmap: "X", bitmap2: "XPress", scale: 36/19, clicker: {
				onClick: Debounce(function(){ QuestsUI.team.close() }, 10)}},
			"home": {type: "button", x: 12, y: 12, bitmap: "home", scale: 36/25, clicker: {
				onClick: Debounce(function(){ QuestsUI.team.close(); QuestsUI.menu.open(); }, 10)}},
			"info": {type: "button", x: 54, y: 12, bitmap: "info", scale: 36/16, clicker: {
				onClick: Debounce(function(){ Dialog({title: "CustomQuest", text: TranAPI.translate("CustomQuests.dialog")}) }, 10)}},
			"ui_text": {type: "text", x: 50, y: 110, font: {color: Color.BLACK, size: 40}, text: ""},
			"ui_button_0": {
				type: "button", x: 50, y: 170, z: 1, bitmap: "button_1", scale: 5, clicker: {
					onClick: Debounce(function(){
						if(LocalData.team){
							Dialog({
								title: TranAPI.translate("Warn"),
								text: TranAPI.translate("Are you sure to quit the team?")
							}, function(){
								runOnClientThread(function(){
									Network.sendToServer("CustomQuests.Server.setTeam", {type: "exit", team: LocalData.team});
								});
							});
						} else {
							GetInput({
								hint: TranAPI.translate("Create a team"),
								title: TranAPI.translate("Please enter your team\'name."),
								button: TranAPI.translate("Create")
							}, function(keyword){
								if(!keyword) alert(TranAPI.translate("Failed: Please do not enter nothing."));
								else if(keyword.length > 10) alert(TranAPI.translate("Failed: Text too long."));
								else if(keyword.match(" ") || keyword.match("\n")) alert(TranAPI.translate("Failed: Please do not enter space or line break."));
								else if(Data[keyword]) alert(TranAPI.translate("Failed: The team already exists."));
								else runOnClientThread(function(){
									Network.sendToServer("CustomQuests.Server.setTeam", {type: "create", team: keyword});
								});
							});
						}
				}, 10)}},
			"ui_text_0": {type: "text", text: "", x: 175, y: 180, z: 2, font: {color: Color.BLACK, size: 40, align: 1}},
			"ui_button_1": {
				type: "button", x: 550, y: 170, z: 1, bitmap: "button_1", scale: 5, clicker: {
					onClick: Debounce(function(){
						if(LocalData.team){
							Dialog({
								title: TranAPI.translate("Invitation Password"),
								text: Encrypt(LocalData.team)
							});
						} else {
							GetInput({
								hint: TranAPI.translate("Join a team"),
								title: TranAPI.translate("Please enter the Invitation Password."),
								button: TranAPI.translate("Join")
							}, function(keyword){
								if(!keyword) alert(TranAPI.translate("Failed: Please do not enter nothing."));
								else runOnClientThread(function(){
									Network.sendToServer("CustomQuests.Server.setTeam", {type: "join", password: keyword});
								});
							});
						}
				}, 10)}},
			"ui_text_1": {type: "text", text: "", x: 675, y: 180, z: 2, font: {color: Color.BLACK, size: 40, align: 1}}
		},
	}),
	setting: new UI.Window({
		drawing: [
			{type: "frame", x: 0, y: 0, width: 1000, height: UI.getScreenHeight(), bitmap: "frame", scale: 0},
			{type: "frame", x: 0, y: 0, width: 1000, height: 60, bitmap: "frame", scale: 4},
			{type: "text", text: TranAPI.translate("Settings"), x: 100, y: 40, width: 100, height: 40, font: {color: Color.BLACK}},
		],
		elements: {
			"close": {type: "button", x: 947, y: 12, bitmap: "X", bitmap2: "XPress", scale: 36/19, clicker: {
				onClick: Debounce(function(){ QuestsUI.setting.close() }, 10)}},
			"home": {type: "button", x: 12, y: 12, bitmap: "home", scale: 36/25, clicker: {
				onClick: Debounce(function(){ QuestsUI.setting.close(); QuestsUI.menu.open(); }, 10)}},
			"info": {type: "button", x: 54, y: 12, bitmap: "info", scale: 36/16, clicker: {
				onClick: Debounce(function(){ Dialog({title: "CustomQuest", text: TranAPI.translate("CustomQuests.dialog")}) }, 10)}},
			"ui_text": {type: "text", x: 50, y: 110, font: {color: Color.BLACK, size: 40},
				text: TranAPI.translate("GUI type: ")+TranAPI.translate(QuestsUI_data.location[Setting.UIsize].name)},
			"ui_button_0": {type: "button", x: 50, y: 170, z: 1, bitmap: "button_1", scale: 5, clicker: {
				onClick: Debounce(function(){RefreshGUIType(0)}, 10)}},
			"ui_text_0": {type: "text", text: TranAPI.translate("Small"), x: 175, y: 180, z: 2, font: {color: Color.BLACK, size: 40, align: 1}},
			"ui_button_1": {type: "button", x: 375, y: 170, z: 1, bitmap: "button_1", scale: 5, clicker: {
				onClick: Debounce(function(){RefreshGUIType(1)}, 10)}},
			"ui_text_1": {type: "text", text: TranAPI.translate("Standard"), x: 500, y: 180, z: 2, font: {color: Color.BLACK, size: 40, align: 1}},
			"ui_button_2": {type: "button", x: 700, y: 170, z: 1, bitmap: "button_1", scale: 5, clicker: {
				onClick: Debounce(function(){RefreshGUIType(2)}, 10)}},
			"ui_text_2": {type: "text", text: TranAPI.translate("Big"), x: 825, y: 180, z: 2, font: {color: Color.BLACK, size: 40, align: 1}},
		},
	}),
	main: new UI.Window({
		drawing: [
			{type: "frame", x: 0, y: 0, width: 1000, height: UI.getScreenHeight(), bitmap: "frame", scale: 0},
			{type: "frame", x: 0, y: 0, width: 1000, height: 60, bitmap: "frame", scale: 4},
			{type: "text", text: TranAPI.translate("Quests"), x: 100, y: 40, width: 100, height: 40, font: {color: Color.BLACK}},
			{type: "frame", x: 0, y: 59, width: 70, height: UI.getScreenHeight()-57, bitmap: "frame", scale: 1},
			{type: "frame", x: 70, y: 60, width: 930, height: UI.getScreenHeight()-60, bitmap: "frame", scale: 0},
		],
		elements: {
			"close": {type: "button", x: 947, y: 12, bitmap: "X", bitmap2: "XPress", scale: 36/19, clicker: {
				onClick: Debounce(function(){ QuestsUI.main.close() }, 10)}},
			"edit": {
				type: "slot", x: 900, y: 10, size: 40, bitmap: "clear", source: {id: VanillaItemID.feather, count: 1}, clicker: {
					onClick: Debounce(function(){ Editor.create() }, 10)}
			},
			"home": {type: "button", x: 12, y: 12, bitmap: "home", scale: 36/25, clicker: {
				onClick: Debounce(function(){ QuestsUI.main.close();QuestsUI.menu.open(); }, 10)}},
			"info": {type: "button", x: 54, y: 12, bitmap: "info", scale: 36/16, clicker: {
				onClick: Debounce(function(){ Dialog({title: "CustomQuest", text: TranAPI.translate("CustomQuests.dialog")}) }, 10)}},
		},
	}),
	parentUI: new UI.Window({
		location: {
			x: Setting.padding, y: 60,
			width: QuestsUI_data.location[Setting.UIsize].width,
			height: UI.getScreenHeight()-60,
			scrollX: QuestsUI_data.location[Setting.UIsize].scrollX,
			scrollY: QuestsUI_data.location[Setting.UIsize].scrollY
		},
		drawing: [
			{type: "background", color: Color.parseColor("#00000000")},
			{type: "bitmap", bitmap: "chapter_bg", x: 0, y: 0, width: 1000, height: 1000/16*9},
		],
		elements: {},
	}),
	parentUI_1: new UI.Window({
		location: {x: 0, y: 60, width: Setting.padding, height: UI.getScreenHeight()-60, scrollY: 0},
		drawing: [
			{type: "background", color: Color.parseColor("#00000000")},
			{type: "bitmap", bitmap: "choose", x: 800, y: 0, width: 200, height: 800}
		],
		elements: {
			"more": {type: "button", x: 0, y: 0, bitmap: "button_more", scale: 800/16, clicker: {
				onClick: Debounce(function(){ QuestsUI.chapterUI.open() }, 10)}},
		},
	}),
	chapterUI: new UI.Window({
		location: {x: 0, y: 60, width: Setting.padding*5, height: UI.getScreenHeight()-60, scrollY: 0},
		drawing: [
			{type: "background", color: Color.parseColor("#00000000")},
			{type: "frame", x: 0, y: 0, width: 1000, height: (UI.getScreenHeight()-60)*1000/(Setting.padding*5), bitmap: "frame", scale: 5},
			{type: "bitmap", bitmap: "choose", x: 160, y: 100, width: 40, height: 160}
		],
		elements: {
			"close": {type: "button", x: 910, y: 10, bitmap: "X", bitmap2: "XPress", scale: 80/19, clicker: {
				onClick: Debounce(function(){ QuestsUI.chapterUI.close() }, 10)}},
		},
	}),
	questUI: new UI.Window({
		location: {x: 200, y: (UI.getScreenHeight()-400)/2, width: 600, height: 400, scrollY: 400},
		drawing: [
			{type: "background", color: Color.parseColor("#00000000")},
			{type: "frame", x: 0, y: 0, width: 1000, height: 1000*400/600, bitmap: "frame", scale: 4},
			{type: "text", text: "", x: 100, y: 70, font: {color: Color.BLACK, size: 40}},
			{type: "line", x1: 0, y1: 100, x2: 1000, y2: 100, width: 5, color: Color.parseColor("#000000")},
			{type: "line", x1: 0, y1: 200, x2: 1000, y2: 200, width: 5, color: Color.parseColor("#000000")},
			{type: "line", x1: 500, y1: 100, x2: 500, y2: 200, width: 5, color: Color.parseColor("#000000")},
			{type: "text", text: TranAPI.translate("Quests"), x: 250, y: 125, font: {color: Color.BLACK, size: 30, align: 1}},
			{type: "text", text: TranAPI.translate("Reward"), x: 750, y: 125, font: {color: Color.BLACK, size: 30, align: 1}},
		],
		elements: {
			"close": {type: "button", x: 920, y: 20, bitmap: "X", bitmap2: "XPress", scale: 60/19, clicker: {
				onClick: Debounce(function(){ QuestsUI.questUI.close() }, 10)}},
			"refresh": {type: "button", x: 840, y: 20, bitmap: "refresh", scale: 60/16, clicker: {
				onClick: Debounce(function(){ Core.refreshQuests(QuestsUI_data.source, QuestsUI_data.chapter, QuestsUI_data.quest, null) }, 10)}},
			"father": {type: "button", x: 20, y: 105, bitmap: "father", scale: 40/48, clicker: {
				onClick: Debounce(function(){ System.quest.getFatherUI(QuestsUI_data.source, QuestsUI_data.chapter, QuestsUI_data.quest) }, 10)}},
			"child": {type: "button", x: 940, y: 105, bitmap: "child", scale: 40/48, clicker: {
				onClick: Debounce(function(){ System.quest.getChildUI(QuestsUI_data.source, QuestsUI_data.chapter, QuestsUI_data.quest) }, 10)}},
			"slot": {type: "slot", visual: true, bitmap: "slot_0", x: 20, y: 20, z: 1, size: 70, source: {}, darken: false},
		},
	}),
	FatherChildUI: new UI.Window({
		location: {x: 0, y: 0, width: 200, height: UI.getScreenHeight(), scrollY: UI.getScreenHeight()},
		drawing: [
			{type: "background", color: Color.parseColor("#00000000")},
			{type: "frame", x: 0, y: 0, width: 1000, height: UI.getScreenHeight()*5, bitmap: "frame", scale: 4},
			{type: "text", text: "", x: 50, y: 140, font: {color: Color.BLACK, size: 80}},
			{type: "line", x1: 0, y1: 200, x2: 1000, y2: 200, width: 5, color: Color.parseColor("#000000")},
		],
		elements: {
			"close": {type: "button", x: 810, y: 10, bitmap: "X", bitmap2: "XPress", scale: 180/19, clicker: {
				onClick: Debounce(function(){ QuestsUI.FatherChildUI.close() }, 10)}},
		},
	}),
	descUI: new UI.Window({
		location: {x: 200, y: 0, width: 600, height: UI.getScreenHeight(), scrollY: 0},
		drawing: [
			{type: "background", color: Color.parseColor("#CC000000")},
			{type: "text", text: "", x: 240, y: 70, font: {color: Color.WHITE, size: 40}},
		],
		elements: {
			"close": {type: "button", x: 920, y: 20, bitmap: "X", bitmap2: "XPress", scale: 60/19, clicker: {
				onClick: Debounce(function(){ QuestsUI.descUI.close() }, 10)}}
		},
	}),
	selectUI: new UI.Window({
		location: {x: 0, y: 0, width: 1000, height: UI.getScreenHeight()},
		drawing: [
			{type: "background", color: Color.parseColor("#80000000")},
			{type: "text", text: "", x: 500, y: 100, font: {color: Color.WHITE, size: 40, align: 1}}
		],
		elements: {
			"close": {type: "button", x: 920, y: 20, bitmap: "X", bitmap2: "XPress", scale: 60/19, clicker: {
				onClick: Debounce(function(){ QuestsUI.selectUI.close() }, 10)}},
		}
	}),
	packageUI: new UI.Window({
		location: {
			x: (1000-UI.getScreenHeight()*3/5*1000/590)/2,
			y: UI.getScreenHeight()/5,
			width: UI.getScreenHeight()*3/5*1000/590,
			height: UI.getScreenHeight()*3/5
		},
		drawing: [
			{type: "background", color: Color.parseColor("#00000000")},
			{type: "frame", x: 0, y: 0, width: 1000, height: 590, bitmap: "frame", scale: 4},
			{type: "text", text: TranAPI.translate("Inventory"), x: 40, y: 80, font: {size: 50, color: Color.BLACK}},
		],
		elements: {
			"close": {type: "button",  x: 910, y: 20, bitmap: "X", bitmap2: "XPress", scale: 80/19, clicker: {
				onClick: Debounce(function(){ QuestsUI.packageUI.close() }, 10)}},
		}
	}),
	selectionUI: new UI.Window({
		location: {x: 300, y: (UI.getScreenHeight()-400)/2, width: 400, height: 400, scrollY: 400},
		drawing: [
			{type: "background", color: Color.parseColor("#00000000")},
			{type: "frame", x: 0, y: 0, width: 1000, height: 1000*400/400, bitmap: "frame", scale: 4},
			{type: "text", x: 500, y: 75, text: TranAPI.translate("Selection"), font: {size: 60, color: Color.BLACK, align: 1}}
		],
		elements: {
			"close": {type: "button",  x: 910, y: 10, bitmap: "X", bitmap2: "XPress", scale: 80/19, clicker: {
				onClick: Debounce(function(){ QuestsUI.selectionUI.close() }, 10)}},
		}
	})
};

;(function(){
	QuestsUI.packageUI.setInventoryNeeded(true);
	var elem = QuestsUI.packageUI.getContent().elements;
	var size = 960/9;
	elem["function"] = {func: function(){}};
	for(let i=0; i<36; i++){
		var x=(i%9)*size+20, y=Math.floor(i/9)*size+120+(i>=27?20:0);
		let index = i+9;
		elem["invSlot"+i] = {type: "invSlot", x: x, y: y, z: 1, size: size, index: index, clicker: {}};
		elem["Slot"+i] = {type: "slot", x: x, y: y, z: 2, size: size, bitmap: "clear", visual: true,
			clicker: { onClick: Debounce(function(){ elem["function"].func(index) }, 10)}};
	}
})();

QuestsUI.menu.setCloseOnBackPressed(true);
QuestsUI.team.setCloseOnBackPressed(true);
QuestsUI.setting.setCloseOnBackPressed(true);
QuestsUI.main.setCloseOnBackPressed(true);
QuestsUI.chapterUI.setCloseOnBackPressed(true);
QuestsUI.questUI.setCloseOnBackPressed(true);
QuestsUI.FatherChildUI.setCloseOnBackPressed(true);
QuestsUI.descUI.setCloseOnBackPressed(true);
QuestsUI.selectUI.setCloseOnBackPressed(true);
QuestsUI.packageUI.setCloseOnBackPressed(true);
QuestsUI.selectionUI.setCloseOnBackPressed(true);

QuestsUI.menu.setBlockingBackground(true);
QuestsUI.packageUI.setBlockingBackground(true);
QuestsUI.selectionUI.setBlockingBackground(true);

QuestsUI.team.setEventListener({
	onOpen: function(){
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
});
QuestsUI.main.setEventListener({
	onOpen: function(){
		QuestsUI.parentUI.open();
		QuestsUI.parentUI_1.open();
	},
	onClose: function(){
		QuestsUI.questUI.close();
		QuestsUI.chapterUI.close();
		QuestsUI.parentUI_1.close();
		QuestsUI.parentUI.close();
	}
});
QuestsUI.questUI.setEventListener({
	onClose: function(){
		QuestsUI.FatherChildUI.close();
		QuestsUI.descUI.close();
		QuestsUI.selectUI.close();
	}
});
