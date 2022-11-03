/// <reference path='./IOTypeTools.js'/>

/** @type { System } */
const System = {
    resolveInputJson (inputJson, refsArray, bitmapNameObject) {
        if (!Utils.isObject(inputJson)) return null
        if (typeof inputJson.type !== 'string') return null
        let description = Utils.resolveTextJson(inputJson.description)
        let inputTypeCb = IOTypeTools.getInputTypeCb(inputJson.type)
        if (typeof inputTypeCb.resolveJson !== 'function') {
            inputJson.description = description
            return inputJson
        }
        let resolvedJson = inputTypeCb.resolveJson.call(null, inputJson, refsArray, bitmapNameObject)
        if (!Utils.isObject(resolvedJson)) return null
        if (typeof resolvedJson.type !== 'string') return null
        resolvedJson.description = description
        return resolvedJson
    },
    resolveOutputJson (outputJson, refsArray, bitmapNameObject) {
        if (!Utils.isObject(outputJson)) return null
        if (typeof outputJson.type !== 'string') return null
        let description = Utils.resolveTextJson(outputJson.description)
        let outputTypeCb = IOTypeTools.getOutputTypeCb(outputJson.type)
        if (typeof outputTypeCb.resolveJson !== 'function') {
            outputJson.description = description
            return outputJson
        }
        let resolvedJson = outputTypeCb.resolveJson.call(null, outputJson, refsArray, bitmapNameObject)
        if (!Utils.isObject(resolvedJson)) return null
        if (typeof resolvedJson.type !== 'string') return null
        resolvedJson.description = description
        return resolvedJson
    },
    resolveJson: (function () {
        const Graph = /** @class */ function () {
            let num_node = 0, map = {}, value = [0]
            let edge = {
                num: 0,
                to: [0],
                dis: [0],
                next: [0],
                head: [0]
            }
            let queue = {
                head: 0,
                tail: 0,
                /** @type { number[] } */
                value: []
            }

            /** @type { (nodeId: string) => number } */
            let getNode = function (nodeId) {
                if (!map[nodeId]) map[nodeId] = ++num_node
                return map[nodeId]
            }
            /** @type { (fromId: string, toId: string, dis: number) => void } */
            this.addEdge = function (fromId, toId, dis) {
                let from = getNode(fromId)
                let to = getNode(toId)
                edge.num++
                edge.to[edge.num] = to
                edge.dis[edge.num] = dis
                edge.next[edge.num] = edge.head[from]
                edge.head[from] = edge.num
            }
            /** @type { (nodeId: string, dis: number) => void } */
            this.setValue = function (nodeId, dis) {
                let node = getNode(nodeId)
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
         * @returns { Nullable<{json: CQTypes.ResolvedMainJson, config: CQTypes.MainJson['config'], bitmaps: CQTypes.MainJson['bitmaps'], childObject: ChildObject}> } 
         */
        const resolveMainJson = function (mainJson, sourceId) {
            if (!Utils.isObject(mainJson)) return null
            mainJson = Utils.deepCopy(mainJson)
            /** @type { ChildObject } */
            let childObject = {}
            let bitmapNameObject = {}
            if (Array.isArray(mainJson.bitmaps)) {
                mainJson.bitmaps.forEach(function (bitmapObject) {
                    if (!Utils.isObject(bitmapObject)) return
                    if (typeof bitmapObject.name !== 'string') return
                    if (typeof bitmapObject.base64 !== 'string') return
                    bitmapNameObject[bitmapObject.name] = true
                })
            }
            let refsArray = []
            refsArray.push(mainJson.ref)
            /** @type { CQTypes.ResolvedMainJson } */
            let resolvedMainJson = {}
            resolvedMainJson.chapter = {}
            resolvedMainJson.name = Utils.resolveTextJson(mainJson.name)
            if (Array.isArray(mainJson.group)) {
                resolvedMainJson.group = []
                mainJson.group.forEach(function (obj) {
                    if (!Utils.isObject(obj)) return
                    if (!Array.isArray(obj.list)) return
                    resolvedMainJson.group.push({
                        name: Utils.resolveTextJson(obj.name),
                        icon: Utils.resolveIconJson(obj.icon, refsArray, bitmapNameObject),
                        list: obj.list
                    })
                })
            }
            let background = mainJson.background
            if (Array.isArray(background)) {
                if (typeof background[0] === 'string') {
                    background[0] = Utils.resolveBitmap(background[0], bitmapNameObject)
                }
                if (typeof background[1] !== 'number') background[1] = null
            } else background = null

            if (Array.isArray(mainJson.main)) mainJson.main.forEach(function (chapterJson) {
                if (typeof chapterJson.id !== 'string') return
                refsArray.push(chapterJson.ref)
                let chapterId = chapterJson.id
                /** @type { CQTypes.ResolvedChapterJson } */
                let resolvedChapterJson = {}
                resolvedMainJson.chapter[chapterId] = resolvedChapterJson
                resolvedChapterJson.quest = {}
                resolvedChapterJson.name = Utils.resolveTextJson(chapterJson.name)
                resolvedChapterJson.icon = Utils.resolveIconJson(chapterJson.icon, refsArray, bitmapNameObject)
                resolvedChapterJson.background = chapterJson.background
                if (Array.isArray(resolvedChapterJson.background)) {
                    if (typeof resolvedChapterJson.background[0] === 'string') {
                        resolvedChapterJson.background[0] = Utils.resolveBitmap(resolvedChapterJson.background[0], bitmapNameObject)
                    }
                    if (typeof resolvedChapterJson.background[1] !== 'number') resolvedChapterJson.background[1] = null
                } else resolvedChapterJson.background = background

                if (Array.isArray(chapterJson.quest)) {
                    let graph = {
                        x: new Graph(),
                        y: new Graph(),
                        size: new Graph()
                    }
                    chapterJson.quest.forEach(function (questJson) {
                        if (typeof questJson.id !== 'string') return
                        if (questJson.type === 'custom') {
                            if (!Utils.isObject(questJson.elem)) return
                            let resolvedQuestJson = questJson
                            resolvedChapterJson.quest[questJson.id] = resolvedQuestJson
                            if (!Array.isArray(resolvedQuestJson.elem)) resolvedQuestJson.elem = [resolvedQuestJson.elem]
                            resolvedQuestJson.elem.forEach(function (elements) {
                                if (elements.type === 'image') {
                                    if (typeof elements.bitmap === 'string') {
                                        elements.bitmap = Utils.resolveBitmap(elements.bitmap, bitmapNameObject)
                                    }
                                    if (typeof elements.overlay === 'string') {
                                        elements.overlay = Utils.resolveBitmap(elements.overlay, bitmapNameObject)
                                    }
                                }
                            })
                            return
                        }
                        if (questJson.type === 'quest') {
                            refsArray.push(questJson.ref)
                            let questId = questJson.id
                            /** @type { CQTypes.ResolvedQuestJson } */
                            let resolvedQuestJson = {}
                            resolvedChapterJson.quest[questId] = resolvedQuestJson
                            resolvedQuestJson.type = 'quest'
                            resolvedQuestJson.pos = questJson.pos
                            resolvedQuestJson.size = questJson.size
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

                            let icon = questJson.icon
                            if (Array.isArray(icon)) {
                                resolvedQuestJson.icon = []
                                for (let i = 0; i < 3; i++) {
                                    let tmpIcon = Utils.resolveIconJson(icon[i], refsArray, bitmapNameObject)
                                    resolvedQuestJson.icon[i] = tmpIcon
                                }
                            } else {
                                icon = Utils.resolveIconJson(icon, refsArray, bitmapNameObject)
                                resolvedQuestJson.icon = [icon, icon, icon]
                            }
                            resolvedQuestJson.parent = []
                            let parentArray = questJson.parent
                            if (!Array.isArray(parentArray)) parentArray = []
                            parentArray.forEach(function (pathParent) {
                                if (typeof pathParent === 'string') pathParent = [null, null, pathParent]
                                if (!Array.isArray(pathParent)) return
                                if (typeof pathParent[0] !== 'string') pathParent[0] = sourceId
                                if (typeof pathParent[1] !== 'string') pathParent[1] = chapterId
                                if (typeof pathParent[2] !== 'string') return
                                if (typeof pathParent[3] !== 'number') pathParent[3] = null
                                resolvedQuestJson.parent.push(pathParent)
                                if (!childObject[pathParent[0]]) childObject[pathParent[0]] = {}
                                let mainChildObject = childObject[pathParent[0]]
                                if (!mainChildObject[pathParent[1]]) mainChildObject[pathParent[1]] = {}
                                let chapterChildObject = mainChildObject[pathParent[1]]
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
                                if (resolvedQuestJson.inner.repeat) resolvedQuestJson.inner.repeat_time = Number(questJson.inner.repeat_time)
                                if (Array.isArray(questJson.inner.input)) questJson.inner.input.forEach(function (inputJson, index) {
                                    let resolvedInputJson = System.resolveInputJson(Utils.resolveRefs(inputJson, refsArray), refsArray, bitmapNameObject)
                                    if (Utils.isObject(resolvedInputJson)) {
                                        resolvedQuestJson.inner.input[index] = resolvedInputJson
                                    } else {
                                        resolvedQuestJson.inner.input[index] = null
                                    }
                                })
                                if (Array.isArray(questJson.inner.output)) questJson.inner.output.forEach(function (outputJson, index) {
                                    let resolvedOutputJson = System.resolveOutputJson(Utils.resolveRefs(outputJson, refsArray), refsArray, bitmapNameObject)
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
                        let resolvedQuestJson = resolvedChapterJson.quest[questId]
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
            let resolvedJson = {}
            /** @type { ReturnType<System['resolveJson']>['config'] } */
            let config = {}
            /** @type { ChildObject } */
            let childObject = {}
            let bitmaps = []
            for (let sourceId in json) {
                if (!Utils.isObject(json[sourceId])) continue
                let obj = resolveMainJson(json[sourceId], sourceId)
                if (!Utils.isObject(obj)) continue
                resolvedJson[sourceId] = obj.json
                if (Utils.isObject(obj.config)) config[sourceId] = obj.config
                if (Array.isArray(obj.bitmaps)) bitmaps = bitmaps.concat(obj.bitmaps)
                for (let sourceId2 in obj.childObject) {
                    if (!childObject[sourceId2]) {
                        childObject[sourceId2] = obj.childObject[sourceId2]
                        continue
                    }
                    let mainChildObject = obj.childObject[sourceId2]
                    for (let chapterId in mainChildObject) {
                        if (!childObject[sourceId2][chapterId]) {
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
                if (!resolvedJson[sourceId]) continue
                let mainChildObject = childObject[sourceId]
                for (let chapterId in mainChildObject) {
                    if (!resolvedJson[sourceId].chapter[chapterId]) continue
                    let chapterChildObject = mainChildObject[chapterId]
                    for (let questId in chapterChildObject) {
                        if (!resolvedJson[sourceId].chapter[chapterId].quest[questId]) continue
                        let resolvedQuestJson = resolvedJson[sourceId].chapter[chapterId].quest[questId]
                        if (resolvedQuestJson.type !== 'quest') continue
                        resolvedQuestJson.child = chapterChildObject[questId]
                    }
                }
            }
            return {
                json: resolvedJson,
                config: Utils.deepCopy(config),
                bitmaps: Utils.deepCopy(bitmaps)
            }
        }
        return resolveJson
    })(),
    isQuestExist (json, sourceId, chapterId, questId) {
        let questJson = this.getQuestJson(json, sourceId, chapterId, questId)
        return Boolean(questJson)
    },
    getQuestJson (json, sourceId, chapterId, questId) {
        if (!Utils.isObject(json)) return null
        if (!json[sourceId]) return null
        let mainJson = json[sourceId]
        if (!mainJson.chapter[chapterId]) return null
        let chapterJson = mainJson.chapter[chapterId]
        if (!chapterJson.quest[questId]) return null
        return chapterJson.quest[questId] || null
    },
    getParent (json, sourceId, chapterId, questId) {
        let questJson = this.getQuestJson(json, sourceId, chapterId, questId)
        if (!questJson || questJson.type !== 'quest') return []
        return questJson.parent
    },
    getChild (json, sourceId, chapterId, questId) {
        let questJson = this.getQuestJson(json, sourceId, chapterId, questId)
        if (!questJson || questJson.type !== 'quest') return []
        return questJson.child
    },
    getInputState (data, sourceId, chapterId, questId, index) {
        let DEFAULT = { state: EnumObject.inputState.unfinished }
        if (!Utils.isObject(data)) return DEFAULT
        if (!data[sourceId]) return DEFAULT
        let mainData = data[sourceId]
        if (!mainData[chapterId]) return DEFAULT
        let chapterData = mainData[chapterId]
        if (!chapterData[questId]) return DEFAULT
        let questData = chapterData[questId]
        return questData.input[index] || DEFAULT
    },
    getOutputState (data, sourceId, chapterId, questId, index) {
        let DEFAULT = { state: EnumObject.outputState.unreceived }
        if (!Utils.isObject(data)) return DEFAULT
        if (!data[sourceId]) return DEFAULT
        let mainData = data[sourceId]
        if (!mainData[chapterId]) return DEFAULT
        let chapterData = mainData[chapterId]
        if (!chapterData[questId]) return DEFAULT
        let questData = chapterData[questId]
        return questData.output[index] || DEFAULT
    },
    validateQuestSaveData (questJson, questData) {
        if (!questJson || questJson.type !== 'quest') return
        if (questData.inputState === EnumObject.questInputState.locked) return
        let state = EnumObject.questInputState.finished
        for (let i = 0; i < questJson.inner.input.length; i++) {
            let tempState = (questData.input[i] || {state: EnumObject.inputState.unfinished}).state
            if (tempState === EnumObject.inputState.unfinished) {
                state = EnumObject.questInputState.unfinished
                break
            } else if (tempState === EnumObject.inputState.repeat_unfinished) {
                state = EnumObject.questInputState.repeat_unfinished
            }
        }
        switch (questData.inputState) {
            case EnumObject.questInputState.finished: {
                if (state !== EnumObject.questInputState.finished) {
                    questData.inputState = state
                    questData.outputState = EnumObject.questOutputState.locked
                }
                break
            }
            case EnumObject.questInputState.unfinished:
            case EnumObject.questInputState.repeat_unfinished: {
                if (state === EnumObject.questInputState.finished) {
                    questData.inputState = EnumObject.questInputState.finished
                }
                break
            }
        }
        if (questData.inputState === EnumObject.questInputState.finished) {
            questData.outputState = EnumObject.questOutputState.received
            for (let i = 0; i < questJson.inner.output.length; i++) {
                let tempState = (questData.output[i] || {state: EnumObject.outputState.unreceived}).state
                if (tempState === EnumObject.outputState.unreceived) {
                    questData.outputState = EnumObject.questOutputState.unreceived
                    break
                } else if (tempState === EnumObject.outputState.repeat_unreceived) {
                    questData.outputState = EnumObject.questOutputState.repeat_unreceived
                }
            }
        } else {
            questData.outputState = EnumObject.questOutputState.locked
        }
    },
    validateSaveData (json, data) {
        /** @type { Array<[CQTypes.sourceId, CQTypes.chapterId, CQTypes.questId]> } */
        let stack = []
        let numberIn = {}
        for (let sourceId in json) {
            numberIn[sourceId] = {}
            let mainJson = json[sourceId]
            let mainData = data[sourceId]
            for (let chapterId in mainJson.chapter) {
                numberIn[sourceId][chapterId] = {}
                let chapterJson = mainJson.chapter[chapterId]
                let chapterData = mainData && mainData[chapterId]
                for (let questId in chapterJson.quest) {
                    let questJson = chapterJson.quest[questId]
                    if (questJson.type !== 'quest') continue
                    if (questJson.parent.length > 0) continue
                    numberIn[sourceId][chapterId][questId] = -1
                    stack.push([sourceId, chapterId, questId])
                    if (!mainData) mainData = data[sourceId] = {}
                    if (!chapterData) chapterData = mainData[chapterId] = {}
                    let questData = chapterData[questId]
                    if (!questData) {
                        questData = chapterData[questId] = {
                            inputState: EnumObject.questInputState.unfinished,
                            outputState: EnumObject.questOutputState.locked,
                            input: [],
                            output: []
                        }
                    }
                    if (questData.inputState === EnumObject.questInputState.locked) {
                        questData.inputState = EnumObject.questInputState.unfinished
                    }
                    this.validateQuestSaveData(questJson, questData)
                }
            }
        }
        let that = this
        let path = null
        while (path = stack.pop()) {
            let inputState = this.getQuestInputState(json, data, path[0], path[1], path[2])
            if (inputState === EnumObject.questInputState.finished || inputState === EnumObject.questInputState.repeat_unfinished) {
                this.getChild(json, path[0], path[1], path[2]).forEach(function (child) {
                    let sourceId = child[0], chapterId = child[1], questId = child[2]
                    if (!numberIn[sourceId]) numberIn[sourceId] = {}
                    if (!numberIn[sourceId][chapterId]) numberIn[sourceId][chapterId] = {}
                    if (numberIn[sourceId][chapterId][questId] < 0) return
                    let questJson = that.getQuestJson(json, sourceId, chapterId, questId)
                    if (!questJson || questJson.type !== 'quest') return
                    if (typeof numberIn[sourceId][chapterId][questId] !== 'number') numberIn[sourceId][chapterId][questId] = 0
                    if (++numberIn[sourceId][chapterId][questId] >= questJson.parent.length) {
                        numberIn[sourceId][chapterId][questId] = -1
                        stack.push([sourceId, chapterId, questId])
                        let mainData = data[sourceId]
                        if (!mainData) mainData = data[sourceId] = {}
                        let chapterData = mainData[chapterId]
                        if (!chapterData) chapterData = mainData[chapterId] = {}
                        let questData = chapterData[questId]
                        if (!questData) {
                            questData = chapterData[questId] = {
                                inputState: EnumObject.questInputState.unfinished,
                                outputState: EnumObject.questOutputState.locked,
                                input: [],
                                output: []
                            }
                        }
                        questData.inputState = EnumObject.questInputState.unfinished
                        that.validateQuestSaveData(questJson, questData)
                    }
                })
            }
        }
    },
    getQuestInputState (json, data, sourceId, chapterId, questId) {
        let DEFAULT = EnumObject.questInputState.locked
        if (!this.isQuestExist(json, sourceId, chapterId, questId)) return DEFAULT
        let parent = this.getParent(json, sourceId, chapterId, questId)
        if (parent.length === 0) {
            DEFAULT = EnumObject.questInputState.unfinished
        }
        if (!Utils.isObject(data)) return DEFAULT
        if (!data[sourceId]) return DEFAULT
        let mainData = data[sourceId]
        if (!mainData[chapterId]) return DEFAULT
        let chapterData = mainData[chapterId]
        if (!chapterData[questId]) return DEFAULT
        let state = chapterData[questId].inputState
        if (parent.length === 0 && state === EnumObject.questInputState.locked) return DEFAULT
        return state
    },
    getQuestOutputState (json, data, sourceId, chapterId, questId) {
        let DEFAULT = EnumObject.questOutputState.locked
        if (!this.isQuestExist(json, sourceId, chapterId, questId)) return DEFAULT
        let inputState = this.getQuestInputState(json, data, sourceId, chapterId, questId)
        if (inputState === EnumObject.questInputState.finished || inputState === EnumObject.questInputState.repeat_unfinished) {
            DEFAULT = EnumObject.questOutputState.unreceived
        }
        if (!Utils.isObject(data)) return DEFAULT
        if (!data[sourceId]) return DEFAULT
        let mainData = data[sourceId]
        if (!mainData[chapterId]) return DEFAULT
        let chapterData = mainData[chapterId]
        if (!chapterData[questId]) return DEFAULT
        let state = chapterData[questId].outputState
        if (DEFAULT === EnumObject.questOutputState.unreceived && state === EnumObject.questOutputState.locked) return DEFAULT
        return state
    },
    getQuestSaveData (json, data, sourceId, chapterId, questId) {
        /** @type { CQTypes.QuestSaveData } */
        let ret = {
            inputState: EnumObject.questInputState.locked,
            outputState: EnumObject.questOutputState.locked,
            input: [],
            output: []
        }
        if (!this.isQuestExist(json, sourceId, chapterId, questId)) return ret
        let parent = this.getParent(json, sourceId, chapterId, questId)
        if (parent.length === 0) ret.inputState = EnumObject.questInputState.unfinished
        if (!Utils.isObject(data)) return ret
        if (!data[sourceId]) return ret
        let mainData = data[sourceId]
        if (!mainData[chapterId]) return ret
        let chapterData = mainData[chapterId]
        if (!chapterData[questId]) return ret
        if (parent.length !== 0 || chapterData[questId].inputState !== EnumObject.questInputState.locked) {
            ret.inputState = chapterData[questId].inputState
        }
        if (ret.inputState <= EnumObject.questInputState.unfinished || chapterData[questId].outputState !== EnumObject.questOutputState.locked) {
            ret.outputState = chapterData[questId].outputState
        }
        ret.input = chapterData[questId].input
        ret.output = chapterData[questId].output
        return ret
    },
    setInputState (json, data, sourceId, chapterId, questId, index, inputStateObject, cb) {
        if (!Utils.isObject(json)) return
        if (!Utils.isObject(data)) return
        if (!Utils.isObject(inputStateObject)) return
        if (typeof inputStateObject.state !== 'number') return
        if (!Utils.isObject(cb)) cb = {}
        let oldQuestInputState = this.getQuestInputState(json, data, sourceId, chapterId, questId)
        if (oldQuestInputState === EnumObject.questInputState.locked) return
        let questJson = System.getQuestJson(json, sourceId, chapterId, questId)
        if (!questJson || questJson.type !== 'quest') return
        if (index >= questJson.inner.input.length) return
        let oldInputStateObject = this.getInputState(data, sourceId, chapterId, questId, index)
        if (!data[sourceId]) data[sourceId] = {}
        let mainData = data[sourceId]
        if (!mainData[chapterId]) mainData[chapterId] = {}
        let chapterData = mainData[chapterId]
        if (!chapterData[questId]) {
            chapterData[questId] = {
                inputState: EnumObject.questInputState.unfinished,
                input: [],
                outputState: EnumObject.questOutputState.locked,
                output: []
            }
        }
        let questData = chapterData[questId]
        questData.input[index] = Utils.deepCopy(inputStateObject)
        if (typeof cb.onInputStateChanged === 'function') {
            cb.onInputStateChanged(questData.input[index], oldInputStateObject)
        }
        let questInputState = EnumObject.questInputState.finished
        for (let i = 0; i < questJson.inner.input.length; i++) {
            let tempState = (questData.input[i] || {state: EnumObject.inputState.unfinished}).state
            if (tempState === EnumObject.inputState.unfinished) {
                questInputState = EnumObject.questInputState.unfinished
                break
            } else if (tempState === EnumObject.inputState.repeat_unfinished) {
                questInputState = EnumObject.questInputState.repeat_unfinished
            }
        }
        let that = this
        if (oldQuestInputState !== questInputState) {
            questData.inputState = questInputState
            if (typeof cb.onQuestInputStateChanged === 'function') {
                cb.onQuestInputStateChanged(questData.inputState, oldQuestInputState)
            }
            if (oldQuestInputState <= EnumObject.questInputState.unfinished && questInputState >= EnumObject.questInputState.finished) {
                questData.outputState = questJson.inner.output.length ? EnumObject.questOutputState.unreceived : EnumObject.questOutputState.received
                if (typeof cb.onQuestOutputStateChanged === 'function') {
                    cb.onQuestOutputStateChanged(questData.outputState, EnumObject.questOutputState.locked)
                }
                questJson.child.forEach(function (pathArray) {
                    let childQuestJson = that.getQuestJson(json, pathArray[0], pathArray[1], pathArray[2])
                    if (!childQuestJson || childQuestJson.type !== 'quest') return
                    let unlocked = childQuestJson.parent.every(function (parentPathArray) {
                        let state = that.getQuestInputState(json, data, parentPathArray[0], parentPathArray[1], parentPathArray[2])
                        return state === EnumObject.questInputState.finished || state === EnumObject.questInputState.repeat_unfinished
                    })
                    if (unlocked) {
                        if (!data[pathArray[0]]) data[pathArray[0]] = {}
                        let mainData = data[pathArray[0]]
                        if (!mainData[pathArray[1]]) mainData[pathArray[1]] = {}
                        let chapterData = mainData[pathArray[1]]
                        if (!chapterData[pathArray[2]]) {
                            chapterData[pathArray[2]] = {
                                inputState: EnumObject.questInputState.locked,
                                input: [],
                                outputState: EnumObject.questOutputState.locked,
                                output: []
                            }
                        }
                        let questData = chapterData[pathArray[2]]
                        let oldQuestInputState = questData.inputState
                        questData.inputState = EnumObject.questInputState.unfinished
                        that.validateQuestSaveData(childQuestJson, questData)
                        if (questData.inputState !== oldQuestInputState && typeof cb.onChildQuestInputStateChanged === 'function') {
                            cb.onChildQuestInputStateChanged(Utils.deepCopy(pathArray), questData.inputState, oldQuestInputState)
                        }
                    }
                })
            } else if (oldQuestInputState === EnumObject.questInputState.repeat_unfinished && questInputState === EnumObject.questInputState.finished) {
                let repeat = false
                for (let i = 0; i < questJson.inner.output.length; i++) {
                    let config = IOTypeTools.getOutputTypeConfig(questJson.inner.output[i].type)
                    if (!config || !config.allowRepeat) continue
                    if (!questData.output[i]) {
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
        if (!Utils.isObject(json)) return
        if (!Utils.isObject(data)) return
        if (!Utils.isObject(outputStateObject)) return
        if (typeof outputStateObject.state !== 'number') return
        if (!Utils.isObject(cb)) cb = {}
        let oldQuestOutputState = this.getQuestOutputState(json, data, sourceId, chapterId, questId)
        if (oldQuestOutputState === EnumObject.questOutputState.locked) return
        let questJson = this.getQuestJson(json, sourceId, chapterId, questId)
        if (!questJson || questJson.type !== 'quest') return
        if (index > questJson.inner.output.length) return
        let oldOutputStateObject = this.getOutputState(data, sourceId, chapterId, questId, index)
        if (!data[sourceId]) data[sourceId] = {}
        let mainData = data[sourceId]
        if (!mainData[chapterId]) mainData[chapterId] = {}
        let chapterData = mainData[chapterId]
        if (!chapterData[questId]) {
            chapterData[questId] = {
                inputState: EnumObject.questInputState.finished,
                input: [],
                outputState: EnumObject.questOutputState.unreceived,
                output: []
            }
        }
        let questData = chapterData[questId]
        questData.output[index] = Utils.deepCopy(outputStateObject)
        if (typeof cb.onOutputStateChanged === 'function') {
            cb.onOutputStateChanged(questData.output[index], oldOutputStateObject)
        }
        let questOutputState = EnumObject.questOutputState.received
        for (let i = 0; i < questJson.inner.output.length; i++) {
            let tempState = (questData.output[i] || {state: EnumObject.outputState.unreceived}).state
            if (tempState === EnumObject.outputState.unreceived) {
                questOutputState = EnumObject.questOutputState.unreceived
                break
            } else if (tempState === EnumObject.outputState.repeat_unreceived) {
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
