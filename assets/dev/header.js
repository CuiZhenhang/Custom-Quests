/// <reference path='../declarations/custom-quests-v2.d.ts'/>
/// <reference path='../lib/ChargeItem.js'/>
/// <reference path='./share.js'/>

IMPORT('ChargeItem')
const Color = android.graphics.Color
const Setting = (function () {
    const Setting = {
        UiSize: __config__.getNumber('setting.ui_size').floatValue(),
        padding: __config__.getNumber('setting.padding').floatValue(),
        path: __config__.getString('contents.path'),
        dev: __config__.getBool('contents.dev'),
        saveOnlyPlayer: __config__.getBool('save.only_player')
    }
    if (Setting.UiSize % 1 !== 0 || Setting.UiSize < 0 || Setting.UiSize > 2) {
        __config__.set('setting.ui_size', Setting.UiSize = 1)
        __config__.save()
    }
    if (typeof Setting.padding !== 'number') {
        __config__.set('setting.padding', Setting.padding = 60)
        __config__.save()
    } else if (Setting.padding < 20) {
        __config__.set('setting.padding', Setting.padding = 20)
        __config__.save()
    } else if (Setting.padding > 200) {
        __config__.set('setting.padding', Setting.padding = 200)
        __config__.save()
    }
    return Setting
})()

/** @type { CQTypes.invalidId } */
const InvalidId = 'invalid'

/** @type { EnumObject } */
const EnumObject = {
    playerState: {
        absent: 0,
        member: 1,
        admin: 2,
        owner: 3
    },
    inputState: {
        unfinished: 0,
        finished: 1,
        repeat_unfinished: 2
    },
    outputState: {
        unreceived: 0,
        received: 1,
        repeat_unreceived: 2
    },
    questInputState: {
        locked: -1,
        unfinished: 0,
        finished: 1,
        repeat_unfinished: 2
    },
    questOutputState: {
        locked: -1,
        unreceived: 0,
        received: 1,
        repeat_unreceived: 2
    }
}

/** @type { Store } */
const Store = (function () {
    /** @type { Store } */
    const DEFAULT = {
        saved: {
            players: {},
            team: {},
            data: {},
            playerList: {},
            exist: {}
        },
        cache: {
            playerLoaded: {},
            playerList: {}
        },
        localCache: {
            resolvedJson: null,
            jsonConfig: null,
            saveData: null,
            team: null,
            isAdmin: false,
            teamList: []
        }
    }
    Callback.addCallback('LevelSelected', function () {
        const obj = Utils.deepCopy(DEFAULT)
        for (const key in Store) {
            Store[key] = null
        }
        for (const key in obj) {
            Store[key] = obj[key]
        }
    })
    return JSON.parse(JSON.stringify(DEFAULT))
})()

Saver.addSavesScope('CustomQuests-v2', function (scope) {
    if (typeof scope !== 'object') return
    Store.saved = scope
}, function () {
    const str = JSON.stringify(Store.saved, function (key, value) {
        if (value === null) return undefined
        return value
    })
    return JSON.parse(str)
})
