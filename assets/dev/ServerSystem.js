/// <reference path='./network.js'/>

/** @type { ServerSystem } */
const ServerSystem = {
    json: {},
    loadedQuest: {},
    getSaveId (target) {
        if (typeof target === 'number') {
            const obj = Store.saved.players[target]
            if (!Utils.isObject(obj)) return InvalidId
            return obj.saveId
        }
        return target.saveId || InvalidId
    },
    getPlayerList (saveId, online) {
        if (saveId === InvalidId) return []
        let list = Store.saved.playerList[saveId]
        if (!Array.isArray(list)) return []
        if (online) {
            list = list.filter(function (player) {
                return Store.cache.playerLoaded[player]
            })
        }
        return list
    },
    getSaveData (saveId) {
        if (saveId === InvalidId) return {}
        const data = Store.saved.data[saveId]
        if (!Utils.isObject(data)) return {}
        return data
    },
    unloadAllLoadedQuest (saveId) {
        if (saveId === InvalidId) return
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
    loadQuest (sourceId, chapterId, questId, saveId) {
        if (saveId === InvalidId) return
        const questJson = System.getQuestJson(Store.cache.resolvedJson, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        const saveData = this.getSaveData(saveId)
        const state = System.getQuestInputState(Store.cache.resolvedJson, saveData, sourceId, chapterId, questId)
        if (state <= -1 /* locked */) return
        if (!Utils.isObject(this.loadedQuest[saveId])) this.loadedQuest[saveId] = {}
        const loadedQuest = this.loadedQuest[saveId]
        if (!Utils.isObject(loadedQuest[sourceId])) loadedQuest[sourceId] = {}
        const mainLoadedQuest = loadedQuest[sourceId]
        if (!Utils.isObject(mainLoadedQuest[chapterId])) mainLoadedQuest[chapterId] = {}
        const chapterLoadedQuest = mainLoadedQuest[chapterId]
        if (!Utils.isObject(chapterLoadedQuest[questId])) chapterLoadedQuest[questId] = {}
        const questLoadedQuest = chapterLoadedQuest[questId]
        if (!Array.isArray(questLoadedQuest.input)) questLoadedQuest.input = []
        if (!Array.isArray(questLoadedQuest.output)) questLoadedQuest.output = []
        const input = questLoadedQuest.input
        const output = questLoadedQuest.output
        const that = this
        const getPlayerList = this.getPlayerList.bind(this, saveId)
        const onUnload = function (loadedIOArray, index) { loadedIOArray[index] = null }
        questJson.inner.input.forEach(function (inputJson, index) {
            if (typeof input[index] === 'string' && IOTypeTools.isInputLoaded(input[index])) return
            input[index] = IOTypeTools.loadInput(inputJson, {
                getPlayerList: getPlayerList,
                getState: System.getInputState.bind(System, saveData, sourceId, chapterId, questId, index),
                setState: that.setInputState.bind(that, sourceId, chapterId, questId, index, saveId)
            }, onUnload.bind(null, input, index))
        })
        questJson.inner.output.forEach(function (outputJson, index) {
            if (typeof output[index] === 'string' && IOTypeTools.isOutputLoaded(output[index])) return
            output[index] = IOTypeTools.loadOutput(outputJson, {
                getPlayerList: getPlayerList,
                getState: System.getOutputState.bind(System, saveData, sourceId, chapterId, questId, index),
                setState: that.setOutputState.bind(that, sourceId, chapterId, questId, index, saveId)
            }, onUnload.bind(null, output, index))
        })
    },
    loadAllQuest (saveId) {
        if (saveId === InvalidId) return
        this.unloadAllLoadedQuest(saveId)
        const json = Store.cache.resolvedJson
        for (const sourceId in json) {
            const mainJson = json[sourceId]
            for (const chapterId in mainJson.chapter) {
                const chapterJson = mainJson.chapter[chapterId]
                for (const questId in chapterJson.quest) {
                    this.loadQuest(sourceId, chapterId, questId, saveId) 
                }
            }
        }
    },
    setInputState (sourceId, chapterId, questId, index, saveId, extraInfo, inputState) {
        
    },
    setOutputState (sourceId, chapterId, questId, index, saveId, extraInfo, outputState) {
        
    },
    receiveAllQuest (sourceId, extraInfo, saveId) {
        if (saveId === InvalidId) return
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
        const obj = Store.saved.players[player]
        if (!Utils.isObject(obj)) return null
        const teamId = obj.teamId
        if (teamId === InvalidId) return null
        return Store.saved.team[teamId]
    },
    createTeam (player, bitmap, name, setting) {
        if (Utils.isObject(this.getTeam(player))) return
        const teamId = Utils.getRandomString()
        Store.saved.team[teamId] = {
            id: teamId,
            saveId: Utils.getRandomString(),
            bitmap: bitmap,
            name: name,
            players: {},
            settingTeam: setting
        }
        this.setTeamPlayerState(teamId, player, 3 /* owner */)
    },
    setTeam (player, teamId) {
        const obj = Store.saved.players[player]
        if (!Utils.isObject(obj)) return
        const oldTeamId = obj.teamId
        obj.teamId = teamId
        setTeamPlayerState(oldTeamId, player, 0 /* absent */)
        if (teamId !== InvalidId) {
            if (!Utils.isObject(Store.saved.team[teamId])) {
                obj.teamId = InvalidId
                return
            }
            setTeamPlayerState(teamId, player, 1 /* member */)
        }
    },
    setTeamPlayerState (teamId, player, state) {
        if (teamId === InvalidId) return
        const team = Store.saved.team[teamId]
        if (!Utils.isObject(team)) return
        team.players[player] = state
        if (state === 0 /* absent */) {
            const list = []
            for (const iPlayer in team.players) {
                if (team.players[iPlayer] >= 1) {
                    list.push(Number(iPlayer))
                }
            }
            if (list.length === 0) {
                this.unloadAllLoadedQuest(team.saveId)
                Store.saved.data[saveId] = null
                Store.saved.playerList[saveId] = null
                Store.saved.team[teamId] = null
            } else {
                Store.saved.playerList[team.saveId] = list
            }
        }
    },
    open (player, sourceId, isMenu) {

    }
}
