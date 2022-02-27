/// <reference path="../desc.js"/>
System.setOutputType("select_item", {
	getGui: function({source, chapter, quest}, value, {key, x, y, name, addElement}){
		addElement(name, {
			type: "slot", visual: true, bitmap: "slot_1", size: 80, source: TransferItem(value.items[0]),
			x: x, y: y, z: 1, clicker: { onClick: Debounce(function(){
				if(Core.isFinished(source, chapter, quest) && !Core.isGotOutput(source, chapter, quest, key)){
					var cont = QuestsUI.selectUI.getContent();
					var uuid = GetUuid();
					QuestsUI.newElements.selectUI.forEach(function(v){cont.elements[v] = void 0});
					QuestsUI.newElements.selectUI = [];
					RefreshGUI(QuestsUI.selectUI, 0);
					
					var recieve = Debounce(function(_k){
						Core.receive(source, chapter, quest, key, _k);
						QuestsUI.selectUI.close();
					}, 20);

					cont.drawing[1].text = TranAPI.translate("Select your reward");
					value.items.forEach(function(item, _k){
						var px = 0;
						if(_k < Math.floor(value.items.length/8)*8) px = 110 + _k%8*100;
						else px = 510 - value.items.length%8*50 + _k%8*100;
						QuestsUI.newElements.selectUI.push(uuid+"item_"+_k);
						cont.elements[uuid+"item_"+_k] = {
							type: "slot", visual: true, bitmap: "slot_1", size: 80, source: TransferItem(item),
							x: px, y: 210+Math.floor(_k/8)*100, clicker: { onClick: function(){ recieve(_k) }
						}};
					});
					RefreshGUI(QuestsUI.selectUI, 1);
					QuestsUI.selectUI.open();
				} else Desc.output["select_item"](value);
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
		if(info < 0) return;
		var item = TransferItem(value.items[info], true);
		new PlayerActor(player).addItemToInventory(item.id, item.count, item.data, item.extra, true);
		Network.getClientForPlayer(player).sendMessage(
		  TranAPI.translate("You got this: ")+Item.getName(item.id, item.data)+" *"+item.count);
	}
});