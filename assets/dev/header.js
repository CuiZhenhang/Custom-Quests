/// <reference path='../declarations/custom-quests-v2.d.ts'/>
/// <reference path='../lib/ChargeItem.js'/>

IMPORT('ChargeItem')
const Color = android.graphics.Color
const Setting = (function () {
    const Setting = {
        UIsize: __config__.getNumber('setting.UIsize').floatValue(),
        padding: __config__.getNumber('setting.padding').floatValue(),
        path: __config__.getString('save.path'),
        dev: __config__.getBool('save.dev')
    }
    if (Setting.UIsize % 1 !== 0 || Setting.UIsize < 0 || Setting.UIsize > 2) {
        __config__.set('setting.UIsize', Setting.UIsize = 1)
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

const Store = {
    saved: {
        bookGived: {},
        team: {},
        data: {}
    },
    cache: {
        playerLoaded: {}
    },
    localCache: {
        team: '',
        isAdmin: false
    }
}
Saver.addSavesScope('CustomQuests-v2', function (scope) {
    if (typeof scope !== 'object') return
    Store.saved = scope
}, function () {
    return Store.saved
})
