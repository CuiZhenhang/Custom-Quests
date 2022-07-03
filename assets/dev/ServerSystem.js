/// <reference path='./network.js'/>

/**
 * @param { Array<Nullable<unknown>> } loadedIOArray 
 * @param { Array<Nullable<unknown>> } bakArray 
 * @param { number } index 
 * @returns { void }
 */
const $ServerSystem_onUnload = function (loadedIOArray, bakArray, index) {
    if (loadedIOArray[index] !== bakArray[index]) return
    loadedIOArray[index] = null
}

/** @type { ServerSystem } */
const ServerSystem = {
    json: {},
    resolvedJson: (function () {
        Callback.addCallback('PostLoaded', function () {
            ServerSystem.resolvedJson = System.resolveJson(ServerSystem.json)
        })
        return null
    })(),
    loadedQuest: {},
    addContents (sourceId, contents) {
        if (typeof sourceId !== 'string') return
        if (!Utils.isObject(contents)) return
        this.json[sourceId] = contents
    },
    createSaveId (playerList) {
        if (!Array.isArray(playerList)) return
        if (playerList.length === 0) return
        const saveId = Utils.getUUID()
        Store.saved.playerList[saveId] = Utils.deepCopy(playerList)
        Store.saved.data[saveId] = {}
        Store.saved.exist[saveId] = true
        return saveId
    },
    getSaveId (target) {
        if (typeof target === 'number') {
            const obj = Store.saved.players[target]
            if (!Utils.isObject(obj)) return InvalidId
            if (!Setting.saveOnlyPlayer) return this.getSaveId(obj.teamId)
            return obj.saveId
        } else if (typeof target === 'string') {
            if (Setting.saveOnlyPlayer) return InvalidId
            if (target === InvalidId) return InvalidId
            const team = Store.saved.team[target]
            if (!Utils.isObject(team)) return InvalidId
            return team.saveId
        }
        return InvalidId
    },
    deleteSaveId (saveId) {
        if (!this.isSaveIdValid(saveId)) return
        this.unloadAllLoadedQuest(saveId)
        Store.saved.playerList[saveId] = null
        Store.saved.data[saveId] = null
        Store.saved.exist[saveId] = null
    },
    isSaveIdValid (saveId) {
        if (saveId === InvalidId) return false
        return Boolean(Store.saved.exist[saveId])
    },
    setPlayerLoaded (player, loaded) {
        if (typeof player !== 'number') return
        if (typeof loaded !== 'boolean') loaded = Boolean(loaded)
        const saveId = this.getSaveId(player)
        if (this.isSaveIdValid(saveId)) {
            if (!Utils.isObject(Store.cache.playerList[saveId])) {
                Store.cache.playerList[saveId] = {
                    player: [],
                    client: new NetworkConnectedClientList()
                }
            }
            const obj = Store.cache.playerList[saveId]
            if (loaded) {
                Store.cache.playerLoaded[player] = true
                if (obj.player.indexOf(player) <= -1) obj.player.push(player)
                try {
                    const client = Network.getClientForPlayer(player)
                    obj.client.add(client)
                } catch (err) {
                    Utils.log('Error in setPlayerLoaded (ServerSystem.js):\n' + err, 'ERROR', false)
                }
                this.loadAllQuest(saveId)
            } else {
                Store.cache.playerLoaded[player] = false
                const index = obj.player.indexOf(player)
                if (index >= 0) obj.player.splice(index, 1)
                try {
                    const client = Network.getClientForPlayer(player)
                    obj.client.remove(client)
                } catch (err) {
                    Utils.log('Error in setPlayerLoaded (ServerSystem.js):\n' + err, 'ERROR', false)
                }
                if (obj.player.length === 0) {
                    this.unloadAllLoadedQuest(saveId)
                }
            }
        } else {
            Store.cache.playerLoaded[player] = loaded
        }
    },
    isPlayerLoaded (player) {
        if (typeof player !== 'number') return false
        return Boolean(Store.cache.playerLoaded[player])
    },
    getPlayerList (saveId, online) {
        if (!this.isSaveIdValid(saveId)) return []
        if (online) {
            const obj = Store.cache.playerList[saveId]
            if (!Utils.isObject(obj)) return []
            return Utils.deepCopy(obj.player)
        } else {
            return Utils.deepCopy(Store.saved.playerList[saveId])
        }
    },
    getConnectedClientList (saveId) {
        if (!this.isSaveIdValid(saveId)) return null
        const obj = Store.cache.playerList[saveId]
        if (!Utils.isObject(obj)) return null
        return obj.client
    },
    getSaveData (saveId) {
        if (!this.isSaveIdValid(saveId)) return {}
        return Store.saved.data[saveId]
    },
    getLoadedQuest (saveId, sourceId, chapterId, questId) {
        if (!this.isSaveIdValid(saveId)) return {}
        if (!Utils.isObject(this.loadedQuest[saveId])) this.loadedQuest[saveId] = {}
        const loadedQuest = this.loadedQuest[saveId]
        if (!Utils.isObject(loadedQuest[sourceId])) loadedQuest[sourceId] = {}
        const mainLoadedQuest = loadedQuest[sourceId]
        if (!Utils.isObject(mainLoadedQuest[chapterId])) mainLoadedQuest[chapterId] = {}
        const chapterLoadedQuest = mainLoadedQuest[chapterId]
        if (!Utils.isObject(chapterLoadedQuest[questId])) chapterLoadedQuest[questId] = {}
        return chapterLoadedQuest[questId]
    },
    unloadAllLoadedQuest (saveId) {
        if (!this.isSaveIdValid(saveId)) return
        const loadedQuest = this.loadedQuest[saveId]
        if (!Utils.isObject(loadedQuest)) return
        for (const sourceId in loadedQuest) {
            const mainLoadedQuest = loadedQuest[sourceId]
            for (const chapterId in mainLoadedQuest) {
                const chapterLoadedQuest = mainLoadedQuest[chapterId]
                for (const questId in chapterLoadedQuest) {
                    const questLoadedQuest = chapterLoadedQuest[questId]
                    if (Array.isArray(questLoadedQuest.input)) {
                        questLoadedQuest.input.forEach(function (inputId) {
                            if (!IOTypeTools.isInputLoaded(inputId)) return
                            IOTypeTools.unloadInput(inputId)
                        })
                        questLoadedQuest.input = null
                    }
                    if (Array.isArray(questLoadedQuest.output)) {
                        questLoadedQuest.output.forEach(function (outputId) {
                            if (!IOTypeTools.isOutputLoaded(outputId)) return
                            IOTypeTools.unloadOutput(outputId)
                        })
                        questLoadedQuest.output = null
                    }
                    chapterLoadedQuest[questId] = null
                }
                mainLoadedQuest[chapterId] = null
            }
            loadedQuest[sourceId] = null
        }
        this.loadedQuest[saveId] = null
    },
    loadInput (saveId, sourceId, chapterId, questId, index) {
        if (!this.isSaveIdValid(saveId)) return
        const questJson = System.getQuestJson(this.resolvedJson, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        if (index >= questJson.inner.input.length) return
        const saveData = this.getSaveData(saveId)
        if (System.getQuestInputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questInputState.locked) return
        if (System.getInputState(saveData, sourceId, chapterId, questId, index) === EnumObject.inputState.finished) return
        const questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!Array.isArray(questLoadedQuest.input)) questLoadedQuest.input = []
        if (IOTypeTools.isInputLoaded(questLoadedQuest.input[index])) return
        const inputBak = []
        questLoadedQuest.input[index] = inputBak[index] = IOTypeTools.loadInput(questJson.inner.input[index], {
            getPlayerList: this.getPlayerList.bind(this, saveId),
            getState: System.getInputState.bind(System, saveData, sourceId, chapterId, questId, index),
            setState: this.setInputState.bind(this, saveId, sourceId, chapterId, questId, index)
        }, $ServerSystem_onUnload.bind(null, questLoadedQuest.input, inputBak, index))
    },
    loadOutput (saveId, sourceId, chapterId, questId, index) {
        if (!this.isSaveIdValid(saveId)) return
        const questJson = System.getQuestJson(this.resolvedJson, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        if (index >= questJson.inner.output.length) return
        const saveData = this.getSaveData(saveId)
        if (System.getQuestOutputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
        if (System.getOutputState(saveData, sourceId, chapterId, questId, index) === EnumObject.outputState.received) return
        const questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!Array.isArray(questLoadedQuest.output)) questLoadedQuest.output = []
        if (IOTypeTools.isOutputLoaded(questLoadedQuest.output[index])) return
        const outputBak = []
        questLoadedQuest.output[index] = outputBak[index] = IOTypeTools.loadOutput(questJson.inner.output[index], {
            getPlayerList: this.getPlayerList.bind(this, saveId),
            getState: System.getOutputState.bind(System, saveData, sourceId, chapterId, questId, index),
            setState: this.setOutputState.bind(this, saveId, sourceId, chapterId, questId, index)
        }, $ServerSystem_onUnload.bind(null, questLoadedQuest.output, outputBak, index))
    },
    loadQuest (saveId, sourceId, chapterId, questId) {
        if (!this.isSaveIdValid(saveId)) return
        const questJson = System.getQuestJson(this.resolvedJson, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        const saveData = this.getSaveData(saveId)
        if (System.getQuestInputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questInputState.locked) return
        const that = this
        const getPlayerList = this.getPlayerList.bind(this, saveId)
        const questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!Array.isArray(questLoadedQuest.input)) questLoadedQuest.input = []
        const inputBak = []
        questJson.inner.input.forEach(function (inputJson, index) {
            if (IOTypeTools.isInputLoaded(questLoadedQuest.input[index])) return
            if (System.getInputState(saveData, sourceId, chapterId, questId, index) === EnumObject.inputState.finished) return
            questLoadedQuest.input[index] = inputBak[index] = IOTypeTools.loadInput(inputJson, {
                getPlayerList: getPlayerList,
                getState: System.getInputState.bind(System, saveData, sourceId, chapterId, questId, index),
                setState: that.setInputState.bind(that, saveId, sourceId, chapterId, questId, index)
            }, $ServerSystem_onUnload.bind(null, questLoadedQuest.input, inputBak, index))
        })
        if (System.getQuestOutputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
        if (!Array.isArray(questLoadedQuest.output)) questLoadedQuest.output = []
        const outputBak = []
        questJson.inner.output.forEach(function (outputJson, index) {
            if (IOTypeTools.isOutputLoaded(output[index])) return
            questLoadedQuest.output[index] = outputBak[index] = IOTypeTools.loadOutput(outputJson, {
                getPlayerList: getPlayerList,
                getState: System.getOutputState.bind(System, saveData, sourceId, chapterId, questId, index),
                setState: that.setOutputState.bind(that, saveId, sourceId, chapterId, questId, index)
            }, $ServerSystem_onUnload.bind(null, questLoadedQuest.output, outputBak, index))
        })
    },
    loadAllQuest (saveId) {
        if (!this.isSaveIdValid(saveId)) return
        this.unloadAllLoadedQuest(saveId)
        const json = this.resolvedJson
        for (const sourceId in json) {
            const mainJson = json[sourceId]
            for (const chapterId in mainJson.chapter) {
                const chapterJson = mainJson.chapter[chapterId]
                for (const questId in chapterJson.quest) {
                    this.loadQuest(saveId, sourceId, chapterId, questId)
                }
            }
        }
    },
    setInputState (saveId, sourceId, chapterId, questId, index, extraInfo, inputStateObject) {
        if (!this.isSaveIdValid(saveId)) return
        if (!Utils.isObject(extraInfo)) extraInfo = {}
        const saveData = this.getSaveData(saveId)
        if (System.getQuestInputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
        const client = this.getConnectedClientList(saveId)
        if (client !== null) {
            runOnMainThread(function () {
                client.send('CustomQuests.Client.setInputState', {
                    sourceId: sourceId, chapterId: chapterId, questId: questId, index: index,
                    extraInfo: extraInfo, inputStateObject: inputStateObject
                })
            })
        }
        const questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!Array.isArray(questLoadedQuest.input)) questLoadedQuest.input = []
        const input = questLoadedQuest.input
        const that = this
        System.setInputState(this.resolvedJson, saveData, sourceId, chapterId, questId, index, inputStateObject, {
            onInputStateChanged (newInputStateObject, oldInputStateObject) {
                let called = false
                if (newInputStateObject.state !== oldInputStateObject.state) {
                    if (newInputStateObject.state === EnumObject.inputState.finished) {
                        if (IOTypeTools.isInputLoaded(input[index])) {
                            try {
                                called = true
                                Callback.invokeCallback('CustomQuests.onInputStateChanged',
                                    input[index],
                                    Utils.deepCopy(newInputStateObject),
                                    Utils.deepCopy(oldInputStateObject),
                                    Utils.deepCopy(extraInfo)
                                )
                            } catch (err) {
                                Utils.log('Error in Callback \'CustomQuests.onInputStateChanged\' (ServerSystem.js):\n' + err, 'ERROR', true)
                            }
                            IOTypeTools.unloadInput(input[index])
                        }
                    } else {
                        if (!IOTypeTools.isInputLoaded(input[index])) {
                            that.loadInput(saveId, sourceId, chapterId, questId, index)
                        }
                    }
                }
                if (!called && IOTypeTools.isInputLoaded(input[index])) {
                    try {
                        called = true
                        Callback.invokeCallback('CustomQuests.onInputStateChanged',
                            input[index],
                            Utils.deepCopy(newInputStateObject),
                            Utils.deepCopy(oldInputStateObject),
                            Utils.deepCopy(extraInfo)
                        )
                    } catch (err) {
                        Utils.log('Error in Callback \'CustomQuests.onInputStateChanged\' (ServerSystem.js):\n' + err, 'ERROR', true)
                    }
                }
            },
            onQuestInputStateChanged (newQuestInputState, oldQuestInputState) {
                try {
                    Callback.invokeCallback('CustomQuests.onQuestInputStateChanged',
                        [sourceId, chapterId, questId],
                        newQuestInputState,
                        oldQuestInputState
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onQuestInputStateChanged\' (ServerSystem.js):\n' + err, 'ERROR', true)
                }
            },
            onQuestOutputStateChanged (newQuestOutputState, oldQuestOutputState) {
                that.loadQuest(saveId, sourceId, chapterId, questId)
                try {
                    Callback.invokeCallback('CustomQuests.onQuestOutputStateChanged',
                        [sourceId, chapterId, questId],
                        newQuestOutputState,
                        oldQuestOutputState
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onQuestOutputStateChanged\' (ServerSystem.js):\n' + err, 'ERROR', true)
                }
            },
            onChildQuestInputStateChanged (pathArray, newQuestInputState, oldQuestInputState) {
                that.loadQuest(saveId, pathArray[0], pathArray[1], pathArray[2])
                try {
                    Callback.invokeCallback('CustomQuests.onQuestInputStateChanged',
                        [pathArray[0], pathArray[1], pathArray[2]],
                        newQuestInputState,
                        oldQuestInputState
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onQuestInputStateChanged\' (ServerSystem.js):\n' + err, 'ERROR', true)
                }
            }
        })
    },
    setOutputState (saveId, sourceId, chapterId, questId, index, extraInfo, outputStateObject) {
        if (!this.isSaveIdValid(saveId)) return
        if (!Utils.isObject(extraInfo)) extraInfo = {}
        const saveData = this.getSaveData(saveId)
        if (System.getQuestOutputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
        const client = this.getConnectedClientList(saveId)
        if (client !== null) {
            runOnMainThread(function () {
                client.send('CustomQuests.Client.setOutputState', {
                    sourceId: sourceId, chapterId: chapterId, questId: questId, index: index,
                    extraInfo: extraInfo, outputStateObject: outputStateObject
                })
            })
        }
        const questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!Array.isArray(questLoadedQuest.output)) questLoadedQuest.output = []
        const output = questLoadedQuest.output
        const that = this
        System.setOutputState(this.resolvedJson, saveData, sourceId, chapterId, questId, index, outputStateObject, {
            onOutputStateChanged (newOutputStateObject, oldOutputStateObject) {
                let called = false
                if (newOutputStateObject.state !== oldOutputStateObject.state) {
                    if (newOutputStateObject.state === EnumObject.outputState.received) {
                        if (IOTypeTools.isOutputLoaded(output[index])) {
                            IOTypeTools.callOutputTypeCb(output[index], 'onReceive', extraInfo)
                            try {
                                called = true
                                Callback.invokeCallback('CustomQuests.onOutputStateChanged',
                                    output[index],
                                    Utils.deepCopy(newOutputStateObject),
                                    Utils.deepCopy(oldOutputStateObject),
                                    Utils.deepCopy(extraInfo)
                                )
                            } catch (err) {
                                Utils.log('Error in Callback \'CustomQuests.onOutputStateChanged\' (ServerSystem.js):\n' + err, 'ERROR', true)
                            }
                            IOTypeTools.unloadOutput(output[index])
                        }
                    } else {
                        if (!IOTypeTools.isOutputLoaded(output[index])) {
                            that.loadOutput(saveId, sourceId, chapterId, questId, index)
                        }
                    }
                }
                if (!called && IOTypeTools.isOutputLoaded(output[index])) {
                    try {
                        called = true
                        Callback.invokeCallback('CustomQuests.onOutputStateChanged',
                            output[index],
                            Utils.deepCopy(newOutputStateObject),
                            Utils.deepCopy(oldOutputStateObject),
                            Utils.deepCopy(extraInfo)
                        )
                    } catch (err) {
                        Utils.log('Error in Callback \'CustomQuests.onOutputStateChanged\' (ServerSystem.js):\n' + err, 'ERROR', true)
                    }
                }
            },
            onQuestOutputStateChanged (newQuestOutputState, oldQuestOutputState) {
                try {
                    Callback.invokeCallback('CustomQuests.onQuestOutputStateChanged',
                        [sourceId, chapterId, questId],
                        newQuestOutputState,
                        oldQuestOutputState
                    )
                } catch (err) {
                    Utils.log('Error in Callback \'CustomQuests.onQuestOutputStateChanged\' (ServerSystem.js):\n' + err, 'ERROR', true)
                }
            }
        })
    },
    receiveAllQuest (saveId, sourceId, extraInfo) {
        if (!this.isSaveIdValid(saveId)) return
        if (!Utils.isObject(extraInfo)) extraInfo = {}
        extraInfo.isFastReceive = true
        const loadedQuest = this.loadedQuest[saveId]
        if (!Utils.isObject(loadedQuest)) return
        const mainLoadedQuest = loadedQuest[sourceId]
        for (const chapterId in mainLoadedQuest) {
            const chapterLoadedQuest = mainLoadedQuest[chapterId]
            for (const questId in chapterLoadedQuest) {
                const questLoadedQuest = chapterLoadedQuest[questId]
                if (Array.isArray(questLoadedQuest.output)) {
                    questLoadedQuest.output.forEach(function (outputId) {
                        if (!IOTypeTools.isOutputLoaded(outputId)) return
                        IOTypeTools.callOutputTypeCb(outputId, 'onReceive', extraInfo)
                    })
                }
            }
        }
    },
    updateTeam (teamId, beforeDelete) {
        if (typeof beforeDelete !== 'boolean') beforeDelete = Boolean(beforeDelete)
        const team = this.getTeam(teamId)
        if (!Utils.isObject(team)) return
        const players = team.players
        const playerList = []
        const client = new NetworkConnectedClientList()
        for (let iPlayer in players) {
            if (players[iPlayer] <= EnumObject.playerState.absent) continue
            const player = Number(iPlayer)
            if (!this.isPlayerLoaded(player)) continue
            playerList.push(player)
            try {
                client.add(Network.getClientForPlayer(player))
            } catch (err) {
                Utils.log('Error in updateTeam (ServerSystem.js):\n' + err, 'ERROR', false)
            }
        }
        runOnMainThread(function () {
            client.send('CustomQuests.Client.setLocalCache', {
                team: beforeDelete ? null : team
            })
        })
        if (!Setting.saveOnlyPlayer) {
            const saveId = team.saveId
            if (beforeDelete) {
                Store.cache.playerList[saveId] = null
            } else {
                if (!Utils.isObject(Store.cache.playerList[saveId])) {
                    Store.cache.playerList[saveId] = {
                        player: [],
                        client: null
                    }
                }
                const obj = Store.cache.playerList[saveId]
                obj.player = playerList
                obj.client = client
            }
        }
    },
    createTeam (player, team) {
        if (!this.isPlayerLoaded(player)) return
        if (Utils.isObject(this.getTeam(player))) return
        const teamId = Utils.getUUID()
        const saveId = Utils.getUUID()
        Store.saved.team[teamId] = {
            id: teamId,
            saveId: saveId,
            bitmap: team.bitmap,
            name: team.name,
            password: team.password,
            players: {},
            settingTeam: team.setting
        }
        Store.saved.exist[saveId]
        this.setPlayerStateForTeam(teamId, player, EnumObject.playerState.owner)
        this.updateTeam(teamId)
    },
    getTeam (target) {
        let teamId
        if (typeof target === 'number') {
            const obj = Store.saved.players[player]
            if (!Utils.isObject(obj)) return null
            teamId = obj.teamId
        } else if (typeof target === 'string') {
           teamId = target
        }
        if (teamId === InvalidId) return null
        return Store.saved.team[teamId] || null
    },
    deleteTeam (teamId) {
        if (teamId === InvalidId) return
        this.deleteSaveId(Store.saved.team[teamId].saveId)
        this.updateTeam(teamId)
        Store.saved.team[teamId] = null
    },
    setTeam (player, teamId) {
        const obj = Store.saved.players[player]
        if (!Utils.isObject(obj)) return
        const oldTeamId = obj.teamId
        this.setPlayerStateForTeam(oldTeamId, player, EnumObject.playerState.absent)
        this.updateTeam(oldTeamId)
        obj.teamId = teamId
        if (teamId !== InvalidId) {
            if (!Utils.isObject(Store.saved.team[teamId])) {
                obj.teamId = InvalidId
                return
            }
            this.setPlayerStateForTeam(teamId, player, EnumObject.playerState.member)
            this.updateTeam(teamId)
        } else {
            runOnMainThread(function () {
                Network.getClientForPlayer(player).send('CustomQuests.Client.setLocalCache', {
                    team: null
                })
            })
        }
    },
    setPlayerStateForTeam (teamId, player, state) {
        if (teamId === InvalidId) return
        const team = Store.saved.team[teamId]
        if (!Utils.isObject(team)) return
        const oldState = team.players[player] || EnumObject.playerState.absent
        if (state === oldState) return
        team.players[player] = state
        if (state === EnumObject.playerState.absent) {
            // exit team
            const list = []
            for (const iPlayer in team.players) {
                if (team.players[iPlayer] >= EnumObject.playerState.member) {
                    list.push(Number(iPlayer))
                }
            }
            if (list.length === 0) {
                this.deleteTeam(teamId)
                return
            }
            Store.saved.playerList[team.saveId] = list
            if (this.getPlayerList(team.saveId, true).length === 0) {
                this.unloadAllLoadedQuest(team.saveId)
            }
        } else if (oldState === EnumObject.playerState.absent) {
            // join team
            this.loadAllQuest(team.saveId)
        }
    }
}

Callback.addCallback('ServerPlayerLoaded', function (player) {
    if (!Utils.isObject(Store.saved.players[player])) {
        Store.saved.players[player] = {
            saveId: ServerSystem.createSaveId([player]),
            teamId: InvalidId,
            bookGived: false
        }
    }
    const obj = Store.saved.players[player]
    if (!obj.bookGived) {
        new PlayerActor(player).addItemToInventory(ItemID.quest_book, 1, 0, null, true)
        obj.bookGived = true
    }
    
    ServerSystem.setPlayerLoaded(player, true)

    const saveId = ServerSystem.getSaveId(player)
    const client = Network.getClientForPlayer(player)
    client.send('CustomQuests.Client.message', {
        text: ['§e<CustomQuests>§r ', '$mod.dialog']
    })
    client.send('CustomQuests.Client.resolveJson', {
        json: ServerSystem.json
    })
    client.send('CustomQuests.Client.setLocalCache', {
        saveData: ServerSystem.getSaveData(saveId),
        team: ServerSystem.getTeam(player),
        isAdmin: Boolean(obj.isAdmin),
        isEditor: Boolean(obj.isEditor)
    })
})

Callback.addCallback('ServerPlayerTick', function (player) {
    /* 30s */
    if (Math.random() * 600 < 1) {
        try {
            const saveId = ServerSystem.getSaveId(player)
            if (!ServerSystem.isSaveIdValid(saveId)) return
            const client = Network.getClientForPlayer(player)
            client.send('CustomQuests.Client.setLocalCache', {
                saveData: ServerSystem.getSaveData(saveId)
            })
        } catch (err) {
            Utils.log('Error in Callback \'ServerPlayerTick\' (ServerSystem.js):\n' + err, 'ERROR', false)
        }
    }
})

Callback.addCallback('ServerPlayerLeft', function (player) {
    ServerSystem.setPlayerLoaded(player, false)
})
