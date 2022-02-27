/// <reference path="../desc.js"/>
System.setOutputType("level", {
	getGui: function({source, chapter, quest}, value, {key, x, y, name, addElement}){
		addElement(name, {
			type: "slot", visual: true, bitmap: "quest_exp_1", size: 80, source: {},
			x: x, y: y, z: 1, clicker: { onClick: Debounce(function(){
				if(Core.isFinished(source, chapter, quest) && !Core.isGotOutput(source, chapter, quest, key)){
					Core.receive(source, chapter, quest, key);
				} else Desc.output["level"](value);
			}, 10)}
		});
		addElement(name+"_text", {
			type: "text", x: x+70, y: y+50, z: 2, text: ""+value.value,
			font: {color: Color.WHITE, size: 20, align: 2}
		});
		addElement(name+"_dot", {
			type: "image", x: x+60, y: y+60, z: 3, width: 25, height: 25,
			bitmap: !Core.isFinished(source, chapter, quest) ? "dot_grey"
			: (Core.isGotOutput(source, chapter, quest, key) ? "clear" : "dot_green")
		});
	},
	onReceive: function({source, chapter, quest}, value, {key, player, info}){
		var actor = new PlayerActor(player);
		actor.setLevel(actor.getLevel()+(value.value-0));
	},
	onFastReceive: function({source, chapter, quest}, value, {key, player}){
		this.onReceive.apply(this, arguments);
		return true;
	}
});