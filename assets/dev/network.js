/// <reference path='./System.js'/>

// Server
Network.addServerPacket('CustomQuests.Server.sendIOPacket', function (client, packetData) {
    if (packetData.type !== 'input' && packetData.type !== 'output') return
    if (typeof packetData.sourceId !== 'string') return
    if (typeof packetData.chapterId !== 'string') return
    if (typeof packetData.questId !== 'string') return
    if (typeof packetData.index !== 'number') return
    if (!Utils.isObject(packetData.data)) return
    let saveId = ServerSystem.getSaveId(client.getPlayerUid())
    if (!ServerSystem.isSaveIdValid(saveId)) {
        if (Setting.saveForTeam && !ServerSystem.getTeam(client.getPlayerUid())) {
            client.send('CustomQuests.Client.alert', {
                text: ['$alert.no_team']
            })
        }
        return
    }
    let loadedQuest = ServerSystem.getLoadedQuest(saveId, packetData.sourceId, packetData.chapterId, packetData.questId)
    if (packetData.type === 'input') {
        if (!Array.isArray(loadedQuest.input)) return
        let inputId = loadedQuest.input[packetData.index]
        if (!IOTypeTools.isInputIdLoaded(inputId)) return
        IOTypeTools.callInputTypeCb(inputId, 'onPacket', {
            client: client,
            packetData: packetData.data
        })
    } else if (packetData.type === 'output') {
        if (!Array.isArray(loadedQuest.output)) return
        let outputId = loadedQuest.output[packetData.index]
        if (!IOTypeTools.isOutputIdLoaded(outputId)) return
        IOTypeTools.callOutputTypeCb(outputId, 'onPacket', {
            client: client,
            packetData: packetData.data
        })
    }
})

Network.addServerPacket('CustomQuests.Server.receiveAllQuest', function (client, packetData) {
    if (typeof packetData.sourceId !== 'string') return
    if (!Utils.isObject(packetData.extraInfo)) packetData.extraInfo = {}
    let player = client.getPlayerUid()
    let saveId = ServerSystem.getSaveId(player)
    if (!ServerSystem.isSaveIdValid(saveId)) {
        if (Setting.saveForTeam && !ServerSystem.getTeam(client.getPlayerUid())) {
            client.send('CustomQuests.Client.alert', {
                text: ['$alert.no_team']
            })
        }
        return
    }
    packetData.extraInfo.operator = {
        type: 'player',
        player: player
    }
    ServerSystem.receiveAllQuest(saveId, packetData.sourceId, packetData.extraInfo)
})

Network.addServerPacket('CustomQuests.Server.TeamTools', function (client, packetData) {
    let player = client.getPlayerUid()
    if (typeof packetData.player === 'number') player = packetData.player
    if (typeof packetData.method !== 'string') return
    switch(packetData.method) {
        case 'create': {
            if (!Utils.isObject(packetData.team)) return
            ServerSystem.createTeam(player, packetData.team)
            break
        }
        case 'join': {
            if (typeof packetData.teamId !== 'string') return
            let team = ServerSystem.getTeam(packetData.teamId)
            if (!team) return
            if (packetData.password !== team.password) {
                client.send('CustomQuests.Client.alert', {
                    text: ['$alert.fail.passwordWrong']
                })
                return
            }
            ServerSystem.setTeam(player, packetData.teamId)
            break
        }
        case 'exit': {
            ServerSystem.setTeam(player, InvalidId)
            break
        }
        case 'setState': {
            if (typeof packetData.state !== 'number') return
            let team = ServerSystem.getTeam(player)
            if (!team) return
            ServerSystem.setPlayerStateForTeam(team.id, player, packetData.state)
            ServerSystem.updateTeam(team.id)
            break
        }
        case 'delete': {
            let teamId = packetData.teamId
            if (typeof teamId !== 'string') {
                let team = ServerSystem.getTeam(player)
                if (!team) return
                teamId = team.id
            }
            ServerSystem.deleteTeam(teamId)
            break
        }
        case 'changeBitmap': {
            if (!Utils.isObject(packetData.bitmap)) return
            let team = packetData.teamId ? ServerSystem.getTeam(packetData.teamId) : ServerSystem.getTeam(player)
            if (!team) return
            Store.saved.team[team.id].bitmap = packetData.bitmap
            ServerSystem.updateTeam(team.id)
            new NetworkConnectedClientList()
                .setupAllPlayersPolicy()
                .send('CustomQuests.Client.setLocalCache', {
                    teamList: ServerSystem.getTeamList()
                })
            break
        }
        case 'rename': {
            if (typeof packetData.name !== 'string') return
            let team = packetData.teamId ? ServerSystem.getTeam(packetData.teamId) : ServerSystem.getTeam(player)
            if (!team) return
            Store.saved.team[team.id].name = packetData.name
            ServerSystem.updateTeam(team.id)
            new NetworkConnectedClientList()
                .setupAllPlayersPolicy()
                .send('CustomQuests.Client.setLocalCache', {
                    teamList: ServerSystem.getTeamList()
                })
            break
        }
        case 'changePassword': {
            if (typeof packetData.password !== 'string') return
            let team = packetData.teamId ? ServerSystem.getTeam(packetData.teamId) : ServerSystem.getTeam(player)
            if (!team) return
            Store.saved.team[team.id].password = packetData.password
            ServerSystem.updateTeam(team.id)
            break
        }
    }
})

// Client
Network.addClientPacket('CustomQuests.Client.message', function (packetData) {
    if (!Array.isArray(packetData.text)) return
    let msg = ''
    packetData.text.forEach(function (str) {
        if (str[0] === '$') {
            str = TranAPI.translate(str.replace(/^\$/, ''))
        }
        msg += str
    })
    Game.message(msg)
})

Network.addClientPacket('CustomQuests.Client.alert', function (packetData) {
    if (!Array.isArray(packetData.text)) return
    let msg = ''
    packetData.text.forEach(function (str) {
        if (str[0] === '$') {
            str = TranAPI.translate(str.replace(/^\$/, ''))
        }
        msg += str
    })
    alert(msg)
})

Network.addClientPacket('CustomQuests.Client.resolveJson', function (packetData) {
    if (!Utils.isObject(packetData.json)) return
    let obj = System.resolveJson(packetData.json)
    Store.localCache.resolvedJson = obj.json
    Store.localCache.jsonConfig = obj.config
    if (Array.isArray(obj.bitmaps)) {
        obj.bitmaps.forEach(function (bitmapObject) {
            if (!Utils.isObject(bitmapObject)) return
            if (typeof bitmapObject.name !== 'string') return
            if (typeof bitmapObject.base64 !== 'string') return
            Utils.putTextureSourceFromBase64('cq_custom_bitmap:' + bitmapObject.name, bitmapObject.base64)
        })
    }
})

Network.addClientPacket('CustomQuests.Client.setLocalCache', function (packetData) {
    let oldLocalCache = Utils.deepCopy(Store.localCache)
    if (Utils.isObject(packetData.saveData) || packetData.saveData === null) {
        Store.localCache.saveData = packetData.saveData
    }
    if (Utils.isObject(packetData.team) || packetData.team === null) {
        Store.localCache.team = packetData.team
    }
    if (Array.isArray(packetData.teamPlayerList) || packetData.teamPlayerList === null) {
        Store.localCache.teamPlayerList = packetData.teamPlayerList
    }
    if (typeof packetData.isAdmin === 'boolean') {
        Store.localCache.isAdmin = packetData.isAdmin
    }
    if (Array.isArray(packetData.teamList)) {
        Store.localCache.teamList = packetData.teamList
    }
    try {
        Callback.invokeCallback('CustomQuests.onLocalCacheChanged',
            Utils.deepCopy(packetData),
            oldLocalCache
        )
    } catch (err) {
        Utils.log('Error in Callback \'CustomQuests.onLocalCacheChanged\' (network.js):\n' + err, 'ERROR', true)
    }
})

Network.addClientPacket('CustomQuests.Client.setInputState', function (packetData) {
    if (typeof packetData.sourceId !== 'string') return
    if (typeof packetData.chapterId !== 'string') return
    if (typeof packetData.questId !== 'string') return
    if (typeof packetData.index !== 'number') return
    if (!Utils.isObject(packetData.extraInfo)) return
    if (!Utils.isObject(packetData.inputStateObject)) return
    let sourceId = packetData.sourceId
    let chapterId = packetData.chapterId
    let questId = packetData.questId
    let index = packetData.index
    let extraInfo = packetData.extraInfo
    System.setInputState(Store.localCache.resolvedJson, Store.localCache.saveData, sourceId, chapterId, questId, index, packetData.inputStateObject, {
            onInputStateChanged (newInputStateObject, oldInputStateObject) {
                try {
                    Callback.invokeCallback('CustomQuests.onLocalInputStateChanged',
                        [sourceId, chapterId, questId],
                        index,
                        Utils.deepCopy(newInputStateObject),
                        Utils.deepCopy(oldInputStateObject),
                        Utils.deepCopy(extraInfo)
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onLocalInputStateChanged\' (network.js):\n' + err, 'ERROR', true)
                }
            },
            onQuestInputStateChanged (newQuestInputState, oldQuestInputState) {
                try {
                    Callback.invokeCallback('CustomQuests.onLocalQuestInputStateChanged',
                        [sourceId, chapterId, questId],
                        newQuestInputState,
                        oldQuestInputState
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onLocalQuestInputStateChanged\' (network.js):\n' + err, 'ERROR', true)
                }
            },
            onQuestOutputStateChanged (newQuestOutputState, oldQuestOutputState) {
                try {
                    Callback.invokeCallback('CustomQuests.onLocalQuestOutputStateChanged',
                        [sourceId, chapterId, questId],
                        newQuestOutputState,
                        oldQuestOutputState
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onLocalQuestOutputStateChanged\' (network.js):\n' + err, 'ERROR', true)
                }
            },
            onChildQuestInputStateChanged (pathArray, newQuestInputState, oldQuestInputState) {
                try {
                    Callback.invokeCallback('CustomQuests.onLocalQuestInputStateChanged',
                        [pathArray[0], pathArray[1], pathArray[2]],
                        newQuestInputState,
                        oldQuestInputState
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onLocalQuestInputStateChanged\' (network.js):\n' + err, 'ERROR', true)
                }
            }
        }
    )
})

Network.addClientPacket('CustomQuests.Client.setOutputState', function (packetData) {
    if (typeof packetData.sourceId !== 'string') return
    if (typeof packetData.chapterId !== 'string') return
    if (typeof packetData.questId !== 'string') return
    if (typeof packetData.index !== 'number') return
    if (!Utils.isObject(packetData.extraInfo)) return
    if (!Utils.isObject(packetData.outputStateObject)) return
    let sourceId = packetData.sourceId
    let chapterId = packetData.chapterId
    let questId = packetData.questId
    let index = packetData.index
    let extraInfo = packetData.extraInfo
    System.setOutputState(Store.localCache.resolvedJson, Store.localCache.saveData, sourceId, chapterId, questId, index, packetData.outputStateObject, {
            onOutputStateChanged (newOutputStateObject, oldOutputStateObject) {
                try {
                    Callback.invokeCallback('CustomQuests.onLocalOutputStateChanged',
                        [sourceId, chapterId, questId],
                        index,
                        Utils.deepCopy(newOutputStateObject),
                        Utils.deepCopy(oldOutputStateObject),
                        Utils.deepCopy(extraInfo)
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onLocalOutputStateChanged\' (network.js):\n' + err, 'ERROR', true)
                }
            },
            onQuestOutputStateChanged (newQuestOutputState, oldQuestOutputState) {
                try {
                    Callback.invokeCallback('CustomQuests.onLocalQuestOutputStateChanged',
                        [sourceId, chapterId, questId],
                        newQuestOutputState,
                        oldQuestOutputState
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onLocalQuestOutputStateChanged\' (network.js):\n' + err, 'ERROR', true)
                }
            }
        }
    )
})

Network.addClientPacket('CustomQuests.Client.openUi', function (packetData) {
    if (typeof packetData.sourceId !== 'string') return
    QuestUi.open(packetData.sourceId)
})
