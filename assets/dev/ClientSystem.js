/// <reference path='./ServerSystem.js'/>

/** @type { ClientSystem } */
const ClientSystem = {
    sendInputPacket (sourceId, chapterId, questId, index, packetData) {
        const questJson = System.getQuestJson(Store.localCache.resolvedJson, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
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
        const questJson = System.getQuestJson(Store.localCache.resolvedJson, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        if (index >= questJson.inner.output.length) return
        runOnClientThread(function () {
            Network.sendToServer('CustomQuests.Server.sendIOPacket', {
                type: 'output',
                sourceId: sourceId, chapterId: chapterId, questId: questId, index: index,
                data: packetData
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
        if (Utils.isObject(this.getTeam())) return
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
        return Utils.deepCopy(Store.localCache.team)
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
    }
}

Callback.addCallback('CustomQuests.onLocalQuestInputStateChanged', function (path, newState, oldState) {
    if (newState === oldState) return
    if (newState === EnumObject.questInputState.finished) {
        const questJson = System.getQuestJson(Store.localCache.resolvedJson, path[0], path[1], path[2])
        if (!Utils.isObject(questJson) || questJson.type !== 'quest') return
        Game.message('§e<CustomQuests>§r ' + Utils.replace(TranAPI.translate('message.questFinished'), [
            ['{questName}', TranAPI.translate(questJson.inner.name)]
        ]))
    }
})
