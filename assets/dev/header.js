/// <reference path='../declarations/custom-quests-v2.d.ts'/>
/// <reference path='../declarations/ChargeItem.d.ts'/>
/// <reference path='./share.js'/>

IMPORT('ChargeItem')

const Setting = (function () {
    let Setting = {
        giveBook: __config__.getBool('give_book'),
        path: __config__.getString('contents.path'),
        saveForTeam: __config__.getBool('save.for_team')
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
    let DEFAULT = {
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
            resolvedJson: {},
            jsonConfig: {},
            saveData: {},
            team: null,
            teamPlayerList: null,
            isAdmin: false,
            teamList: []
        }
    }
    Callback.addCallback('LevelSelected', function () {
        let obj = Utils.deepCopy(DEFAULT)
        for (let key in Store) {
            Store[key] = null
        }
        for (let key in obj) {
            Store[key] = obj[key]
        }
    })
    return JSON.parse(JSON.stringify(DEFAULT))
})()

Saver.addSavesScope('CustomQuests-v2', function (scope) {
    if (!Utils.isObject(scope)) return
    Store.saved = scope
    for (let saveId in Store.saved.data) {
        if (!Utils.isObject(Store.saved.data[saveId])) continue
        System.validateSaveData(ServerSystem.resolvedJson, Store.saved.data[saveId])
    }
}, function () {
    return JSON.parse(JSON.stringify(Store.saved, function (key, value) {
        if (value === null) return undefined
        return value
    }))
})
