/// <reference path='../IOTypeTools.js'/>

const $input_group_Tools = {
    /**
     * @param { CQTypes.IOTypes.InputJson_group } inputJson 
     * @param { CQTypes.IOTypeToolsCb<CQTypes.InputStateObject> } toolsCb 
     * @returns { boolean } true if finished
     */
    updateState (inputJson, toolsCb) {
        let changed = false
        let stateObj = toolsCb.getState()
        if (!Array.isArray(stateObj.list)) {
            stateObj.list = []
            changed = true
        }
        if (stateObj.state === EnumObject.inputState.repeat_unfinished && stateObj.wasFinished) {
            for (let index = 0; index < inputJson.list.length; index++) {
                stateObj.list[index] = {
                    state: EnumObject.inputState.repeat_unfinished
                }
            }
            delete stateObj.wasFinished
            stateObj.count = 0
            changed = true
        }
        let count = 0
        for (let index = 0; index < inputJson.list.length; index++) {
            if (!stateObj.list[index]) continue
            if (stateObj.list[index].state === EnumObject.inputState.finished) ++count
        }
        if (count >= inputJson.count) {
            stateObj.state = EnumObject.inputState.finished
            stateObj.list = []
            stateObj.wasFinished = true
            stateObj.count = 0
            changed = true
        } else if (stateObj.count !== count) {
            stateObj.count = count
            changed = true
        }
        if (changed) toolsCb.setState({}, stateObj)
        return stateObj.state === EnumObject.inputState.finished
    },
    /**
     * @param { CQTypes.IOTypeToolsCb<CQTypes.InputStateObject> | CQTypes.IOTypeToolsLocalCb<CQTypes.InputStateObject> } toolsCb 
     * @param { number } index 
     * @returns { CQTypes.InputStateObject } 
     */
    getStateSafe (toolsCb, index) {
        let stateObj = toolsCb.getState()
        let DEFAULT = { state: stateObj.state }
        if (!Array.isArray(stateObj.list)) return DEFAULT
        if (!stateObj.list[index]) return DEFAULT
        return Utils.deepCopy(stateObj.list[index])
    },
    /**
     * @param { CQTypes.IOTypeToolsCb<CQTypes.InputStateObject> } toolsCb 
     * @param { Object } params 
     * @param { number } params.index 
     * @param { CQTypes.inputId } params.inputId 
     * @param { () => void } params.updateState 
     * @param { object } extraInfo 
     * @param { CQTypes.InputStateObject } inputStateObject 
     */
    setState (toolsCb, params, extraInfo, inputStateObject) {
        if (!Utils.isObject(extraInfo)) extraInfo = {}
        if (!Utils.isObject(inputStateObject)) return
        let stateObj = toolsCb.getState()
        let oldStateObj = this.getStateSafe(toolsCb, params.index)
        stateObj.list[params.index] = inputStateObject
        toolsCb.setState(extraInfo, stateObj)
        try {
            Callback.invokeCallback('CustomQuests.onInputStateChanged',
                params.inputId,
                Utils.deepCopy(inputStateObject),
                Utils.deepCopy(oldStateObj),
                Utils.deepCopy(extraInfo)
            )
        } catch (err) {
            Utils.error('Error in Callback \'CustomQuests.onInputStateChanged\' (input/group.js):\n', err)
        }
        if (inputStateObject.state !== oldStateObj.state) params.updateState()
    },
    /**
     * @param { CQTypes.IOTypeToolsLocalCb<CQTypes.InputStateObject> } toolsCb 
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
    taskUi: (function () {
        const Color = android.graphics.Color
        const ScreenHeight = UI.getScreenHeight()
        const TaskUi = {
            /** @type { Array<[string, CQTypes.IOTypes.InputJson_group, CQTypes.IOTypeToolsLocalCb<CQTypes.InputStateObject>]> } */
            stackOpened: [],
            /** @type { Array<{ close: Array<() => void>, reload: Array<() => void> }> } */
            stackListener: [],
            taskUi: QuestUiTools.createUi({
                location: { x: 300, y: 50, width: 400, height: 400 },
                drawing: [
                    { type: 'background', color: Color.TRANSPARENT },
                    { type: 'frame', x: 0, y: 0, width: 1000, height: 1000, bitmap: 'classic_frame_bg_light', scale: 2 },
                    { type: 'text', text: TranAPI.translate('inputType.group'), x: 50, y: 70, font: { color: Color.BLACK, size: 40 } },
                    { type: 'text', text: '', x: 50, y: 120, font: { color: Color.GRAY, size: 40 } },
                    { type: 'line', x1: 0, y1: 150, x2: 1000, y2: 150, color: Color.BLACK, width: 5 },
                    { type: 'line', x1: 0, y1: 300, x2: 1000, y2: 300, color: Color.BLACK, width: 5 }
                ],
                elements: {
                    close: { type: 'button', x: 910, y: 10, bitmap: 'X', bitmap2: 'XPress', scale: 80 / 19,
                        clicker: {
                            onClick: Utils.debounce(function () {
                                let stackOpened = TaskUi.stackOpened
                                if (!stackOpened.length) return
                                TaskUi.closeTaskUi(stackOpened[stackOpened.length - 1][0])
                            }, 500),
                            onLongClick: Utils.debounce(function () {
                                let stackOpened = TaskUi.stackOpened
                                if (!stackOpened.length) return
                                TaskUi.closeTaskUi(stackOpened[0][0])
                            }, 500)
                        }
                    }
                }
            }, null, {
                blockingBackground: true,
                hideNavigation: true
            }),
            openTaskUi () {
                if (!this.stackOpened.length) return
                let params = this.stackOpened[this.stackOpened.length - 1]
                let listenerObj = this.stackListener[this.stackOpened.length - 1]
                let uuid = Utils.getUUID()
                let inputJson = params[1], toolsCb = params[2]
                let stateObj = toolsCb.getState()
                let finished = stateObj.state === EnumObject.inputState.finished
                let inputJsonList = inputJson.list
                let yBelowLine = (150 + Math.ceil(Math.max(inputJsonList.length, 1) / 6) * 150)
                let description = QuestUiTools.resolveTextJsonToElements(inputJson.description, {
                    prefix: uuid + '_desc_',
                    pos: [50, yBelowLine + 15],
                    maxWidth: 900,
                    rowSpace: 10,
                    font: {
                        color: android.graphics.Color.BLACK,
                        size: 30
                    }
                })
                let maxY = description.maxY + 30
                this.taskUi.clearNewElements(null, true)
                let location = this.taskUi.ui.getLocation()
                let content = this.taskUi.content
                location.scrollY = maxY * (400 / 1000)
                location.height = Math.min(location.scrollY, ScreenHeight - 60)
                location.y = (ScreenHeight - location.height) / 2
                content.drawing[1].height = maxY
                content.drawing[3].text = Utils.replace(TranAPI.translate('inputType.group.finished'), [
                    ['{count}', Number(finished ? inputJson.count : (stateObj.count || 0))],
                    ['{require}', Number(inputJson.count)]
                ])
                content.drawing[5].y2 = content.drawing[5].y1 = yBelowLine
                this.taskUi.addElements(description.elements)
                let that = this
                inputJsonList.forEach(function (inputJson, index) {
                    if (!inputJson || typeof inputJson === 'string') return
                    let getIcon = IOTypeTools.getInputTypeCb(inputJson.type).getIcon
                    if (typeof getIcon !== 'function') return
                    let getState = $input_group_Tools.getStateSafe.bind($input_group_Tools, toolsCb, index)
                    let elements = getIcon(inputJson, {
                        getState: getState,
                        sendPacket: $input_group_Tools.sendPacket.bind($input_group_Tools, toolsCb, index),
                        openDescription: QuestUi.openDescriptionUi.bind(QuestUi, true, inputJson, { getState: getState })
                    }, {
                        pos: [150 * (index % 6) + 65, 150 * Math.floor(index / 5) + 165],
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
                    that.taskUi.addElements(elements)
                    if (finished || (stateObj.list && stateObj.list[index] && stateObj.list[index].state === EnumObject.inputState.finished)) {
                        that.taskUi.addElements([[uuid + '_input_bingo_' + index, {
                            type: 'image', z: 10, width: 45, height: 45 * 16 / 22, bitmap: 'cq_bingo',
                            x: 150 * (index % 6) + 65 + 67.5,
                            y: 150 * Math.floor(index / 5) + 165 + 7.5
                        }]])
                    }
                })
                this.taskUi.open(true)
            },
            /** @type { (uuid: string) => void } */
            closeTaskUi (uuid) {
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
                            Utils.error('Error in closeTaskUi (input/group.js):\n', err)
                        }
                    })
                    listenerObj.close.length = 0
                    listenerObj.reload.length = 0
                })
                if (this.stackOpened.length) this.openTaskUi()
                else this.taskUi.close()
            },
            /** @type { (uuid: string) => void } */
            reloadTaskUi (uuid) {
                if (!this.stackOpened.length || this.stackOpened[this.stackOpened.length - 1][0] !== uuid) return
                if (!this.taskUi.isOpened()) return
                let listenerObj = this.stackListener[this.stackOpened.length - 1]
                this.openTaskUi()
                listenerObj.reload.forEach(function (listener) {
                    try {
                        listener()
                    } catch (err) {
                        Utils.error('Error in reloadTaskUi (input/group.js):\n', err)
                    }
                })
            }
        }

        return {
            /**
             * @param { CQTypes.IOTypes.InputJson } inputJson 
             * @param { CQTypes.IOTypeToolsLocalCb<CQTypes.InputStateObject> } toolsCb 
             * @param { Object } setListener
             * @param { (listener: () => void) => void = } setListener.setCloseListener 
             * @param { (listener: () => void) => void = } setListener.setReloadListener 
             */
            open (inputJson, toolsCb, setListener) {
                let uuid = Utils.getUUID()
                TaskUi.stackOpened.push([uuid, inputJson, toolsCb])
                TaskUi.stackListener.push({ close: [], reload: [] })
                if (typeof setListener.setCloseListener === 'function') {
                    setListener.setCloseListener(TaskUi.closeTaskUi.bind(TaskUi, uuid))
                }
                if (typeof setListener.setReloadListener === 'function') {
                    setListener.setReloadListener(TaskUi.reloadTaskUi.bind(TaskUi, uuid))
                }
                TaskUi.openTaskUi()
            }
        }
    })()
}

IOTypeTools.setInputType('group', TranAPI.getTranslation('inputType.group'), {
    resolveJson (inputJson, refsArray, bitmapNameObject) {
        inputJson.icon = Utils.resolveIconJson(inputJson.icon, refsArray, bitmapNameObject)
        if (typeof inputJson.count !== 'number') inputJson.count = 1
        if (!Array.isArray(inputJson.list)) return null
        let list = []
        inputJson.list.forEach(function (tInputJson) {
            tInputJson = Utils.resolveRefs(tInputJson, refsArray)
            if (!Utils.isObject(tInputJson) || typeof tInputJson.type !== 'string') return
            let config = IOTypeTools.getInputTypeConfig(tInputJson.type)
            if (!config || !config.allowGroup) return
            tInputJson = System.resolveInputJson(tInputJson, refsArray, bitmapNameObject)
            if (tInputJson) list.push(tInputJson)
        })
        inputJson.list = list
        return inputJson
    },
    onLoad (inputJson, toolsCb, cache) {
        if (typeof toolsCb.createChildInputId !== 'function') return
        if ($input_group_Tools.updateState(inputJson, toolsCb)) return
        cache.loaded = true
        cache.inputIdArray = []
        let updateState = $input_group_Tools.updateState.bind($input_group_Tools, inputJson, toolsCb)
        inputJson.list.forEach(function (tInputJson, index) {
            if (!tInputJson) return
            let params = {
                index: index,
                inputId: InvalidId,
                updateState: updateState
            }
            cache.inputIdArray[index] = params.inputId = toolsCb.createChildInputId(tInputJson, {
                getPlayerList: toolsCb.getPlayerList,
                getConnectedClientList: toolsCb.getConnectedClientList,
                getState: $input_group_Tools.getStateSafe.bind($input_group_Tools, toolsCb, index),
                setState: $input_group_Tools.setState.bind($input_group_Tools, toolsCb, params),
                createChildInputId: toolsCb.createChildInputId
            })
            IOTypeTools.loadInput(params.inputId)
        })
    },
    onUnload (inputJson, toolsCb, cache) {
        if (!cache.loaded) return
        cache.loaded = false
        cache.inputIdArray.forEach(function (inputId) {
            if (typeof inputId !== 'string') return
            if (!IOTypeTools.isInputIdLoaded(inputId)) return
            IOTypeTools.unloadInput(inputId)
        })
    },
    onPacket (inputJson, toolsCb, cache, extraInfo) {
        let inputId = cache.inputIdArray[extraInfo.packetData.index]
        if (typeof inputId !== 'string') return
        if (!IOTypeTools.isInputIdLoaded(inputId)) return
        IOTypeTools.callInputTypeCb(inputId, 'onPacket', {
            client: extraInfo.client,
            packetData: extraInfo.packetData.data
        })
    },
    getIcon (inputJson, toolsCb, extraInfo) {
        let pos = extraInfo.pos
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: (typeof inputJson.icon.bitmap === 'string') ? inputJson.icon.bitmap : 'cq_clear',
                source: Utils.transferItemFromJson(inputJson.icon),
                clicker: {
                    onClick: Utils.debounce(function () {
                        $input_group_Tools.taskUi.open(inputJson, toolsCb, extraInfo)
                    }, 500)
                }
            }]
        ]
    }
}, {
    allowRepeat: true,
    allowGroup: true
})
