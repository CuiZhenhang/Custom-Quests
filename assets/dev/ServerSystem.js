/// <reference path='./network.js'/>

/**
 * @param { Array<Nullable<string>> } loadedIOArray 
 * @param { Array<Nullable<string>> } bakArray 
 * @param { number } index 
 * @param { Array<string> } idArray 
 * @returns { void }
 */
const $ServerSystem_onUnload = function (loadedIOArray, bakArray, index, idArray) {
    let idIndex = idArray.indexOf(bakArray[index])
    if (idIndex >= 0) idArray.splice(idIndex, 1)
    if (loadedIOArray[index] === bakArray[index]) {
        loadedIOArray[index] = null
    }
}

/** @type { ServerSystem } */
const ServerSystem = {
    json: {},
    resolvedJson: (function () {
        Callback.addCallback('PostLoaded', function () {
            ServerSystem.resolvedJson = System.resolveJson(ServerSystem.json).json
        })
        return null
    })(),
    loadedQuest: (function () {
        Callback.addCallback('LevelSelected', function () {
            ServerSystem.loadedQuest = {}
        })
        return {}
    })(),
    typedLoadedQuest: (function () {
        Callback.addCallback('LevelSelected', function () {
            ServerSystem.typedLoadedQuest = {
                input: {},
                output: {}
            }
        })
        return {
            input: {},
            output: {}
        }
    })(),
    addContents (sourceId, contents) {
        if (typeof sourceId !== 'string') return
        if (!Utils.isObject(contents)) return
        if (!Array.isArray(contents.main)) return
        this.json[sourceId] = contents
    },
    createSaveId (playerList) {
        if (!Array.isArray(playerList)) return
        if (playerList.length === 0) return
        let saveId = Utils.getUUID()
        while (this.isSaveIdValid(saveId)) saveId = Utils.getUUID()
        Store.saved.playerList[saveId] = Utils.deepCopy(playerList)
        Store.saved.data[saveId] = {}
        Store.saved.exist[saveId] = true
        return saveId
    },
    getSaveId (target) {
        if (typeof target === 'number') {
            let obj = Store.saved.players[target]
            if (!Utils.isObject(obj)) return InvalidId
            if (Setting.saveForTeam) return this.getSaveId(obj.teamId)
            return obj.saveId
        } else if (typeof target === 'string') {
            if (!Setting.saveForTeam) return InvalidId
            if (target === InvalidId) return InvalidId
            let team = Store.saved.team[target]
            if (!Utils.isObject(team)) return InvalidId
            return team.saveId
        }
        return InvalidId
    },
    deleteSaveId (saveId) {
        if (!this.isSaveIdValid(saveId)) return
        this.unloadAllLoadedQuest(saveId)
        delete Store.saved.playerList[saveId]
        delete Store.saved.data[saveId]
        delete Store.saved.exist[saveId]
    },
    isSaveIdValid (saveId) {
        if (saveId === InvalidId) return false
        return Boolean(Store.saved.exist[saveId])
    },
    setPlayerLoaded (player, loaded) {
        if (typeof player !== 'number') return
        if (typeof loaded !== 'boolean') loaded = Boolean(loaded)
        let saveId = this.getSaveId(player)
        if (this.isSaveIdValid(saveId)) {
            if (!Utils.isObject(Store.cache.playerList[saveId])) {
                Store.cache.playerList[saveId] = {
                    player: [],
                    client: new NetworkConnectedClientList()
                }
            }
            let obj = Store.cache.playerList[saveId]
            if (loaded) {
                Store.cache.playerLoaded[player] = true
                if (obj.player.indexOf(player) <= -1) obj.player.push(player)
                try {
                    let client = Network.getClientForPlayer(player)
                    obj.client.add(client)
                } catch (err) {
                    Utils.log('Error in setPlayerLoaded (ServerSystem.js):\n' + err, 'ERROR', false)
                }
                this.loadAllQuest(saveId)
            } else {
                Store.cache.playerLoaded[player] = false
                let index = obj.player.indexOf(player)
                if (index >= 0) obj.player.splice(index, 1)
                try {
                    let client = Network.getClientForPlayer(player)
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
            let obj = Store.cache.playerList[saveId]
            if (!Utils.isObject(obj)) return []
            return Utils.deepCopy(obj.player)
        } else {
            return Utils.deepCopy(Store.saved.playerList[saveId])
        }
    },
    getConnectedClientList (saveId) {
        if (!this.isSaveIdValid(saveId)) return null
        let obj = Store.cache.playerList[saveId]
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
        let loadedQuest = this.loadedQuest[saveId]
        if (!Utils.isObject(loadedQuest[sourceId])) loadedQuest[sourceId] = {}
        let mainLoadedQuest = loadedQuest[sourceId]
        if (!Utils.isObject(mainLoadedQuest[chapterId])) mainLoadedQuest[chapterId] = {}
        let chapterLoadedQuest = mainLoadedQuest[chapterId]
        if (!Utils.isObject(chapterLoadedQuest[questId])) chapterLoadedQuest[questId] = {}
        return chapterLoadedQuest[questId]
    },
    getTypedInputId (saveId, type) {
        if (!this.isSaveIdValid(saveId)) return []
        if (!Utils.isObject(this.typedLoadedQuest.input[saveId])) return []
        if (!Array.isArray(this.typedLoadedQuest.input[saveId][type])) return []
        return Utils.deepCopy(this.typedLoadedQuest.input[saveId][type])
    },
    getTypedOutputId (saveId, type) {
        if (!this.isSaveIdValid(saveId)) return []
        if (!Utils.isObject(this.typedLoadedQuest.output[saveId])) return []
        if (!Array.isArray(this.typedLoadedQuest.output[saveId][type])) return []
        return Utils.deepCopy(this.typedLoadedQuest.output[saveId][type])
    },
    unloadAllLoadedQuest (saveId) {
        if (!this.isSaveIdValid(saveId)) return
        let typedLoadedQuest_Input = this.typedLoadedQuest.input[saveId]
        if (Utils.isObject(typedLoadedQuest_Input)) {
            for (let type in typedLoadedQuest_Input) {
                if (!Array.isArray(typedLoadedQuest_Input[type])) continue
                typedLoadedQuest_Input[type].forEach(function (inputId) {
                    if (!IOTypeTools.isInputIdLoaded(inputId)) return
                    IOTypeTools.unloadInput(inputId)
                })
            }
        }
        delete this.typedLoadedQuest.input[saveId]
        let typedLoadedQuest_Output = this.typedLoadedQuest.output[saveId]
        if (Utils.isObject(typedLoadedQuest_Output)) {
            for (let type in typedLoadedQuest_Output) {
                if (!Array.isArray(typedLoadedQuest_Output[type])) continue
                typedLoadedQuest_Output[type].forEach(function (outputId) {
                    if (!IOTypeTools.isOutputIdLoaded(outputId)) return
                    IOTypeTools.unloadOutput(outputId)
                })
            }
        }
        delete this.typedLoadedQuest.output[saveId]
        delete this.loadedQuest[saveId]
    },
    loadInput (saveId, sourceId, chapterId, questId, index) {
        if (!this.isSaveIdValid(saveId)) return
        let questJson = System.getQuestJson(this.resolvedJson, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        if (index >= questJson.inner.input.length) return
        if (!Utils.isObject(questJson.inner.input[index])) return
        let saveData = this.getSaveData(saveId)
        if (System.getQuestInputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questInputState.locked) return
        if (System.getInputState(saveData, sourceId, chapterId, questId, index).state === EnumObject.inputState.finished) return
        let questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!Array.isArray(questLoadedQuest.input)) questLoadedQuest.input = []
        if (IOTypeTools.isInputIdLoaded(questLoadedQuest.input[index])) return
        if (!Utils.isObject(this.typedLoadedQuest.input[saveId])) this.typedLoadedQuest.input[saveId] = {}
        if (!Array.isArray(this.typedLoadedQuest.input[saveId][questJson.inner.input[index].type])) {
            this.typedLoadedQuest.input[saveId][questJson.inner.input[index].type] = []
        }
        let inputIdArray = this.typedLoadedQuest.input[saveId][questJson.inner.input[index].type]
        let inputBak = []
        questLoadedQuest.input[index] = inputBak[index] = IOTypeTools.createInputId(questJson.inner.input[index], {
            getPlayerList: this.getPlayerList.bind(this, saveId),
            getConnectedClientList: this.getConnectedClientList.bind(this, saveId),
            getState: System.getInputState.bind(System, saveData, sourceId, chapterId, questId, index),
            setState: this.setInputState.bind(this, saveId, sourceId, chapterId, questId, index)
        }, $ServerSystem_onUnload.bind(null, questLoadedQuest.input, inputBak, index, inputIdArray))
        inputIdArray.push(questLoadedQuest.input[index])
        IOTypeTools.loadInput(questLoadedQuest.input[index])
    },
    loadOutput (saveId, sourceId, chapterId, questId, index) {
        if (!this.isSaveIdValid(saveId)) return
        let questJson = System.getQuestJson(this.resolvedJson, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        if (index >= questJson.inner.output.length) return
        if (!Utils.isObject(questJson.inner.output[index])) return
        let saveData = this.getSaveData(saveId)
        if (System.getQuestOutputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
        if (System.getOutputState(saveData, sourceId, chapterId, questId, index).state === EnumObject.outputState.received) return
        let questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!Array.isArray(questLoadedQuest.output)) questLoadedQuest.output = []
        if (IOTypeTools.isOutputIdLoaded(questLoadedQuest.output[index])) return
        if (!Utils.isObject(this.typedLoadedQuest.output[saveId])) this.typedLoadedQuest.output[saveId] = {}
        if (!Array.isArray(this.typedLoadedQuest.output[saveId][questJson.inner.output[index].type])) {
            this.typedLoadedQuest.output[saveId][questJson.inner.output[index].type] = []
        }
        let outputIdArray = this.typedLoadedQuest.output[saveId][questJson.inner.output[index].type]
        let outputBak = []
        questLoadedQuest.output[index] = outputBak[index] = IOTypeTools.createOutputId(questJson.inner.output[index], {
            getPlayerList: this.getPlayerList.bind(this, saveId),
            getConnectedClientList: this.getConnectedClientList.bind(this, saveId),
            getState: System.getOutputState.bind(System, saveData, sourceId, chapterId, questId, index),
            setState: this.setOutputState.bind(this, saveId, sourceId, chapterId, questId, index)
        }, $ServerSystem_onUnload.bind(null, questLoadedQuest.output, outputBak, index, outputIdArray))
        outputIdArray.push(questLoadedQuest.output[index])
        IOTypeTools.loadOutput(questLoadedQuest.output[index])
    },
    loadQuest (saveId, sourceId, chapterId, questId) {
        if (!this.isSaveIdValid(saveId)) return
        let questJson = System.getQuestJson(this.resolvedJson, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        let saveData = this.getSaveData(saveId)
        if (System.getQuestInputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questInputState.locked) return
        let that = this
        let getPlayerList = this.getPlayerList.bind(this, saveId)
        let getConnectedClientList = this.getConnectedClientList.bind(this, saveId)
        let questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!Array.isArray(questLoadedQuest.input)) questLoadedQuest.input = []
        if (!Utils.isObject(this.typedLoadedQuest.input[saveId])) this.typedLoadedQuest.input[saveId] = {}
        let typedLoadedQuest_Input = this.typedLoadedQuest.input[saveId]
        let inputBak = []
        questJson.inner.input.forEach(function (inputJson, index) {
            if (!Utils.isObject(inputJson)) return
            if (System.getInputState(saveData, sourceId, chapterId, questId, index).state === EnumObject.inputState.finished) return
            if (IOTypeTools.isInputIdLoaded(questLoadedQuest.input[index])) return
            if (!Array.isArray(typedLoadedQuest_Input[inputJson.type])) typedLoadedQuest_Input[inputJson.type] = []
            questLoadedQuest.input[index] = inputBak[index] = IOTypeTools.createInputId(inputJson, {
                getPlayerList: getPlayerList,
                getConnectedClientList: getConnectedClientList,
                getState: System.getInputState.bind(System, saveData, sourceId, chapterId, questId, index),
                setState: that.setInputState.bind(that, saveId, sourceId, chapterId, questId, index)
            }, $ServerSystem_onUnload.bind(null, questLoadedQuest.input, inputBak, index, typedLoadedQuest_Input[inputJson.type]))
            typedLoadedQuest_Input[inputJson.type].push(questLoadedQuest.input[index])
            IOTypeTools.loadInput(questLoadedQuest.input[index])
        })
        if (System.getQuestOutputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
        if (!Array.isArray(questLoadedQuest.output)) questLoadedQuest.output = []
        if (!Utils.isObject(this.typedLoadedQuest.output[saveId])) this.typedLoadedQuest.output[saveId] = {}
        let typedLoadedQuest_Output = this.typedLoadedQuest.output[saveId]
        let outputBak = []
        questJson.inner.output.forEach(function (outputJson, index) {
            if (!Utils.isObject(outputJson)) return
            if (System.getOutputState(saveData, sourceId, chapterId, questId, index).state === EnumObject.outputState.received) return
            if (IOTypeTools.isOutputIdLoaded(questLoadedQuest.output[index])) return
            if (!Array.isArray(typedLoadedQuest_Output[outputJson.type])) typedLoadedQuest_Output[outputJson.type] = []
            questLoadedQuest.output[index] = outputBak[index] = IOTypeTools.createOutputId(outputJson, {
                getPlayerList: getPlayerList,
                getConnectedClientList: getConnectedClientList,
                getState: System.getOutputState.bind(System, saveData, sourceId, chapterId, questId, index),
                setState: that.setOutputState.bind(that, saveId, sourceId, chapterId, questId, index)
            }, $ServerSystem_onUnload.bind(null, questLoadedQuest.output, outputBak, index, typedLoadedQuest_Output[outputJson.type]))
            typedLoadedQuest_Output[outputJson.type].push(questLoadedQuest.output[index])
            IOTypeTools.loadOutput(questLoadedQuest.output[index])
        })
    },
    loadAllQuest (saveId, isRelaod) {
        /** @todo bfs */
        if (!this.isSaveIdValid(saveId)) return
        if (isRelaod) this.unloadAllLoadedQuest(saveId)
        let json = this.resolvedJson
        for (let sourceId in json) {
            let mainJson = json[sourceId]
            for (let chapterId in mainJson.chapter) {
                let chapterJson = mainJson.chapter[chapterId]
                for (let questId in chapterJson.quest) {
                    this.loadQuest(saveId, sourceId, chapterId, questId)
                }
            }
        }
    },
    setInputState (saveId, sourceId, chapterId, questId, index, extraInfo, inputStateObject) {
        if (!this.isSaveIdValid(saveId)) return
        if (!Utils.isObject(extraInfo)) extraInfo = {}
        let questJson = System.getQuestJson(this.resolvedJson, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        let saveData = this.getSaveData(saveId)
        if (System.getQuestInputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
        let client = this.getConnectedClientList(saveId)
        if (client !== null) {
            runOnMainThread(function () {
                client.send('CustomQuests.Client.setInputState', {
                    sourceId: sourceId, chapterId: chapterId, questId: questId, index: index,
                    extraInfo: extraInfo, inputStateObject: inputStateObject
                })
            })
        }
        let questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!Array.isArray(questLoadedQuest.input)) questLoadedQuest.input = []
        let input = questLoadedQuest.input
        let that = this
        System.setInputState(this.resolvedJson, saveData, sourceId, chapterId, questId, index, inputStateObject, {
            onInputStateChanged (newInputStateObject, oldInputStateObject) {
                let called = false
                if (newInputStateObject.state !== oldInputStateObject.state) {
                    if (newInputStateObject.state === EnumObject.inputState.finished) {
                        if (IOTypeTools.isInputIdLoaded(input[index])) {
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
                        if (!IOTypeTools.isInputIdLoaded(input[index])) {
                            that.loadInput(saveId, sourceId, chapterId, questId, index)
                        }
                    }
                }
                if (!called && IOTypeTools.isInputIdLoaded(input[index])) {
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
        let questJson = System.getQuestJson(this.resolvedJson, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        let saveData = this.getSaveData(saveId)
        if (System.getQuestOutputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
        let client = this.getConnectedClientList(saveId)
        if (client !== null) {
            runOnMainThread(function () {
                client.send('CustomQuests.Client.setOutputState', {
                    sourceId: sourceId, chapterId: chapterId, questId: questId, index: index,
                    extraInfo: extraInfo, outputStateObject: outputStateObject
                })
            })
        }
        let questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!Array.isArray(questLoadedQuest.output)) questLoadedQuest.output = []
        let output = questLoadedQuest.output
        let that = this
        System.setOutputState(this.resolvedJson, saveData, sourceId, chapterId, questId, index, outputStateObject, {
            onOutputStateChanged (newOutputStateObject, oldOutputStateObject) {
                let called = false
                if (newOutputStateObject.state !== oldOutputStateObject.state) {
                    if (newOutputStateObject.state === EnumObject.outputState.received) {
                        if (IOTypeTools.isOutputIdLoaded(output[index])) {
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
                        if (!IOTypeTools.isOutputIdLoaded(output[index])) {
                            that.loadOutput(saveId, sourceId, chapterId, questId, index)
                        }
                    }
                }
                if (!called && IOTypeTools.isOutputIdLoaded(output[index])) {
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
        let loadedQuest = this.loadedQuest[saveId]
        if (!Utils.isObject(loadedQuest)) return
        let mainLoadedQuest = loadedQuest[sourceId]
        for (let chapterId in mainLoadedQuest) {
            let chapterLoadedQuest = mainLoadedQuest[chapterId]
            for (let questId in chapterLoadedQuest) {
                let questLoadedQuest = chapterLoadedQuest[questId]
                if (Array.isArray(questLoadedQuest.output)) {
                    questLoadedQuest.output.forEach(function (outputId) {
                        if (!IOTypeTools.isOutputIdLoaded(outputId)) return
                        IOTypeTools.callOutputTypeCb(outputId, 'onFastReceive', extraInfo)
                    })
                }
            }
        }
    },
    updateTeam (teamId, beforeDelete) {
        if (teamId === InvalidId) return
        if (typeof beforeDelete !== 'boolean') beforeDelete = Boolean(beforeDelete)
        let team = this.getTeam(teamId)
        if (!Utils.isObject(team)) return
        let players = team.players
        let playerList = []
        let client = new NetworkConnectedClientList()
        for (let iPlayer in players) {
            if (players[iPlayer] <= EnumObject.playerState.absent) continue
            let player = Number(iPlayer)
            if (!this.isPlayerLoaded(player)) continue
            playerList.push(player)
            try {
                client.add(Network.getClientForPlayer(player))
            } catch (err) {
                Utils.log('Error in updateTeam (ServerSystem.js):\n' + err, 'ERROR', false)
            }
        }
        let that = this
        runOnMainThread(function () {
            client.send('CustomQuests.Client.setLocalCache', {
                team: beforeDelete ? null : team,
                teamPlayerList: beforeDelete ? null : that.getTeamPlayerList(teamId)
            })
        })
        if (Setting.saveForTeam) {
            let saveId = team.saveId
            if (beforeDelete) {
                delete Store.cache.playerList[saveId]
            } else {
                if (!Utils.isObject(Store.cache.playerList[saveId])) {
                    Store.cache.playerList[saveId] = {
                        player: [],
                        client: null
                    }
                }
                let obj = Store.cache.playerList[saveId]
                obj.player = playerList
                obj.client = client
            }
        }
    },
    createTeam (player, team) {
        if (!this.isPlayerLoaded(player)) return
        if (Utils.isObject(this.getTeam(player))) return
        let teamId = Utils.getUUID()
        while (Utils.isObject(Store.saved.team[teamId])) teamId = Utils.getUUID()
        let saveId = this.createSaveId([player])
        Store.saved.team[teamId] = {
            id: teamId,
            saveId: saveId,
            bitmap: team.bitmap,
            name: team.name,
            password: team.password,
            players: {},
            settingTeam: team.setting
        }
        this.setTeam(player, teamId)
        this.setPlayerStateForTeam(teamId, player, EnumObject.playerState.owner)
        this.updateTeam(teamId)
        let that = this
        new NetworkConnectedClientList()
            .setupAllPlayersPolicy()
            .send('CustomQuests.Client.setLocalCache', {
                teamList: that.getTeamList()
            })
    },
    getTeam (target) {
        let teamId
        if (typeof target === 'number') {
            let obj = Store.saved.players[target]
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
        this.updateTeam(teamId, true)
        delete Store.saved.team[teamId]
        let that = this
        new NetworkConnectedClientList()
            .setupAllPlayersPolicy()
            .send('CustomQuests.Client.setLocalCache', {
                teamList: that.getTeamList(),
            })
    },
    setTeam (player, teamId) {
        let obj = Store.saved.players[player]
        if (!Utils.isObject(obj)) return
        if (teamId !== InvalidId && !Utils.isObject(Store.saved.team[teamId])) return
        let oldTeamId = obj.teamId
        if (teamId === oldTeamId) return
        this.setPlayerStateForTeam(oldTeamId, player, EnumObject.playerState.absent)
        this.updateTeam(oldTeamId)
        obj.teamId = teamId
        if (teamId !== InvalidId) {
            this.setPlayerStateForTeam(teamId, player, EnumObject.playerState.member)
            this.updateTeam(teamId)
        } else {
            let that = this
            runOnMainThread(function () {
                Network.getClientForPlayer(player).send('CustomQuests.Client.setLocalCache', {
                    team: null,
                    teamPlayerList: that.getTeamPlayerList(teamId)
                })
            })
        }
    },
    setPlayerStateForTeam (teamId, player, state) {
        if (teamId === InvalidId) return
        let team = Store.saved.team[teamId]
        if (!Utils.isObject(team)) return
        let oldState = team.players[player] || EnumObject.playerState.absent
        if (state === oldState) return
        team.players[player] = state
        if (state === EnumObject.playerState.absent) {
            // exit team
            let list = []
            for (let iPlayer in team.players) {
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
    },
    getTeamList () {
        let list = []
        for (let teamId in Store.saved.team) {
            if (!Utils.isObject(Store.saved.team[teamId])) continue
            list.push({
                teamId: teamId,
                bitmap: Store.saved.team[teamId].bitmap,
                name: Store.saved.team[teamId].name
            })
        }
        return list
    },
    getTeamPlayerList (teamId) {
        if (teamId === InvalidId) return null
        let team = Store.saved.team[teamId]
        if (!Utils.isObject(team)) return null
        let playerList = this.getPlayerList(team.saveId, false)
        /** @type { ReturnType<ServerSystem['getTeamPlayerList']> } */
        let ret = []
        let that = this
        playerList.forEach(function (player) {
            let obj = Store.saved.players[player]
            if (!Utils.isObject(obj)) return
            ret.push({
                name: obj.name,
                player: player,
                online: that.isPlayerLoaded(player)
            })
        })
        return ret
    }
}

Callback.addCallback('ServerPlayerLoaded', function (player) {
    if (!Utils.isObject(Store.saved.players[player])) {
        Store.saved.players[player] = {
            saveId: ServerSystem.createSaveId([player]),
            teamId: InvalidId,
            bookGived: false,
            name: Entity.getNameTag(player)
        }
    }
    let obj = Store.saved.players[player]
    if (!obj.bookGived) {
        new PlayerActor(player).addItemToInventory(ItemID.quest_book, 1, 0, null, true)
        obj.bookGived = true
    }
    obj.name = Entity.getNameTag(player)
    
    ServerSystem.setPlayerLoaded(player, true)

    let saveId = ServerSystem.getSaveId(player)
    let client = Network.getClientForPlayer(player)
    client.send('CustomQuests.Client.message', {
        text: ['??e<CustomQuests>??r ', '$mod.dialog']
    })
    client.send('CustomQuests.Client.resolveJson', {
        json: ServerSystem.json
    })
    client.send('CustomQuests.Client.setLocalCache', {
        saveData: ServerSystem.getSaveData(saveId),
        team: ServerSystem.getTeam(player),
        isAdmin: Boolean(obj.isAdmin),
        isEditor: Boolean(obj.isEditor),
        teamList: ServerSystem.getTeamList(),
        teamPlayerList: ServerSystem.getTeamPlayerList(obj.teamId)
    })
})

Callback.addCallback('ServerPlayerTick', function (player) {
    /* 30s */
    if (Math.random() * 600 < 1) {
        try {
            let saveId = ServerSystem.getSaveId(player)
            if (!ServerSystem.isSaveIdValid(saveId)) return
            let client = Network.getClientForPlayer(player)
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
