/// <reference path='./core-engine.d.ts'/>

declare namespace CQTypes {
    type bitmap = string
    type TextJson = string | {[lang: string]: string}
    interface ExtraJson {type: string, [key: string]: unknown}
    interface ItemJson {id: string | number, count?: number, data?: number, extra?: ExtraJson[]}
    interface IconJson {bitmap?: bitmap, id?: string | number, count?: number, data?: number, extra?: ExtraJson[]}
    interface PathObject {source: string, capter: string, quest: string}
    type refs = `ref:${string}`
    type Ref<T> = refs | T

    namespace IOTypes {
        interface IOJsonBase {
            type: string
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
        id: string
        pos: [
            x: number | [id: string, plus: number], 
            y: number | [id: string, plus: number]
        ]
        size: number | [id: string, times: number]
        icon: Ref<IconJson> | [
            locked: Ref<IconJson>,
            unlocked: Ref<IconJson>,
            finished: Ref<IconJson>
        ]
        dependence?: Array<string | [
            source: string | null,
            chapter: string | null,
            quest: string,
            width?: number
        ]>
        hidden?: boolean
        inner: {
            input: IOTypes.InputJson[]
            output: IOTypes.OutputJson[]
            name: TextJson
            text: TextJson
        }
        ref?: {[key: refs]: object}
    }

    interface QuestJson_Custom {
        type: 'custom'
        id: string
        elem: UI.Elements
    }

    interface ChapterJson {
        id: string
        name: TextJson
        icon: Ref<IconJson>
        quest: Array<QuestJson | QuestJson_Custom>
        background?: bitmap
        ref?: {[key: refs]: object}
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
        ref?: {[key: refs]: object}
    }
    
    enum playerState {
        absent = 0,
        member = 1,
        admin = 2,
        owner = 3
    }
    interface team {
        id: string
        bitmap: IconJson
        name: string
        players: {[player: number]: playerState}
        setting: {}
    }

    enum inputState {
        unfinished = 0,
        finished = 1,
        repeat_unfinished = 2
    }
    enum outputState {
        unreceived = 0,
        received = 1,
        repeat_unreceived = 2
    }
    interface data {
        [source: string]: {
            [chapter: string]: {
                [quest: string]: {
                    input: Array<Nullable<{
                        state: inputState
                        [key: string]: unknown
                    }>>
                    output: Array<Nullable<{
                        state: outputState
                        [key: string]: unknown
                    }>>
                }
            }
        }
    }

    interface extraTypeCb {
        fromJson: (item: ItemInstance, extraJson: ExtraJson, onServer?: boolean) => void
        fromItem: (item: ItemInstance, extraJson: ExtraJson) => boolean
        isPassed: (item: ItemInstance, extraJson: ExtraJson) => boolean
    }
}

interface Store {
    saved: {
        bookGived: {[player: number]: boolean}
        team: {[teamId: string]: CQTypes.team}
        data: {[dataId: string]: CQTypes.data}
        admin: {[player: number]: boolean}
        editor: {[player: number]: boolean}
    }
    cache: {
        playerLoaded: {[player: number]: boolean}
    }
    localCache: {
        data: CQTypes.data
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
    t (str: CQTypes.TextJson, source?: string, chapter?: string, quest?: string, type?: string): string
}

interface Utils {
    voidFunc (): void
    log (message: string, type: string, hasAlert?: boolean): void
    randomString (): string
    isDefined (length: number, arr: unknown[]): boolean
    hasKeyOfKeys (obj: {[key: string]: unknown}, keys: string[]): boolean
    deepCopy <T = object>(obj: T): T
    debounce <T = Function>(func: T, wait: number, func2?: T, ths?: unknown): T
    transferIdFromJson (id: CQTypes.ItemJson['id'], onServer?: boolean): number
    idFromItem: {[id: number]: string}
    transferIdFromItem (id: number): string
    extraType: {[type: string]: {
        fromJson?: CQTypes.extraTypeCb['fromJson']
        fromItem?: CQTypes.extraTypeCb['fromItem']
        isPassed?: CQTypes.extraTypeCb['isPassed']
    }}
    setExtraTypeCb (type: string, { fromJson, fromItem, isPassed }: {
        fromJson?: CQTypes.extraTypeCb['fromJson']
        fromItem?: CQTypes.extraTypeCb['fromItem']
        isPassed?: CQTypes.extraTypeCb['isPassed']
    }): void
    getExtraTypeCb (type: string, from: 'fromJson'): CQTypes.extraTypeCb['fromJson'] | Utils['voidFunc']
    getExtraTypeCb (type: string, from: 'fromItem'): CQTypes.extraTypeCb['fromItem'] | Utils['voidFunc']
    getExtraTypeCb (type: string, from: 'isPassed'): CQTypes.extraTypeCb['isPassed'] | Utils['voidFunc']
    transferItemFromJson (itemJson: CQTypes.ItemJson, onServer?: boolean): ItemInstance
    transferItemFromItem (item: ItemInstance): CQTypes.ItemJson
    isItemExtraPassed (item: ItemInstance, extraJsonArray: CQTypes.ExtraJson[] | CQTypes.ExtraJson): boolean
    readContents (path: string): CQTypes.MainJson | {}
}


