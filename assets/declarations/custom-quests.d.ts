/// <reference path="./core-engine.d.ts"/>

declare type TextJson = string|{[language: string]: string};
declare interface ExtraJson {type: string, key?: string, value?: any, logic?: string}
declare interface ItemJson {id: string|number, count?: number, data?: number, extra?: ExtraJson[]}
declare interface IconJson {bitmap?: string, id?: string|number, count?: number, data?: number, extra?: ExtraJson[]}


declare interface IOJson_Base {
	type: string;
	[key: string]: any;
}

declare interface InputJson_check extends IOJson_Base{
	type: "check";
}
declare interface InputJson_item extends ItemJson, IOJson_Base {
	type: "item";
}
declare interface InputJson_item_group extends IOJson_Base {
	type: "item_group";
	items: ItemJson[];
}
declare interface InputJson_exp extends IOJson_Base {
	type: "exp";
	value: number;
}
declare interface InputJson_level extends IOJson_Base {
	type: "level";
	value: number;
}
declare type InputJson = (
	IOJson_Base
	| InputJson_check
	| InputJson_item
	| InputJson_item_group
	| InputJson_exp
	| InputJson_level
);

declare interface OutputJson_item extends ItemJson, IOJson_Base {
	type: "item";
}
declare interface OutputJson_random_item extends IOJson_Base {
	type: "random_item";
	items: {
		id: string|number;
		count?: number;
		data?: number;
		extra?: ExtraJson[];
		weigth: number;
	}[];
}
declare interface OutputJson_select_item extends IOJson_Base {
	type: "select_item";
	items: ItemJson[];
}
declare interface OutputJson_exp extends IOJson_Base {
	type: "exp";
	value: number;
}
declare interface OutputJson_level extends IOJson_Base {
	type: "level";
	value: number;
}
declare interface OutputJson_command extends IOJson_Base {
	type: "level";
	commands: string[];
}
declare type OutputJson = (
	IOJson_Base
	| OutputJson_item
	| OutputJson_random_item
	| OutputJson_select_item
	| OutputJson_exp
	| OutputJson_level
	| OutputJson_command
);


declare interface QuestJson_Info {
	input: InputJson[];
	output: OutputJson[];
	display_name?: TextJson;
	text?: TextJson;
	hidden?: boolean;
}

declare interface QuestJson {
	type: "quest";
	name: string;
	x: number|[string, number];
	y: number|[string, number];
	size: number|[string, number];
	father?: ([string|null, string|null, string, number?]|string)[];
	icon: IconJson;
	icon_locked?: IconJson;
	icon_finished?: IconJson;
	info?: QuestJson_Info;
	tag?: object;
}

declare interface QuestJson_Custom {
	type: "custom";
	name: string;
	value: UI.Elements;
}

declare interface ChapterJson {
	name: string;
	display_name?: TextJson;
	icon: IconJson;
	quest: QuestJson[];
}

declare interface MainJson {
	main: ChapterJson[];
	info?: {
		display_name?: TextJson;
		background?: string;
	};
}

declare interface InputType {
	getGUI?: (path: {source: string, chapter: string, quest: string}, value: InputJson,
		info: {key: number, x: number, y: number, name: string, addElement: System["quest"]["addQuestUIElement"]}) => void;
	
	onTick?: (path: {source: string, chapter: string, quest: string}, value: InputJson,
		info: {key: number, player: number, package: {[id_data: `${number}:${number}`]: number},
			extra_package: {[id_data: `${number}:${number}`]: ItemInstance}}) => void;
	
	onCreate?: (path: {source: string, chapter: string, quest: string}, value: InputJson,
		info: {key: number, team: string}) => void;
	onCreated?: (path: {source: string, chapter: string, quest: string}, value: InputJson,
		info: {key: number, team: string}) => void;
	
	onDelete?: (path: {source: string, chapter: string, quest: string}, value: InputJson,
		info: {key: number, team: string, cause: string}) => void;
	onDeleted?: (path: {source: string, chapter: string, quest: string}, value: InputJson,
		info: {key: number, team: string, cause: string}) => void;
}

declare interface OutputType {
	getGUI?: (path: {source: string, chapter: string, quest: string}, value: OutputJson,
		info: {key: number, x: number, y: number, name: string, addElement: System["quest"]["addQuestUIElement"]}) => void;
	
	onReceive?: (path: {source: string, chapter: string, quest: string}, value: OutputJson,
		info: {key: number, player: number, info: any}) => void;
	onReceived?: (path: {source: string, chapter: string, quest: string}, value: OutputJson,
		info: {key: number, player: number, info: any}) => void;
	
	onFastReceive?: (path: {source: string, chapter: string, quest: string}, value: OutputJson,
		info: {key: number, player: number}) => boolean;
	onFastReceived?: (path: {source: string, chapter: string, quest: string}, value: OutputJson,
		info: {key: number, player: number}) => boolean;
}

declare interface private_object {
	Book: {[player: number]: boolean};
	Data: {[team: string]: {
		member: {[player: number]: boolean};
		main: {[source: string]: {[chapter: string]: {[quest: string]: {
			input: boolean[];
			output: boolean[];
		}}}};
	}};
	Team: {[player: number]: string};
	Loaded: {[player: number]: boolean};
	EditorList: {[player: number]: boolean};
	LocalData: {
		team: string|null;
	};
	Setting: {
		UIsize: number;
		padding: number;
		path: string;
		dev: boolean;
	};
	QuestsUI_data: {
		source: string|null;
		chapter: string|null;
		quest: string|null;
		size: number;
		hw: number;
		location: {
			name: string;
			width: number;
			scrollX: number;
			scrollY: number;
		}[];
	};
	DataJson: MainJson;
}

declare interface private_globalFunc {
	RefreshLocalData: () => void;
	CheckDefined: (arr: any[], length: number) => boolean;
	GetUuid: () => string;
	Encrypt: (input: string) => string;
	RefreshGUIType: (size: number) => void;
	RefreshGUI: (ui: UI.Window, mode?: boolean) => void;
	getRecipeUI: (item: ItemInstance, isUsage?: boolean) => void;
	HaveKeys: (obj: object, keys: string[]) => boolean;
}

declare interface private_globalInstance {
	ServerPacket: {
		addPacket: (name: string, func: (client: NetworkClient, T: any[]) => void) => void;
		callPacket: (name: string, args?: [client: NetworkClient, T: any[]]) => void;
	};
	ClientPacket: {
		addPacket: (name: string, func: (T: any[]) => void) => void;
		callPacket: (name: string, args?: [T: any[]]) => void;
	};
}

declare interface globalFunc {
	ReadPath: (path: string) => MainJson|{};
	PreCalc: (jsonMain: MainJson) => void;
	Debounce: <T = Function>(func: T, wait: number, func2?: T, ths?: any) => T;
	CheckExtraItem: (item: ItemInstance, extra: ItemJson[]) => boolean;
	Logic: (a: any, operator: string, b: any) => boolean;
	TransferId: (id: number|string, onServer?: boolean) => number;
	TransferItem: (item: ItemJson, onServer?: boolean) => ItemInstance;
	DeTransferId: (id: number) => string;
	DeTransferItem: (item: ItemInstance) => ItemJson;
	GetInput: (params: {hint?: string; title?: string, button?: string}, func: (keyword: string) => void) => void;
	Dialog: (params: {text: string; title?: string, button?: string}, func: () => void) => void;
}

declare interface TranAPI {
	translation: {[language: string]: {[str: string]: string}};
    language: string;
    intTranslation: () => void;
    addTranslation: (str: string, params: {[language: string]: string}) => void;
    translate: (str: string) => string;
    TAT: (str: TextJson|string, source?: string, chapter?: string, quest?: string, type?: string) => string;
}

declare interface System {
	data: {[source: string]: {
		father: {[chapter: string]: {[quest: string]: [string, string, string][]}};
		child: {[chapter: string]: {[quest: string]: [string, string, string][]}};
		chapter: {[chapter: string]: ChapterJson};
		info: {
			display_name?: TextJson;
			background?: string;
		};
	}};
	showInfo: {[source: string]: boolean};
	open: (source: string, ismenu?: boolean) => void;
    openForPlayer: (player: number, source: string, ismenu?: boolean) => void;
    addSource: (source: string, json: MainJson, showInfo?: boolean) => void;
    setSource: (source: string) => void;
	deleteSource: (source: string, onServer: boolean) => void;
	setInputType: (type: string, params: InputType) => void;
	setOutputType: (type: string, params: OutputType) => void;
	chapter: {
		add: (source: string, json: ChapterJson) => void;
		set: (source: string, chapter: string) => void;
		clearGUI: () => void;
	};
	quest: {
		input: {[type: string]: InputType};
		output: {[type: string]: OutputType};
		setInputType: (type: string, params: InputType) => void;
		getInputType: (type: string, name: string) => Function;
		setOutputType: (type: string, params: OutputType) => void;
		getOutputType: (type: string, name: string) => Function;
		addQuestUIElement: (key: string, element: UI.Elements) => void;
		getQuestUI: (source: string, chapter: string, quest: string, info?: QuestJson_Info, icon?: IconJson) => void;
		addGUI: (source: string, chapter: string, quest: string, v: QuestJson) => void;
		setChild: (father: [string|null, string|null, string], child: [string, string, string], width?: number) => void;
		get: (source: string, chapter: string, quest: string) => QuestJson;
		isExist: (source: string, chapter: string, quest: string) => boolean;
		getFather: (source: string, chapter: string, quest: string) => [string, string, string][];
		getChild: (source: string, chapter: string, quest: string) => [string, string, string][];
		getFatherChildUI: (list: {[source: string]: {[chapter: string]: {[quest: string]: boolean}}}) => void;
		getFatherUI: (source: string, chapter: string, quest: string) => void;
		getChildUI: (source: string, chapter: string, quest: string) => void;
	};
}

declare interface Core {
	quest: {[team: string]: {[source: string]: {[chapter: string]: QuestJson[]}}};
	clearData: (player: number) => void;
	loadAllQuests: (player: number) => void;
	loadQuets: (source: string, chapter: string, v: QuestJson, player: number) => void;
	refreshQuests: (source: string, chapter: string, quest: string, player?: number) => void;
	finish: (source: string, chapter: string, quest: string, key: number, player?: number) => void;
	receive: (source: string, chapter: string, quest: string, key: number, info?: any, player?: number) => void;
	isFinishedInput: (source: string, chapter: string, quest: string, key: number, player?: number) => boolean;
	isGotOutput: (source: string, chapter: string, quest: string, key: number, player?: number) => boolean;
	isFinished: (source: string, chapter: string, quest: string, player?: number) => boolean;
	isGot: (source: string, chapter: string, quest: string, player?: number) => boolean;
	isLocked_Local: (source: string, chapter: string, quest: string) => boolean;
	getInventory: (player: number) => ItemInstance[];
	getSortInventory: (player: number, package?: ItemInstance[]) => {[id_data: `${number}:${number}`]: number};
	getExtraInventory: (player: number, package?: ItemInstance[]) => {[id_data: `${number}:${number}`]: ItemInstance};
	getTeam: (player?: number) => string;
	getPlayerForTeam: (team: string) => {[player: number]: boolean};
}

declare interface EditorParams_Base {
	type: string;
	must?: boolean;
	[key: string]: any;
}

declare interface EditorParams_string extends EditorParams_Base {
	type: "string";
}
declare interface EditorParams_number extends EditorParams_Base {
	type: "number";
	min?: number;
	max?: number;
}
declare type EditorParams = (
	EditorParams_Base
	| EditorParams_string
	| EditorParams_number
)

declare interface Editor {
    enabled: boolean;
    data: MainJson;
    link: {[chapter: string]: {
		data: ChapterJson;
		quest: {[quest: string]: QuestJson};
	}};
    init: () => void;
	save: (develop?: boolean) => void;
	loadData_Local: (data: MainJson) => void;
	loadData: (data: MainJson) => void;
	loadAllQuests: (player: number) => void;
	setEditor: (player: number, enabled: boolean) => void;
	ui: {
		type: {[type: string]: (param: EditorParams, target: object, value: object, key: string, keep?: boolean) => void};
		addType: (type: string, func: (param: EditorParams, target: object, value: object, key: string, keep?: boolean) => void) => void;
		getType: (type: string) => (param: EditorParams, target: object, value: object, key: string, keep?: boolean) => void;
		newEditorUI: (params: {
			text: TextJson;
			color?: number;
			must?: boolean;
			getGui?: (info: {
				index: number,
				x: number, y: number,
				name: string, elem: UI.ElementSet
			}, self: object) => void;
			onDelete?: (elem: UI.ElementSet, name: string) => void;
			main?: {
				text: TextJson;
				color?: number;
				must?: boolean;
				getGui: (info: {
					index: number, key: number,
					x: number, y: number,
					name: string, elem: UI.ElementSet
				}, self: object) => void;
				onDelete?: (elem: UI.ElementSet, name: string) => void;
			}[];
		}[]) => UI.Window;
		getEditorUI: (params: {[key: string]: EditorParams}, value: {[key: string]: any}) => UI.Window;
		getItem: (func: (item: ItemInstance) => void) => void;
		getSelectionUI: (params: {[key: string]: {
			text: string;
			func: () => boolean;
		}}, title?: string) => void;
	};
	create: () => void;
    editSource: () => void;
    addChapter: (chapter: string) => void;
    editChapter: (chapter: string) => void;
    deleteChapter: (chapter: string) => void;
    addQuest: (chapter: string, quest: string) => void;
    editQuest: (chapter: string, quest: string) => void;
    deleteQuest: (chapter: string, quest: string) => void;
}

declare interface QuestsUI {
	newElements: {
		main: string[];
		parentUI: string[];
		parentUI_1: string[];
		chapterUI: string[];
		questUI: string[];
		FatherChildUI: string[];
		descUI: string[];
		selectUI: string[];
	};
	menu: UI.Window;
	team: UI.Window;
	setting: UI.Window;
	main: UI.Window;
	parentUI: UI.Window;
	parentUI_1: UI.Window;
	chapterUI: UI.Window;
	questUI: UI.Window;
	FatherChildUI: UI.Window;
	descUI: UI.Window;
	selectUI: UI.Window;
	packageUI: UI.Window;
}

declare interface Desc {
	input: {
		item: (params: InputJson_item) => void;
		item_group: (params: InputJson_item_group) => void;
		exp: (params: InputJson_exp) => void;
		level: (params: InputJson_level) => void;
	};
	output: {
		item: (params: OutputJson_item) => void;
		random_item: (params: OutputJson_random_item) => void;
		select_item: (params: OutputJson_select_item) => void;
		exp: (params: OutputJson_exp) => void;
		level: (params: OutputJson_level) => void;
	};
}

declare interface CustomQuestsAPI {
	version: ["alpha"|"beta"|"release", number, number, number?];
	dir: string;
	QuestsUI_bitmap: {[key: string]: string};
	globalFunc: globalFunc;
	TranAPI: TranAPI;
	System: System;
	Core: Core;
	Editor: Editor;
	QuestsUI: QuestsUI;
	Desc: Desc;
	requireGlobal: (cmd: string) => any;
}

declare namespace ModAPI {
	function addAPICallback(apiName: "CustomQuestsAPI", func: (api: CustomQuestsAPI) => void): void;
}

declare namespace Callback {

	function addCallback(name: "CustomQuests.finishInput", func: finishInputFunction): void;

	function addCallback(name: "CustomQuests.finishQuest", func: finishQuestFunction): void;

	function addCallback(name: "CustomQuests.receiveOutput", func: receiveOutputFunction): void;

	interface finishInputFunction {
		(source: string, chapter: string, quest: string, key: number, value: InputJson, player: number): void
	}

	interface finishQuestFunction {
		(source: string, chapter: string, quest: string, value: QuestJson, player: number): void
	}

	interface receiveOutputFunction {
		(source: string, chapter: string, quest: string, key: number, value: OutputJson, player: number): void
	}

}