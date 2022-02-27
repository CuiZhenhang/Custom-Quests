/// <reference path="../desc.js"/>
System.setInputType("item", {
	getGui: function({source, chapter, quest}, value, {key, x, y, name, addElement}){
		var finished = Core.isFinishedInput(source, chapter, quest, key);
		addElement(name, {
			type: "slot", visual: true, bitmap: "slot_1", size: 80, source: TransferItem(value),
			x: x, y: y, z: 1, clicker: { onClick: Debounce(function(){ Desc.input["item"](value) }, 10)}
		});
		addElement(name+"_finished", {
			type: "image", x: x+30, y: y+80-50*16/22, z: 2,
			width: 55, height: 55*16/22, bitmap: finished ? "finished" : "clear"
		});
	},
	onTick: function({source, chapter, quest}, value, {key, player, package, extra_package}){
		if(!Core.isFinishedInput(source, chapter, quest, key, player)){
			if(value.id == 0){
				Core.finish(source, chapter, quest, key, player);
			} else if(value.extra){
				var result_item = extra_package[TransferId(value.id, true)+":"+(typeof(value.data)=="number" ? value.data : "-1")];
				var result_count = 0;
				if(result_item) result_item.forEach(function(item){
					if(CheckExtraItem(item, value.extra)) result_count += item.count;
				});
				if(result_count >= value.count){
					Core.finish(source, chapter, quest, key, player);
				};
			} else {
				if(package[TransferId(value.id, true)+":"+(typeof(value.data)=="number" ? value.data : "-1")] >= value.count){
					Core.finish(source, chapter, quest, key, player);
				}
			}
		}
	}
});