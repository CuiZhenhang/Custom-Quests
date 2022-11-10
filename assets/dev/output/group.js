/// <reference path='../IOTypeTools.js'/>

const $output_group_Tools = {
    /**
     * Weighted random selection of `numSelect` samples
     * @param { Array<{ weight: number, data: number }> } weightedArray 
     * @param { number = } numSelect 
     * @returns { Array<number> } selection data
     */
    randomSelection (weightedArray, numSelect) {
        if (!Array.isArray(weightedArray)) return []
        if (typeof numSelect !== 'number') numSelect = 1
        if (numSelect < 1) return []
        /** @type { Array<{ value: number, data: number }> } */
        let selection = []
        weightedArray.forEach(function (obj, index) {
            let value = Math.log(Math.random()) / obj.weight
            if (index < numSelect) {
                // join { obj.data, value } to selection
                selection.push({
                    value: value,
                    data: obj.data
                })
            } else {
                // let tmp = object in selection with min value // (if `numSelect` is large, `PriorityQueue` is recommended)
                let tmp = selection[0], tmpIndex = 0
                for (let i = 1; i < selection.length; ++i) {
                    if (selection[i].value < tmp.value) {
                        tmp = selection[i]
                        tmpIndex = i
                    }
                }
                // if (value > tmp.value) replace tmp to { obj.data, value }
                if (value > tmp.value) {
                    selection[tmpIndex] = {
                        value: value,
                        data: obj.data
                    }
                }
            }
        })
        // transfer selection into array
        let ret = []
        for (let i = 0; i < selection.length; ++i) {
            ret.push(selection[i].data)
        }
        return ret
    },
    /**
     * @param { CQTypes.IOTypes.OutputJson_group } outputJson 
     * @param { CQTypes.IOTypeToolsCb<CQTypes.OutputStateObject> } toolsCb 
     */
    initToLoad (outputJson, toolsCb) {
        let changed = false
        let stateObj = toolsCb.getState()
        if (!Array.isArray(stateObj.list)) {
            stateObj.list = []
            changed = true
        }
        if (!Array.isArray(stateObj.toLoad)) {
            if (outputJson.isSelect) {
                stateObj.toLoad = []
            } else {
                let weightedArray = []
                outputJson.list.forEach(function (obj, index) {
                    weightedArray.push({
                        weight: obj.weight,
                        data: index
                    })
                })
                stateObj.toLoad = this.randomSelection(weightedArray, outputJson.count)
            }
            changed = true
        }
        if (changed) toolsCb.setState({}, stateObj)
    },
    /**
     * @param { CQTypes.IOTypes.OutputJson_group } outputJson 
     * @param { CQTypes.IOTypeToolsCb<CQTypes.OutputStateObject> } toolsCb 
     * @returns { boolean } true if received
     */
    updateState (outputJson, toolsCb) {
        this.initToLoad(outputJson, toolsCb)
        let changed = false
        let stateObj = toolsCb.getState()
        if (stateObj.state === EnumObject.outputState.repeat_unreceived && stateObj.wasReceived) {
            if (outputJson.isSelect) {
                for (let index = 0; index < outputJson.list.length; ++index) {
                    stateObj.list[index] = {
                        state: EnumObject.outputState.repeat_unreceived
                    }
                    if (!IOTypeTools.getOutputTypeConfig(outputJson.list[index].output.type).allowRepeat) {
                        stateObj.list[index].state = EnumObject.outputState.received
                    }
                }
            } else {
                for (let index = 0; index < outputJson.list.length; ++index) {
                    stateObj.list[index] = {
                        state: EnumObject.outputState.received
                    }
                }
                stateObj.toLoad.forEach(function (index) {
                    if (IOTypeTools.getOutputTypeConfig(outputJson.list[index].output.type).allowRepeat) {
                        stateObj.list[index].state = EnumObject.outputState.repeat_unreceived
                    }
                })
            }
            delete stateObj.wasReceived
            stateObj.count = 0
            changed = true
        }
        let count = 0
        if (outputJson.isSelect) {
            for (let index = 0; index < outputJson.list.length; ++index) {
                if (stateObj.list[index] && stateObj.list[index].state === EnumObject.outputState.received) {
                    ++count
                }
            }
        } else {
            stateObj.toLoad.forEach(function (index) {
                if (stateObj.list[index] && stateObj.list[index].state === EnumObject.outputState.received) {
                    ++count
                }
            })
        }
        if (count >= outputJson.count) {
            stateObj.state = EnumObject.outputState.received
            delete stateObj.toLoad
            stateObj.list = []
            stateObj.wasReceived = true
            stateObj.count = 0
            changed = true
        } else if (stateObj.count !== count) {
            stateObj.count = count
            changed = true
        }
        if (changed) toolsCb.setState({}, stateObj)
        return stateObj.state === EnumObject.outputState.received
    },
    /**
     * @param { CQTypes.IOTypeToolsCb<CQTypes.OutputStateObject> | CQTypes.IOTypeToolsLocalCb<CQTypes.OutputStateObject> } toolsCb 
     * @param { number } index 
     * @returns { CQTypes.OutputStateObject } 
     */
    getStateSafe (toolsCb, index) {
        let stateObj = toolsCb.getState()
        let DEFAULT = { state: stateObj.state }
        if (!Array.isArray(stateObj.list)) return DEFAULT
        if (!stateObj.list[index]) return DEFAULT
        return Utils.deepCopy(stateObj.list[index])
    },
    /**
     * @param { CQTypes.IOTypeToolsCb<CQTypes.OutputStateObject> } toolsCb 
     * @param { { index: number, outputId: CQTypes.outputId, updateState: () => void } } params 
     * @param { object } extraInfo 
     * @param { CQTypes.OutputStateObject } outputStateObject 
     */
    setState (toolsCb, params, extraInfo, outputStateObject) {
        if (!Utils.isObject(extraInfo)) extraInfo = {}
        if (!Utils.isObject(outputStateObject)) return
        let stateObj = toolsCb.getState()
        let oldStateObj = this.getStateSafe(toolsCb, params.index)
        stateObj.list[params.index] = outputStateObject
        toolsCb.setState(extraInfo, stateObj)
        let needUnload = false
        if (outputStateObject.state === EnumObject.outputState.received) {
            if (IOTypeTools.isOutputIdLoaded(params.outputId)) {
                if (stateObj.state !== EnumObject.outputState.received) {
                    IOTypeTools.callOutputTypeCb(params.outputId, 'onReceive', extraInfo)
                }
                needUnload = true
            }
        }
        try {
            Callback.invokeCallback('CustomQuests.onOutputStateChanged',
                params.outputId,
                Utils.deepCopy(outputStateObject),
                Utils.deepCopy(oldStateObj),
                Utils.deepCopy(extraInfo)
            )
        } catch (err) {
            Utils.error('Error in Callback \'CustomQuests.onOutputStateChanged\' (output/group.js):\n', err)
        }
        if (needUnload) IOTypeTools.unloadOutput(params.outputId)
        if (outputStateObject.state !== oldStateObj.state) params.updateState()
    },
    /**
     * @param { CQTypes.IOTypeToolsLocalCb<CQTypes.OutputStateObject> } toolsCb 
     * @param { number } index 
     * @param { object } packetData 
     */
    sendPacket (toolsCb, index, packetData) {
        if (typeof toolsCb.sendPacket !== 'function') return
        toolsCb.sendPacket({
            index: index,
            data: packetData
        })
    },
    rewardUi: (function () {
        const Color = android.graphics.Color
        const ScreenHeight = UI.getScreenHeight()
        const RewardUi = {
            /** @type { Array<[string, CQTypes.IOTypes.OutputJson_group, CQTypes.IOTypeToolsLocalCb<CQTypes.OutputStateObject>]> } */
            stackOpened: [],
            /** @type { Array<{ close: Array<() => void>, reload: Array<() => void> }> } */
            stackListener: [],
            rewardUi: QuestUiTools.createUi({
                location: { x: 300, y: 50, width: 400, height: 400 },
                drawing: [
                    { type: 'background', color: Color.TRANSPARENT },
                    { type: 'frame', x: 0, y: 0, width: 1000, height: 1000, bitmap: 'classic_frame_bg_light', scale: 2 },
                    { type: 'text', text: TranAPI.translate('outputType.group'), x: 50, y: 70, font: { color: Color.BLACK, size: 40 } },
                    { type: 'text', text: '', x: 50, y: 120, font: { color: Color.GRAY, size: 40 } },
                    { type: 'line', x1: 0, y1: 150, x2: 1000, y2: 150, color: Color.BLACK, width: 5 },
                    { type: 'line', x1: 0, y1: 300, x2: 1000, y2: 300, color: Color.BLACK, width: 5 }
                ],
                elements: {
                    close: { type: 'button', x: 910, y: 10, bitmap: 'X', bitmap2: 'XPress', scale: 80 / 19,
                        clicker: {
                            onClick: Utils.debounce(function () {
                                let stackOpened = RewardUi.stackOpened
                                if (!stackOpened.length) return
                                RewardUi.closeRewardUi(stackOpened[stackOpened.length - 1][0])
                            }, 500),
                            onLongClick: Utils.debounce(function () {
                                let stackOpened = RewardUi.stackOpened
                                if (!stackOpened.length) return
                                RewardUi.closeRewardUi(stackOpened[0][0])
                            }, 500)
                        }
                    }
                }
            }, null, {
                blockingBackground: true,
                hideNavigation: true
            }),
            openRewardUi () {
                if (!this.stackOpened.length) return
                let params = this.stackOpened[this.stackOpened.length - 1]
                let listenerObj = this.stackListener[this.stackOpened.length - 1]
                let uuid = Utils.getUUID()
                let outputJson = params[1], toolsCb = params[2]
                let stateObj = toolsCb.getState()
                let received = stateObj.state === EnumObject.outputState.received
                let finished = Array.isArray(stateObj.toLoad) || received
                let isSelect = Boolean(outputJson.isSelect)
                let sumWeight = 0
                if (!isSelect) {
                    for (let index = 0; index < outputJson.list.length; ++index) {
                        sumWeight += Math.max(Number(outputJson.list[index].weight || 0), 0)
                    }
                }
                let notToLoad = []
                if (!isSelect && !received) {
                    for (let index = 0; index < outputJson.list.length; ++index) {
                        notToLoad[index] = true
                    }
                    if (Array.isArray(stateObj.toLoad)) {
                        stateObj.toLoad.forEach(function (index) {
                            notToLoad[index] = false
                        })
                    }
                }
                let yBelowLine = (150 + Math.ceil(Math.max(outputJson.list.length, 1) / 6) * (150 + (isSelect ? 0 : 30)))
                let description = QuestUiTools.resolveTextJsonToElements(outputJson.description, {
                    prefix: uuid + '_desc_',
                    pos: [50, yBelowLine + 15],
                    maxWidth: 900,
                    rowSpace: 10,
                    font: {
                        color: Color.BLACK,
                        size: 30
                    }
                })
                let maxY = description.maxY + 30
                this.rewardUi.clearNewElements(null, true)
                let location = this.rewardUi.ui.getLocation()
                let content = this.rewardUi.content
                location.scrollY = maxY * (400 / 1000)
                location.height = Math.min(location.scrollY, ScreenHeight - 60)
                location.y = (ScreenHeight - location.height) / 2
                content.drawing[1].height = maxY
                content.drawing[3].text = Utils.replace(TranAPI.translate('outputType.group.received'), [
                    ['{count}', Number(received ? outputJson.count : (stateObj.count || 0))],
                    ['{total}', Number(outputJson.count)]
                ])
                content.drawing[5].y2 = content.drawing[5].y1 = yBelowLine
                this.rewardUi.addElements(description.elements)
                let that = this
                outputJson.list.forEach(function (obj, index) {
                    let outputJson = obj.output
                    if (!outputJson || typeof outputJson === 'string') return
                    let getIcon = IOTypeTools.getOutputTypeCb(outputJson.type).getIcon
                    if (typeof getIcon !== 'function') return
                    let getState = $output_group_Tools.getStateSafe.bind($output_group_Tools, toolsCb, index)
                    let posX = 150 * (index % 6) + 65, posY = (150 + (isSelect ? 0 : 30)) * Math.floor(index / 5) + 165
                    let elements = getIcon(outputJson, {
                        getState: getState,
                        sendPacket: $output_group_Tools.sendPacket.bind($output_group_Tools, toolsCb, index),
                        openDescription: QuestUi.openDescriptionUi.bind(QuestUi, false, outputJson, { getState: getState })
                    }, {
                        pos: [posX, posY],
                        size: 120,
                        prefix: uuid + '_list_' + index + '_',
                        setCloseListener: function (listener) {
                            if (typeof listener !== 'function') return
                            listenerObj.close.push(listener)
                        },
                        setReloadListener: function (listener) {
                            if (typeof listener !== 'function') return
                            listenerObj.reload.push(listener)
                        }
                    })
                    if (!Utils.isObject(elements)) return
                    that.rewardUi.addElements(elements)
                    if (finished && !notToLoad[index]) {
                        if (!received && (!stateObj.list || !stateObj.list[index] || stateObj.list[index].state !== EnumObject.outputState.received)) {
                            that.rewardUi.addElements([[uuid + '_output_dot_' + index, {
                                type: 'image',
                                x: posX + 82.5, y: posY + 7.5, z: 10,
                                width: 30, height: 30,
                                bitmap: 'cq_dot_green'
                            }]])
                        }
                    } else {
                        that.rewardUi.addElements([[uuid + '_output_dot_' + index, {
                            type: 'image',
                            x: posX + 82.5, y: posY + 7.5, z: 10,
                            width: 30, height: 30,
                            bitmap: 'cq_dot_grey'
                        }]])
                    }
                    if (!isSelect) {
                        that.rewardUi.addElements([[uuid + '_posibility_' + index, {
                            type: 'text', 
                            x: posX + 60, y: posY + 120,
                            text: that.formatPosibility(obj.weight || 0, sumWeight),
                            font: { color: Color.GRAY, size: 25, align: 1 }
                        }]])
                    }
                })
                this.rewardUi.open(true)
            },
            /** @type { (uuid: string) => void } */
            closeRewardUi (uuid) {
                let index = -1
                for (let i = 0; i < this.stackOpened.length; ++i) {
                    if (this.stackOpened[i][0] === uuid) {
                        index = i
                        break
                    }
                }
                if (index < 0) return
                this.stackOpened.splice(index)
                this.stackListener.splice(index).forEach(function (listenerObj) {
                    listenerObj.close.forEach(function (listener) {
                        try {
                            listener()
                        } catch (err) {
                            Utils.error('Error in closeRewardUi (output/group.js):\n', err)
                        }
                    })
                    listenerObj.close.length = 0
                    listenerObj.reload.length = 0
                })
                if (this.stackOpened.length) this.openRewardUi()
                else this.rewardUi.close()
            },
            /** @type { (uuid: string) => void } */
            reloadRewardUi (uuid) {
                if (!this.stackOpened.length || this.stackOpened[this.stackOpened.length - 1][0] !== uuid) return
                if (!this.rewardUi.isOpened()) return
                let listenerObj = this.stackListener[this.stackOpened.length - 1]
                this.openRewardUi()
                listenerObj.reload.forEach(function (listener) {
                    try {
                        listener()
                    } catch (err) {
                        Utils.error('Error in reloadRewardUi (output/group.js):\n', err)
                    }
                })
            },
            /**
             * @param { number } weight 
             * @param { number } sumWeight 
             * @returns { string } 
             */
            formatPosibility (weight, sumWeight) {
                if (typeof weight !== 'number' || weight <= 0) return '0%'
                let percent = weight / sumWeight
                return String(Math.round(percent * 1e5) / 1e3) + '%'
            }
        }

        return {
            /**
             * @param { CQTypes.IOTypes.OutputJson } outputJson 
             * @param { CQTypes.IOTypeToolsLocalCb<CQTypes.OutputStateObject> } toolsCb 
             * @param { { setCloseListener?: () => void } } setListener 
             */
            open (outputJson, toolsCb, setListener) {
                let uuid = Utils.getUUID()
                RewardUi.stackOpened.push([uuid, outputJson, toolsCb])
                RewardUi.stackListener.push({ close: [], reload: [] })
                if (typeof setListener.setCloseListener === 'function') {
                    setListener.setCloseListener(RewardUi.closeRewardUi.bind(RewardUi, uuid))
                }
                if (typeof setListener.setReloadListener === 'function') {
                    setListener.setReloadListener(RewardUi.reloadRewardUi.bind(RewardUi, uuid))
                }
                RewardUi.openRewardUi()
            }
        }
    })()
}

IOTypeTools.setOutputType('group', TranAPI.getTranslation('outputType.group'), {
    resolveJson (outputJson, refsArray, bitmapNameObject) {
        outputJson.icon = Utils.resolveIconJson(outputJson.icon, refsArray, bitmapNameObject)
        if (typeof outputJson.count !== 'number') outputJson.count = 1
        if (!Array.isArray(outputJson.list)) return null
        let list = []
        outputJson.list.forEach(function (obj) {
            if (!Utils.isObject(obj)) return
            let weight = typeof obj.weight === 'number' ? obj.weight : 1
            if (weight < 0) weight = 0
            let tOutputJson = Utils.resolveRefs(obj.output, refsArray)
            if (!Utils.isObject(tOutputJson) || typeof tOutputJson.type !== 'string') return
            let config = IOTypeTools.getOutputTypeConfig(tOutputJson.type)
            if (!config || !config.allowGroup) return
            tOutputJson.autoReceive = Boolean(outputJson.autoReceive && !outputJson.isSelect)
            tOutputJson = System.resolveOutputJson(tOutputJson, refsArray, bitmapNameObject)
            if (tOutputJson) list.push({ output: tOutputJson, weight: weight })
        })
        outputJson.list = list
        if (outputJson.count > list.length) outputJson.count = list.length
        return outputJson
    },
    onLoad (outputJson, toolsCb, cache) {
        if (typeof toolsCb.createChildOutputId !== 'function') return
        if ($output_group_Tools.updateState(outputJson, toolsCb)) return
        cache.loaded = true
        cache.outputIdArray = []
        let notToLoad = []
        let stateObj = toolsCb.getState()
        if (!outputJson.isSelect) {
            for (let index = 0; index < outputJson.list.length; ++index) {
                notToLoad[index] = true
            }
            if (Array.isArray(stateObj.toLoad)) {
                stateObj.toLoad.forEach(function (index) {
                    notToLoad[index] = false
                })
            }
        }
        let updateState = $output_group_Tools.updateState.bind($output_group_Tools, outputJson, toolsCb)
        outputJson.list.forEach(function (obj, index) {
            if (notToLoad[index]) return
            if (stateObj.list && stateObj.list[index] && stateObj.list[index].state === EnumObject.outputState.received) return
            let tOutputJson = obj.output
            let params = {
                index: index,
                outputId: InvalidId,
                updateState: updateState
            }
            cache.outputIdArray[index] = params.outputId = toolsCb.createChildOutputId(tOutputJson, {
                getPlayerList: toolsCb.getPlayerList,
                getConnectedClientList: toolsCb.getConnectedClientList,
                getState: $output_group_Tools.getStateSafe.bind($output_group_Tools, toolsCb, index),
                setState: $output_group_Tools.setState.bind($output_group_Tools, toolsCb, params),
                createChildOutputId: toolsCb.createChildOutputId
            })
            IOTypeTools.loadOutput(params.outputId)
        })
    },
    onUnload (outputJson, toolsCb, cache, extraInfo) {
        if (!cache.loaded) return
        cache.loaded = false
        cache.outputIdArray.forEach(function (outputId) {
            if (typeof outputId !== 'string') return
            if (!IOTypeTools.isOutputIdLoaded(outputId)) return
            IOTypeTools.unloadOutput(outputId)
        })
    },
    onPacket (outputJson, toolsCb, cache, extraInfo) {
        let outputId = cache.outputIdArray[extraInfo.packetData.index]
        if (typeof outputId !== 'string') return
        if (!IOTypeTools.isOutputIdLoaded(outputId)) return
        IOTypeTools.callOutputTypeCb(outputId, 'onPacket', {
            client: extraInfo.client,
            packetData: extraInfo.packetData.data
        })
    },
    onFastReceive (outputJson, toolsCb, cache, extraInfo) {
        if (outputJson.isSelect) return
        cache.outputIdArray.forEach(function (outputId) {
            if (typeof outputId !== 'string') return
            if (!IOTypeTools.isOutputIdLoaded(outputId)) return
            IOTypeTools.callOutputTypeCb(outputId, 'onFastReceive', extraInfo)
        })
    },
    getIcon (outputJson, toolsCb, extraInfo) {
        let pos = extraInfo.pos
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: (typeof outputJson.icon.bitmap === 'string') ? outputJson.icon.bitmap : 'cq_clear',
                source: Utils.transferItemFromJson(outputJson.icon),
                clicker: {
                    onClick: Utils.debounce(function () {
                        $output_group_Tools.rewardUi.open(outputJson, toolsCb, extraInfo)
                    }, 500)
                }
            }]
        ]
    }
}, {
    allowRepeat: true,
    allowGroup: false
})
