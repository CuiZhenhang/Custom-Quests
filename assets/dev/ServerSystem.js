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
    loadedQuest: {},
    createSaveId (playerList) {
        if (!Array.isArray(playerList)) return
        if (playerList.length === 0) return
        const saveId = Utils.getRandomString()
        Store.saved.playerList[saveId] = Utils.deepCopy(playerList)
        Store.saved.data[saveId] = {}
        Store.saved.exist[saveId] = true
        return saveId
    },
    getSaveId (target) {
        if (typeof target === 'number') {
            if (!Store.cache.playerLoaded[target]) return
            const obj = Store.saved.players[target]
            if (!Utils.isObject(obj)) return InvalidId
            return obj.saveId
        }
        if (typeof target === 'string') {
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
    getPlayerList (saveId, online) {
        if (!this.isSaveIdValid(saveId)) return []
        let list = Store.saved.playerList[saveId]
        if (online) {
            list = list.filter(function (player) {
                return Store.cache.playerLoaded[player]
            })
        }
        return list
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
                            if (typeof inputId !== 'string') return
                            IOTypeTools.unloadInput(inputId)
                        })
                        questLoadedQuest.input = null
                    }
                    if (Array.isArray(questLoadedQuest.output)) {
                        questLoadedQuest.output.forEach(function (outputId) {
                            if (typeof outputId !== 'string') return
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
        const questJson = System.getQuestJson(Store.cache.resolvedJson, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        if (index >= questJson.inner.input.length) return
        const saveData = this.getSaveData(saveId)
        if (System.getQuestInputState(Store.cache.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questInputState.locked) return
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
        const questJson = System.getQuestJson(Store.cache.resolvedJson, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        if (index >= questJson.inner.output.length) return
        const saveData = this.getSaveData(saveId)
        if (System.getQuestOutputState(Store.cache.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
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
        const questJson = System.getQuestJson(Store.cache.resolvedJson, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        const saveData = this.getSaveData(saveId)
        if (System.getQuestInputState(Store.cache.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questInputState.locked) return
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
        if (System.getQuestOutputState(Store.cache.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
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
        const json = Store.cache.resolvedJson
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
        const saveData = this.getSaveData(saveId)
        if (System.getQuestInputState(Store.cache.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
        const questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!Array.isArray(questLoadedQuest.input)) questLoadedQuest.input = []
        const input = questLoadedQuest.input
        const that = this
        System.setInputState(Store.cache.resolvedJson, saveData, sourceId, chapterId, questId, index, inputStateObject, {
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
                                Utils.log('Error in Callback \'CustomQuests.onInputStateChanged\':\n' + err, 'ERROR', true)
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
                        Utils.log('Error in Callback \'CustomQuests.onInputStateChanged\':\n' + err, 'ERROR', true)
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
                    Utils.log('Error in Callback \'CustomQuests.onQuestInputStateChanged\':\n' + err, 'ERROR', true)
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
                    Utils.log('Error in Callback \'CustomQuests.onQuestOutputStateChanged\':\n' + err, 'ERROR', true)
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
                    Utils.log('Error in Callback \'CustomQuests.onQuestInputStateChanged\':\n' + err, 'ERROR', true)
                }
            }
        })
    },
    setOutputState (saveId, sourceId, chapterId, questId, index, extraInfo, outputStateObject) {
        if (!this.isSaveIdValid(saveId)) return
        const saveData = this.getSaveData(saveId)
        if (System.getQuestOutputState(Store.cache.resolvedJson, saveData, sourceId, chapterId, questId) <= EnumObject.questOutputState.locked) return
        const questLoadedQuest = this.getLoadedQuest(saveId, sourceId, chapterId, questId)
        if (!Array.isArray(questLoadedQuest.output)) questLoadedQuest.output = []
        const output = questLoadedQuest.output
        const that = this
        System.setOutputState(Store.cache.resolvedJson, saveData, sourceId, chapterId, questId, index, outputStateObject, {
            onOutputStateChanged (newOutputStateObject, oldOutputStateObject) {
                let called = false
                if (newOutputStateObject.state !== oldOutputStateObject.state) {
                    if (newOutputStateObject.state === EnumObject.outputState.received) {
                        if (IOTypeTools.isOutputLoaded(output[index])) {
                            IOTypeTools.callOutTypeCb(output[index], 'onReceive', extraInfo)
                            try {
                                called = true
                                Callback.invokeCallback('CustomQuests.onOutputStateChanged',
                                    output[index],
                                    Utils.deepCopy(newOutputStateObject),
                                    Utils.deepCopy(oldOutputStateObject),
                                    Utils.deepCopy(extraInfo)
                                )
                            } catch (err) {
                                Utils.log('Error in Callback \'CustomQuests.onOutputStateChanged\':\n' + err, 'ERROR', true)
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
                        Utils.log('Error in Callback \'CustomQuests.onOutputStateChanged\':\n' + err, 'ERROR', true)
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
                    Utils.log('Error in Callback \'CustomQuests.onQuestOutputStateChanged\':\n' + err, 'ERROR', true)
                }
            }
        })
    },
    receiveAllQuest (saveId, sourceId, extraInfo) {
        if (!this.isSaveIdValid(saveId)) return
        const loadedQuest = this.loadedQuest[saveId]
        if (!Utils.isObject(loadedQuest)) return
        const mainLoadedQuest = loadedQuest[sourceId]
        for (const chapterId in mainLoadedQuest) {
            const chapterLoadedQuest = mainLoadedQuest[chapterId]
            for (const questId in chapterLoadedQuest) {
                const questLoadedQuest = chapterLoadedQuest[questId]
                if (Array.isArray(questLoadedQuest.output)) {
                    questLoadedQuest.output.forEach(function (outputId) {
                        if (typeof outputId !== 'string') return
                        IOTypeTools.callOutTypeCb(outputId, 'onFastReceive', extraInfo)
                    })
                }
            }
        }
    },
    getTeam (player) {
        if (!Store.cache.playerLoaded[player]) return
        const obj = Store.saved.players[player]
        if (!Utils.isObject(obj)) return null
        const teamId = obj.teamId
        if (teamId === InvalidId) return null
        return Store.saved.team[teamId]
    },
    createTeam (player, bitmap, name, setting) {
        if (!Store.cache.playerLoaded[player]) return
        if (Utils.isObject(this.getTeam(player))) return
        const teamId = Utils.getRandomString()
        const saveId = Utils.getRandomString()
        Store.saved.team[teamId] = {
            id: teamId,
            saveId: saveId,
            bitmap: bitmap,
            name: name,
            players: {},
            settingTeam: setting
        }
        Store.saved.exist[saveId]
        this.setPlayerStateForTeam(teamId, player, EnumObject.playerState.owner)
    },
    deleteTeam (teamId) {
        if (teamId === InvalidId) return
        this.deleteSaveId(Store.saved.team[teamId].saveId)
        Store.saved.team[teamId] = null
    },
    setTeam (player, teamId) {
        if (!Store.cache.playerLoaded[player]) return
        const obj = Store.saved.players[player]
        if (!Utils.isObject(obj)) return
        const oldTeamId = obj.teamId
        this.setPlayerStateForTeam(oldTeamId, player, EnumObject.playerState.absent)
        obj.teamId = teamId
        if (teamId !== InvalidId) {
            if (!Utils.isObject(Store.saved.team[teamId])) {
                obj.teamId = InvalidId
                return
            }
            this.setPlayerStateForTeam(teamId, player, EnumObject.playerState.member)
        }
    },
    setPlayerStateForTeam (teamId, player, state) {
        if (!Store.cache.playerLoaded[player]) return
        if (teamId === InvalidId) return
        const team = Store.saved.team[teamId]
        if (!Utils.isObject(team)) return
        const oldState = team.players[player] || EnumObject.playerState.absent
        if (state === oldState) return
        team.players[player] = state
        if (state === EnumObject.playerState.absent) {
            // exit team
            const list = []
            let hasOnlinePlayer = false
            for (const iPlayer in team.players) {
                if (team.players[iPlayer] >= EnumObject.playerState.member) {
                    list.push(Number(iPlayer))
                    if (Store.cache.playerLoaded[iPlayer]) {
                        hasOnlinePlayer = true
                    }
                }
            }
            if (list.length === 0) {
                this.deleteTeam(teamId)
                return
            }
            Store.saved.playerList[team.saveId] = list
            if (!hasOnlinePlayer) {
                this.unloadAllLoadedQuest(team.saveId)
            }
        } else if (oldState === EnumObject.playerState.absent) {
            // join team
            this.loadAllQuest(team.saveId)
        }
    },
    open (player, sourceId, isMenu) {
        if (!Store.cache.playerLoaded[player]) return

    }
}

Callback.addCallback('ServerPlayerLoaded', function (player) {
    Updatable.addUpdatable({
        timer: 0,
        update () {
            this.timer++
            if (Store.cache.playerLoaded[player]) {
                ServerSystem.loadAllQuest(ServerSystem.getSaveId(player))
                Network.getClientForPlayer(player).send('CustomQuests.Client.message', {
                    text: ['§e<CustomQuests>§r ', '$mod.dialog']
                })
                this.remove = true
            } else if (this.timer >= 200 /* 10s */) {
                Network.getClientForPlayer(player).send('CustomQuests.Client.message', {
                    text: ['§e<CustomQuests>§r ', '$message.connection_timeout']
                })
                this.remove = true
            }
        }
    })
})
