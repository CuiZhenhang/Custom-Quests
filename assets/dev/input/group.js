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
        return stateObj.state === EnumObject.questInputState.finished
    },
    /**
     * @param { CQTypes.IOTypeToolsCb<CQTypes.InputStateObject> | CQTypes.IOTypeToolsLocalCb<CQTypes.InputStateObject> } toolsCb 
     * @param { number } index 
     * @returns { CQTypes.InputStateObject } 
     */
    getStateSafe (toolsCb, index) {
        let DEFAULT = { state: EnumObject.inputState.unfinished }
        let stateObj = toolsCb.getState()
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
        let oldStateObj = stateObj.list[params.index] || { state: EnumObject.inputState.unfinished }
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
    ui: (function () {
        const Color = android.graphics.Color
        const ScreenHeight = UI.getScreenHeight()
        const TaskUi = QuestUiTools.createUi({
            location: { x: 300, y: 50, width: 400, height: ScreenHeight - 100 },
            drawing: [
                { type: 'background', color: Color.TRANSPARENT },
                { type: 'frame', x: 0, y: 0, width: 1000, height: (ScreenHeight - 100) * (1000 / 400), bitmap: 'classic_frame_bg_light', scale: 2 }
            ],
            elements: {
                close: { type: 'closeButton', x: 910, y: 10, bitmap: 'X', bitmap2: 'XPress', scale: 80 / 19 }
            }
        }, null, {
            closeOnBackPressed: true,
            blockingBackground: true,
            hideNavigation: true
        })
        return {
            /**
             * @param { CQTypes.IOTypes.InputJson } inputJson 
             * @param { CQTypes.IOTypeToolsLocalCb<CQTypes.InputStateObject> } toolsCb 
             */
            open (inputJson, toolsCb) {
                alert('open group task gui')
                TaskUi.open(true)
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
        let updateState = $input_group_Tools.updateState.bind(null, inputJson, toolsCb)
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
                getState: $input_group_Tools.getStateSafe.bind(null, toolsCb, index),
                setState: $input_group_Tools.setState.bind(null, toolsCb, params),
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
                        $input_group_Tools.ui.open(inputJson, toolsCb)
                    }, 500),
                    onLongClick: Utils.debounce(toolsCb.openDescription, 500)
                }
            }]
        ]
    },
    getDescription (inputJson, toolsCb, extraInfo) {
        let stateObj = toolsCb.getState()
        let finished = stateObj.state === EnumObject.inputState.finished
        let prefix = extraInfo.prefix
        let maxY = extraInfo.posY + 100
        let elements = [
            [prefix + 'text', {
                type: 'text', x: 500, y: extraInfo.posY - 10, text: TranAPI.translate('inputType.group.text'),
                font: { color: android.graphics.Color.BLACK, size: 30, align: 1 }
            }],
            [prefix + 'data', {
                type: 'text', x: 500, y: extraInfo.posY + 30,
                text: Utils.replace(TranAPI.translate('inputType.group.finished'), [
                    ['{count}', Number(finished ? inputJson.count : (stateObj.count || 0))],
                    ['{require}', Number(inputJson.count)]
                ]),
                font: { color: android.graphics.Color.GRAY, size: 30, align: 1 }
            }]
        ]
        let description = QuestUiTools.resolveTextJsonToElements(inputJson.description, {
            prefix: prefix + 'desc_',
            pos: [50, maxY],
            maxWidth: 900,
            rowSpace: 10,
            font: {
                color: android.graphics.Color.BLACK,
                size: 30
            }
        })
        elements = elements.concat(description.elements)
        maxY = description.maxY + 20
        return {
            maxY: maxY,
            elements: elements
        }
    }
}, {
    allowRepeat: true,
    allowGroup: true
})
