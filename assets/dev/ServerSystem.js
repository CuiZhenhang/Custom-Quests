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
            let rootQuest = ServerSystem.rootQuest = {}
            for (let sourceId in ServerSystem.resolvedJson) {
                rootQuest[sourceId] = {}
                let mainJson = ServerSystem.resolvedJson[sourceId]
                for (let chapterId in mainJson.chapter) {
                    rootQuest[sourceId][chapterId] = {}
                    let chapterJson = mainJson.chapter[chapterId]
                    for (let questId in chapterJson.quest) {
                        let questJson = chapterJson.quest[questId]
                        if (questJson.type === 'quest' && questJson.parent.length === 0) {
                            rootQuest[sourceId][chapterId][questId] = true
                        }
                    }
                }
            }
        })
        return null
    })(),
    rootQuest: {},
    loadedQuest: (function () {
        Callback.addCallback('LevelSelected', function () {
            ServerSystem.loadedQuest = {}
        })
        return {}
    })(),
    loadedQuestIdArray: (function () {
        Callback.addCallback('LevelSelected', function () {
            ServerSystem.loadedQuestIdArray = {}
        })
        return {}
    })(),
    addContents (sourceId, contents) {
        if (typeof sourceId !== 'string') return
        if (!Utils.isObject(contents)) return
        if (!Array.isArray(contents.main)) return
        this.json[sourceId] = contents
    },
    createSaveId (playerList) {
        if (!Array.isArray(playerList)) return InvalidId
        if (playerList.length === 0) return InvalidId
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
            if (!obj) return InvalidId
            if (Setting.saveForTeam) return this.getSaveId(obj.teamId)
            return obj.saveId
        } else if (typeof target === 'string') {
            if (!Setting.saveForTeam) return InvalidId
            if (target === InvalidId) return InvalidId
            let team = Store.saved.team[target]
            if (!team) return InvalidId
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
    isTeamSaveId (saveId) {
        if (saveId === InvalidId) return false
        let playerList = this.getPlayerList(saveId)
        if (playerList.length === 0) return false
        let team = this.getTeam(playerList[0])
        return Boolean(team && team.saveId === saveId)
    },
    setPlayerLoaded (player, loaded) {
        if (typeof player !== 'number') return
        if (typeof loaded !== 'boolean') loaded = Boolean(loaded)
        let saveId = this.getSaveId(player)
        if (this.isSaveIdValid(saveId)) {
            if (!Store.cache.playerList[saveId]) {
                Store.cache.playerList[saveId] = {
                    player: [],
                    client: new NetworkConnectedClientList()
                }
            }
            let obj = Store.cache.playerList[saveId]
            if (loaded) {
                Store.cache.playerLoaded[player] = true
                if (obj.player.indexOf(player) < 0) obj.player.push(player)
                obj.client && obj.client.add(Network.getClientForPlayer(player))
                this.loadAllQuest(saveId)
            } else {
                Store.cache.playerLoaded[player] = false
                let index = obj.player.indexOf(player)
                if (index >= 0) obj.player.splice(index, 1)
                obj.client && obj.client.remove(Network.getClientForPlayer(player))
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
            if (!obj) return []
            return obj.player
        } else {
            return Store.saved.playerList[saveId]
        }
    },
    getConnectedClientList (saveId) {
        if (!this.isSaveIdValid(saveId)) return null
        let obj = Store.cache.playerList[saveId]
        if (!obj) return null
        return obj.client
    },
    getSaveData (saveId) {
        if (!this.isSaveIdValid(saveId)) return {}
        return Store.saved.data[saveId]
    },
    getLoadedQuest (saveId, sourceId, chapterId, questId) {
        if (!this.isSaveIdValid(saveId)) return {}
        if (!this.loadedQuest[saveId]) this.loadedQuest[saveId] = {}
        let loadedQuest = this.loadedQuest[saveId]
        if (!loadedQuest[sourceId]) loadedQuest[sourceId] = {}
        let mainLoadedQuest = loadedQuest[sourceId]
        if (!mainLoadedQuest[chapterId]) mainLoadedQuest[chapterId] = {}
        let chapterLoadedQuest = mainLoadedQuest[chapterId]
        if (!chapterLoadedQuest[questId]) chapterLoadedQuest[questId] = {}
        return chapterLoadedQuest[questId]
    },
    getTypedInputId (saveId, type) {
        return []
    },
    getTypedOutputId (saveId, type) {
        return []
    },
    unloadAllLoadedQuest (saveId) {
        if (!this.isSaveIdValid(saveId)) return
        let loadedQuestIdArray = this.loadedQuestIdArray[saveId]
        if (!loadedQuestIdArray) return
        loadedQuestIdArray.input.forEach(function (inputId) {
            if (!IOTypeTools.isInputIdLoaded(inputId)) return
            IOTypeTools.unloadInput(inputId)
        })
        loadedQuestIdArray.output.forEach(function (outputId) {
            if (!IOTypeTools.isOutputIdLoaded(outputId)) return
            IOTypeTools.unloadOutput(outputId)
        })
        delete this.loadedQuest[saveId]
        delete this.loadedQuestIdArray[saveId]
    },
    loadInput (saveId, sourceId, chapterId, questId, index) {
        if (!this.isSaveIdValid(saveId)) return
        let questJson = System.getQuestJson(this.resolvedJson, sourceId, chapterId, questId)
        if (!questJson || questJson.type !== 'quest') return
        if (index >= questJson.inner.input.length) return
        if (!questJson.inner.input[index]) return
        let saveData = this.getSaveData(saveId)
        if (System.getQuestInputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questInputState.locked) return
        if (System.getInputState(saveData, sourceId, chapterId, questId, index).state === EnumObject.inputState.finished) return
        let questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!Array.isArray(questLoadedQuest.input)) questLoadedQuest.input = []
        if (IOTypeTools.isInputIdLoaded(questLoadedQuest.input[index])) return
        if (!this.loadedQuestIdArray[saveId]) {
            this.loadedQuestIdArray[saveId] = {
                input: [],
                output: []
            }
        }
        let inputIdArray = this.loadedQuestIdArray[saveId].input
        let inputBak = []
        questLoadedQuest.input[index] = inputBak[index] = IOTypeTools.createInputId(questJson.inner.input[index], {
            getPlayerList: Utils.safeResult(this.getPlayerList.bind(this, saveId)),
            getConnectedClientList: this.getConnectedClientList.bind(this, saveId),
            getState: Utils.safeResult(System.getInputState.bind(System, saveData, sourceId, chapterId, questId, index)),
            setState: this.setInputState.bind(this, saveId, sourceId, chapterId, questId, index)
        }, $ServerSystem_onUnload.bind(null, questLoadedQuest.input, inputBak, index, inputIdArray), saveId)
        inputIdArray.push(questLoadedQuest.input[index])
        IOTypeTools.loadInput(questLoadedQuest.input[index])
    },
    loadOutput (saveId, sourceId, chapterId, questId, index) {
        if (!this.isSaveIdValid(saveId)) return
        let questJson = System.getQuestJson(this.resolvedJson, sourceId, chapterId, questId)
        if (!questJson || questJson.type !== 'quest') return
        if (index >= questJson.inner.output.length) return
        if (!questJson.inner.output[index]) return
        let saveData = this.getSaveData(saveId)
        if (System.getQuestOutputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
        if (System.getOutputState(saveData, sourceId, chapterId, questId, index).state === EnumObject.outputState.received) return
        let questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!Array.isArray(questLoadedQuest.output)) questLoadedQuest.output = []
        if (IOTypeTools.isOutputIdLoaded(questLoadedQuest.output[index])) return
        if (!this.loadedQuestIdArray[saveId]) {
            this.loadedQuestIdArray[saveId] = {
                input: [],
                output: []
            }
        }
        let outputIdArray = this.loadedQuestIdArray[saveId].output
        let outputBak = []
        questLoadedQuest.output[index] = outputBak[index] = IOTypeTools.createOutputId(questJson.inner.output[index], {
            getPlayerList: Utils.safeResult(this.getPlayerList.bind(this, saveId)),
            getConnectedClientList: this.getConnectedClientList.bind(this, saveId),
            getState: Utils.safeResult(System.getOutputState.bind(System, saveData, sourceId, chapterId, questId, index)),
            setState: this.setOutputState.bind(this, saveId, sourceId, chapterId, questId, index)
        }, $ServerSystem_onUnload.bind(null, questLoadedQuest.output, outputBak, index, outputIdArray), saveId)
        outputIdArray.push(questLoadedQuest.output[index])
        IOTypeTools.loadOutput(questLoadedQuest.output[index])
    },
    loadQuest (saveId, sourceId, chapterId, questId) {
        if (!this.isSaveIdValid(saveId)) return
        let questJson = System.getQuestJson(this.resolvedJson, sourceId, chapterId, questId)
        if (!questJson || questJson.type !== 'quest') return
        let saveData = this.getSaveData(saveId)
        if (System.getQuestInputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questInputState.locked) return
        let that = this
        let getPlayerList = Utils.safeResult(this.getPlayerList.bind(this, saveId))
        let getConnectedClientList = this.getConnectedClientList.bind(this, saveId)
        let questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!this.loadedQuestIdArray[saveId]) {
            this.loadedQuestIdArray[saveId] = {
                input: [],
                output: []
            }
        }
        let loadedQuestIdArray = this.loadedQuestIdArray[saveId]
        if (!Array.isArray(questLoadedQuest.input)) questLoadedQuest.input = []
        let inputBak = []
        questJson.inner.input.forEach(function (inputJson, index) {
            if (!inputJson) return
            if (System.getInputState(saveData, sourceId, chapterId, questId, index).state === EnumObject.inputState.finished) return
            if (IOTypeTools.isInputIdLoaded(questLoadedQuest.input[index])) return
            questLoadedQuest.input[index] = inputBak[index] = IOTypeTools.createInputId(inputJson, {
                getPlayerList: getPlayerList,
                getConnectedClientList: getConnectedClientList,
                getState: Utils.safeResult(System.getInputState.bind(System, saveData, sourceId, chapterId, questId, index)),
                setState: that.setInputState.bind(that, saveId, sourceId, chapterId, questId, index)
            }, $ServerSystem_onUnload.bind(null, questLoadedQuest.input, inputBak, index, loadedQuestIdArray.input), saveId)
            loadedQuestIdArray.input.push(questLoadedQuest.input[index])
            IOTypeTools.loadInput(questLoadedQuest.input[index])
        })
        if (System.getQuestOutputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
        if (!Array.isArray(questLoadedQuest.output)) questLoadedQuest.output = []
        let outputBak = []
        questJson.inner.output.forEach(function (outputJson, index) {
            if (!outputJson) return
            if (System.getOutputState(saveData, sourceId, chapterId, questId, index).state === EnumObject.outputState.received) return
            if (IOTypeTools.isOutputIdLoaded(questLoadedQuest.output[index])) return
            questLoadedQuest.output[index] = outputBak[index] = IOTypeTools.createOutputId(outputJson, {
                getPlayerList: getPlayerList,
                getConnectedClientList: getConnectedClientList,
                getState: Utils.safeResult(System.getOutputState.bind(System, saveData, sourceId, chapterId, questId, index)),
                setState: that.setOutputState.bind(that, saveId, sourceId, chapterId, questId, index)
            }, $ServerSystem_onUnload.bind(null, questLoadedQuest.output, outputBak, index, loadedQuestIdArray.output), saveId)
            loadedQuestIdArray.output.push(questLoadedQuest.output[index])
            IOTypeTools.loadOutput(questLoadedQuest.output[index])
        })
    },
    loadAllQuest (saveId, isRelaod) {
        if (!this.isSaveIdValid(saveId)) return
        if (isRelaod) this.unloadAllLoadedQuest(saveId)
        /** @type { Array<[CQTypes.sourceId, CQTypes.chapterId, CQTypes.questId]> } */
        let stack = []
        let numberIn = {}
        let json = this.resolvedJson
        let data = Store.saved.data[saveId]
        if (!data) return
        for (let sourceId in this.rootQuest) {
            numberIn[sourceId] = {}
            for (let chapterId in this.rootQuest[sourceId]) {
                numberIn[sourceId][chapterId] = {}
                for (let questId in this.rootQuest[sourceId][chapterId]) {
                    if (!this.rootQuest[sourceId][chapterId][questId]) continue
                    numberIn[sourceId][chapterId][questId] = -1
                    stack.push([sourceId, chapterId, questId])
                    this.loadQuest(saveId, sourceId, chapterId, questId)
                }
            }
        }
        let that = this
        let path = null
        while (path = stack.pop()) {
            let inputState = System.getQuestInputState(json, data, path[0], path[1], path[2])
            if (inputState >= EnumObject.questInputState.finished) {
                System.getChild(json, path[0], path[1], path[2]).forEach(function (child) {
                    let sourceId = child[0], chapterId = child[1], questId = child[2]
                    if (!numberIn[sourceId]) numberIn[sourceId] = {}
                    if (!numberIn[sourceId][chapterId]) numberIn[sourceId][chapterId] = {}
                    if (numberIn[sourceId][chapterId][questId] < 0) return
                    let questJson = System.getQuestJson(json, sourceId, chapterId, questId)
                    if (!questJson || questJson.type !== 'quest') return
                    if (typeof numberIn[sourceId][chapterId][questId] !== 'number') numberIn[sourceId][chapterId][questId] = 0
                    if (++numberIn[sourceId][chapterId][questId] >= questJson.parent.length) {
                        numberIn[sourceId][chapterId][questId] = -1
                        stack.push([sourceId, chapterId, questId])
                        that.loadQuest(saveId, sourceId, chapterId, questId)
                    }
                })
            }
        }
    },
    setInputState (saveId, sourceId, chapterId, questId, index, extraInfo, inputStateObject) {
        if (!this.isSaveIdValid(saveId)) return
        if (!Utils.isObject(extraInfo)) extraInfo = {}
        let questJson = System.getQuestJson(this.resolvedJson, sourceId, chapterId, questId)
        if (!questJson || questJson.type !== 'quest') return
        let saveData = this.getSaveData(saveId)
        if (System.getQuestInputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
        let client = this.getConnectedClientList(saveId)
        if (client !== null) {
            runOnMainThread(function () {
                client && client.send('CustomQuests.Client.setInputState', {
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
        if (!questJson || questJson.type !== 'quest') return
        let saveData = this.getSaveData(saveId)
        if (System.getQuestOutputState(this.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
        let client = this.getConnectedClientList(saveId)
        if (client !== null) {
            runOnMainThread(function () {
                client && client.send('CustomQuests.Client.setOutputState', {
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
        if (!loadedQuest) return
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
        if (!team) return
        let players = team.players
        let playerList = []
        let client = new NetworkConnectedClientList()
        for (let iPlayer in players) {
            if (players[iPlayer] <= EnumObject.playerState.absent) continue
            let player = Number(iPlayer)
            if (!this.isPlayerLoaded(player)) continue
            playerList.push(player)
            client.add(Network.getClientForPlayer(player))
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
            runOnMainThread(function () {
                client.send('CustomQuests.Client.setLocalCache', {
                    saveData: beforeDelete ? {} : ServerSystem.getSaveData(saveId)
                })
            })
            if (beforeDelete) {
                delete Store.cache.playerList[saveId]
            } else {
                if (!Store.cache.playerList[saveId]) {
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
        if (this.getTeam(player)) return
        let teamId = Utils.getUUID()
        while (Store.saved.team[teamId]) teamId = Utils.getUUID()
        let saveId = this.createSaveId([player])
        if (saveId === InvalidId) return
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
        let teamId = InvalidId
        if (typeof target === 'number') {
            let obj = Store.saved.players[target]
            if (!obj) return null
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
                teamList: that.getTeamList()
            })
    },
    setTeam (player, teamId) {
        let obj = Store.saved.players[player]
        if (!obj) return
        if (teamId !== InvalidId && !Store.saved.team[teamId]) return
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
                    teamPlayerList: that.getTeamPlayerList(teamId),
                    saveData: {}
                })
            })
        }
    },
    setPlayerStateForTeam (teamId, player, state) {
        if (teamId === InvalidId) return
        let team = Store.saved.team[teamId]
        if (!team) return
        let oldState = team.players[player] || EnumObject.playerState.absent
        if (state === oldState) return
        team.players[player] = state
        if (state === EnumObject.playerState.absent) {
            // exit team
            let list = Store.saved.playerList[team.saveId]
            let index = list.indexOf(player)
            if (index !== -1) list.splice(index, 1)
            if (list.length === 0) {
                this.deleteTeam(teamId)
                return
            }
            if (this.getPlayerList(team.saveId, true).length === 0) {
                this.unloadAllLoadedQuest(team.saveId)
            }
        } else if (oldState === EnumObject.playerState.absent) {
            // join team
            let list = Store.saved.playerList[team.saveId]
            if (list.indexOf(player) < 0) list.push(player)
            this.loadAllQuest(team.saveId)
        }
    },
    getTeamList () {
        let list = []
        for (let teamId in Store.saved.team) {
            if (!Store.saved.team[teamId]) continue
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
        if (!team) return null
        let playerList = this.getPlayerList(team.saveId, false)
        /** @type { Exclude<ReturnType<ServerSystem['getTeamPlayerList']>, null> } */
        let ret = []
        let that = this
        playerList.forEach(function (player) {
            let obj = Store.saved.players[player]
            if (!obj) return
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
    if (!Store.saved.players[player]) {
        Store.saved.players[player] = {
            saveId: ServerSystem.createSaveId([player]),
            teamId: InvalidId,
            bookGived: false,
            name: Entity.getNameTag(player)
        }
    }
    let obj = Store.saved.players[player]
    if (!obj.bookGived && Setting.giveBook) {
        new PlayerActor(player).addItemToInventory(ItemID.quest_book, 1, 0, null, true)
        obj.bookGived = true
    }
    obj.name = Entity.getNameTag(player)
    
    ServerSystem.setPlayerLoaded(player, true)

    let saveId = ServerSystem.getSaveId(player)
    let client = Network.getClientForPlayer(player)
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
        isEditor: Boolean(obj.isEditor),
        teamList: ServerSystem.getTeamList(),
        teamPlayerList: ServerSystem.getTeamPlayerList(obj.teamId)
    })
})

; (function () {
    /** @type { {[player: number]: number} } */
    let latest = {}

    Callback.addCallback('ServerPlayerTick', function (player) {
        let now = Date.now()
        if (now < latest[player]) return
        latest[player] = now + 30000 /* 30s */
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
    })

    Callback.addCallback('ServerPlayerLeft', function (player) {
        delete latest[player]
    })
})()

Callback.addCallback('ServerPlayerLeft', function (player) {
    ServerSystem.setPlayerLoaded(player, false)
})
