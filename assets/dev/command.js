/// <reference path="./desc.js"/>

;(function(){
	const runJs = false;
	var toLower = function(str){
		if(typeof str != "string") return "";
		return str.toLowerCase();
	};
	ServerPacket.addPacket("command.clearData", function(client, T){
		switch(T.player){
			case "@p":
			case "@s":
				Core.clearData(client.getPlayerUid());
			break;
			case "@r":
				let tmp = Network.getConnectedPlayers();
				Core.clearData(tmp[Math.floor(tmp.length*Math.random())]);
			break;
			case "@e":
			case "@a":
				let tmp = Network.getConnectedPlayers();
				for(let i=0; i<tmp.length; i++){
					Core.clearData(tmp[i]);
				}
			break;
			default: 
				let tmp = Network.getConnectedPlayers();
				for(let i=0; i<tmp.length; i++){
					if(Entity.getNameTag(tmp[i])==T.player){
						Core.clearData(tmp[i]);
					}
				}
		}
	});
	ServerPacket.addPacket("command.edit", function(client, T){
		T.enabled = Boolean(T.enabled);
		switch(T.player){
			case "@p":
			case "@s":
				Editor.setEditor(client.getPlayerUid(), T.enabled);
			break;
			case "@r":
				let tmp = Network.getConnectedPlayers();
				Editor.setEditor(tmp[Math.floor(tmp.length*Math.random())], T.enabled);
			break;
			case "@e":
			case "@a":
				let tmp = Network.getConnectedPlayers();
				for(let i=0; i<tmp.length; i++)
				Editor.setEditor(tmp[i], T.enabled);
			break;
			default: 
				let tmp = Network.getConnectedPlayers();
				for(let i=0; i<tmp.length; i++){
					if(Entity.getNameTag(tmp[i])==T.player){
						Editor.setEditor(tmp[i], T.enabled);
					}
				}
		}
	});
	Callback.addCallback("NativeCommand", function(str){
		var cmd = str.split(" ");
		if(toLower(cmd[0]) == "/cq"){
			if(Player.getBooleanAbility("op")){
				switch(toLower(cmd[1])){
					case "cleardata":
						Network.sendToServer("CustomQuests.Server.eval", {
							name: "command.clearData",
							player: toLower(cmd[2])
						});
					break;
					case "edit":
						cmd[3] = toLower(cmd[3]);
						if(cmd[3] == "true" || cmd[3] == "false"){
							Network.sendToServer("CustomQuests.Server.eval", {
								name: "command.edit",
								player: toLower(cmd[2]), enabled: cmd[3] == "true"
							});
						} else Game.message("§c"+"/cq edit <player: target> <enabled: boolean>");
					break;
					case "js":
						if(runJs){
							cmd.splice(0, 2);
							eval(cmd.join(" "));
							break;
						}
					default:
						Game.message("§c"+TranAPI.translate("CustomQuests.help"));
				}
			} else Game.message("§c<CustomQuests>: "+TranAPI.translate("Sorry, you don't have op."));
			Game.prevent();
		}
	});
})();
