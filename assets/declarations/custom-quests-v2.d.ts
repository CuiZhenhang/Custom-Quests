/// <reference path='./core-engine.d.ts'/>

declare namespace CQTypes {
    type bitmap = string
    type sourceId = string
    type chapterId = string
    type questId = string
    type refId = string
    type saveId = string
    type teamId = string
    type inputId = string
    type outputId = string

    type TextJson = string | {[lang: string]: string}
    interface ExtraJson {type: string, [key: string]: unknown}
    interface ItemJson {id: string | number, count?: number, data?: number, extra?: ExtraJson[]}
    interface IconJson {bitmap?: bitmap, id?: string | number, count?: number, data?: number, extra?: ExtraJson[]}
    type PathArray = [sourceId: sourceId, capterId: chapterId, questId: questId]
    type Ref<T> = `ref:${string}` | T

    namespace IOTypes {
        interface IOJsonBase {
            type: string
            repeat?: {
                type: 'none' | 'time' | 'custom'
                time?: number
            }
            [key: string]: unknown
        }

        interface InputJson_group extends IOJsonBase {
            type: 'group'
            list: InputJson[]
        }
        interface InputJson_check extends IOJsonBase {
            type: 'check'
        }
        interface InputJson_item extends ItemJson, IOJsonBase {
            type: 'item'
        }
        interface InputJson_exp extends IOJsonBase {
            type: 'exp'
            value: number
        }
        interface InputJson_level extends IOJsonBase {
            type: 'level'
            value: number
        }
        type InputJson = (
            IOJsonBase
            | InputJson_group
            | InputJson_check
            | InputJson_item
            | InputJson_exp
            | InputJson_level
        )

        interface OutputJson_random extends IOJsonBase {
            type: 'random'
            list: Array<{
                output: OutputJson
                weigth: number
            }>
        }
        interface OutputJson_select extends IOJsonBase {
            type: 'select'
            list: OutputJson[]
        }
        interface OutputJson_item extends ItemJson, IOJsonBase {
            type: 'item'
        }
        interface OutputJson_exp extends IOJsonBase {
            type: 'exp'
            value: number
        }
        interface OutputJson_level extends IOJsonBase {
            type: 'level'
            value: number
        }
        interface OutputJson_command extends IOJsonBase {
            type: 'level'
            commands: string[]
        }
        type OutputJson = (
            IOJsonBase
            | OutputJson_random
            | OutputJson_select
            | OutputJson_item
            | OutputJson_exp
            | OutputJson_level
            | OutputJson_command
        )        
    }

    interface QuestJson {
        type: 'quest'
        id: questId
        pos: [
            x: number | [id: questId, plus: number], 
            y: number | [id: questId, plus: number]
        ]
        size: number | [id: questId, times: number]
        icon: Ref<IconJson> | [
            locked: Ref<IconJson>,
            unlocked: Ref<IconJson>,
            finished: Ref<IconJson>
        ]
        parent?: Array<questId | [
            sourceId: sourceId | null,
            chapterId: chapterId | null,
            questId: questId,
            width?: number
        ]>
        hidden?: boolean
        inner: {
            input: IOTypes.InputJson[]
            output: IOTypes.OutputJson[]
            name: TextJson
            text: TextJson
        }
        ref?: {[refId: refId]: unknown}
    }

    interface QuestJsonElement {
        type: 'custom'
        id: questId
        elem: UI.Elements
    }

    interface ChapterJson {
        id: chapterId
        name: TextJson
        icon: Ref<IconJson>
        quest: Array<QuestJson | QuestJsonElement>
        background?: bitmap
        ref?: {[refId: refId]: unknown}
    }

    interface MainJson {
        main: ChapterJson[]
        name: TextJson
        background?: [bitmap: bitmap, ratdio?: number]
        menu?: [bitmap: bitmap, ratio?: number]
        bitmaps?: Array<{
            name: string
            base64: string
        }>
        ref?: {[refId: refId]: unknown}
    }

    interface AllMainJson {
        [sourceId: sourceId]: MainJson
    }

    interface ResolvedQuestJson {
        pos: [x: number, y: number]
        size: number
        icon: [locked: Ref<IconJson>, unlocked: Ref<IconJson>, finished: Ref<IconJson>]
        parent: Array<[sourceId: sourceId, chapterId: chapterId, questId: questId, width: number]>
        child: Array<PathArray>
        hidden: boolean
        inner: QuestJson['inner']
    }

    interface ResolvedChapterJson {
        name: CQTypes.ChapterJson['name']
        icon: CQTypes.ChapterJson['icon']
        quest: {[questId: questId]: ResolvedQuestJson | QuestJsonElement}
        background?: CQTypes.ChapterJson['background']
    }

    interface ResolvedMainJson {
        chapter: {[chapterId: chapterId]: ResolvedChapterJson}
        name: CQTypes.MainJson['name']
        background?: CQTypes.MainJson['background']
        menu?: CQTypes.MainJson['menu']
    }

    interface AllResolvedMainJson {
        [sourceId: sourceId]: ResolvedMainJson
    }

    enum playerState {
        absent = 0,
        member = 1,
        admin = 2,
        owner = 3
    }
    interface team {
        id: teamId
        saveId: saveId
        bitmap: IconJson
        name: string
        players: {[player: number]: playerState}
        settingTeam: {}
        settingPlayer: {[player: number]: {}}
    }

    enum InputState {
        unfinished = 0,
        finished = 1,
        repeat_unfinished = 2
    }
    enum OutputState {
        unreceived = 0,
        received = 1,
        repeat_unreceived = 2
    }
    enum QuestInputState {
        locked = -1,
        unfinished = 0,
        finished = 1,
        repeat_unfinished = 2
    }
    enum QuestOutputState {
        locked = -1,
        unreceived = 0,
        received = 1,
        repeat_unreceived = 2
    }
    interface SaveData {
        [sourceId: sourceId]: {
            [chapterId: chapterId]: {
                [questId: questId]: {
                    inputState: QuestInputState
                    input: Array<Nullable<{
                        state: InputState
                        [key: string]: unknown
                    }>>
                    outputState: QuestOutputState
                    output: Array<Nullable<{
                        state: OutputState
                        [key: string]: unknown
                    }>>
                }
            }
        }
    }

    interface extraTypeCb {
        fromJson?: (item: ItemInstance, extraJson: ExtraJson, onServer?: boolean) => void
        fromItem?: (item: ItemInstance, extraJson: ExtraJson) => boolean
        isPassed?: (item: ItemInstance, extraJson: ExtraJson) => boolean
    }

    interface Operator {
        type: 'player' | 'tileEntity'
        player?: number
        tile?: TileEntity
    }

    interface IOTypeToolsCb {
        getPlayerList?: (online?: boolean) => Array<number>
        getState?: () => {state: CQTypes.InputState, [key: string]: unknown}
        setState?: (state: {state: CQTypes.InputState, [key: string]: unknown}) => void
    }

    interface InputTypeCb {
        onLoad?: (inputJson: IOTypes.InputJson, toolsCb: IOTypeToolsCb, cache: {[key: string]: unknown}) => void
        onUnload?: (inputJson: IOTypes.InputJson, toolsCb: IOTypeToolsCb, cache: {[key: string]: unknown}) => void
        getIcon?: (inputJson: IOTypes.InputJson, toolsCb: IOTypeToolsCb, cache: {[key: string]: unknown}, extraInfo: {
            pos: [x: number, y: number]
            size: number
            prefix: string
        }) => {[key: string]: UI.Elements}
        getDesc?: (inputJson: IOTypes.InputJson, toolsCb: IOTypeToolsCb, cache: {[key: string]: unknown}, extraInfo: {}) => Nullable<UI.Window>
        onEdit?: (...params: unknown[]) => unknown
        onTick?: (inputJson: IOTypes.InputJson, toolsCb: IOTypeToolsCb, cache: {[key: string]: unknown}, extraInfo: {
            playerList: Array<number>
            inventory: ReturnType<Utils['getSortInventory']>
            inventoryExtra: ReturnType<Utils['getExtraInventory']>
        }) => void
    }

    interface InputTypeConfig {
        allowRepeat?: boolean
        allowGroup?: boolean
        operatorOnly?: Operator['type'] | 'both' | 'neither'
    }

    interface OutputTypeCb {
        onLoad?: (outputJson: IOTypes.OutputJson, toolsCb: IOTypeToolsCb, cache: {[key: string]: unknown}) => void
        onUnload?: (outputJson: IOTypes.OutputJson, toolsCb: IOTypeToolsCb, cache: {[key: string]: unknown}) => void
        getIcon?: (outputJson: IOTypes.OutputJson, toolsCb: IOTypeToolsCb, cache: {[key: string]: unknown}, extraInfo: {
            pos: [x: number, y: number]
            size: number
            prefix: string
        }) => {[key: string]: UI.Elements}
        getDesc?: (outputJson: IOTypes.OutputJson, toolsCb: IOTypeToolsCb, cache: {[key: string]: unknown}, extraInfo: {}) => UI.Window
        onEdit?: (...params: unknown[]) => unknown
        onReceive?: (outputJson: IOTypes.OutputJson, toolsCb: IOTypeToolsCb, cache: {[key: string]: unknown}, extraInfo: {
            operator: Operator
            extraInfo: unknown
        }) => void
        onFastReceive?: (outputJson: IOTypes.OutputJson, toolsCb: IOTypeToolsCb, cache: {[key: string]: unknown}, extraInfo: {
            operator: Operator
        }) => void
    }

    interface OutputTypeConfig {
        allowRepeat?: boolean
        allowGroup?: boolean
        operatorOnly?: Operator['type'] | 'both' | 'neither'
    }
}

interface Store {
    saved: {
        players: {[player: number]: {
            saveId: CQTypes.saveId
            bookGived?: boolean
            isAdmin?: boolean
            isEditor?: boolean
        }}
        team: {[teamId: CQTypes.teamId]: CQTypes.team}
        data: {[saveId: CQTypes.saveId]: CQTypes.SaveData}
    }
    cache: {
        playerLoaded: {[player: number]: boolean}
        resolvedJson: CQTypes.AllResolvedMainJson
    }
    localCache: {
        resolvedJson: CQTypes.AllResolvedMainJson
        dataPlayer: CQTypes.SaveData
        dataTeam: CQTypes.SaveData
        saveId: CQTypes.saveId
        team: CQTypes.team
        isAdmin: boolean
        isEditor: boolean
    }
}

interface TranAPI {
    translation: {[lang: string]: {[str: string]: string}}
    lang: string
    intTranslation (): void
    addTranslation (str: string, params: {[lang: string]: string}): void
    translate (str: string): string
    t (str: CQTypes.TextJson, sourceId?: CQTypes.sourceId, chapterId?: CQTypes.chapterId, questId?: CQTypes.questId, type?: string): string
}

interface Utils {
    voidFunc (): void
    log (message: string, type: string, hasAlert?: boolean): void
    getUUID (): string
    isDefined (length: number, arr: unknown[]): boolean
    hasKeyOfKeys (obj: {[key: string]: unknown}, keys: string[]): boolean
    deepCopy <T = object>(obj: T): T
    debounce <T = Function>(func: T, wait: number, func2?: T, ths?: unknown): T
    operate (a: number, operator: string, b: number, dflt?: boolean): boolean
    transferIdFromJson (id: CQTypes.ItemJson['id'], onServer?: boolean): number
    idFromItem: {[id: number]: string}
    transferIdFromItem (id: number): string
    extraType: {[type: string]: CQTypes.extraTypeCb}
    setExtraTypeCb (type: string, extraTypeCb: CQTypes.extraTypeCb): void
    getExtraTypeCb (type: string, from: 'fromJson'): CQTypes.extraTypeCb['fromJson'] | Utils['voidFunc']
    getExtraTypeCb (type: string, from: 'fromItem'): CQTypes.extraTypeCb['fromItem'] | Utils['voidFunc']
    getExtraTypeCb (type: string, from: 'isPassed'): CQTypes.extraTypeCb['isPassed'] | Utils['voidFunc']
    transferItemFromJson (itemJson: CQTypes.ItemJson, onServer?: boolean): ItemInstance
    transferItemFromItem (item: ItemInstance): CQTypes.ItemJson
    isItemExtraPassed (item: ItemInstance, extraJsonArray: CQTypes.ExtraJson[] | CQTypes.ExtraJson): boolean
    readContents (path: string): CQTypes.MainJson | {}
    solveRefs <T = unknown>(value: CQTypes.Ref<T>, refsArray: Array<{[refId: CQTypes.refId]: unknown}>): T
    getInput (params: {text?: string, hint?: string; title?: string, button?: string}, cb: (keyword: string) => void): void
    dialog (params: {text: string; title?: string, button?: string}, cb: () => void): void
    getInventory (player: number): Array<ItemInstance>
    getSortInventory (inventory: Array<ItemInstance>): {[idData: `${number}:${number}`]: number}
    getExtraInventory (inventory: Array<ItemInstance>): {[idData: `${number}:${number}`]: ItemInstance}
}

interface IOTypeTools {
    inputTypeCb: {
        [type: string]: {
            cb: CQTypes.InputTypeCb
            config: CQTypes.InputTypeConfig
        }
    }
    setInputTypeCb (type: string, inputTypeCb: CQTypes.InputTypeCb, config?: CQTypes.InputTypeConfig): void
    inputObject: {
        [inputId: CQTypes.inputId]: {
            cache: {[key: string]: unknown}
            json: CQTypes.IOTypes.InputJson
            toolsCb: CQTypes.IOTypeToolsCb
        }
    }
    typedInputList: {[type: string]: Array<CQTypes.inputId>}
    getAllInputByType (type: string | Array<string>): Array<CQTypes.inputId>
    loadInput (inputJson: CQTypes.IOTypes.InputJson, toolsCb: CQTypes.IOTypeToolsCb): CQTypes.inputId
    unloadInput (inputId: CQTypes.inputId): void
    callInputTypeCb (inputId: CQTypes.inputId, method: 'getIcon', extraInfo: Parameters<CQTypes.InputTypeCb['getIcon']>[3]): ReturnType<CQTypes.InputTypeCb['getIcon']>
    callInputTypeCb (inputId: CQTypes.inputId, method: 'getDesc', extraInfo: Parameters<CQTypes.InputTypeCb['getDesc']>[3]): ReturnType<CQTypes.InputTypeCb['getDesc']>
    callInputTypeCb (inputId: CQTypes.inputId, method: 'onEdit', extraInfo: Parameters<CQTypes.InputTypeCb['onEdit']>[3]): ReturnType<CQTypes.InputTypeCb['onEdit']>
    callInputTypeCb (inputId: CQTypes.inputId, method: 'onTick', extraInfo: Parameters<CQTypes.InputTypeCb['onTick']>[3]): ReturnType<CQTypes.InputTypeCb['onTick']>
    outputTypeCb: {
        [type: string]: {
            cb: CQTypes.OutputTypeCb
            config: CQTypes.OutputTypeConfig
        }
    }
    setOutputTypeCb (type: string, outputTypeCb: CQTypes.OutputTypeCb, config?: CQTypes.OutputTypeConfig): void
    outputObject: {
        [outputId: CQTypes.outputId]: {
            cache: {[key: string]: unknown}
            json: CQTypes.IOTypes.OutputJson
            toolsCb: CQTypes.IOTypeToolsCb
        }
    }
    typedOutputList: {[type: string]: Array<CQTypes.inputId>}
    getAllOutputByType (type: string | Array<string>): Array<CQTypes.outputId>
    loadOutput (outputJson: CQTypes.IOTypes.OutputJson, toolsCb: CQTypes.IOTypeToolsCb): CQTypes.outputId
    unloadOutput (outputId: CQTypes.outputId): void
    callOutTypeCb (outputId: CQTypes.outputId, method: 'onTick', extraInfo: Parameters<CQTypes.OutputTypeCb['getIcon']>[3]): ReturnType<CQTypes.OutputTypeCb['getIcon']>
    callOutTypeCb (outputId: CQTypes.outputId, method: 'getDesc', extraInfo: Parameters<CQTypes.OutputTypeCb['getDesc']>[3]): ReturnType<CQTypes.OutputTypeCb['getDesc']>
    callOutTypeCb (outputId: CQTypes.outputId, method: 'onEdit', extraInfo: Parameters<CQTypes.OutputTypeCb['onEdit']>[3]): ReturnType<CQTypes.OutputTypeCb['onEdit']>
    callOutTypeCb (outputId: CQTypes.outputId, method: 'onReceive', extraInfo: Parameters<CQTypes.OutputTypeCb['onReceive']>[3]): ReturnType<CQTypes.OutputTypeCb['onReceive']>
    callOutTypeCb (outputId: CQTypes.outputId, method: 'onFastReceive', extraInfo: Parameters<CQTypes.OutputTypeCb['onFastReceive']>[3]): ReturnType<CQTypes.OutputTypeCb['onFastReceive']>
}

interface System {
    resolveJson (json: CQTypes.AllMainJson): CQTypes.AllResolvedMainJson
    isExist (json: CQTypes.AllResolvedMainJson, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): boolean
    getQuestJson (json: CQTypes.AllResolvedMainJson, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): CQTypes.ResolvedQuestJson
    getParent (json: CQTypes.AllResolvedMainJson, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): Array<CQTypes.PathArray>
    getChild (json: CQTypes.AllResolvedMainJson, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): Array<CQTypes.PathArray>
    getInputState (data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number): {state: CQTypes.InputState, [key: string]: unknown}
    getOutputState (data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number): {stata: CQTypes.OutputState, [key: string]: unknown}
    getQuestInputState (data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): CQTypes.QuestInputState
    getQuestOutputState (data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): CQTypes.QuestOutputState
    getPlayersState (team: CQTypes.team): CQTypes.team['players']
}

interface ServerSystem {
    json: CQTypes.AllMainJson
    loadedQuest: {
        [saveId: CQTypes.saveId]: {
            [sourceId: CQTypes.sourceId]: {
                [chapterId: CQTypes.chapterId]: {
                    [questId: CQTypes.questId]: {
                        input: Array<CQTypes.inputId>
                        output: Array<CQTypes.outputId>
                    }
                }
            }
        }
    }
    getSaveId (player: number): CQTypes.saveId
    getSaveId (team: CQTypes.team): CQTypes.saveId
    getSaveData (saveId: CQTypes.saveId): CQTypes.SaveData
    getPlayerList (saveId: CQTypes.saveId, online?: boolean): Array<number>
    loadQuest (sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, saveId: CQTypes.saveId): void
    loadAllQuest (saveId: CQTypes.saveId): void
    reloadQuest (sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, saveId: CQTypes.saveId): void
    setInputState (sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number, operator: CQTypes.Operator, extraInfo: unknown, saveId: CQTypes.saveId): void
    setOutputState (sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number, operator: CQTypes.Operator, extraInfo: unknown, saveId: CQTypes.saveId): void
    receiveAllQuest (sourceId: CQTypes.sourceId, operator: CQTypes.Operator, saveId: CQTypes.saveId): void
    getTeam (player: number): CQTypes.team
    setTeam (player: number, teamId: CQTypes.teamId): void
    open (player: number, sourceId: CQTypes.sourceId, ismenu?: boolean): void
}

interface ClientSystem {
    open (sourceId: CQTypes.sourceId, ismenu?: boolean): void

}

interface CustomQuestsAPI {
    version: `${number}.${number}.${number}-${string}`
    TranAPI: TranAPI
    Utils: Utils
    IOTypeTools: IOTypeTools
    System: System
    ServerSystem: ServerSystem
    ClientSystem: ClientSystem
    requireGlobal (cmd: string): unknown
}

declare namespace ModAPI {
    function addAPICallback(apiName: 'CustomQuestsAPI', func: (api: CustomQuestsAPI) => void): void
}

declare namespace Callback {
    function addCallback(name: 'CustomQuests.onTeamChanged', func: onTeamChangedFunction): void
    function addCallback(name: 'CustomQuests.onInputStateChanged', func: onInputStateChangedFunction): void
    function addCallback(name: 'CustomQuests.onOutputStateChanged', func: onOutputStateChangedFunction): void
    function addCallback(name: 'CustomQuests.onQuestInputStateChanged', func: onQuestInputStateChangedFunction): void
    function addCallback(name: 'CustomQuests.onQuestOutputStateChanged', func: onQuestOutputStateChangedFunction): void

    interface onTeamChangedFunction {
        (player: number, newTeamId: CQTypes.teamId, oldTeamId: CQTypes.teamId): void
    }

    interface onInputStateChangedFunction {
        (inputId: CQTypes.inputId, newState: {state: CQTypes.InputState, [key: string]: unknown}, oldState: {state: CQTypes.InputState, [key: string]: unknown}): void
    }

    interface onOutputStateChangedFunction {
        (outputId: CQTypes.outputId, newState: {state: CQTypes.OutputState, [key: string]: unknown}, oldState: {state: CQTypes.OutputState, [key: string]: unknown}): void
    }

    interface onQuestInputStateChangedFunction {
        (path: CQTypes.PathArray, newState: CQTypes.QuestInputState, oldState: CQTypes.QuestInputState): void
    }

    interface onQuestOutputStateChangedFunction {
        (path: CQTypes.PathArray, newState: CQTypes.QuestOutputState, oldState: CQTypes.QuestOutputState): void
    }
}
