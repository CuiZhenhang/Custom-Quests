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
    }
}

Callback.addCallback('CustomQuests.onQuestInputStateChangedLocal', function (path, newState, oldState) {
    if (newState === oldState) return
    if (newState === EnumObject.questInputState.finished) {
        const questJson = System.getQuestJson(Store.localCache.resolvedJson, path[0], path[1], path[2])
        if (!Utils.isObject(questJson) || questJson.type !== 'quest') return
        Game.message('<Custom Quests> ' + TranAPI.translate('message.questFinished')
            + TranAPI.t(questJson.inner.name, path[0], path[1], path[2], 'name'))
    }
})
