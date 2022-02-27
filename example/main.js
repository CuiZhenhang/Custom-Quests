//define quests for your mods.
ModAPI.addAPICallback("CustomQuestsAPI", function(API){
	//some data
	const packetName = "Example.Client.init";
	const my_source = "Test";
	const showInfo = true;
	var my_json = API.globalFunc.ReadPath(__dir__+"custom/");
	API.globalFunc.PreCalc(my_json);

	//to work correctly
	API.System.addSource(my_source, JSON.parse(JSON.stringify(my_json), showInfo));
	Network.addClientPacket(packetName, function(T){
		if(T && T.json){
			API.System.deleteSource(my_source);
			API.System.addSource(my_source, T.json, showInfo);
		}
	});
	Callback.addCallback("ServerPlayerLoaded", function(player){
		Network.getClientForPlayer(player).send(packetName, {json: my_json});
	});
	Callback.addCallback("LevelLeft", function(){
		API.System.deleteSource(my_source);
		API.System.addSource(my_source, JSON.parse(JSON.stringify(my_json), showInfo));
	});

	//to use
	Item.registerUseFunction(280, function(coords, item, block, player){
		API.System.openForPlayer(player, my_source);
	});
});
