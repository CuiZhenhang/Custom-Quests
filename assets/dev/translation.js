/// <reference path="../declarations/core-engine.d.ts"/>
/// <reference path="./other.js"/>
var TranAPI = {
	translation: {},
	language: "en",
	getKeys: function(){
		if(FileTools.isExists(__dir__+"/lang/languages.json")){
			return FileTools.ReadJSON(__dir__ + "/lang/languages.json");
		} else return {};
	},
	intTranslation: function(){
		let languages = TranAPI.getKeys();
		let QB = {}, QB2 = {};
		for(let language in languages) {
			let country = languages[language];
			let languageObject = FileTools.ReadKeyValueFile(__dir__ + "/lang/" + language + ".lang", "=");
			if(!TranAPI.translation[country]){
				TranAPI.translation[country] = {};
			}
			
			for (let str in languageObject) {
				str = str.replace(/\\n/g, "\n");
				TranAPI.translation[country][str] = languageObject[str].replace(/\\n/g, "\n");
			};
			if(languageObject["Quests Book"]) QB[country] = languageObject["Quests Book"].replace(/\\n/g, "\n");
			if(languageObject["Quests Editor Book"]) QB2[country] = languageObject["Quests Editor Book"].replace(/\\n/g, "\n");
			
			let temp = {};
			temp[country] = country;
			Translation.addTranslation("CustomQuests.language", temp);
		}
		TranAPI.language = Translation.translate("CustomQuests.language") || "en";
		Translation.addTranslation("Quests Book", QB);
		Translation.addTranslation("Quests Editor Book", QB2);
	},
	addTranslation: function(str, params){
		for(let country in params){
			if(typeof(params[country]) == "string"){
				if(!TranAPI.translation[country]) TranAPI.translation[country] = {};
				TranAPI.translation[country][str] = params[country];
			}
		}
	},
	translate: function(str){
		if(TranAPI.translation[TranAPI.language] && TranAPI.translation[TranAPI.language][str]){
			return TranAPI.translation[TranAPI.language][str];
		} else if(TranAPI.translation["en"] && TranAPI.translation["en"][str] !== void 0){
			return TranAPI.translation["en"][str];
		} else return str;
	},
	/**
	 * translate and add translation
	 */
	TAT: function(str, source, chapter, quest, type){
		let temp = source || "";
		if(chapter) temp += "."+chapter;
		if(quest) temp += "."+quest;
		if(type) temp += "."+type;
		
		if(!str) str = "";
		if(typeof(str) != "string") TranAPI.addTranslation(temp, str);

		let ret = TranAPI.translate(temp);
		if(ret != temp) return ret;
		else if(typeof(str) == "string") return str || temp;
		else return temp;
	}
};
TranAPI.intTranslation();
