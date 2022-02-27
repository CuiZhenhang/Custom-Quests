/// <reference path="../desc.js"/>
System.setOutputType("item", {
	getGui: function({source, chapter, quest}, value, {key, x, y, name, addElement}){
		addElement(name, {
			type: "slot", visual: true, bitmap: "slot_1", size: 80, source: TransferItem(value),
			x: x, y: y, z: 1, clicker: { onClick: Debounce(function(){
				if(Core.isFinished(source, chapter, quest) && !Core.isGotOutput(source, chapter, quest, key)){
					Core.receive(source, chapter, quest, key);
				} else Desc.output["item"](value);
			}, 10)}
		});
		addElement(name+"_dot", {
			type: "image", x: x+60, y: y+60, z: 2, width: 25, height: 25,
			bitmap: !Core.isFinished(source, chapter, quest) ? "dot_grey"
			: (Core.isGotOutput(source, chapter, quest, key) ? "clear" : "dot_green")
		});
	},
	onReceive: function({source, chapter, quest}, value, {key, player, info}){
		var item = TransferItem(value, true);
		new PlayerActor(player).addItemToInventory(item.id, item.count, item.data, item.extra, true);
	},
	onFastReceive: function({source, chapter, quest}, value, {key, player}){
		this.onReceive.apply(this, arguments);
		return true;
	}
});