/// <reference path="../desc.js"/>
System.setOutputType("command", {
	getGui: function({source, chapter, quest}, value, {key, x, y, name, addElement}){
		addElement(name, {
			type: "slot", visual: true, bitmap: "icon_command", size: 80, source: {},
			x: x, y: y, z: 1, clicker: { onClick: Debounce(function(){
				if(Core.isFinished(source, chapter, quest) && !Core.isGotOutput(source, chapter, quest, key)){
					Core.receive(source, chapter, quest, key);
				} else Desc.output["command"](value);
			}, 10)}
		});
		addElement(name+"_dot", {
			type: "image", x: x+60, y: y+60, z: 3, width: 25, height: 25,
			bitmap: !Core.isFinished(source, chapter, quest) ? "dot_grey"
			: (Core.isGotOutput(source, chapter, quest, key) ? "clear" : "dot_green")
		});
	},
	onReceive: function({source, chapter, quest}, value, {key, player, info}){
		runOnMainThread(function(){
			var pos = Entity.getPosition(player);
			value.commands.forEach(function(cmd){
				Commands.execAt(cmd, pos.x, pos.y, pos.z);
			});
		});
	},
	onFastReceive: function({source, chapter, quest}, value, {key, player}){
		this.onReceive.apply(this, arguments);
		return true;
	}
});
