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
        interface InputJsonBase {
            type: string
            [key: string]: unknown
        }

        interface InputJson_group extends InputJsonBase {
            type: 'group'
            list: Array<Ref<InputJson>>
        }
        interface InputJson_check extends InputJsonBase {
            type: 'check'
        }
        interface InputJson_item extends ItemJson, InputJsonBase {
            type: 'item'
            submit?: boolean
            bitmap?: bitmap
        }
        interface InputJson_exp extends InputJsonBase {
            type: 'exp'
            value: number
        }
        interface InputJson_level extends InputJsonBase {
            type: 'level'
            value: number
        }
        type InputJson = (
            InputJsonBase
            | InputJson_group
            | InputJson_check
            | InputJson_item
            | InputJson_exp
            | InputJson_level
        )

        interface OutputJsonBase {
            type: string
            autoReceive?: boolean
            [key: string]: unknown
        }

        interface OutputJson_random extends OutputJsonBase {
            type: 'random'
            list: Array<{
                output: Ref<OutputJson>
                weigth: number
            }>
        }
        interface OutputJson_select extends OutputJsonBase {
            type: 'select'
            list: Array<Ref<OutputJson>>
        }
        interface OutputJson_item extends ItemJson, InputJsonBase {
            type: 'item'
            bitmap?: bitmap
        }
        interface OutputJson_exp extends OutputJsonBase {
            type: 'exp'
            value: number
        }
        interface OutputJson_level extends OutputJsonBase {
            type: 'level'
            value: number
        }
        interface OutputJson_command extends OutputJsonBase {
            type: 'level'
            commands: string[]
        }
        type OutputJson = (
            OutputJsonBase
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
            repeat?: boolean
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
        description: TextJson
        icon: Ref<IconJson>
        quest: Array<QuestJson | QuestJsonElement>
        background?: [bitmap: bitmap, ratdio?: number]
        ref?: {[refId: refId]: unknown}
    }

    interface MainJson {
        name: TextJson
        main: ChapterJson[]
        group?: Array<{
            name: TextJson
            array: chapterId[]
        }>
        background?: [bitmap: bitmap, ratdio?: number]
        bitmaps?: Array<{
            name: string
            base64: string
        }>
        config?: {
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
        inner: {
            input: Array<IOTypes.InputJson>
            output: Array<IOTypes.OutputJson>
            name: TextJson
            text: TextJson
            repeat: boolean
        }
    }

    interface ResolvedChapterJson {
        quest: {[questId: questId]: ResolvedQuestJson | QuestJsonElement}
        name: ChapterJson['name']
        description: ChapterJson['description']
        icon: ChapterJson['icon']
        background?: ChapterJson['background']
    }

    interface ResolvedMainJson {
        chapter: {[chapterId: chapterId]: ResolvedChapterJson}
        name: MainJson['name']
        group?: Array<{
            name: TextJson
            array: chapterId[]
        }>
    }

    interface AllResolvedMainJson {
        [sourceId: sourceId]: ResolvedMainJson
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
    interface InputStateObject {
        state: InputState
        [key: string]: unknown
    }
    interface OutputStateObject {
        state: OutputState
        [key: string]: unknown
    }
    interface SaveData {
        [sourceId: sourceId]: {
            [chapterId: chapterId]: {
                [questId: questId]: {
                    inputState: QuestInputState
                    input: Array<Nullable<InputStateObject>>
                    outputState: QuestOutputState
                    output: Array<Nullable<OutputStateObject>>
                }
            }
        }
    }

    enum PlayerState {
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
        password: string
        players: {[player: number]: PlayerState}
        settingTeam: {}
    }

    interface extraTypeCb {
        fromJson?: (item: ItemInstance, extraJson: ExtraJson) => void
        fromItem?: (item: ItemInstance, extraJson: ExtraJson) => boolean
        isPassed?: (item: ItemInstance, extraJson: ExtraJson) => boolean
    }

    interface Operator {
        type: 'player' | 'tileEntity'
        player?: number
        tile?: TileEntity
    }

    interface IOTypeToolsCb <T = InputStateObject | OutputStateObject>{
        getState: () => T
        setState?: (extraInfo: object, stateObject: T) => void
        getPlayerList?: (online?: boolean) => Array<number>
    }

    interface IOTypeToolsLocalCb <T = InputStateObject | OutputStateObject>{
        getState: () => T
        sendPacket?: (packetData: object) => void
    }

    /**
     * Change the value of [[inputJson]] is not recommended
     */
    interface InputTypeCb {
        resolveJson?: (inputJson: IOTypes.InputJsonBase, refsArray: Array<{[refId: refId]: unknown}>, bitmapNameObject: {[bitmapName: string]: boolean}) => Nullable<IOTypes.InputJson>
        onLoad?: (inputJson: IOTypes.InputJson, toolsCb: IOTypeToolsCb<InputStateObject>, cache: {[key: string]: unknown}) => void
        onUnload?: (inputJson: IOTypes.InputJson, toolsCb: IOTypeToolsCb<InputStateObject>, cache: {[key: string]: unknown}) => void
        onPacket?: (inputJson: IOTypes.InputJson, toolsCb: IOTypeToolsCb<InputStateObject>, cache: {[key: string]: unknown}, extraInfo: {
            client: NetworkClient
            packetData: object
        }) => void
        onTick?: (inputJson: IOTypes.InputJson, toolsCb: IOTypeToolsCb<InputStateObject>, cache: {[key: string]: unknown}, extraInfo: {
            playerInventory: Array<{
                player: number
                sort: ReturnType<Utils['getSortInventory']>
                extra: ReturnType<Utils['getExtraInventory']>
            }>
        }) => void
        getIcon?: (inputJson: IOTypes.InputJson, toolsCb: IOTypeToolsLocalCb<InputStateObject>, extraInfo: {
            pos: [x: number, y: number]
            size: number
            prefix: string
        }) => {[key: string]: UI.Elements}
        getDesc?: (inputJson: IOTypes.InputJson, toolsCb: IOTypeToolsLocalCb<InputStateObject>, extraInfo: {}) => Nullable<UI.Window>
        onEdit?: (...params: unknown[]) => unknown
    }

    interface InputTypeConfig {
        allowRepeat?: boolean
        allowGroup?: boolean
    }

    /**
     * Change the value of [[outputJson]] is not recommended
     */
    interface OutputTypeCb {
        resolveJson?: (outputJson: IOTypes.OutputJsonBase, refsArray: Array<{[refId: refId]: unknown}>, bitmapNameObject: {[bitmapName: string]: boolean}) => Nullable<IOTypes.OutputJson>
        onLoad?: (outputJson: IOTypes.OutputJson, toolsCb: IOTypeToolsCb<OutputStateObject>, cache: {[key: string]: unknown}) => void
        onUnload?: (outputJson: IOTypes.OutputJson, toolsCb: IOTypeToolsCb<OutputStateObject>, cache: {[key: string]: unknown}) => void
        onPacket?: (outputJson: IOTypes.OutputJson, toolsCb: IOTypeToolsCb<OutputStateObject>, cache: {[key: string]: unknown}, extraInfo: {
            client: NetworkClient
            packetData: object
        }) => void
        onReceive?: (outputJson: IOTypes.OutputJson, toolsCb: IOTypeToolsCb<OutputStateObject>, cache: {[key: string]: unknown}, extraInfo: {
            operator?: Operator
            isFastReceive?: boolean
            [key: string]: unknown
        }) => void
        getIcon?: (outputJson: IOTypes.OutputJson, toolsCb: IOTypeToolsLocalCb<OutputStateObject>, extraInfo: {
            pos: [x: number, y: number]
            size: number
            prefix: string
        }) => {[key: string]: UI.Elements}
        getDesc?: (outputJson: IOTypes.OutputJson, toolsCb: IOTypeToolsLocalCb<OutputStateObject>, extraInfo: {}) => UI.Window
        onEdit?: (...params: unknown[]) => unknown
    }

    interface OutputTypeConfig {
        allowRepeat?: boolean
        allowGroup?: boolean
    }
}

interface EnumObject {
    playerState: {
        absent: CQTypes.PlayerState.absent
        member: CQTypes.PlayerState.member
        admin: CQTypes.PlayerState.admin
        owner: CQTypes.PlayerState.owner
    }
    inputState: {
        unfinished: CQTypes.InputState.unfinished
        finished: CQTypes.InputState.finished
        repeat_unfinished: CQTypes.InputState.repeat_unfinished
    }
    outputState: {
        unreceived: CQTypes.OutputState.unreceived
        received: CQTypes.OutputState.received
        repeat_unreceived: CQTypes.OutputState.repeat_unreceived
    }
    questInputState: {
        locked: CQTypes.QuestInputState.locked
        unfinished: CQTypes.QuestInputState.unfinished
        finished: CQTypes.QuestInputState.finished
        repeat_unfinished: CQTypes.QuestInputState.repeat_unfinished
    }
    questOutputState: {
        locked: CQTypes.QuestOutputState.locked
        unreceived: CQTypes.QuestOutputState.unreceived
        received: CQTypes.QuestOutputState.received
        repeat_unreceived: CQTypes.QuestOutputState.repeat_unreceived
    }
}

interface Store {
    /**
     * Direct access to this property is not recommended
     */
    saved: {
        players: {
            [player: number]: {
                saveId: CQTypes.saveId
                teamId: CQTypes.teamId
                bookGived: boolean
                isAdmin?: boolean
                isEditor?: boolean
            }
        }
        team: {[teamId: CQTypes.teamId]: CQTypes.team}
        data: {[saveId: CQTypes.saveId]: CQTypes.SaveData}
        playerList: {[saveId: CQTypes.saveId]: Array<number>}
        exist: {[saveId: CQTypes.saveId]: boolean}
    }
    /**
     * Direct access to this property is not recommended
     */
    cache: {
        playerLoaded: {[player: number]: boolean},
        playerList: {
            [saveId: CQTypes.saveId]: {
                player: Array<number>
                client: NetworkConnectedClientList
            }
        }
    }
    localCache: {
        resolvedJson: CQTypes.AllResolvedMainJson
        jsonConfig: {[sourceId: CQTypes.sourceId]: CQTypes.MainJson['config']}
        saveData: CQTypes.SaveData
        team: CQTypes.team
        isAdmin: boolean
        teamList: ReturnType<ServerSystem['getTeamList']>
    }
}

interface TranAPI {
    lang: string
    /**
     * Direct access to this property is not recommended
     */
    translation: {[lang: string]: {[str: string]: string}}
    addTranslation (str: string, params: {[lang: string]: string}): void
    translate (str: string | {[lang: string]: string}): string
    t (str: CQTypes.TextJson, sourceId?: CQTypes.sourceId, chapterId?: CQTypes.chapterId, questId?: CQTypes.questId, type?: string): string
}

interface Utils {
    voidFunc (): void
    log (message: string, type: string, hasAlert?: boolean): void
    getUUID (): string
    md5 (str: string): string
    isObject (obj: object): boolean
    deepCopy <T = object>(obj: T): T
    debounce <T extends any[], RT = any, TT = any>(func: (this: TT, ...args: T) => RT, wait: number, func2?: Nullable<(this: TT, ...args: T) => RT>, ths?: TT): (...args: T) => RT
    operate (a: number, operator: string, b: number, defaultValue?: boolean): boolean
    transferIdFromJson (id: CQTypes.ItemJson['id']): number
    /**
     * Direct access to this property is not recommended
     */
    idFromItem: {[id: number]: string}
    transferIdFromItem (id: number): string
    /**
     * Direct access to this property is not recommended
     */
    extraType: {[type: string]: CQTypes.extraTypeCb}
    setExtraTypeCb (type: string, extraTypeCb: CQTypes.extraTypeCb): void
    getExtraTypeCb (type: string, from: 'fromJson'): CQTypes.extraTypeCb['fromJson'] | Utils['voidFunc']
    getExtraTypeCb (type: string, from: 'fromItem'): CQTypes.extraTypeCb['fromItem'] | Utils['voidFunc']
    getExtraTypeCb (type: string, from: 'isPassed'): CQTypes.extraTypeCb['isPassed'] | Utils['voidFunc']
    transferItemFromJson (itemJson: CQTypes.ItemJson): ItemInstance
    transferItemFromItem (item: ItemInstance): CQTypes.ItemJson
    isItemExtraPassed (item: ItemInstance, extraJsonArray: CQTypes.ExtraJson[] | CQTypes.ExtraJson): boolean
    readContents (path: string): CQTypes.MainJson | {}
    resolveRefs <T = unknown>(value: CQTypes.Ref<T>, refsArray: Array<{[refId: CQTypes.refId]: unknown}>): T
    resolveBitmap (bitmap: CQTypes.bitmap, bitmapNameObject: {[bitmapName: string]: boolean}): Nullable<CQTypes.bitmap>
    resolveTextJson (textJson: unknown): CQTypes.TextJson
    putTextureSourceFromBase64 (name: string, encodedString: string): void
    getInput (params: {text?: string, hint?: string; title?: string, button?: string}, cb: (keyword: string) => void): void
    dialog (params: {text: string; title?: string, button?: string}, cb: () => void): void
    getInventory (player: number): Array<ItemInstance>
    getSortInventory (inventory: Array<ItemInstance>): {[idData: `${number}:${number}`]: number}
    getExtraInventory (inventory: Array<ItemInstance>): {[idData: `${number}:${number}`]: Array<ItemInstance>}
}

interface IOTypeTools {
    /**
     * Direct access to this property is not recommended
     */
    inputType: {
        [type: string]: {
            cb: CQTypes.InputTypeCb
            config: CQTypes.InputTypeConfig
        }
    }
    setInputType (type: string, inputTypeCb: CQTypes.InputTypeCb, config?: CQTypes.InputTypeConfig): void
    getInputTypeCb (type: string): CQTypes.InputTypeCb
    getInputTypeConfig (type: string): Nullable<CQTypes.InputTypeConfig>
    /**
     * Direct access to this property is not recommended
     */
    inputObject: {
        [inputId: CQTypes.inputId]: {
            cache: {[key: string]: unknown}
            json: CQTypes.IOTypes.InputJson
            toolsCb: CQTypes.IOTypeToolsCb<CQTypes.InputStateObject>
            onUnload?: () => void
        }
    }
    typedInputList: {[type: string]: Array<CQTypes.inputId>}
    getAllInputByType (type: string | Array<string>): Array<CQTypes.inputId>
    loadInput (inputJson: CQTypes.IOTypes.InputJson, toolsCb: CQTypes.IOTypeToolsCb<CQTypes.InputStateObject>, onUnload?: () => void): CQTypes.inputId
    isInputLoaded (inputId: CQTypes.inputId): boolean
    unloadInput (inputId: CQTypes.inputId): void
    callInputTypeCb (inputId: CQTypes.inputId, method: 'onPacket', extraInfo: Parameters<CQTypes.InputTypeCb['onPacket']>[3]): ReturnType<CQTypes.InputTypeCb['onPacket']>
    callInputTypeCb (inputId: CQTypes.inputId, method: 'onTick', extraInfo: Parameters<CQTypes.InputTypeCb['onTick']>[3]): ReturnType<CQTypes.InputTypeCb['onTick']>
    getPlayerListByInputId (inputId: CQTypes.inputId, online?: boolean): number[]
    getInputJsonByInputId (inputId: CQTypes.inputId): CQTypes.IOTypes.InputJson
    /**
     * Direct access to this property is not recommended
     */
    outputType: {
        [type: string]: {
            cb: CQTypes.OutputTypeCb
            config: CQTypes.OutputTypeConfig
        }
    }
    setOutputType (type: string, outputTypeCb: CQTypes.OutputTypeCb, config?: CQTypes.OutputTypeConfig): void
    getOutputTypeCb (type: string): CQTypes.OutputTypeCb
    getOutputTypeConfig (type: string): Nullable<CQTypes.OutputTypeConfig>
    /**
     * Direct access to this property is not recommended
     */
    outputObject: {
        [outputId: CQTypes.outputId]: {
            cache: {[key: string]: unknown}
            json: CQTypes.IOTypes.OutputJson
            toolsCb: CQTypes.IOTypeToolsCb<CQTypes.OutputStateObject>
            onUnload?: () => void
        }
    }
    typedOutputList: {[type: string]: Array<CQTypes.inputId>}
    getAllOutputByType (type: string | Array<string>): Array<CQTypes.outputId>
    loadOutput (outputJson: CQTypes.IOTypes.OutputJson, toolsCb: CQTypes.IOTypeToolsCb<CQTypes.OutputStateObject>, onUnload?: () => void): CQTypes.outputId
    isOutputLoaded (outputId: CQTypes.outputId): boolean
    unloadOutput (outputId: CQTypes.outputId): void
    callOutputTypeCb (outputId: CQTypes.outputId, method: 'onPacket', extraInfo: Parameters<CQTypes.OutputTypeCb['onPacket']>[3]): ReturnType<CQTypes.OutputTypeCb['onPacket']>
    callOutputTypeCb (outputId: CQTypes.outputId, method: 'onReceive', extraInfo: Parameters<CQTypes.OutputTypeCb['onReceive']>[3]): ReturnType<CQTypes.OutputTypeCb['onReceive']>
    getPlayerListByOutputId (outputId: CQTypes.outputId, online?: boolean): number[]
    getOutputJsonByOutputId (outputId: CQTypes.outputId): CQTypes.IOTypes.OutputJson
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
    getInputState (data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number): CQTypes.InputStateObject
    getOutputState (data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number): CQTypes.OutputStateObject
    getQuestInputState (json: CQTypes.AllResolvedMainJson, data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): CQTypes.QuestInputState
    getQuestOutputState (json: CQTypes.AllResolvedMainJson, data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): CQTypes.QuestOutputState
    setInputState (json: CQTypes.AllResolvedMainJson, data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number,
        inputStateObject: CQTypes.InputStateObject, cb?: {
            onInputStateChanged?: (newInputStateObject: CQTypes.InputStateObject, oldInputStateObject: CQTypes.InputStateObject) => void
            onQuestInputStateChanged?: (newQuestInputState: CQTypes.QuestInputState, oldQuestInputState: CQTypes.QuestInputState) => void
            onQuestOutputStateChanged?: (newQuestOutputState: CQTypes.QuestOutputState.unreceived | CQTypes.QuestOutputState.repeat_unreceived, oldQuestOutputState: CQTypes.QuestOutputState.locked) => void
            onChildQuestInputStateChanged?: (pathArray: CQTypes.PathArray, newQuestInputState: CQTypes.QuestInputState.unfinished, oldQuestInputState: CQTypes.QuestInputState.locked) => void
        }): void
    setOutputState (json: CQTypes.AllResolvedMainJson, data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number,
        outputStateObject: CQTypes.OutputStateObject, cb?: {
            onOutputStateChanged?: (newOutputStateObject: CQTypes.OutputStateObject, oldOutputStateObject: CQTypes.OutputStateObject) => void
            onQuestOutputStateChanged?: (newQuestOutputState: CQTypes.QuestOutputState, oldQuestOutputState: CQTypes.QuestOutputState) => void
        }): void
}

interface ServerSystem {
    /**
     * Direct access to this property is not recommended
     */
    json: CQTypes.AllMainJson
    resolvedJson: CQTypes.AllResolvedMainJson
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
    addContents (sourceId: CQTypes.sourceId, contents: CQTypes.MainJson): void
    createSaveId (playerList: Array<number>): CQTypes.saveId
    getSaveId (target: number | CQTypes.teamId): CQTypes.saveId
    deleteSaveId (saveId: CQTypes.saveId): void
    isSaveIdValid (saveId: CQTypes.saveId): boolean
    setPlayerLoaded (player: number, loaded?: boolean): void
    isPlayerLoaded (player: number): boolean
    getPlayerList (saveId: CQTypes.saveId, online?: boolean): Array<number>
    getConnectedClientList (saveId: CQTypes.saveId): Nullable<NetworkConnectedClientList>
    getSaveData (saveId: CQTypes.saveId): CQTypes.SaveData
    getLoadedQuest (saveId: CQTypes.saveId, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): {
        input?: Array<Nullable<CQTypes.inputId>>
        output?: Array<Nullable<CQTypes.outputId>>
    }
    unloadAllLoadedQuest (saveId: CQTypes.saveId): void
    loadInput (saveId: CQTypes.saveId, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number): void
    loadOutput (saveId: CQTypes.saveId, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number): void
    loadQuest (saveId: CQTypes.saveId, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): void
    loadAllQuest (saveId: CQTypes.saveId, isReload?: boolean): void
    setInputState (saveId: CQTypes.saveId, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number,
        extraInfo: object, inputStateObject: CQTypes.InputStateObject): void
    setOutputState (saveId: CQTypes.saveId, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number,
        extraInfo: object, outputStateObject: CQTypes.OutputStateObject): void
    receiveAllQuest (saveId: CQTypes.saveId, sourceId: CQTypes.sourceId, extraInfo: {[key: string]: unknown}): void
    updateTeam (teamId: CQTypes.teamId, beforeDelete?: boolean): void
    createTeam (player: number, team: {
        bitmap: CQTypes.team['bitmap']
        name: CQTypes.team['name']
        password: CQTypes.team['password']
        setting: CQTypes.team['settingTeam']
    }): void
    getTeam (target: number | CQTypes.teamId): Nullable<CQTypes.team>
    deleteTeam (teamId: CQTypes.teamId): void
    setTeam (player: number, teamId: CQTypes.teamId): void
    /**
     * Warn: this method itself does not call [[updateTeam]]
     */
    setPlayerStateForTeam (teamId: CQTypes.teamId, player: number, state: CQTypes.PlayerState): void
    getTeamList (): Array<{teamId: CQTypes.teamId, bitmap: CQTypes.team['bitmap'], name: CQTypes.team['name']}>
}

interface ClientSystem {
    sendInputPacket (sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number, packetData: object): void
    sendOutputPacket (sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number, packetData: object): void
}

interface Interaction {
    openRecipeUI (item: ItemInstance, isUsage?: boolean): void
}

interface CustomQuestsAPI {
    version: `${number}.${number}.${number}-${string}`
    invalidId: CQTypes.invalidId
    EnumObject: EnumObject
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
    /**
     * Automatic changes caused by input changes do not trigger this callback
     */
    function addCallback(name: 'CustomQuests.onOutputStateChanged', func: onOutputStateChangedFunction): void
    function addCallback(name: 'CustomQuests.onQuestInputStateChanged', func: onQuestInputStateChangedFunction): void
    function addCallback(name: 'CustomQuests.onQuestOutputStateChanged', func: onQuestOutputStateChangedFunction): void

    function addCallback(name: 'CustomQuests.onInputStateChangedLocal', func: onInputStateChangedLocalFunction): void
    /**
     * Automatic changes caused by input changes do not trigger this callback
     */
    function addCallback(name: 'CustomQuests.onOutputStateChangedLocal', func: onOutputStateChangedLocalFunction): void
    function addCallback(name: 'CustomQuests.onQuestInputStateChangedLocal', func: onQuestInputStateChangedLocalFunction): void
    function addCallback(name: 'CustomQuests.onQuestOutputStateChangedLocal', func: onQuestOutputStateChangedLocalFunction): void

    interface onInputStateChangedFunction {
        (inputId: CQTypes.inputId, newState: CQTypes.InputStateObject, oldState: CQTypes.InputStateObject, extraInfo: {[key: string]: unknown}): void
    }

    interface onOutputStateChangedFunction {
        (outputId: CQTypes.outputId, newState: CQTypes.OutputStateObject, oldState: CQTypes.OutputStateObject, extraInfo: {[key: string]: unknown}): void
    }

    interface onQuestInputStateChangedFunction {
        (path: CQTypes.PathArray, newState: CQTypes.QuestInputState, oldState: CQTypes.QuestInputState): void
    }

    interface onQuestOutputStateChangedFunction {
        (path: CQTypes.PathArray, newState: CQTypes.QuestOutputState, oldState: CQTypes.QuestOutputState): void
    }

    interface onInputStateChangedLocalFunction {
        (path: CQTypes.PathArray, index: number, newState: CQTypes.InputStateObject, oldState: CQTypes.InputStateObject, extraInfo: {[key: string]: unknown}): void
    }

    interface onOutputStateChangedLocalFunction {
        (path: CQTypes.PathArray, index: number, newState: CQTypes.OutputStateObject, oldState: CQTypes.OutputStateObject, extraInfo: {[key: string]: unknown}): void
    }

    interface onQuestInputStateChangedLocalFunction {
        (path: CQTypes.PathArray, newState: CQTypes.QuestInputState, oldState: CQTypes.QuestInputState): void
    }

    interface onQuestOutputStateChangedLocalFunction {
        (path: CQTypes.PathArray, newState: CQTypes.QuestOutputState, oldState: CQTypes.QuestOutputState): void
    }
}
