/// <reference path='../declarations/custom-quests-v2.d.ts'/>
/// <reference path='../lib/ChargeItem.js'/>

IMPORT('ChargeItem')
const Color = android.graphics.Color
const Setting = (function () {
    const Setting = {
        UiSize: __config__.getNumber('setting.ui_size').floatValue(),
        padding: __config__.getNumber('setting.padding').floatValue(),
        path: __config__.getString('save.path'),
        dev: __config__.getBool('save.dev')
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

/** @type { Store } */
const Store = (function () {
    /** @type { Store } */
    const DEFAULT = {
        saved: {
            players: {},
            team: {},
            data: {},
            playerList: {}
        },
        cache: {
            playerLoaded: {},
            resolvedJson: null
        },
        localCache: {
            resolvedJson: null,
            dataPlayer: null,
            dataTeam: null,
            saveId: InvalidId,
            team: null,
            isAdmin: false,
            isEditor: false
        }
    }
    Callback.addCallback('LevelLeft', function () {
        const obj = Utils.deepCopy(DEFAULT)
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
    return Store.saved
})
