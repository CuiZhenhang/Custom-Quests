/// <reference path='./IOTypeTools.js'/>

/** @type { System } */
const System = {
    resolveJson: (function () {
        /**
         * @param { CQTypes.IOTypes.InputJsonBase } inputJson 
         * @param { Array<{[refId: CQTypes.refId]: unknown}> } refsArray 
         * @param { {[bitmapName: string]: boolean} } bitmapNameObject 
         * @returns { CQTypes.IOTypes.InputJson } 
         */
        const resolveInputJson = function (inputJson, refsArray, bitmapNameObject) {
            if (!Utils.isObject(inputJson)) return null
            if (typeof inputJson.type !== 'string') return null
            const inputTypeCb = IOTypeTools.getInputTypeCb(inputJson.type)
            if (typeof inputTypeCb.resolveJson !== 'function') return inputJson
            const resolvedJson = inputTypeCb.resolveJson(inputJson, refsArray, bitmapNameObject)
            if (!Utils.isObject(resolvedJson)) return null
            if (typeof resolvedJson.type !== 'string') return null
            return resolvedJson
        }

        /**
         * @param { CQTypes.IOTypes.OutputJsonBase } outputJson 
         * @param { Array<{[refId: CQTypes.refId]: unknown}> } refsArray 
         * @param { {[bitmapName: string]: boolean} } bitmapNameObject 
         * @returns { CQTypes.IOTypes.OutputJson } 
         */
        const resolveOutputJson = function (outputJson, refsArray, bitmapNameObject) {
            if (!Utils.isObject(outputJson)) return null
            if (typeof outputJson.type !== 'string') return null
            const outputTypeCb = IOTypeTools.getOutputTypeCb(outputJson.type)
            if (typeof outputTypeCb.resolveJson !== 'function') return outputJson
            const resolvedJson = outputTypeCb.resolveJson(outputJson, refsArray, bitmapNameObject)
            if (!Utils.isObject(resolvedJson)) return null
            if (typeof resolvedJson.type !== 'string') return null
            return resolvedJson
        }

        const Graph = function () {
            let num_node = 0, map = {}, value = [0]
            const edge = {
                num: 0,
                to: [0],
                dis: [0],
                next: [0],
                head: [0]
            }
            const queue = {
                head: 0,
                tail: 0,
                value: []
            }

            /** @type { (nodeId: string) => number } */
            const getNode = function (nodeId) {
                if (!map[nodeId]) map[nodeId] = ++num_node
                return map[nodeId]
            }
            /** @type { (fromId: string, toId: string, dis: number) => void } */
            this.addEdge = function (fromId, toId, dis) {
                const from = getNode(fromId)
                const to = getNode(toId)
                edge.num++
                edge.to[edge.num] = to
                edge.dis[edge.num] = dis
                edge.next[edge.num] = edge.head[from]
                edge.head[from] = edge.num
            }
            /** @type { (nodeId: string, dis: number) => void } */
            this.setValue = function (nodeId, dis) {
                const node = getNode(nodeId)
                value[node] = dis
                queue.value[queue.tail++] = node
            }
            /** @type { (nodeId: string) => number } */
            this.getValue = function (nodeId) {
                return value[getNode(nodeId)]
            }
            /** @type { (cb: (nodeValue: number, edgeDis: number) => number) => void } */
            this.bfs = function (cb) {
                let u, v
                while (queue.head < queue.tail) {
                    u = queue.value[queue.head++]
                    for (let i = edge.head[u]; i; i = edge.next[i]) {
                        v = edge.to[i]
                        if (typeof value[v] === 'number') continue
                        value[v] = cb(value[u], edge.dis[i])
                        queue.value[queue.tail++] = v
                    }
                }
            }
        }

        /** @type { (param: number | [string, number]) => boolean } */
        const isValidXYSize = function (param) {
            if (typeof param === 'number') return true
            if (!Utils.isObject(param)) return false
            if (typeof param[0] !== 'string') return false
            if (typeof param[1] !== 'number') return false
            return true
        }

        /**
         * @typedef { {[sourceId: CQTypes.sourceId]: {[chapterId: CQTypes.chapterId]: {[questId: CQTypes.questId]: Array<CQTypes.PathArray>}}} } ChildObject
         * @param { CQTypes.MainJson } mainJson 
         * @param { CQTypes.sourceId } sourceId 
         * @returns { {json: CQTypes.ResolvedMainJson, config: CQTypes.MainJson['config'], bitmaps: CQTypes.MainJson['bitmaps'], childObject: ChildObject} } 
         */
        const resolveMainJson = function (mainJson, sourceId) {
            if (!Utils.isObject(mainJson)) return null
            /** @type { ChildObject } */
            const childObject = {}
            const bitmapNameObject = {}
            if (Array.isArray(mainJson.bitmaps)) {
                mainJson.bitmaps.forEach(function (bitmapObject) {
                    if (!Utils.isObject(bitmapObject)) return
                    if (typeof bitmapObject.name !== 'string') return
                    if (typeof bitmapObject.base64 !== 'string') return
                    bitmapNameObject[bitmapObject.name] = true
                })
            }
            const refsArray = []
            refsArray.push(mainJson.ref)
            /** @type { CQTypes.ResolvedMainJson } */
            const resolvedMainJson = {}
            resolvedMainJson.chapter = {}
            resolvedMainJson.name = Utils.resolveTextJson(mainJson.name)
            if (Array.isArray(mainJson.group)) resolvedMainJson.group = mainJson.group
            let background = Utils.deepCopy(mainJson.background)
            if (Array.isArray(background) && typeof background[0] === 'string') {
                background[0] = Utils.resolveBitmap(background[0], bitmapNameObject)
                if (typeof background[1] !== 'number') background[1] = null
            } else background = null

            if (Array.isArray(mainJson.main)) mainJson.main.forEach(function (chapterJson) {
                if (typeof chapterJson.id !== 'string') return
                refsArray.push(chapterJson.ref)
                const chapterId = chapterJson.id
                /** @type { CQTypes.ResolvedChapterJson } */
                const resolvedChapterJson = {}
                resolvedMainJson.chapter[chapterId] = resolvedChapterJson
                resolvedChapterJson.quest = {}
                resolvedChapterJson.name = Utils.resolveTextJson(chapterJson.name)
                resolvedChapterJson.description = Utils.resolveTextJson(chapterJson.description)
                resolvedChapterJson.icon = Utils.deepCopy(Utils.resolveRefs(chapterJson.icon, refsArray))
                if (!Utils.isObject(resolvedChapterJson.icon)) resolvedChapterJson.icon = {}
                resolvedChapterJson.background = Utils.deepCopy(chapterJson.background)
                if (Array.isArray(resolvedChapterJson.background) && typeof resolvedChapterJson.background[0] === 'string') {
                    resolvedChapterJson.background[0] = Utils.resolveBitmap(resolvedChapterJson.background[0], bitmapNameObject)
                    if (typeof resolvedChapterJson.background[1] !== 'number') resolvedChapterJson.background[1] = null
                } else resolvedChapterJson.background = Utils.deepCopy(background)

                if (Array.isArray(chapterJson.quest)) {
                    const graph = {
                        x: new Graph(),
                        y: new Graph(),
                        size: new Graph()
                    }
                    chapterJson.quest.forEach(function (questJson) {
                        if (typeof questJson.id !== 'string') return
                        if (questJson.type === 'custom') {
                            if (!Utils.isObject(questJson.elem)) return
                            resolvedChapterJson.quest[questJson.id] = Utils.deepCopy(questJson)
                            return
                        }
                        if (questJson.type === 'quest') {
                            refsArray.push(questJson.ref)
                            const questId = questJson.id
                            /** @type { CQTypes.ResolvedQuestJson } */
                            const resolvedQuestJson = {}
                            resolvedChapterJson.quest[questId] = resolvedQuestJson
                            resolvedQuestJson.type = 'quest'
                            resolvedQuestJson.pos = Utils.deepCopy(questJson.pos)
                            resolvedQuestJson.size = Utils.deepCopy(questJson.size)
                            if (!Array.isArray(resolvedQuestJson.pos)) resolvedQuestJson.pos = [0, 0]
                            if (!isValidXYSize(resolvedQuestJson.pos[0])) resolvedQuestJson.pos[0] = 0
                            if (!isValidXYSize(resolvedQuestJson.pos[1])) resolvedQuestJson.pos[1] = 0
                            if (!isValidXYSize(resolvedQuestJson.size)) resolvedQuestJson.size = 50
                            if (typeof resolvedQuestJson.pos[0] === 'number') graph.x.setValue(questId, resolvedQuestJson.pos[0])
                            else graph.x.addEdge(resolvedQuestJson.pos[0][0], questId, resolvedQuestJson.pos[0][1])
                            if (typeof resolvedQuestJson.pos[1] === 'number') graph.y.setValue(questId, resolvedQuestJson.pos[1])
                            else graph.y.addEdge(resolvedQuestJson.pos[1][0], questId, resolvedQuestJson.pos[1][1])
                            if (typeof resolvedQuestJson.size === 'number') graph.size.setValue(questId, resolvedQuestJson.size)
                            else graph.size.addEdge(resolvedQuestJson.size[0], questId, resolvedQuestJson.size[1])

                            resolvedQuestJson.icon = Utils.deepCopy(Utils.resolveRefs(questJson.icon, refsArray))
                            if (!Utils.isObject(resolvedQuestJson.icon)) resolvedQuestJson.icon = {}
                            else if (!Array.isArray(resolvedQuestJson.icon)) {
                                resolvedQuestJson.icon = [
                                    Utils.deepCopy(resolvedQuestJson.icon),
                                    Utils.deepCopy(resolvedQuestJson.icon),
                                    Utils.deepCopy(resolvedQuestJson.icon)
                                ]
                            } else {
                                if (!Utils.isObject(resolvedQuestJson.icon[0])) resolvedQuestJson.icon[0] = {}
                                if (!Utils.isObject(resolvedQuestJson.icon[1])) resolvedQuestJson.icon[1] = {}
                                if (!Utils.isObject(resolvedQuestJson.icon[2])) resolvedQuestJson.icon[2] = {}
                            }
                            resolvedQuestJson.parent = []
                            let parentArray = Utils.deepCopy(questJson.parent)
                            if (!Array.isArray(parentArray)) parentArray = []
                            parentArray.forEach(function (pathParent) {
                                if (typeof pathParent === 'string') pathParent = [null, null, pathParent]
                                if (!Array.isArray(pathParent)) return
                                if (typeof pathParent[0] !== 'string') pathParent[0] = sourceId
                                if (typeof pathParent[1] !== 'string') pathParent[1] = chapterId
                                if (typeof pathParent[2] !== 'string') return
                                if (typeof pathParent[3] !== 'number') pathParent[3] = null
                                resolvedQuestJson.parent.push(pathParent)
                                if (!Utils.isObject(childObject[pathParent[0]])) childObject[pathParent[0]] = {}
                                const mainChildObject = childObject[pathParent[0]]
                                if (!Utils.isObject(mainChildObject[pathParent[1]])) mainChildObject[pathParent[1]] = {}
                                const chapterChildObject = mainChildObject[pathParent[1]]
                                if (!Array.isArray(chapterChildObject[pathParent[2]])) chapterChildObject[pathParent[2]] = []
                                chapterChildObject[pathParent[2]].push([sourceId, chapterId, questId])
                            })
                            resolvedQuestJson.child = []
                            resolvedQuestJson.hidden = Boolean(questJson.hidden)
                            resolvedQuestJson.inner = {
                                input: [],
                                output: [],
                                name: '',
                                text: '',
                                repeat: false
                            }
                            if (questJson.inner) {
                                resolvedQuestJson.inner.name = Utils.resolveTextJson(questJson.inner.name)
                                resolvedQuestJson.inner.text = Utils.resolveTextJson(questJson.inner.text)
                                resolvedQuestJson.inner.repeat = Boolean(questJson.inner.repeat)
                                if (Array.isArray(questJson.inner.input)) questJson.inner.input.forEach(function (inputJson, index) {
                                    const resolvedInputJson = resolveInputJson(
                                        Utils.deepCopy(Utils.resolveRefs(inputJson, refsArray)),
                                        Utils.deepCopy(refsArray),
                                        bitmapNameObject
                                    )
                                    if (Utils.isObject(resolvedInputJson)) {
                                        resolvedQuestJson.inner.input[index] = resolvedInputJson
                                    } else {
                                        resolvedQuestJson.inner.input[index] = null
                                    }
                                })
                                if (Array.isArray(questJson.inner.output)) questJson.inner.output.forEach(function (outputJson, index) {
                                    const resolvedOutputJson = resolveOutputJson(
                                        Utils.deepCopy(Utils.resolveRefs(outputJson, refsArray)),
                                        Utils.deepCopy(refsArray),
                                        bitmapNameObject
                                    )
                                    if (Utils.isObject(resolvedOutputJson)) {
                                        resolvedQuestJson.inner.output[index] = resolvedOutputJson
                                    } else {
                                        resolvedQuestJson.inner.output[index] = null
                                    }
                                })
                            }
                            refsArray.pop()
                            return
                        }
                    })
                    graph.x.bfs(function (nodeValue, edgeDis) { return nodeValue + edgeDis })
                    graph.y.bfs(function (nodeValue, edgeDis) { return nodeValue + edgeDis })
                    graph.size.bfs(function (nodeValue, edgeDis) { return nodeValue * edgeDis })
                    for (let questId in resolvedChapterJson.quest) {
                        const resolvedQuestJson = resolvedChapterJson.quest[questId]
                        if (resolvedQuestJson.type !== 'quest') continue
                        resolvedQuestJson.pos[0] = graph.x.getValue(questId) || 0
                        resolvedQuestJson.pos[1] = graph.y.getValue(questId) || 0
                        resolvedQuestJson.size = graph.size.getValue(questId) || 0
                    }
                }

                refsArray.pop()
            })

            refsArray.pop()
            return {
                json: resolvedMainJson,
                config: mainJson.config,
                bitmaps: mainJson.bitmaps,
                childObject: childObject
            }
        }

        /** @type { System['resolveJson'] } */
        const resolveJson = function (json) {
            /** @type { CQTypes.AllResolvedMainJson } */
            const resolvedJson = {}
            const config = {}
            /** @type { ChildObject } */
            const childObject = {}
            let bitmaps = []
            for (let sourceId in json) {
                if (!Utils.isObject(json[sourceId])) continue
                const obj = resolveMainJson(json[sourceId], sourceId)
                if (!Utils.isObject(obj)) continue
                resolvedJson[sourceId] = obj.json
                if (Utils.isObject(obj.config)) {
                    config[sourceId] = Utils.deepCopy(obj.config)
                }
                if (Array.isArray(obj.bitmaps)) {
                    bitmaps = bitmaps.concat(obj.bitmaps)
                }
                for (let sourceId2 in obj.childObject) {
                    if (!Utils.isObject(childObject[sourceId2])) {
                        childObject[sourceId2] = obj.childObject[sourceId2]
                        continue
                    }
                    let mainChildObject = obj.childObject[sourceId2]
                    for (let chapterId in mainChildObject) {
                        if (!Utils.isObject(childObject[sourceId2][chapterId])) {
                            childObject[sourceId2][chapterId] = mainChildObject[chapterId]
                            continue
                        }
                        let chapterChildObject = mainChildObject[chapterId]
                        for (let questId in chapterChildObject) {
                            if (!Array.isArray(childObject[sourceId2][chapterId][questId])) {
                                childObject[sourceId2][chapterId][questId] = chapterChildObject[questId]
                                continue
                            }
                            childObject[sourceId2][chapterId][questId] = childObject[sourceId2][chapterId][questId].concat(chapterChildObject[questId])
                        }
                    }
                }
            }
            for (let sourceId in childObject) {
                if (!Utils.isObject(resolvedJson[sourceId])) continue
                let mainChildObject = childObject[sourceId]
                for (let chapterId in mainChildObject) {
                    if (!Utils.isObject(resolvedJson[sourceId].chapter[chapterId])) continue
                    let chapterChildObject = mainChildObject[chapterId]
                    for (let questId in chapterChildObject) {
                        if (!Utils.isObject(resolvedJson[sourceId].chapter[chapterId].quest[questId])) continue
                        const resolvedQuestJson = resolvedJson[sourceId].chapter[chapterId].quest[questId]
                        if (resolvedQuestJson.type !== 'quest') continue
                        resolvedQuestJson.child = chapterChildObject[questId]
                    }
                }
            }
            return {
                json: resolvedJson,
                config: config,
                bitmaps: Utils.deepCopy(bitmaps)
            }
        }
        return resolveJson
    })(),
    isExist (json, sourceId, chapterId, questId) {
        const questJson = this.getQuestJson(json, sourceId, chapterId, questId)
        return Utils.isObject(questJson)
    },
    getQuestJson (json, sourceId, chapterId, questId) {
        if (!Utils.isObject(json)) return null
        if (!Utils.isObject(json[sourceId])) return null
        const mainJson = json[sourceId]
        if (!Utils.isObject(mainJson.chapter[chapterId])) return null
        const chapterJson = mainJson.chapter[chapterId]
        if (!Utils.isObject(chapterJson.quest[questId])) return null
        return chapterJson.quest[questId]
    },
    getParent (json, sourceId, chapterId, questId) {
        const questJson = this.getQuestJson(json, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return []
        if (questJson.type !== 'quest') return []
        return questJson.parent
    },
    getChild (json, sourceId, chapterId, questId) {
        const questJson = this.getQuestJson(json, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return []
        if (questJson.type !== 'quest') return []
        return questJson.child
    },
    getInputState (data, sourceId, chapterId, questId, index) {
        const DEFAULT = { state: EnumObject.inputState.unfinished }
        if (!Utils.isObject(data)) return DEFAULT
        if (!Utils.isObject(data[sourceId])) return DEFAULT
        const mainData = data[sourceId]
        if (!Utils.isObject(mainData[chapterId])) return DEFAULT
        const chapterData = mainData[chapterId]
        if (!Utils.isObject(chapterData[questId])) return DEFAULT
        const questData = chapterData[questId]
        return Utils.deepCopy(questData.input[index]) || DEFAULT
    },
    getOutputState (data, sourceId, chapterId, questId, index) {
        const DEFAULT = { state: EnumObject.outputState.unreceived }
        if (!Utils.isObject(data)) return DEFAULT
        if (!Utils.isObject(data[sourceId])) return DEFAULT
        const mainData = data[sourceId]
        if (!Utils.isObject(mainData[chapterId])) return DEFAULT
        const chapterData = mainData[chapterId]
        if (!Utils.isObject(chapterData[questId])) return DEFAULT
        const questData = chapterData[questId]
        return Utils.deepCopy(questData.output[index]) || DEFAULT
    },
    getQuestInputState (json, data, sourceId, chapterId, questId) {
        let DEFAULT = EnumObject.questInputState.locked
        if (!this.isExist(json, sourceId, chapterId, questId)) return DEFAULT
        const parent = this.getParent(json, sourceId, chapterId, questId)
        if (parent.length === 0) {
            DEFAULT = EnumObject.questInputState.unfinished
        }
        if (!Utils.isObject(data)) return DEFAULT
        if (!Utils.isObject(data[sourceId])) return DEFAULT
        const mainData = data[sourceId]
        if (!Utils.isObject(mainData[chapterId])) return DEFAULT
        const chapterData = mainData[chapterId]
        if (!Utils.isObject(chapterData[questId])) return DEFAULT
        const state = chapterData[questId].inputState
        if (parent.length === 0 && state <= EnumObject.questInputState.locked) return DEFAULT
        return state
    },
    getQuestOutputState (json, data, sourceId, chapterId, questId) {
        let DEFAULT = EnumObject.questOutputState.locked
        const inputState = this.getQuestInputState(json, data, sourceId, chapterId, questId)
        if (inputState >= EnumObject.questInputState.finished) {
            DEFAULT = EnumObject.questOutputState.unreceived
        }
        if (!Utils.isObject(data)) return DEFAULT
        if (!Utils.isObject(data[sourceId])) return DEFAULT
        const mainData = data[sourceId]
        if (!Utils.isObject(mainData[chapterId])) return DEFAULT
        const chapterData = mainData[chapterId]
        if (!Utils.isObject(chapterData[questId])) return DEFAULT
        const state = chapterData[questId].outputState
        if (inputState >= 0 && state <= EnumObject.questOutputState.locked) return DEFAULT
        return state
    },
    setInputState (json, data, sourceId, chapterId, questId, index, inputStateObject, cb) {
        if (!Utils.isObject(inputStateObject)) return
        if (typeof inputStateObject.state !== 'number') return
        if (!Utils.isObject(cb)) cb = {}
        const oldQuestInputState = this.getQuestInputState(json, data, sourceId, chapterId, questId)
        if (oldQuestInputState <= EnumObject.questInputState.locked) return
        const questJson = System.getQuestJson(json, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        if (index >= questJson.inner.input.length) return
        const oldInputStateObject = this.getInputState(data, sourceId, chapterId, questId, index)
        if (!Utils.isObject(data[sourceId])) data[sourceId] = {}
        const mainData = data[sourceId]
        if (!Utils.isObject(mainData[chapterId])) mainData[chapterId] = {}
        const chapterData = mainData[chapterId]
        if (!Utils.isObject(chapterData[questId])) {
            chapterData[questId] = {
                inputState: EnumObject.questInputState.unfinished,
                input: [],
                outputState: EnumObject.questOutputState.locked,
                output: []
            }
        }
        const questData = chapterData[questId]
        questData.input[index] = Utils.deepCopy(inputStateObject)
        if (typeof cb.onInputStateChanged === 'function') {
            cb.onInputStateChanged(questData.input[index], oldInputStateObject)
        }
        let questInputState = questData.input[index].state
        for (let i = 0; i < questJson.inner.input.length; i++) {
            const tempState = (questData.input[i] || {state: EnumObject.inputState.unfinished}).state
            if (tempState <= EnumObject.inputState.unfinished) {
                questInputState = EnumObject.questInputState.unfinished
                break
            } else if (tempState >= EnumObject.inputState.repeat_unfinished) {
                questInputState = EnumObject.questInputState.repeat_unfinished
            }
        }
        const that = this
        if (oldQuestInputState !== questInputState) {
            questData.inputState = questInputState
            if (typeof cb.onQuestInputStateChanged === 'function') {
                cb.onQuestInputStateChanged(questData.inputState, oldQuestInputState)
            }
            if (oldQuestInputState <= EnumObject.questInputState.unfinished && questInputState >= EnumObject.questInputState.finished) {
                questData.outputState = EnumObject.questOutputState.unreceived
                if (typeof cb.onQuestOutputStateChanged === 'function') {
                    cb.onQuestOutputStateChanged(questData.outputState, EnumObject.questOutputState.locked)
                }
                questJson.child.forEach(function (pathArray) {
                    const childQuestJson = that.getQuestJson(json, pathArray[0], pathArray[1], pathArray[2])
                    if (!Utils.isObject(childQuestJson)) return
                    if (childQuestJson.type !== 'quest') return
                    const unlocked = childQuestJson.parent.every(function (parentPathArray) {
                        const state = that.getQuestInputState(json, data, parentPathArray[0], parentPathArray[1], parentPathArray[2])
                        return state >= EnumObject.questInputState.finished
                    })
                    if (unlocked) {
                        if (!Utils.isObject(data[pathArray[0]])) data[pathArray[0]] = {}
                        const mainData = data[pathArray[0]]
                        if (!Utils.isObject(mainData[pathArray[1]])) mainData[pathArray[1]] = {}
                        const chapterData = mainData[pathArray[1]]
                        if (!Utils.isObject(chapterData[pathArray[2]])) {
                            chapterData[pathArray[2]] = {
                                inputState: EnumObject.questInputState.unfinished,
                                input: [],
                                outputState: EnumObject.questOutputState.locked,
                                output: []
                            }
                        }
                        const questData = chapterData[pathArray[2]]
                        questData.inputState = EnumObject.questInputState.unfinished
                        if (typeof cb.onChildQuestInputStateChanged === 'function') {
                            cb.onChildQuestInputStateChanged(Utils.deepCopy(pathArray), questData.inputState, EnumObject.questInputState.locked)
                        }
                    }
                })
            } else if (oldQuestInputState >= EnumObject.questInputState.repeat_unfinished && questInputState === EnumObject.questInputState.finished) {
                let repeat = false
                for (let i = 0; i < questJson.inner.output.length; i++) {
                    const config = IOTypeTools.getOutputTypeConfig(questJson.inner.output[i].type)
                    if (!Utils.isObject(config)) continue
                    if (!config.allowRepeat) continue
                    if (!Utils.isObject(questData.output[i])) {
                        questData.output[i] = {
                            state: EnumObject.outputState.repeat_unreceived
                        }
                    }
                    if (questData.outputState[i] !== EnumObject.outputState.received) continue
                    questData.output[i].state = EnumObject.outputState.repeat_unreceived
                    repeat = true
                }
                if (repeat) {
                    questData.outputState = EnumObject.questOutputState.repeat_unreceived
                    if (typeof cb.onQuestOutputStateChanged === 'function') {
                        cb.onQuestOutputStateChanged(questData.outputState, EnumObject.questOutputState.locked)
                    }
                }
            }
        }
    },
    setOutputState (json, data, sourceId, chapterId, questId, index, outputStateObject, cb) {
        if (!Utils.isObject(outputStateObject)) return
        if (typeof outputStateObject.state !== 'number') return
        if (!Utils.isObject(cb)) cb = {}
        const oldQuestOutputState = this.getQuestOutputState(json, data, sourceId, chapterId, questId)
        if (oldQuestOutputState <= EnumObject.questOutputState.locked) return
        const questJson = this.getQuestJson(json, sourceId, chapterId, questId)
        if (!Utils.isObject(questJson)) return
        if (questJson.type !== 'quest') return
        if (index > questJson.inner.output.length) return
        const oldOutputStateObject = this.getOutputState(data, sourceId, chapterId, questId, index)
        if (!Utils.isObject(data[sourceId])) data[sourceId] = {}
        const mainData = data[sourceId]
        if (!Utils.isObject(mainData[chapterId])) mainData[chapterId] = {}
        const chapterData = mainData[chapterId]
        if (!Utils.isObject(chapterData[questId])) {
            chapterData[questId] = {
                inputState: EnumObject.questInputState.finished,
                input: [],
                outputState: EnumObject.questOutputState.unreceived,
                output: []
            }
        }
        const questData = chapterData[questId]
        questData.output[index] = Utils.deepCopy(outputStateObject)
        if (typeof cb.onOutputStateChanged === 'function') {
            cb.onOutputStateChanged(questData.output[index], oldOutputStateObject)
        }
        let questOutputState = questData.output[index].state
        for (let i = 0; i < questJson.inner.output.length; i++) {
            const tempState = (questData.output[i] || {state: EnumObject.outputState.unreceived}).state
            if (tempState <= EnumObject.outputState.unreceived) {
                questOutputState = EnumObject.questOutputState.unreceived
                break
            } else if (tempState >= EnumObject.outputState.repeat_unreceived) {
                questOutputState = EnumObject.questOutputState.repeat_unreceived
            }
        }
        if (oldQuestOutputState !== questOutputState) {
            questData.outputState = questOutputState
            if (typeof cb.onQuestOutputStateChanged === 'function') {
                cb.onQuestOutputStateChanged(questData.outputState, oldQuestOutputState)
            }
        }
    }
}
