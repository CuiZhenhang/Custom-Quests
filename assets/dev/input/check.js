/// <reference path="../desc.js"/>
System.setInputType("check", {
	getGui: function({source, chapter, quest}, value, {key, x, y, name, addElement}){
		var finished = Core.isFinishedInput(source, chapter, quest, key);
		addElement(name, {
			type: "button", bitmap: finished ? "accept" : "accept_grey", x: x, y: y, scale: 5,
			clicker: { onClick: Debounce(function(){
				if(!Core.isLocked_Local(source, chapter, quest) && !Core.isFinished(source, chapter, quest)){
					Core.finish(source, chapter, quest, key);
				}
			}, 10)}
		});
	}
});