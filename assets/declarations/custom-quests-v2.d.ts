/// <reference path='./core-engine.d.ts'/>

declare type TextJson = string|{[lang: string]: string}
declare interface ExtraJson {type: string, [key: string]: unknown}
declare interface ItemJson {id: string|number, count?: number, data?: number, extra?: ExtraJson[]}
declare interface IconJson {bitmap?: string, id?: string|number, count?: number, data?: number, extra?: ExtraJson[]}

declare interface MainJson {}


declare interface TranAPI {
	translation: {[lang: string]: {[str: string]: string}}
    lang: string
    intTranslation (): void
    addTranslation (str: string, params: {[lang: string]: string}): void
    translate (str: string): string
    t (str: TextJson, source?: string, chapter?: string, quest?: string, type?: string): string
}

declare interface extraTypeCb {
    fromJson: (item: ItemInstance, extraJson: ExtraJson, onServer?: boolean) => void
    fromItem: (item: ItemInstance, extraJson: ExtraJson) => boolean
    isPassed: (item: ItemInstance, extraJson: ExtraJson) => boolean
}

declare class packetHelper <T = unknown[]> {
    addPacket: (name: string, func: (...params: T) => void) => void
    callPacket: (name: string, args?: T) => void
}

declare interface Utils {
    voidFunc (): void
    log (message: string, type: string, hasAlert?: boolean): void
    randomString (): string
    isDefined (length: number, arr: unknown[]): boolean
    hasKeyOfKeys (obj: {[key: string]: unknown}, keys: string[]): boolean
    debounce <T = Function>(func: T, wait: number, func2?: T, ths?: unknown): T
    transferIdFromJson (id: ItemJson['id'], onServer?: boolean): number
    idFromItem: {[id: number]: string}
    transferIdFromItem (id: number): string
    extraType: {[type: string]: {
        fromJson?: extraTypeCb['fromJson']
        fromItem?: extraTypeCb['fromItem']
        isPassed?: extraTypeCb['isPassed']
    }}
    setExtraTypeCb (type: string, { fromJson, fromItem, isPassed }: {
        fromJson?: extraTypeCb['fromJson']
        fromItem?: extraTypeCb['fromItem']
        isPassed?: extraTypeCb['isPassed']
    }): void
    getExtraTypeCb (type: string, from: 'fromJson'): extraTypeCb['fromJson'] | Utils['voidFunc']
    getExtraTypeCb (type: string, from: 'fromItem'): extraTypeCb['fromItem'] | Utils['voidFunc']
    getExtraTypeCb (type: string, from: 'isPassed'): extraTypeCb['isPassed'] | Utils['voidFunc']
    transferItemFromJson (itemJson: ItemJson, onServer?: boolean): ItemInstance
    transferItemFromItem (item: ItemInstance): ItemJson
    isItemExtraPassed (item: ItemInstance, extraJsonArray: ExtraJson[]|ExtraJson): boolean
    readQuestsData (path: string): MainJson | {},
    packetHelper: typeof packetHelper
}
