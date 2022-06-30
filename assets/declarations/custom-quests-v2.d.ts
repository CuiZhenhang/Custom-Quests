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
    type invalidId = saveId & teamId & inputId & outputId

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
            list: Array<Ref<InputJson>>
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
                output: Ref<OutputJson>
                weigth: number
            }>
        }
        interface OutputJson_select extends IOJsonBase {
            type: 'select'
            list: Array<Ref<OutputJson>>
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
            input: Array<Ref<IOTypes.InputJson>>
            output: Array<Ref<IOTypes.OutputJson>>
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
        quest: Array<QuestJson | QuestJsonElement>
        id: chapterId
        name: TextJson
        icon: Ref<IconJson>
        background?: [bitmap: bitmap, ratdio?: number]
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
        config?: {
            saveOnly?: 'player' | 'team' | 'both' | 'either'
            textMessage?: boolean
            guiMessage?: boolean
        }
        ref?: {[refId: refId]: unknown}
    }

    interface AllMainJson {
        [sourceId: sourceId]: MainJson
    }

    interface ResolvedQuestJson {
        type: QuestJson['type']
        pos: [x: number, y: number]
        size: number
        icon: [locked: Ref<IconJson>, unlocked: Ref<IconJson>, finished: Ref<IconJson>]
        parent: Array<[sourceId: sourceId, chapterId: chapterId, questId: questId, width: number]>
        child: Array<PathArray>
        hidden: boolean
        inner: QuestJson['inner']
    }

    interface ResolvedChapterJson {
        quest: {[questId: questId]: ResolvedQuestJson | QuestJsonElement}
        name: ChapterJson['name']
        icon: ChapterJson['icon']
        background?: ChapterJson['background']
    }

    interface ResolvedMainJson {
        chapter: {[chapterId: chapterId]: ResolvedChapterJson}
        name: MainJson['name']
        menu?: MainJson['menu']
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
        getState?: () => {state: InputState, [key: string]: unknown}
        setState?: (extraInfo: {[key: string]: unknown}, state: {state: InputState, [key: string]: unknown}) => void
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
        resolveJson?: (inputJson: IOTypes.IOJsonBase, refsArray: Array<{[refId: refId]: unknown}>) => Nullable<IOTypes.InputJson>
    }

    interface InputTypeConfig {
        allowRepeat?: boolean
        allowGroup?: boolean
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
            [key: string]: unknown
        }) => void
        onFastReceive?: (outputJson: IOTypes.OutputJson, toolsCb: IOTypeToolsCb, cache: {[key: string]: unknown}, extraInfo: {
            operator: Operator
        }) => void
        resolveJson?: (inputJson: IOTypes.IOJsonBase, refsArray: Array<{[refId: refId]: unknown}>) => Nullable<IOTypes.OutputJson>
    }

    interface OutputTypeConfig {
        allowRepeat?: boolean
        allowGroup?: boolean
        operatorOnly?: Operator['type'] | 'both' | 'neither'
    }
}

interface Store {
    saved: {
        players: {
            [player: number]: {
                saveId: CQTypes.saveId
                teamId: CQTypes.teamId
                bookGived: boolean
                isAdmin: boolean
                isEditor: boolean
            }
        }
        team: {[teamId: CQTypes.teamId]: CQTypes.team}
        data: {[saveId: CQTypes.saveId]: CQTypes.SaveData}
        playerList: {[saveId: CQTypes.saveId]: Array<number>}
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
    getRandomString (): string
    isDefined (length: number, arr: unknown[]): boolean
    isObject (obj: object): boolean
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
    resolveRefs <T = unknown>(value: CQTypes.Ref<T>, refsArray: Array<{[refId: CQTypes.refId]: unknown}>): T
    copyTextJson (textJson: unknown): CQTypes.TextJson
    getInput (params: {text?: string, hint?: string; title?: string, button?: string}, cb: (keyword: string) => void): void
    dialog (params: {text: string; title?: string, button?: string}, cb: () => void): void
    getInventory (player: number): Array<ItemInstance>
    getSortInventory (inventory: Array<ItemInstance>): {[idData: `${number}:${number}`]: number}
    getExtraInventory (inventory: Array<ItemInstance>): {[idData: `${number}:${number}`]: ItemInstance}
}

interface IOTypeTools {
    inputType: {
        [type: string]: {
            cb: CQTypes.InputTypeCb
            config: CQTypes.InputTypeConfig
        }
    }
    setInputType (type: string, inputTypeCb: CQTypes.InputTypeCb, config?: CQTypes.InputTypeConfig): void
    getInputTypeCb (type: string): CQTypes.InputTypeCb
    getInputTypeConfig (type: string): Nullable<CQTypes.InputTypeConfig>
    inputObject: {
        [inputId: CQTypes.inputId]: {
            cache: {[key: string]: unknown}
            json: CQTypes.IOTypes.InputJson
            toolsCb: CQTypes.IOTypeToolsCb
            onUnload?: () => void
        }
    }
    typedInputList: {[type: string]: Array<CQTypes.inputId>}
    getAllInputByType (type: string | Array<string>): Array<CQTypes.inputId>
    loadInput (inputJson: CQTypes.IOTypes.InputJson, toolsCb: CQTypes.IOTypeToolsCb, onUnload?: () => void): CQTypes.inputId
    isInputLoaded (inputId: CQTypes.inputId): boolean
    unloadInput (inputId: CQTypes.inputId): void
    callInputTypeCb (inputId: CQTypes.inputId, method: 'getIcon', extraInfo: Parameters<CQTypes.InputTypeCb['getIcon']>[3]): ReturnType<CQTypes.InputTypeCb['getIcon']>
    callInputTypeCb (inputId: CQTypes.inputId, method: 'getDesc', extraInfo: Parameters<CQTypes.InputTypeCb['getDesc']>[3]): ReturnType<CQTypes.InputTypeCb['getDesc']>
    callInputTypeCb (inputId: CQTypes.inputId, method: 'onEdit', extraInfo: Parameters<CQTypes.InputTypeCb['onEdit']>[3]): ReturnType<CQTypes.InputTypeCb['onEdit']>
    callInputTypeCb (inputId: CQTypes.inputId, method: 'onTick', extraInfo: Parameters<CQTypes.InputTypeCb['onTick']>[3]): ReturnType<CQTypes.InputTypeCb['onTick']>
    outputType: {
        [type: string]: {
            cb: CQTypes.OutputTypeCb
            config: CQTypes.OutputTypeConfig
        }
    }
    setOutputType (type: string, outputTypeCb: CQTypes.OutputTypeCb, config?: CQTypes.OutputTypeConfig): void
    getOutputTypeCb (type: string): CQTypes.OutputTypeCb
    getOutputTypeConfig (type: string): Nullable<CQTypes.OutputTypeConfig>
    outputObject: {
        [outputId: CQTypes.outputId]: {
            cache: {[key: string]: unknown}
            json: CQTypes.IOTypes.OutputJson
            toolsCb: CQTypes.IOTypeToolsCb
            onUnload?: () => void
        }
    }
    typedOutputList: {[type: string]: Array<CQTypes.inputId>}
    getAllOutputByType (type: string | Array<string>): Array<CQTypes.outputId>
    loadOutput (outputJson: CQTypes.IOTypes.OutputJson, toolsCb: CQTypes.IOTypeToolsCb, onUnload?: () => void): CQTypes.outputId
    isOutputLoaded (outputId: CQTypes.outputId): boolean
    unloadOutput (outputId: CQTypes.outputId): void
    callOutTypeCb (outputId: CQTypes.outputId, method: 'onTick', extraInfo: Parameters<CQTypes.OutputTypeCb['getIcon']>[3]): ReturnType<CQTypes.OutputTypeCb['getIcon']>
    callOutTypeCb (outputId: CQTypes.outputId, method: 'getDesc', extraInfo: Parameters<CQTypes.OutputTypeCb['getDesc']>[3]): ReturnType<CQTypes.OutputTypeCb['getDesc']>
    callOutTypeCb (outputId: CQTypes.outputId, method: 'onEdit', extraInfo: Parameters<CQTypes.OutputTypeCb['onEdit']>[3]): ReturnType<CQTypes.OutputTypeCb['onEdit']>
    callOutTypeCb (outputId: CQTypes.outputId, method: 'onReceive', extraInfo: Parameters<CQTypes.OutputTypeCb['onReceive']>[3]): ReturnType<CQTypes.OutputTypeCb['onReceive']>
    callOutTypeCb (outputId: CQTypes.outputId, method: 'onFastReceive', extraInfo: Parameters<CQTypes.OutputTypeCb['onFastReceive']>[3]): ReturnType<CQTypes.OutputTypeCb['onFastReceive']>
}

interface System {
    resolveJson (json: CQTypes.AllMainJson): {
        json: CQTypes.AllResolvedMainJson
        config: {[sourceId: CQTypes.sourceId]: CQTypes.MainJson['config']}
        bitmaps: CQTypes.MainJson['bitmaps']
    }
    isExist (json: CQTypes.AllResolvedMainJson, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): boolean
    getQuestJson (json: CQTypes.AllResolvedMainJson, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): Nullable<CQTypes.ResolvedQuestJson | CQTypes.QuestJsonElement>
    getParent (json: CQTypes.AllResolvedMainJson, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): Array<CQTypes.PathArray>
    getChild (json: CQTypes.AllResolvedMainJson, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): Array<CQTypes.PathArray>
    getInputState (data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number): {state: CQTypes.InputState, [key: string]: unknown}
    getOutputState (data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number): {stata: CQTypes.OutputState, [key: string]: unknown}
    getQuestInputState (json: CQTypes.AllResolvedMainJson, data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): CQTypes.QuestInputState
    getQuestOutputState (json: CQTypes.AllResolvedMainJson, data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): CQTypes.QuestOutputState
}

interface ServerSystem {
    json: CQTypes.AllMainJson
    loadedQuest: {
        [saveId: CQTypes.saveId]: {
            [sourceId: CQTypes.sourceId]: {
                [chapterId: CQTypes.chapterId]: {
                    [questId: CQTypes.questId]: {
                        input?: Array<Nullable<CQTypes.inputId>>
                        output?: Array<Nullable<CQTypes.outputId>>
                    }
                }
            }
        }
    }
    invalidSaveId: CQTypes.saveId
    getSaveId (target: number | CQTypes.team): CQTypes.saveId
    getPlayerList (saveId: CQTypes.saveId, online?: boolean): Array<number>
    getSaveData (saveId: CQTypes.saveId): CQTypes.SaveData
    unloadAllLoadedQuest (saveId: CQTypes.saveId): void
    loadQuest (sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, saveId: CQTypes.saveId): void
    loadAllQuest (saveId: CQTypes.saveId): void
    setInputState (sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number, saveId: CQTypes.saveId,
        extraInfo: {[key: string]: unknown}, inputState: CQTypes.InputState): void
    setOutputState (sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number, saveId: CQTypes.saveId,
        extraInfo: {[key: string]: unknown}, outputState: CQTypes.OutputState): void
    receiveAllQuest (sourceId: CQTypes.sourceId, extraInfo: {[key: string]: unknown}, saveId: CQTypes.saveId): void
    getTeam (player: number): Nullable<CQTypes.team>
    createTeam (player: number, bitmap: CQTypes.team['bitmap'], name: CQTypes.team['name'], setting: CQTypes.team['settingTeam']): void
    setTeam (player: number, teamId: CQTypes.teamId): void
    setTeamPlayerState (teamId: CQTypes.teamId, player: number, state: CQTypes.playerState): void
    open (player: number, sourceId: CQTypes.sourceId, isMenu?: boolean): void
}

interface ClientSystem {
    open (sourceId: CQTypes.sourceId, isMenu?: boolean): void

}

interface CustomQuestsAPI {
    version: `${number}.${number}.${number}-${string}`
    invalidId: CQTypes.invalidId
    Store: Store
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
    function addCallback(name: 'CustomQuests.onInputStateChanged', func: onInputStateChangedFunction): void
    function addCallback(name: 'CustomQuests.onOutputStateChanged', func: onOutputStateChangedFunction): void
    function addCallback(name: 'CustomQuests.onQuestInputStateChanged', func: onQuestInputStateChangedFunction): void
    function addCallback(name: 'CustomQuests.onQuestOutputStateChanged', func: onQuestOutputStateChangedFunction): void

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
