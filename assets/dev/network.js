/// <reference path='./System.js'/>

// Server
Network.addServerPacket('CustomQuests.Server.sendIOPacket', function (client, packetData) {
    if (packetData.type !== 'input' && packetData.type !== 'output') return
    if (typeof packetData.sourceId !== 'string') return
    if (typeof packetData.chapterId !== 'string') return
    if (typeof packetData.questId !== 'string') return
    if (typeof packetData.index !== 'number') return
    if (!Utils.isObject(packetData.data)) return
    const saveId = ServerSystem.getSaveId(client.getPlayerUid())
    if (!ServerSystem.isSaveIdValid(saveId)) return
    const loadedQuest = ServerSystem.getLoadedQuest(saveId, packetData.sourceId, packetData.chapterId, packetData.questId)
    if (packetData.type === 'input') {
        if (!Array.isArray(loadedQuest.input)) return
        const inputId = loadedQuest.input[packetData.index]
        if (!IOTypeTools.isInputLoaded(inputId)) return
        IOTypeTools.callInputTypeCb(inputId, 'onPacket', {
            client: client,
            packetData: packetData.data
        })
    } else if (packetData.type === 'output') {
        if (!Array.isArray(loadedQuest.output)) return
        const outputId = loadedQuest.output[packetData.index]
        if (!IOTypeTools.isOutputLoaded(outputId)) return
        IOTypeTools.callOutputTypeCb(outputId, 'onPacket', {
            client: client,
            packetData: packetData.data
        })
    }
})

Network.addServerPacket('CustomQuests.Server.teamTools', function (client, packetData) {
    let player = client.getPlayerUid()
    if (typeof packetData.player === 'number') player = packetData.player
    if (typeof packetData.type !== 'string') return
    switch(packetData.type) {
        case 'getList': {
            client.send('CustomQuests.Client.setLocalCache', {
                teamList: ServerSystem.getTeamList()
            })
            break
        }
        case 'create': {
            if (!Utils.isObject(packetData.team)) return
            ServerSystem.createTeam(player, packetData.team)
            break
        }
        case 'join': {
            if (typeof packetData.teamId !== 'string') return
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
            if (!Utils.isObject(team)) return
            ServerSystem.setPlayerStateForTeam(team.id, player, packetData.state)
            ServerSystem.updateTeam(team.id)
            break
        }
        case 'delete': {
            let teamId = packetData.teamId
            if (typeof teamId !== 'string') {
                let team = ServerSystem.getTeam(player)
                if (!Utils.isObject(team)) return
                teamId = team.id
            }
            ServerSystem.deleteTeam(teamId)
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
    const obj = System.resolveJson(packetData.json)
    Store.localCache.resolvedJson = obj.json
    Store.localCache.jsonConfig = obj.config
    if (Array.isArray(packetData.bitmaps)) packetData.bitmaps.forEach(function (bitmapObject) {
        if (!Utils.isObject(bitmapObject)) return
        if (typeof bitmapObject.name !== 'string') return
        if (typeof bitmapObject.base64 !== 'string') return
        Utils.putTextureSourceFromBase64(bitmapObject.name, bitmapObject.base64)
    })
})

Network.addClientPacket('CustomQuests.Client.setLocalCache', function (packetData) {
    if (Utils.isObject(packetData.saveData) || packetData.saveData === null) {
        Store.localCache.saveData = packetData.saveData
    }
    if (Utils.isObject(packetData.team) || packetData.team === null) {
        Store.localCache.team = packetData.team
    }
    if (typeof packetData.isAdmin === 'boolean') {
        Store.localCache.isAdmin = packetData.isAdmin
    }
    if (Array.isArray(packetData.teamList)) {
        Store.localCache.teamList = packetData.teamList
    }
})

Network.addClientPacket('CustomQuests.Client.setInputState', function (packetData) {
    if (typeof packetData.sourceId !== 'string') return
    if (typeof packetData.chapterId !== 'string') return
    if (typeof packetData.questId !== 'string') return
    if (typeof packetData.index !== 'number') return
    if (!Utils.isObject(packetData.extraInfo)) return
    if (!Utils.isObject(packetData.inputStateObject)) return
    const sourceId = packetData.sourceId
    const chapterId = packetData.chapterId
    const questId = packetData.questId
    const index = packetData.index
    const extraInfo = packetData.extraInfo
    System.setInputState(Store.localCache.resolvedJson, Store.localCache.saveData, sourceId, chapterId, questId, index, packetData.inputStateObject, {
            onInputStateChanged (newInputStateObject, oldInputStateObject) {
                try {
                    Callback.invokeCallback('CustomQuests.onInputStateChangedLocal',
                        [sourceId, chapterId, questId],
                        index,
                        Utils.deepCopy(newInputStateObject),
                        Utils.deepCopy(oldInputStateObject),
                        Utils.deepCopy(extraInfo)
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onInputStateChangedLocal\' (network.js):\n' + err, 'ERROR', true)
                }
            },
            onQuestInputStateChanged (newQuestInputState, oldQuestInputState) {
                try {
                    Callback.invokeCallback('CustomQuests.onQuestInputStateChangedLocal',
                        [sourceId, chapterId, questId],
                        newQuestInputState,
                        oldQuestInputState
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onQuestInputStateChangedLocal\' (network.js):\n' + err, 'ERROR', true)
                }
            },
            onQuestOutputStateChanged (newQuestOutputState, oldQuestOutputState) {
                try {
                    Callback.invokeCallback('CustomQuests.onQuestOutputStateChangedLocal',
                        [sourceId, chapterId, questId],
                        newQuestOutputState,
                        oldQuestOutputState
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onQuestOutputStateChangedLocal\' (network.js):\n' + err, 'ERROR', true)
                }
            },
            onChildQuestInputStateChanged (pathArray, newQuestInputState, oldQuestInputState) {
                try {
                    Callback.invokeCallback('CustomQuests.onQuestInputStateChangedLocal',
                        [pathArray[0], pathArray[1], pathArray[2]],
                        newQuestInputState,
                        oldQuestInputState
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onQuestInputStateChangedLocal\' (network.js):\n' + err, 'ERROR', true)
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
    const sourceId = packetData.sourceId
    const chapterId = packetData.chapterId
    const questId = packetData.questId
    const index = packetData.index
    const extraInfo = packetData.extraInfo
    System.setOutputState(Store.localCache.resolvedJson, Store.localCache.saveData, sourceId, chapterId, questId, index, packetData.outputStateObject, {
            onOutputStateChanged (newOutputStateObject, oldOutputStateObject) {
                try {
                    Callback.invokeCallback('CustomQuests.onOutputStateChangedLocal',
                        [sourceId, chapterId, questId],
                        index,
                        Utils.deepCopy(newOutputStateObject),
                        Utils.deepCopy(oldOutputStateObject),
                        Utils.deepCopy(extraInfo)
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onOutputStateChangedLocal\' (network.js):\n' + err, 'ERROR', true)
                }
            },
            onQuestOutputStateChanged (newQuestOutputState, oldQuestOutputState) {
                try {
                    Callback.invokeCallback('CustomQuests.onQuestOutputStateChangedLocal',
                        [sourceId, chapterId, questId],
                        newQuestOutputState,
                        oldQuestOutputState
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onQuestOutputStateChangedLocal\' (network.js):\n' + err, 'ERROR', true)
                }
            }
        }
    )
})
