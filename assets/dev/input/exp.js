/// <reference path="../desc.js"/>
System.setInputType("exp", {
	getGui: function({source, chapter, quest}, value, {key, x, y, name, addElement}){
		var finished = Core.isFinishedInput(source, chapter, quest, key);
		addElement(name, {
			type: "slot", visual: true, bitmap: "quest_exp_0", size: 80, source: {},
			x: x, y: y, z: 1, clicker: { onClick: Debounce(function(){ Desc.input["exp"](value) }, 10)}
		});
		addElement(name+"_text", {
			type: "text", x: x+70, y: y+50, z: 2, text: ""+value.value,
			font: {color: Color.WHITE, size: 20, align: 2}
		});
		addElement(name+"_finished", {
			type: "image", x: x+30, y: y+80-50*16/22, z: 3,
			width: 55, height: 55*16/22, bitmap: finished ? "finished" : "clear"
		});
	},
	onTick: function({source, chapter, quest}, value, {key, player}){
		if(!Core.isFinishedInput(source, chapter, quest, key, player)){
			if((new PlayerActor(player)).getExperience() >= value.value){
				Core.finish(source, chapter, quest, key, player);
			}
		}
	}
});