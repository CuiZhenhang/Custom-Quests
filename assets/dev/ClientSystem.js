/// <reference path='./ServerSystem.js'/>

/** @type { ClientSystem } */
const ClientSystem = {
    sendInputPacket (sourceId, chapterId, questId, index, packetData) {
        let questJson = System.getQuestJson(Store.localCache.resolvedJson, sourceId, chapterId, questId)
        if (!questJson || questJson.type !== 'quest') return
        if (index >= questJson.inner.input.length) return
        runOnClientThread(function () {
            Network.sendToServer('CustomQuests.Server.sendIOPacket', {
                type: 'input',
                sourceId: sourceId, chapterId: chapterId, questId: questId, index: index,
                data: packetData
            })
        })
    },
    sendOutputPacket (sourceId, chapterId, questId, index, packetData) {
        let questJson = System.getQuestJson(Store.localCache.resolvedJson, sourceId, chapterId, questId)
        if (!questJson || questJson.type !== 'quest') return
        if (index >= questJson.inner.output.length) return
        runOnClientThread(function () {
            Network.sendToServer('CustomQuests.Server.sendIOPacket', {
                type: 'output',
                sourceId: sourceId, chapterId: chapterId, questId: questId, index: index,
                data: packetData
            })
        })
    },
    receiveAllQuest (sourceId, extraInfo) {
        runOnClientThread(function () {
            Network.sendToServer('CustomQuests.Server.receiveAllQuest', {
                sourceId: sourceId,
                extraInfo: extraInfo
            })
        })
    },
    refreshTeamList () {
        runOnClientThread(function () {
            Network.sendToServer('CustomQuests.Server.TeamTools', {
                method: 'getList'
            })
        })
    },
    createTeam (team) {
        if (this.getTeam()) return
        runOnClientThread(function () {
            Network.sendToServer('CustomQuests.Server.TeamTools', {
                method: 'create',
                team: {
                    bitmap: team.bitmap,
                    name: team.name,
                    password: Utils.md5(team.password),
                    setting: team.setting
                }
            })
        })
    },
    joinTeam (teamId, password) {
        runOnClientThread(function () {
            Network.sendToServer('CustomQuests.Server.TeamTools', {
                method: 'join',
                teamId: teamId,
                password: Utils.md5(password)
            })
        })
    },
    getTeam () {
        return Store.localCache.team || null
    },
    exitTeam () {
        runOnClientThread(function () {
            Network.sendToServer('CustomQuests.Server.TeamTools', {
                method: 'exit'
            })
        })
    },
    deleteTeam () {
        runOnClientThread(function () {
            Network.sendToServer('CustomQuests.Server.TeamTools', {
                method: 'delete'
            })
        })
    },
    setPlayerStateForTeam (player, state) {
        runOnClientThread(function () {
            Network.sendToServer('CustomQuests.Server.TeamTools', {
                method: 'setState',
                player: player,
                state: state
            })
        })
    },
    changeBitmapTeam (bitmap) {
        runOnClientThread(function () {
            Network.sendToServer('CustomQuests.Server.TeamTools', {
                method: 'changeBitmap',
                bitmap: bitmap
            })
        })
    },
    renameTeam (name) {
        runOnClientThread(function () {
            Network.sendToServer('CustomQuests.Server.TeamTools', {
                method: 'rename',
                name: name
            })
        })
    },
    changePasswordTeam (password) {
        runOnClientThread(function () {
            Network.sendToServer('CustomQuests.Server.TeamTools', {
                method: 'changePassword',
                password: Utils.md5(password)
            })
        })
    }
}

Callback.addCallback('CustomQuests.onLocalQuestInputStateChanged', function (path, newState, oldState) {
    if (newState === oldState) return
    if (newState === EnumObject.questInputState.finished) {
        let config = Store.localCache.jsonConfig[path[0]]
        if (!config || !config.textMessage) return
        let questJson = System.getQuestJson(Store.localCache.resolvedJson, path[0], path[1], path[2])
        if (!questJson || questJson.type !== 'quest') return
        Game.message('§e<CustomQuests>§r ' + Utils.replace(TranAPI.translate('message.questFinished'), [
            ['{questName}', TranAPI.translate(questJson.inner.name)]
        ]))
    }
})
