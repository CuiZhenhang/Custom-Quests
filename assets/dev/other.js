/// <reference path="./command.js"/>
IDRegistry.genItemID("quest_book");
Item.createItem("quest_book", "Quests Book", {name: "quest_book"}, {stack: 1});
Recipes.addShapeless({id: ItemID.quest_book, count: 1, data: 0}, [
	{id: VanillaItemID.book, data: 0}, {id: VanillaItemID.string, data: 0}
]);
Item.registerUseFunction("quest_book", function(coords, item, block, player){
	System.openForPlayer(player, "Default", true);
});


var DataJson = ReadPath(__dir__+Setting.path);
FileTools.WriteJSON(__dir__+Setting.path+"CustomQuests.json", DataJson);
PreCalc(DataJson);
System.addSource("Default", JSON.parse(JSON.stringify(DataJson)), true);
Callback.addCallback("ServerPlayerLoaded", function(Uid){
	Network.getClientForPlayer(Uid).send("CustomQuests.Client.init", {data: Data, json: DataJson});
	if(!Book[Uid]){
		new PlayerActor(Uid).addItemToInventory(ItemID.quest_book, 1, 0, null, true);
		Book[Uid] = true;
	}
});
Callback.addCallback("LevelLeft", function(){
	System.deleteSource("Default");
	System.addSource("Default", JSON.parse(JSON.stringify(DataJson)), true);
});


;(function(){
	var func = function(){
		Book = {};
		Data = {};
		Team = {};
		Loaded = {};
		EditorList = {};
		LocalData = {team: null};
		Core.quest = {};
		Editor.data = {};
		Editor.link = {};
		Editor.ability = false;
		Editor.enabled = false;
		Item.setGlint(ItemID.quest_book_editor, false);
		QuestsUI_data.source = null;
		QuestsUI_data.chapter = null;
		QuestsUI_data.quest = null;
	};
	Callback.addCallback("PostLoaded", func);
	Callback.addCallback("LevelLeft", func);
})();


ModAPI.registerAPI("CustomQuestsAPI", {
	version: ["beta", 1, 2, 0],
	dir: __dir__,
	globalFunc: {
		ReadPath: ReadPath,
		PreCalc: PreCalc,
		Debounce: Debounce,
		CheckExtraItem: CheckExtraItem,
		Logic: Logic,
		TransferId: TransferId,
		TransferItem: TransferItem,
		DeTransferId: DeTransferId,
		DeTransferItem: DeTransferItem,
		GetInput: GetInput,
		Dialog: Dialog
	},
	TranAPI: TranAPI,
	System: System,
	Core: Core,
	Editor: Editor,
	QuestsUI: QuestsUI,
	Desc: Desc,
	requireGlobal: function(cmd){ return eval(cmd) }
});
Logger.Log("The API of Custom Quests is named CustomQuestsAPI.", "API");
