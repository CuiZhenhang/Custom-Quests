/// <reference path='./IOTypeTools.js'/>

/** @type { System } */
const System = {
    resolveJson: (function () {
        /**
         * @param { CQTypes.IOTypes.IOJsonBase } inputJson 
         * @param { Array<{[refId: CQTypes.refId]: unknown}> } refsArray 
         * @returns { CQTypes.IOTypes.InputJson } 
         */
        const resolveInputJson = function (inputJson, refsArray) {
            if (!Utils.isObject(inputJson)) return null
            if (typeof inputJson.type !== 'string') return null
            const inputTypeCb = IOTypeTools.getInputTypeCb(inputJson.type)
            if (typeof inputTypeCb.resolveJson !== 'function') return inputJson
            const resolvedJson = inputTypeCb.resolveJson(Utils.deepCopy(inputJson), Utils.deepCopy(refsArray))
            if (!Utils.isObject(resolvedJson)) return null
            if (typeof resolvedJson.type !== 'string') return null
            return resolvedJson
        }

        /**
         * @param { CQTypes.IOTypes.IOJsonBase } outputJson 
         * @param { Array<{[refId: CQTypes.refId]: unknown}> } refsArray 
         * @returns { CQTypes.IOTypes.OutputJson } 
         */
        const resolveOutputJson = function (outputJson, refsArray) {
            if (!Utils.isObject(outputJson)) return null
            if (typeof outputJson.type !== 'string') return null
            const outputTypeCb = IOTypeTools.getOutputTypeCb(outputJson.type)
            if (typeof outputTypeCb.resolveJson !== 'function') return outputJson
            const resolvedJson = outputTypeCb.resolveJson(Utils.deepCopy(outputJson), Utils.deepCopy(refsArray))
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
                queue.push(node)
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
            const refsArray = []
            refsArray.push(mainJson.ref)
            /** @type { CQTypes.ResolvedMainJson } */
            const resolvedMainJson = {}
            resolvedMainJson.chapter = {}
            resolvedMainJson.name = Utils.copyTextJson(mainJson.name)
            resolvedMainJson.menu = Utils.deepCopy(mainJson.menu)
            if (!Array.isArray(resolvedMainJson.menu)) resolvedMainJson.menu = null
            let background = Utils.deepCopy(mainJson.background)
            if (!Array.isArray(background) || typeof background[0] !== 'string') background = null

            if (Array.isArray(mainJson.main)) mainJson.main.forEach(function (chapterJson) {
                if (typeof chapterJson.id !== 'string') return
                refsArray.push(chapterJson.ref)
                const chapterId = chapterJson.id
                /** @type { CQTypes.ResolvedChapterJson } */
                const resolvedChapterJson = {}
                resolvedMainJson.chapter[chapterId] = resolvedChapterJson
                resolvedChapterJson.quest = {}
                resolvedChapterJson.name = Utils.copyTextJson(chapterJson.name)
                resolvedChapterJson.icon = Utils.deepCopy(Utils.resolveRefs(chapterJson.icon, refsArray))
                if (!Utils.isObject(resolvedChapterJson.icon)) resolvedChapterJson.icon = {}
                resolvedChapterJson.background = Utils.deepCopy(chapterJson.background)
                if (!Array.isArray(resolvedChapterJson.background) || typeof resolvedChapterJson.background[0] !== 'string') {
                    resolvedChapterJson.background = background
                }

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
                            resolvedQuestJson.hidden = Boolean(questJson.hidden)
                            resolvedQuestJson.inner = {
                                input: [],
                                output: [],
                                name: '',
                                text: ''
                            }
                            if (questJson.inner) {
                                resolvedQuestJson.inner.name = Utils.copyTextJson(questJson.inner.name)
                                resolvedQuestJson.inner.text = Utils.copyTextJson(questJson.inner.text)
                                if (Array.isArray(questJson.inner.input)) questJson.inner.input.forEach(function (inputJson, index) {
                                    const resolvedInputJson = resolveInputJson(Utils.resolveRefs(inputJson, refsArray), refsArray)
                                    if (Utils.isObject(resolvedInputJson)) {
                                        resolvedQuestJson.inner.input[index] = resolvedInputJson
                                    } else {
                                        resolvedQuestJson.inner.input[index] = null
                                    }
                                })
                                if (Array.isArray(questJson.inner.output)) questJson.inner.output.forEach(function (outputJson, index) {
                                    const resolvedOutputJson = resolveOutputJson(Utils.resolveRefs(outputJson, refsArray), refsArray)
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
                    for (const questId in resolvedChapterJson.quest) {
                        const resolvedQuestJson = resolvedChapterJson.quest[questId]
                        if (resolvedQuestJson.type !== 'quest') continue
                        resolvedQuestJson.pos[0] = graph.x.getValue(questId)
                        resolvedQuestJson.pos[1] = graph.y.getValue(questId)
                        resolvedQuestJson.size = graph.size.getValue(questId)
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
            for (const sourceId in json) {
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
                for (const sourceId2 in obj.childObject) {
                    if (!Utils.isObject(childObject[sourceId2])) {
                        childObject[sourceId2] = obj.childObject[sourceId2]
                        continue
                    }
                    const mainChildObject = obj.childObject[sourceId2]
                    for (const chapterId in mainChildObject) {
                        if (!Utils.isObject(childObject[sourceId2][chapterId])) {
                            childObject[sourceId2][chapterId] = mainChildObject[chapterId]
                            continue
                        }
                        const chapterChildObject = mainChildObject[chapterId]
                        for (const questId in chapterChildObject) {
                            if (!Array.isArray(childObject[sourceId2][chapterId][questId])) {
                                childObject[sourceId2][chapterId][questId] = chapterChildObject[questId]
                                continue
                            }
                            childObject[sourceId2][chapterId][questId] = childObject[sourceId2][chapterId][questId].concat(chapterChildObject[questId])
                        }
                    }
                }
            }
            for (const sourceId in childObject) {
                if (!Utils.isObject(resolvedJson[sourceId])) continue
                const mainChildObject = childObject[sourceId]
                for (const chapterId in mainChildObject) {
                    if (!Utils.isObject(resolvedJson[sourceId].chapter[chapterId])) continue
                    const chapterChildObject = mainChildObject[chapterId]
                    for (const questId in chapterChildObject) {
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
        if (!Utils.isObject(mainJson[chapterId])) return null
        const chapterJson = mainJson[chapterId]
        if (!Utils.isObject(chapterJson[questId])) return null
        return chapterJson[questId]
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
        const DEFAULT = { state: 0 /* unfinished */ }
        if (!Utils.isObject(data)) return DEFAULT
        if (!Utils.isObject(data[sourceId])) return DEFAULT
        const mainData = data[sourceId]
        if (!Utils.isObject(mainData[chapterId])) return DEFAULT
        const chapterData = mainData[chapterId]
        if (!Utils.isObject(chapterData[questId])) return DEFAULT
        const questData = chapterData[questId]
        return questData.input[index] || DEFAULT
    },
    getOutputState (data, sourceId, chapterId, questId, index) {
        const DEFAULT = { state: 0 /* unreceived */ }
        if (!Utils.isObject(data)) return DEFAULT
        if (!Utils.isObject(data[sourceId])) return DEFAULT
        const mainData = data[sourceId]
        if (!Utils.isObject(mainData[chapterId])) return DEFAULT
        const chapterData = mainData[chapterId]
        if (!Utils.isObject(chapterData[questId])) return DEFAULT
        const questData = chapterData[questId]
        return questData.output[index] || DEFAULT
    },
    getQuestInputState (json, data, sourceId, chapterId, questId) {
        const DEFAULT = { state: -1 /* locked */ }
        if (!this.isExist(json, sourceId, chapterId, questId)) return DEFAULT
        const parent = this.getParent(json, sourceId, chapterId, questId)
        if (parent.length === 0) DEFAULT.state = 0 /* unfinished */
        if (!Utils.isObject(data)) return DEFAULT
        if (!Utils.isObject(data[sourceId])) return DEFAULT
        const mainData = data[sourceId]
        if (!Utils.isObject(mainData[chapterId])) return DEFAULT
        const chapterData = mainData[chapterId]
        if (!Utils.isObject(chapterData[questId])) return DEFAULT
        return chapterData[questId].inputState
    },
    getQuestOutputState (json, data, sourceId, chapterId, questId) {
        const DEFAULT = { state: -1 /* locked */ }
        if (!this.isExist(json, sourceId, chapterId, questId)) return DEFAULT
        const parent = this.getParent(json, sourceId, chapterId, questId)
        if (parent.length === 0) DEFAULT.state = 0 /* unreceived */
        if (!Utils.isObject(data)) return DEFAULT
        if (!Utils.isObject(data[sourceId])) return DEFAULT
        const mainData = data[sourceId]
        if (!Utils.isObject(mainData[chapterId])) return DEFAULT
        const chapterData = mainData[chapterId]
        if (!Utils.isObject(chapterData[questId])) return DEFAULT
        return chapterData[questId].outputState
    }
}
