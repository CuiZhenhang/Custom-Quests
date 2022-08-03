/// <reference path='../IOTypeTools.js'/>

const $input_group_Tools = {
    /**
     * @param { CQTypes.IOTypeToolsCb<CQTypes.InputStateObject> | CQTypes.IOTypeToolsLocalCb<CQTypes.InputStateObject> } toolsCb 
     * @param { number } index 
     */
    getState (toolsCb, index) {
        let DEFAULT = { state: EnumObject.inputState.unfinished }
        let stateObj = toolsCb.getState()
        if (!Array.isArray(stateObj.list)) return DEFAULT
        if (!Utils.isObject(stateObj.list[index])) return DEFAULT
        return Utils.deepCopy(stateObj.list[index])
    },
    /**
     * @param { CQTypes.IOTypeToolsCb<CQTypes.InputStateObject> } toolsCb 
     * @param { Array<Nullable<CQTypes.inputId>> } loadedIOArray 
     * @param { number } index 
     * @param { object } extraInfo 
     * @param { CQTypes.InputStateObject } inputStateObject 
     */
    setState (toolsCb, loadedIOArray, index, extraInfo, inputStateObject) {
        if (!Utils.isObject(inputStateObject)) return
        let stateObj = toolsCb.getState()
        if (!Array.isArray(stateObj.list)) stateObj.list = []
        let oldStateObj = Utils.isObject(stateObj.list[index]) ? stateObj.list[index] : { state: EnumObject.inputState.unfinished }
        stateObj.list[index] = inputStateObject
        if (inputStateObject.state === EnumObject.inputState.finished) {
            stateObj.state = EnumObject.inputState.finished
            stateObj.wasFinished = true
        }
        toolsCb.setState(extraInfo, stateObj)
        try {
            Callback.invokeCallback('CustomQuests.onInputStateChanged',
                loadedIOArray[index],
                Utils.deepCopy(inputStateObject),
                Utils.deepCopy(oldStateObj),
                Utils.deepCopy(extraInfo)
            )
        } catch (err) {
            Utils.log('Error in Callback \'CustomQuests.onInputStateChanged\' (input/group.js):\n' + err, 'ERROR', true)
        }
    },
    /**
     * @param { Array<Nullable<CQTypes.inputId>> } loadedIOArray 
     * @param { number } index 
     * @param { Array<CQTypes.inputId> } idArray 
     */
    onUnload (loadedIOArray, index, idArray) {
        let idIndex = idArray.indexOf(loadedIOArray[index])
        if (idIndex >= 0) idArray.splice(idIndex, 1)
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
    /** @type { ReturnType<QuestUiTools['createUi']> } */
    ui: (function () {
        let Color = android.graphics.Color
        let ScreenHeight = UI.getScreenHeight()
        Callback.addCallback('PostLoaded', function () {
            $input_group_Tools.ui = QuestUiTools.createUi({
                location: { x: 300, y: 50, width: 400, height: ScreenHeight - 100 },
                drawing: [
                    { type: 'background', color: Color.TRANSPARENT },
                    { type: 'frame', x: 0, y: 0, width: 1000, height: 0 }
                ]
            }, null, {
                closeOnBackPressed: true,
                blockingBackground: true
            })
        })
        return null
    })(),
    /**
     * @param { CQTypes.IOTypes.InputJson } inputJson 
     * @param { CQTypes.IOTypeToolsLocalCb<CQTypes.InputStateObject> } toolsCb 
     */
    open (inputJson, toolsCb) {
        if (this.ui === null) return

    }
}
/*
IOTypeTools.setInputType('group', TranAPI.getTranslation('inputType.group'), {
    resolveJson (inputJson, refsArray, bitmapNameObject) {
        inputJson.icon = Utils.resolveIconJson(inputJson.icon, refsArray, bitmapNameObject)
        if (!Array.isArray(inputJson.list)) return null
        inputJson.list.forEach(function (tInputJson, index, self) {
            if (!Utils.isObject(tInputJson) || typeof tInputJson.type !== 'string') {
                self[index] = null
                return
            }
            tInputJson = Utils.deepCopy(Utils.resolveRefs(tInputJson, refsArray))
            let config = IOTypeTools.getInputTypeConfig(tInputJson.type)
            if (!Utils.isObject(config) || !config.allowGroup) {
                self[index] = null
                return
            }
            self[index] = System.resolveInputJson(
                tInputJson,
                refsArray,
                bitmapNameObject
            )
        })
        return inputJson
    },
    onLoad (inputJson, toolsCb, cache) {
        let stateObj = toolsCb.getState()
        if (stateObj.state === EnumObject.inputState.repeat_unfinished && stateObj.wasFinished) {
            for (let index = 0; index < inputJson.list.length; index++) {
                stateObj.list[index] = {
                    state: EnumObject.inputState.repeat_unfinished
                }
            }
            stateObj.wasFinished = false
            toolsCb.setState({}, stateObj)
        } else {
            if (Array.isArray(stateObj.list)) {
                for (let index = 0; index < inputJson.list.length; index++) {
                    if (!Utils.isObject(stateObj.list[index])) continue
                    if (stateObj.list[index].state === EnumObject.inputState.finished) {
                        stateObj.state = EnumObject.inputState.finished
                        stateObj.wasFinished = true
                        toolsCb.setState({}, stateObj)
                        return
                    }
                }
            }
        }
        cache.loaded = true
        let playerList = toolsCb.getPlayerList(false)
        cache.saveId = ServerSystem.getSaveId(playerList[0])
        if (!Utils.isObject(ServerSystem.typedLoadedQuest.input[cache.saveId])) {
            ServerSystem.typedLoadedQuest.input[cache.saveId] = {}
        }
        let obj = ServerSystem.typedLoadedQuest.input[cache.saveId]
        cache.input = []
        inputJson.list.forEach(function (tInputJson, index) {
            if (!Utils.isObject(tInputJson)) return
            if (!Array.isArray(obj[tInputJson.type])) obj[tInputJson.type] = []
            cache.input[index] = IOTypeTools.createInputId(tInputJson, {
                getPlayerList: toolsCb.getPlayerList,
                getConnectedClientList: toolsCb.getConnectedClientList,
                getState: $input_group_Tools.getState.bind(null, toolsCb, index),
                setState: $input_group_Tools.setState.bind(null, toolsCb, cache.input, index)
            }, $input_group_Tools.onUnload.bind(null, cache.input, index, obj[tInputJson.type]))
            obj[tInputJson.type].push(cache.input[index])
            IOTypeTools.loadInput(cache.input[index])
        })
    },
    onUnload (inputJson, toolsCb, cache) {
        if (!cache.loaded) return
        cache.input.forEach(function (inputId) {
            if (typeof inputId !== 'string') return
            if (!IOTypeTools.isInputIdLoaded(inputId)) return
            IOTypeTools.unloadInput(inputId)
        })
    },
    onPacket (inputJson, toolsCb, cache, extraInfo) {
        let inputId = cache.input[extraInfo.packetData.index]
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
                bitmap: (typeof inputJson.icon.bitmap === 'string') ? inputJson.icon.bitmap : 'clear',
                source: Utils.transferItemFromJson(inputJson.icon),
                clicker: {
                    onClick: Utils.debounce(function () {
                        
                    }, 500),
                    onLongClick: Utils.debounce(toolsCb.openDescription, 500)
                }
            }]
        ]
    },
    getDescription (inputJson, toolsCb, extraInfo) {
        
    }
}, {
    allowRepeat: true,
    allowGroup: false
})
*/
