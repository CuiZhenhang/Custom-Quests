/// <reference path="../desc.js"/>
System.setOutputType("random_item", {
	getGui: function({source, chapter, quest}, value, {key, x, y, name, addElement}){
		addElement(name, {
			type: "slot", visual: true, bitmap: "slot_1", size: 80, source: TransferItem(value.items[0]),
			x: x, y: y, z: 1, clicker: { onClick: Debounce(function(){
				if(Core.isFinished(source, chapter, quest) && !Core.isGotOutput(source, chapter, quest, key)){
					Core.receive(source, chapter, quest, key);
				} else Desc.output["random_item"](value);
			}, 10)}
		});
		addElement(name+"_text", {
			type: "text", x: x+55, y: y, z: 2,
			font: {color: Color.BLACK, size: 20, bold: true}, text: "※"
		});
		addElement(name+"_dot", {
			type: "image", x: x+60, y: y+60, z: 2, width: 25, height: 25,
			bitmap: !Core.isFinished(source, chapter, quest) ? "dot_grey"
			: (Core.isGotOutput(source, chapter, quest, key) ? "clear" : "dot_green")
		});
	},
	onReceive: function({source, chapter, quest}, value, {key, player, info}){
		if(!value.items) return;
		var tot = (value.items||[]).reduce(function(val, item){return (val||0)+item.weight});
		if(tot <= 0) return;
		var temp = tot*Math.random(), result = -1;
		value.items.some(function(item, _k){
			temp -= item.weight || 0;
			result = _k;
			return tot<=0;
		});
		if(result < 0) return;
		
		var item = TransferItem(value.items[result], true);
		new PlayerActor(player).addItemToInventory(item.id, item.count, item.data, item.extra, true);
		Network.getClientForPlayer(player).sendMessage(
		  TranAPI.translate("You got this: ")+Item.getName(item.id, item.data)+" *"+item.count);
	},
	onFastReceive: function({source, chapter, quest}, value, {key, player}){
		this.onReceive.apply(this, arguments);
		return true;
	}
});