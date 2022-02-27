/// <reference path="../desc.js"/>
System.setInputType("item_group", {
	getGui: function({source, chapter, quest}, value, {key, x, y, name, addElement}){
		var finished = Core.isFinishedInput(source, chapter, quest, key);
		addElement(name, {
			type: "slot", visual: true, bitmap: "slot_1", size: 80, source: TransferItem(value.items[0]),
			x: x, y: y, z: 1, clicker: { onClick: Debounce(function(){ Desc.input["item_group"](value) }, 10)}
		});
		addElement(name+"_text", {
			type: "text", x: x+55, y: y, z: 2,
			font: {color: Color.BLACK, size: 20, bold: true}, text: "※"
		});
		addElement(name+"_finished", {
			type: "image", x: x+30, y: y+80-50*16/22, z: 2,
			width: 55, height: 55*16/22, bitmap: finished ? "finished" : "clear"
		});
	},
	onTick: function({source, chapter, quest}, value, {key, player, package, extra_package}){
		if(!Core.isFinishedInput(source, chapter, quest, key, player)){
			var is_finished = false;
			value.items.forEach(function(v_item){
				if(is_finished) return;
				if(v_item.id == 0){
					Core.finish(source, chapter, quest, key, player);
					is_finished = true;
				} else if(v_item.extra){
					var result_item = extra_package[TransferId(v_item.id, true)+":"+(typeof(v_item.data)=="number" ? v_item.data : "-1")];
					var result_count = 0;
					if(result_item) result_item.forEach(function(item){
						if(CheckExtraItem(item, v_item.extra)) result_count += item.count;
					});
					if(result_count >= v_item.count){
						Core.finish(source, chapter, quest, key, player);
						is_finished = true;
					};
				} else {
					if(package[TransferId(v_item.id, true)+":"+(typeof(v_item.data)=="number" ? v_item.data : "-1")] >= v_item.count){
						Core.finish(source, chapter, quest, key, player);
						is_finished = true;
					}
				}
			});
		}
	}
});