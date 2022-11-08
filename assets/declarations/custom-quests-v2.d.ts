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
    interface IconJson {bitmap?: bitmap, darken?: boolean, id?: string | number, count?: number, data?: number, extra?: ExtraJson[]}
    type PathArray = [sourceId: sourceId, capterId: chapterId, questId: questId]
    type Ref<T> = `ref:${refId}` | T

    namespace IOTypes {
        interface InputJsonBase {
            type: string
            description?: TextJson
            [key: string]: any
        }

        interface InputJson_group extends InputJsonBase {
            type: 'group'
            icon: Ref<IconJson>
            list: Array<Ref<InputJson>>
            count?: number
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
            isLevel?: boolean
            submit?: boolean
        }
        interface InputJson_visit_dimension extends InputJsonBase {
            type: 'visit_dimension'
            icon: Ref<IconJson>
            dimension: string | number
        }
        interface InputJson_location extends InputJsonBase {
            type: 'location'
            icon: Ref<IconJson>
            pos: [x: number, y: number, z: number]
            radius: [x: number, y: number, z: number]
            dimension?: string | number
            ignoreDimension?: boolean
        }
        interface InputJson_kill extends InputJsonBase {
            type: 'kill'
            icon: Ref<IconJson>
            entityId: number
            count: number
        }
        type InputJson = (
            InputJsonBase
            | InputJson_group
            | InputJson_check
            | InputJson_item
            | InputJson_exp
            | InputJson_visit_dimension
            | InputJson_location
            | InputJson_kill
        )

        interface OutputJsonBase {
            type: string
            description?: TextJson
            autoReceive?: boolean
            mutiReward?: boolean
            [key: string]: any
        }

        interface OutputJson_group extends OutputJsonBase {
            type: 'group'
            icon: Ref<IconJson>
            list: Array<{
                output: Ref<OutputJson>
                weight?: number
            }>
            count?: number
            isSelect?: boolean
        }
        interface OutputJson_empty extends OutputJsonBase {
            type: 'empty'
        }
        interface OutputJson_item extends ItemJson, OutputJsonBase {
            type: 'item'
            bitmap?: bitmap
        }
        interface OutputJson_exp extends OutputJsonBase {
            type: 'exp'
            value: number
            isLevel?: boolean
        }
        interface OutputJson_command extends OutputJsonBase {
            type: 'command'
            commands: string[]
        }
        interface OutputJson_message extends OutputJsonBase {
            type: 'message'
            message: TextJson
            toAll?: boolean
        }
        type OutputJson = (
            OutputJsonBase
            | OutputJson_group
            | OutputJson_item
            | OutputJson_exp
            | OutputJson_command
            | OutputJson_message
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
            unfinished: Ref<IconJson>,
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
            /** @todo */
            repeat?: boolean
            repeatTime?: number
        }
        ref?: {[refId: refId]: unknown}
    }

    interface QuestJsonElement {
        type: 'custom'
        id: questId
        elem: UI.Elements | Array<UI.Elements>
    }

    interface ChapterJson {
        id: chapterId
        name: TextJson
        icon: Ref<IconJson>
        quest: Array<QuestJson | QuestJsonElement>
        background?: [bitmap?: bitmap, ratdio?: number]
        ref?: {[refId: refId]: unknown}
    }

    interface MainJson {
        name: TextJson
        main: ChapterJson[]
        group?: Array<{
            name: TextJson
            icon: Ref<IconJson>
            list: Array<chapterId>
        }>
        background?: [bitmap?: bitmap, ratdio?: number]
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
        icon: [locked: IconJson, unfinished: IconJson, finished: IconJson]
        parent: Array<[sourceId: sourceId, chapterId: chapterId, questId: questId, width?: number]>
        child: Array<PathArray>
        hidden: boolean
        inner: {
            input: Array<IOTypes.InputJson>
            output: Array<IOTypes.OutputJson>
            name: TextJson
            text: TextJson
            /** @todo */
            repeat: boolean
            /** @todo */
            repeat_time?: number
        }
    }

    interface ResolvedChapterJson {
        quest: {[questId: questId]: ResolvedQuestJson | QuestJsonElement}
        name: TextJson
        icon: IconJson
        background?: ChapterJson['background']
    }

    interface ResolvedMainJson {
        chapter: {[chapterId: chapterId]: ResolvedChapterJson}
        name: TextJson
        group?: Array<{
            name: TextJson
            icon: IconJson
            list: Array<chapterId>
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
        [key: string]: any
    }
    interface OutputStateObject {
        state: OutputState
        [key: string]: any
    }
    interface QuestSaveData {
        inputState: QuestInputState
        input: Array<Nullable<InputStateObject>>
        outputState: QuestOutputState
        output: Array<Nullable<OutputStateObject>>
    }
    interface SaveData {
        [sourceId: sourceId]: {
            [chapterId: chapterId]: {
                [questId: questId]: QuestSaveData
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
        setState: (extraInfo: object, stateObject: T) => void
        getPlayerList: (online?: boolean) => Array<number>
        getConnectedClientList: () => NetworkConnectedClientList
        createChildInputId?: Nullable<(inputJson: CQTypes.IOTypes.InputJson, toolsCb: CQTypes.IOTypeToolsCb<CQTypes.InputStateObject>, onUnload?: () => void) => CQTypes.inputId>
        createChildOutputId?: Nullable<(outputJson: CQTypes.IOTypes.OutputJson, toolsCb: CQTypes.IOTypeToolsCb<CQTypes.OutputStateObject>, onUnload?: () => void) => CQTypes.outputId>
    }

    interface IOTypeToolsLocalCb <T = InputStateObject | OutputStateObject>{
        getState: () => T
        sendPacket?: (packetData: object) => void
        openDescription?: () => void
    }

    /**
     * Modify `inputJson` is not allowed except [[resolveJson]]
     */
    interface InputTypeCb<T = IOTypes.InputJson> {
        resolveJson?: (this: void, inputJson: IOTypes.InputJson, refsArray: Array<{[refId: refId]: unknown}>, bitmapNameObject: {[bitmapName: string]: boolean}) => Nullable<T>
        onLoad?: (this: void, inputJson: T, toolsCb: IOTypeToolsCb<InputStateObject>, cache: object) => void
        onUnload?: (this: void, inputJson: T, toolsCb: IOTypeToolsCb<InputStateObject>, cache: object) => void
        onCustomCall?: (this: void, inputJson: T, toolsCb: IOTypeToolsCb<InputStateObject>, cache: object, extraInfo: object) => unknown
        onPacket?: (this: void, inputJson: T, toolsCb: IOTypeToolsCb<InputStateObject>, cache: object, extraInfo: {
            client: NetworkClient
            packetData: object
        }) => void
        onTick?: (this: void, inputJson: T, toolsCb: IOTypeToolsCb<InputStateObject>, cache: object, extraInfo: {
            playerInventory: Array<{
                player: number
                normal: ReturnType<Utils['getInventory']>
                sort: ReturnType<Utils['getSortInventory']>
                extra: ReturnType<Utils['getExtraInventory']>
            }>
        }) => void
        getIcon?: (this: void, inputJson: T, toolsCb: IOTypeToolsLocalCb<InputStateObject>, extraInfo: {
            pos: [x: number, y: number]
            size: number
            prefix: string
            setCloseListener?: (listener: () => void) => void
            setReloadListener?: (listener: () => void) => void
        }) => {[key: string]: UI.Elements} | Array<[string, UI.Elements]>
        getDescription?: (this: void, inputJson: T, toolsCb: IOTypeToolsLocalCb<InputStateObject>, extraInfo: {
            posY: number
            prefix: string
            setCloseListener?: (listener: () => void) => void
        }) => {
            maxY: number
            elements: {[key: string]: UI.Elements} | Array<[string, UI.Elements]>
        }
        onEdit?: (...params: unknown[]) => unknown
    }

    interface InputTypeConfig {
        allowRepeat?: boolean
        allowGroup?: boolean
    }

    /**
     * Modify `outputJson` is not allowed except [[resolveJson]]
     */
    interface OutputTypeCb<T = IOTypes.OutputJson> {
        resolveJson?: (this: void, outputJson: IOTypes.OutputJson, refsArray: Array<{[refId: refId]: unknown}>, bitmapNameObject: {[bitmapName: string]: boolean}) => Nullable<T>
        onLoad?: (this: void, outputJson: T, toolsCb: IOTypeToolsCb<OutputStateObject>, cache: object) => void
        onUnload?: (this: void, outputJson: T, toolsCb: IOTypeToolsCb<OutputStateObject>, cache: object) => void
        onCustomCall?: (this: void, outputJson: T, toolsCb: IOTypeToolsCb<OutputStateObject>, cache: object, extraInfo: object) => unknown
        onPacket?: (this: void, outputJson: T, toolsCb: IOTypeToolsCb<OutputStateObject>, cache: object, extraInfo: {
            client: NetworkClient
            packetData: object
        }) => void
        onFastReceive?: (this: void, outputJson: T, toolsCb: IOTypeToolsCb<OutputStateObject>, cache: object, extraInfo: {
            operator?: Operator
            [key: string]: unknown
        }) => void
        onReceive?: (this: void, outputJson: T, toolsCb: IOTypeToolsCb<OutputStateObject>, cache: object, extraInfo: {
            operator?: Operator
            [key: string]: unknown
        }) => void
        getIcon?: (this: void, outputJson: T, toolsCb: IOTypeToolsLocalCb<OutputStateObject>, extraInfo: {
            pos: [x: number, y: number]
            size: number
            prefix: string
            setCloseListener?: (listener: () => void) => void
            setReloadListener?: (listener: () => void) => void
        }) => {[key: string]: UI.Elements} | Array<[string, UI.Elements]>
        getDescription?: (this: void, outputJson: T, toolsCb: IOTypeToolsLocalCb<OutputStateObject>, extraInfo: {
            posY: number
            prefix: string
            setCloseListener?: (listener: () => void) => void
        }) => {
            maxY: number
            elements: {[key: string]: UI.Elements} | Array<[string, UI.Elements]>
        }
        onEdit?: (...params: unknown[]) => unknown
    }

    interface OutputTypeConfig {
        allowRepeat?: boolean
        allowGroup?: boolean
    }
}

interface EnumObject {
    readonly playerState: {
        readonly absent: CQTypes.PlayerState.absent
        readonly member: CQTypes.PlayerState.member
        readonly admin: CQTypes.PlayerState.admin
        readonly owner: CQTypes.PlayerState.owner
    }
    readonly inputState: {
        readonly unfinished: CQTypes.InputState.unfinished
        readonly finished: CQTypes.InputState.finished
        readonly repeat_unfinished: CQTypes.InputState.repeat_unfinished
    }
    readonly outputState: {
        readonly unreceived: CQTypes.OutputState.unreceived
        readonly received: CQTypes.OutputState.received
        readonly repeat_unreceived: CQTypes.OutputState.repeat_unreceived
    }
    readonly questInputState: {
        readonly locked: CQTypes.QuestInputState.locked
        readonly unfinished: CQTypes.QuestInputState.unfinished
        readonly finished: CQTypes.QuestInputState.finished
        readonly repeat_unfinished: CQTypes.QuestInputState.repeat_unfinished
    }
    readonly questOutputState: {
        readonly locked: CQTypes.QuestOutputState.locked
        readonly unreceived: CQTypes.QuestOutputState.unreceived
        readonly received: CQTypes.QuestOutputState.received
        readonly repeat_unreceived: CQTypes.QuestOutputState.repeat_unreceived
    }
}

interface Store {
    saved: {
        players: {
            [player: number]: {
                saveId: CQTypes.saveId
                teamId: CQTypes.teamId
                bookGived: boolean
                name: string
                isAdmin?: boolean
                isEditor?: boolean
            }
        }
        team: {[teamId: CQTypes.teamId]: CQTypes.team}
        data: {[saveId: CQTypes.saveId]: CQTypes.SaveData}
        playerList: {[saveId: CQTypes.saveId]: Array<number>}
        exist: {[saveId: CQTypes.saveId]: boolean}
    }
    cache: {
        playerLoaded: {[player: number]: boolean},
        playerList: {
            [saveId: CQTypes.saveId]: {
                player: Array<number>
                client: Nullable<NetworkConnectedClientList>
            }
        }
    }
    localCache: {
        resolvedJson: CQTypes.AllResolvedMainJson
        jsonConfig: {[sourceId: CQTypes.sourceId]: CQTypes.MainJson['config']}
        saveData: CQTypes.SaveData
        team: Nullable<CQTypes.team>
        teamPlayerList: ReturnType<ServerSystem['getTeamPlayerList']>
        isAdmin: boolean
        teamList: ReturnType<ServerSystem['getTeamList']>
    }
}

interface TranAPI {
    lang: string
    translation: {[lang: string]: {[str: string]: string}}
    addTranslation (str: string, params: {[lang: string]: string}): void
    getTranslation (str: string): {[lang: string]: string}
    translate (str?: CQTypes.TextJson): string
}

interface Utils {
    voidFunc (): void
    log (message: string, type: string, hasAlert?: boolean): void
    error (message: string, err: Error): void
    getUUID (): string
    md5 (str: string): string
    isObject (obj: any): obj is object
    deepCopy <T = object>(obj: T): T
    debounce <T extends any[], RT = any, TT = any>(func: (this: TT, ...args: T) => RT, wait: number, func2?: Nullable<(this: TT, ...args: T) => RT>, ths?: TT): (...args: T) => RT
    safeResult <T extends Function>(func: T, ths?: any): T
    operate (a: number, operator: string, b: number, defaultValue?: boolean): boolean
    replace (str: string, replaceArray: Array<[key: string, str: string]>): string
    transferIdFromJson (id: CQTypes.ItemJson['id']): number
    idFromItem: {[id: number]: string}
    transferIdFromItem (id: number): string
    extraType: {[type: string]: CQTypes.extraTypeCb}
    setExtraTypeCb (type: string, extraTypeCb: CQTypes.extraTypeCb): void
    getExtraTypeCb (type: string, from: string): Function
    getExtraTypeCb (type: string, from: 'fromJson'): CQTypes.extraTypeCb['fromJson'] | Utils['voidFunc']
    getExtraTypeCb (type: string, from: 'fromItem'): CQTypes.extraTypeCb['fromItem'] | Utils['voidFunc']
    getExtraTypeCb (type: string, from: 'isPassed'): CQTypes.extraTypeCb['isPassed'] | Utils['voidFunc']
    transferItemFromJson (itemJson: {id?: string | number, count?: number, data?: number, extra?: CQTypes.ExtraJson[]}): ItemInstance
    transferItemFromItem (item: ItemInstance): CQTypes.ItemJson
    isItemExtraPassed (item: ItemInstance, extraJsonArray: CQTypes.ExtraJson[] | CQTypes.ExtraJson): boolean
    readContents (path: string): CQTypes.MainJson | {}
    resolveRefs <T = unknown>(value: CQTypes.Ref<T>, refsArray: Array<{[refId: CQTypes.refId]: unknown}>): Nullable<T>
    resolveBitmap (bitmap: CQTypes.bitmap, bitmapNameObject: {[bitmapName: string]: boolean}): Nullable<CQTypes.bitmap>
    resolveTextJson (textJson: unknown): CQTypes.TextJson
    resolveIconJson (iconJson: CQTypes.Ref<CQTypes.IconJson>, refsArray: Array<{[refId: CQTypes.refId]: unknown}>, bitmapNameObject: {[bitmapName: string]: boolean}): CQTypes.IconJson
    putTextureSourceFromBase64 (name: string, encodedString: string): void
    getInput (params: {text?: string, hint?: string; title?: string, button?: string, mutiLine?: boolean}, cb: (keyword: string) => void): void
    dialog (params: {text: string; title?: string, button?: string}, cb?: () => void): void
    getInventory (player: number): Array<ItemInstance>
    getSortInventory (inventory: Array<ItemInstance>): {[idData: `${number}:${number}`]: number}
    getExtraInventory (inventory: Array<ItemInstance>): {[idData: `${number}:${number}`]: Array<ItemInstance>}
}

interface IOTypeTools {
    inputType: {
        [type: string]: {
            name: CQTypes.TextJson
            cb: CQTypes.InputTypeCb
            config: CQTypes.InputTypeConfig
        }
    }
    setInputType (type: string, name: CQTypes.TextJson, inputTypeCb: CQTypes.InputTypeCb, config?: CQTypes.InputTypeConfig): void
    getAllInputType (): Array<string>
    getInputTypeName (type: string): string
    getInputTypeCb (type: string): CQTypes.InputTypeCb
    getInputTypeConfig (type: string): Nullable<CQTypes.InputTypeConfig>
    inputObject: {
        [inputId: CQTypes.inputId]: {
            saveId: CQTypes.saveId
            loaded: boolean
            cache: object
            json: CQTypes.IOTypes.InputJson
            toolsCb: CQTypes.IOTypeToolsCb<CQTypes.InputStateObject>
            onUnload?: () => void
        }
    }
    typedInputList: {
        [saveId: CQTypes.saveId]: {
            [type: string]: Array<CQTypes.inputId>
        }
    }
    getAllInputIdByType (type: string | Array<string>, saveId?: CQTypes.saveId): Array<CQTypes.inputId>
    createInputId (inputJson: CQTypes.IOTypes.InputJson, toolsCb: CQTypes.IOTypeToolsCb<CQTypes.InputStateObject>, onUnload?: () => void, saveId?: CQTypes.saveId): CQTypes.inputId
    createChildInputId (inputId: CQTypes.inputId, inputJson: CQTypes.IOTypes.InputJson, toolsCb: CQTypes.IOTypeToolsCb<CQTypes.InputStateObject>, onUnload?: () => void): CQTypes.inputId
    isInputIdLoaded (inputId: Nullable<CQTypes.inputId>): boolean
    loadInput (inputId: CQTypes.inputId): void
    unloadInput (inputId: CQTypes.inputId): void
    callInputTypeCb (inputId: CQTypes.inputId, method: string, extraInfo: object): unknown
    callInputTypeCb (inputId: CQTypes.inputId, method: 'onCustomCall', extraInfo: Parameters<Exclude<CQTypes.InputTypeCb['onCustomCall'], undefined>>[3]): ReturnType<Exclude<CQTypes.InputTypeCb['onCustomCall'], undefined>>
    callInputTypeCb (inputId: CQTypes.inputId, method: 'onPacket', extraInfo: Parameters<Exclude<CQTypes.InputTypeCb['onPacket'], undefined>>[3]): ReturnType<Exclude<CQTypes.InputTypeCb['onPacket'], undefined>>
    callInputTypeCb (inputId: CQTypes.inputId, method: 'onTick', extraInfo: Parameters<Exclude<CQTypes.InputTypeCb['onTick'], undefined>>[3]): ReturnType<Exclude<CQTypes.InputTypeCb['onTick'], undefined>>
    getPlayerListByInputId (inputId: CQTypes.inputId, online?: boolean): number[]
    getInputJsonByInputId (inputId: CQTypes.inputId): Nullable<CQTypes.IOTypes.InputJson>
    outputType: {
        [type: string]: {
            name: CQTypes.TextJson
            cb: CQTypes.OutputTypeCb
            config: CQTypes.OutputTypeConfig
        }
    }
    setOutputType (type: string, name: CQTypes.TextJson, outputTypeCb: CQTypes.OutputTypeCb, config?: CQTypes.OutputTypeConfig): void
    getAllOutputType (): Array<string>
    getOutputTypeName (type: string): string
    getOutputTypeCb (type: string): CQTypes.OutputTypeCb
    getOutputTypeConfig (type: string): Nullable<CQTypes.OutputTypeConfig>
    outputObject: {
        [outputId: CQTypes.outputId]: {
            saveId: CQTypes.saveId
            loaded: boolean
            cache: object
            json: CQTypes.IOTypes.OutputJson
            toolsCb: CQTypes.IOTypeToolsCb<CQTypes.OutputStateObject>
            onUnload?: () => void
        }
    }
    typedOutputList: {
        [saveId: CQTypes.saveId]: {
            [type: string]: Array<CQTypes.outputId>
        }
    }
    getAllOutputIdByType (type: string | Array<string>, saveId?: CQTypes.saveId): Array<CQTypes.outputId>
    createOutputId (outputJson: CQTypes.IOTypes.OutputJson, toolsCb: CQTypes.IOTypeToolsCb<CQTypes.OutputStateObject>, onUnload?: () => void, saveId?: CQTypes.saveId): CQTypes.outputId
    createChildOutputId (outputId: CQTypes.outputId, outputJson: CQTypes.IOTypes.OutputJson, toolsCb: CQTypes.IOTypeToolsCb<CQTypes.OutputStateObject>, onUnload?: () => void): CQTypes.outputId
    isOutputIdLoaded (outputId: Nullable<CQTypes.outputId>): boolean
    loadOutput (outputId: CQTypes.outputId): void
    unloadOutput (outputId: CQTypes.outputId): void
    callOutputTypeCb (outputId: CQTypes.outputId, method: string, extraInfo: object): unknown
    callOutputTypeCb (outputId: CQTypes.outputId, method: 'onCustomCall', extraInfo: Parameters<Exclude<CQTypes.OutputTypeCb['onCustomCall'], undefined>>[3]): ReturnType<Exclude<CQTypes.OutputTypeCb['onCustomCall'], undefined>>
    callOutputTypeCb (outputId: CQTypes.outputId, method: 'onPacket', extraInfo: Parameters<Exclude<CQTypes.OutputTypeCb['onPacket'], undefined>>[3]): ReturnType<Exclude<CQTypes.OutputTypeCb['onPacket'], undefined>>
    callOutputTypeCb (outputId: CQTypes.outputId, method: 'onFastReceive', extraInfo: Parameters<Exclude<CQTypes.OutputTypeCb['onFastReceive'], undefined>>[3]): ReturnType<Exclude<CQTypes.OutputTypeCb['onFastReceive'], undefined>>
    callOutputTypeCb (outputId: CQTypes.outputId, method: 'onReceive', extraInfo: Parameters<Exclude<CQTypes.OutputTypeCb['onReceive'], undefined>>[3]): ReturnType<Exclude<CQTypes.OutputTypeCb['onReceive'], undefined>>
    getPlayerListByOutputId (outputId: CQTypes.outputId, online?: boolean): number[]
    getOutputJsonByOutputId (outputId: CQTypes.outputId): Nullable<CQTypes.IOTypes.OutputJson>
}

interface System {
    resolveInputJson (inputJson:  CQTypes.IOTypes.InputJsonBase, refsArray: Array<{[refId: CQTypes.refId]: unknown}>, bitmapNameObject: {[bitmapName: string]: boolean}): CQTypes.IOTypes.InputJson
    resolveOutputJson (outputJson: CQTypes.IOTypes.OutputJsonBase, refsArray: Array<{[refId: CQTypes.refId]: unknown}>, bitmapNameObject: {[bitmapName: string]: boolean}): CQTypes.IOTypes.OutputJson
    resolveJson (json: CQTypes.AllMainJson): {
        json: CQTypes.AllResolvedMainJson
        config: {[sourceId: CQTypes.sourceId]: CQTypes.MainJson['config']}
        bitmaps: CQTypes.MainJson['bitmaps']
    }
    isQuestExist (json: CQTypes.AllResolvedMainJson, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): boolean
    getQuestJson (json: CQTypes.AllResolvedMainJson, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): Nullable<CQTypes.ResolvedQuestJson | CQTypes.QuestJsonElement>
    getParent (json: CQTypes.AllResolvedMainJson, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): Array<CQTypes.PathArray>
    getChild (json: CQTypes.AllResolvedMainJson, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): Array<CQTypes.PathArray>
    getInputState (data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number): CQTypes.InputStateObject
    getOutputState (data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number): CQTypes.OutputStateObject
    validateQuestSaveData (questJson: CQTypes.ResolvedQuestJson, questData: CQTypes.QuestSaveData): void
    validateSaveData (json: CQTypes.AllResolvedMainJson, data: CQTypes.SaveData): void
    getQuestInputState (json: CQTypes.AllResolvedMainJson, data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): CQTypes.QuestInputState
    getQuestOutputState (json: CQTypes.AllResolvedMainJson, data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): CQTypes.QuestOutputState
    getQuestSaveData (json: CQTypes.AllResolvedMainJson, data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): CQTypes.QuestSaveData
    setInputState (json: CQTypes.AllResolvedMainJson, data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number,
        inputStateObject: CQTypes.InputStateObject, cb?: {
            onInputStateChanged?: (newInputStateObject: CQTypes.InputStateObject, oldInputStateObject: CQTypes.InputStateObject) => void
            onQuestInputStateChanged?: (newQuestInputState: CQTypes.QuestInputState, oldQuestInputState: CQTypes.QuestInputState) => void
            onQuestOutputStateChanged?: (newQuestOutputState: CQTypes.QuestOutputState, oldQuestOutputState: CQTypes.QuestOutputState.locked) => void
            onChildQuestInputStateChanged?: (pathArray: CQTypes.PathArray, newQuestInputState: CQTypes.QuestInputState.unfinished, oldQuestInputState: CQTypes.QuestInputState.locked) => void
        }): void
    setOutputState (json: CQTypes.AllResolvedMainJson, data: CQTypes.SaveData, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number,
        outputStateObject: CQTypes.OutputStateObject, cb?: {
            onOutputStateChanged?: (newOutputStateObject: CQTypes.OutputStateObject, oldOutputStateObject: CQTypes.OutputStateObject) => void
            onQuestOutputStateChanged?: (newQuestOutputState: CQTypes.QuestOutputState, oldQuestOutputState: CQTypes.QuestOutputState) => void
        }): void
}

interface ServerSystem {
    json: CQTypes.AllMainJson
    resolvedJson: CQTypes.AllResolvedMainJson
    rootQuest: {
        [sourceId: CQTypes.sourceId]: {
            [chapterId: CQTypes.chapterId]: {
                [questId: CQTypes.questId]: boolean
            }
        }
    },
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
    loadedQuestIdArray: {
        [saveId: CQTypes.saveId]: {
            input: Array<CQTypes.inputId>
            output: Array<CQTypes.outputId>
        }
    }
    addContents (sourceId: CQTypes.sourceId, contents: CQTypes.MainJson | {}): void
    createSaveId (playerList: Array<number>): CQTypes.saveId
    getSaveId (target: number | CQTypes.teamId): CQTypes.saveId
    deleteSaveId (saveId: CQTypes.saveId): void
    isSaveIdValid (saveId: CQTypes.saveId): boolean
    isTeamSaveId (saveId: CQTypes.saveId): boolean
    setPlayerLoaded (player: number, loaded?: boolean): void
    isPlayerLoaded (player: number): boolean
    getPlayerList (saveId: CQTypes.saveId, online?: boolean): Array<number>
    getConnectedClientList (saveId: CQTypes.saveId): Nullable<NetworkConnectedClientList>
    getSaveData (saveId: CQTypes.saveId): CQTypes.SaveData
    getLoadedQuest (saveId: CQTypes.saveId, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): {
        input?: Array<Nullable<CQTypes.inputId>>
        output?: Array<Nullable<CQTypes.outputId>>
    }
    /**
     * @deprecated Use [[IOTypeTools.getAllInputIdByType]] instead
     */
    getTypedInputId (saveId: CQTypes.saveId, type: string): Array<CQTypes.inputId>
    /**
     * @deprecated Use [[IOTypeTools.getAllOutIdByType]] instead
     */
    getTypedOutputId (saveId: CQTypes.saveId, type: string): Array<CQTypes.outputId>
    unloadAllLoadedQuest (saveId: CQTypes.saveId): void
    loadInput (saveId: CQTypes.saveId, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number): void
    loadOutput (saveId: CQTypes.saveId, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number): void
    loadQuest (saveId: CQTypes.saveId, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId): void
    loadAllQuest (saveId: CQTypes.saveId, isReload?: boolean): void
    setInputState (saveId: CQTypes.saveId, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number,
        extraInfo: object, inputStateObject: CQTypes.InputStateObject): void
    setOutputState (saveId: CQTypes.saveId, sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number,
        extraInfo: object, outputStateObject: CQTypes.OutputStateObject): void
    receiveAllQuest (saveId: CQTypes.saveId, sourceId: CQTypes.sourceId, extraInfo: {operator?: CQTypes.Operator, [key: string]: unknown}): void
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
    getTeamPlayerList (teamId: CQTypes.teamId): Nullable<Array<{name: string, online: boolean, player: number}>>
}

interface ClientSystem {
    sendInputPacket (sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number, packetData: object): void
    sendOutputPacket (sourceId: CQTypes.sourceId, chapterId: CQTypes.chapterId, questId: CQTypes.questId, index: number, packetData: object): void
    receiveAllQuest (sourceId: CQTypes.sourceId, extraInfo: {[key: string]: unknown}): void
    refreshTeamList (): void
    createTeam (team: {
        bitmap: CQTypes.team['bitmap']
        name: CQTypes.team['name']
        password: string
        setting: CQTypes.team['settingTeam']
    }): void
    joinTeam (teamId: CQTypes.teamId, password: string): void
    getTeam (): Nullable<CQTypes.team>
    exitTeam (): void
    deleteTeam (): void
    setPlayerStateForTeam (player: number, state: CQTypes.PlayerState): void
    changeBitmapTeam (bitmap: CQTypes.team['bitmap']): void
    renameTeam (name: CQTypes.team['name']): void
    changePasswordTeam (password: string): void
}

interface QuestUi {
    open (sourceId: CQTypes.sourceId): void
    openForPlayer (sourceId: CQTypes.sourceId, player: number): void
    openQuestUi (questJson: CQTypes.ResolvedQuestJson, saveData: CQTypes.QuestSaveData, params: {
        sendInputPacket?: (index: number, packetData: object) => void
        sendOutputPacket?: (index: number, packetData: object) => void
        openParentListUi?: () => void
        openChildListUi?: () => void
        isReload?: boolean
    }): {
        isClosed: () => boolean
        close: () => void
    }
    openDescriptionUi (isInput: true, inputJson: CQTypes.IOTypes.InputJson, toolsCb: CQTypes.IOTypeToolsLocalCb<CQTypes.InputStateObject>):  {
        isClosed: () => boolean
        close: () => void
    }
    openDescriptionUi (isInput: false, outputJson: CQTypes.IOTypes.OutputJson, toolsCb: CQTypes.IOTypeToolsLocalCb<CQTypes.OutputStateObject>): {
        isClosed: () => boolean
        close: () => void
    }
    openTeamUi (): void
    openQuestListUi (title: string, questList: Array<CQTypes.PathArray>, onSelect: (path: CQTypes.PathArray) => boolean): void
    openItemChooseUi (title: string, isValid: (item: ItemInstance) => boolean, onSelect: (item: ItemInstance) => void): void
    openSelectionUi (title: Nullable<string>, selection: Array<{ text: string, darken?: boolean, onSelect: () => boolean }>): void
}

interface QuestUiTools {
    createUi (content: UI.Window['content'], eventListener?: Nullable<{
        onOpen?: (ui: ReturnType<QuestUiTools['createUi']>) => void
        onClose?: (ui: ReturnType<QuestUiTools['createUi']>) => void
    }>, option?: Nullable<{
        closeOnBackPressed?: boolean
        blockingBackground?: boolean
        asGameOverlay?: boolean
        notTouchable?: boolean
        hideNavigation?: boolean
    }>): {
        content: UI.Window['content']
        ui: UI.Window
        newElements: Array<string>
        binElements: Array<string>
        addElements (elementsObj: {[key: string]: UI.Elements} | Array<[string, UI.Elements]>): void
        clearNewElements (newElements?: Nullable<Array<string>>, lazy?: boolean): void
        refresh (): void
        open (refresh?: boolean): void
        close (): void
        isOpened (): boolean
    }
    getQuestIcon (questJson: CQTypes.ResolvedQuestJson, saveData: CQTypes.QuestSaveData, option: {
        prefix: string
        pos?: [x: number, y: number]
        size?: number
        clicker?: UI.Elements['clicker']
    }): Array<[string, UI.Elements]>
    getDependencyLine (posParent: [x: number, y: number], posChild: [x: number, y: number], width: number, color: number): Array<UI.DrawingElements & UI.Elements>
    getTextWidth (text: string, size: number): number
    resolveText (text: string, getWidthRatio: (str: string) => number): Array<string>
    resolveTextJsonToElements (textJson: Nullable<CQTypes.TextJson>, params: {
        prefix: string
        pos: [x: number, y: number, z?: number]
        maxWidth: number
        rowSpace: number
        font: UI.FontDescription
    }): {
        maxY: number
        elements: Array<[string, UI.Elements]>
    }
    createAnimator (duration: number, update: (animator: android.animation.ValueAnimator) => void): android.animation.ValueAnimator
}

interface Integration {
    openRecipeUI (item: ItemInstance, isUsage?: boolean): void
}

interface CustomQuestsAPI {
    readonly version: `${number}.${number}.${number}-${string}`
    readonly invalidId: CQTypes.invalidId
    readonly EnumObject: EnumObject
    readonly Store: Store
    readonly TranAPI: TranAPI
    readonly Utils: Utils
    readonly IOTypeTools: IOTypeTools
    readonly System: System
    readonly ServerSystem: ServerSystem
    readonly ClientSystem: ClientSystem
    readonly QuestUi: QuestUi
    readonly QuestUiTools: QuestUiTools
    requireGlobal (cmd: string): any
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

    function addCallback(name: 'CustomQuests.onLocalInputStateChanged', func: onLocalInputStateChangedFunction): void
    /**
     * Automatic changes caused by input changes do not trigger this callback
     */
    function addCallback(name: 'CustomQuests.onLocalOutputStateChanged', func: onLocalOutputStateChangedFunction): void
    function addCallback(name: 'CustomQuests.onLocalQuestInputStateChanged', func: onLocalQuestInputStateChangedFunction): void
    function addCallback(name: 'CustomQuests.onLocalQuestOutputStateChanged', func: onLocalQuestOutputStateChangedFunction): void
    function addCallback(name: 'CustomQuests.onLocalCacheChanged', func: onLocalCacheChangedFunction): void

    interface onInputStateChangedFunction {
        (inputId: CQTypes.inputId, newState: CQTypes.InputStateObject, oldState: CQTypes.InputStateObject, extraInfo: object): void
    }

    interface onOutputStateChangedFunction {
        (outputId: CQTypes.outputId, newState: CQTypes.OutputStateObject, oldState: CQTypes.OutputStateObject, extraInfo: object): void
    }

    interface onQuestInputStateChangedFunction {
        (path: CQTypes.PathArray, newState: CQTypes.QuestInputState, oldState: CQTypes.QuestInputState): void
    }

    interface onQuestOutputStateChangedFunction {
        (path: CQTypes.PathArray, newState: CQTypes.QuestOutputState, oldState: CQTypes.QuestOutputState): void
    }

    interface onLocalInputStateChangedFunction {
        (path: CQTypes.PathArray, index: number, newState: CQTypes.InputStateObject, oldState: CQTypes.InputStateObject, extraInfo: object): void
    }

    interface onLocalOutputStateChangedFunction {
        (path: CQTypes.PathArray, index: number, newState: CQTypes.OutputStateObject, oldState: CQTypes.OutputStateObject, extraInfo: object): void
    }

    interface onLocalQuestInputStateChangedFunction {
        (path: CQTypes.PathArray, newState: CQTypes.QuestInputState, oldState: CQTypes.QuestInputState): void
    }

    interface onLocalQuestOutputStateChangedFunction {
        (path: CQTypes.PathArray, newState: CQTypes.QuestOutputState, oldState: CQTypes.QuestOutputState): void
    }

    type LocalCache = Store['localCache']
    interface onLocalCacheChangedFunction {
        (packetData: {
            saveData?: LocalCache['saveData'] | null
            team?: LocalCache['team'] | null
            teamPlayerList?: LocalCache['teamPlayerList'] | null
            isAdmin?: LocalCache['isAdmin']
            teamList?: LocalCache['teamList']
        }, oldLocalCache: LocalCache): void
    }
}
