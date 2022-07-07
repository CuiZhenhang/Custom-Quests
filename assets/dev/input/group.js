/// <reference path='../interaction.js'/>

const $input_group_Tools = {
    /**
     * @param { CQTypes.IOTypeToolsCb<CQTypes.InputStateObject> } toolsCb 
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
     * @param { number } index 
     * @param { object } extraInfo 
     * @param { CQTypes.InputStateObject } inputStateObject 
     */
    setState (toolsCb, index, extraInfo, inputStateObject) {
        if (!Utils.isObject(inputStateObject)) return
        let stateObj = toolsCb.getState()
        if (!Array.isArray(stateObj.list)) stateObj.list = []
        stateObj.list[index] = inputStateObject
        toolsCb.setState(extraInfo, stateObj)
    },
    /**
     * @param { Array<Nullable<CQTypes.inputId>> } loadedIOArray 
     * @param { number } index 
     * @param { Array<CQTypes.inputId> } idArray 
     */
    onUnload (loadedIOArray, index, idArray) {
        let idIndex = idArray.indexOf(loadedIOArray[index])
        if (idIndex >= 0) idArray.splice(idIndex, 1)
    }
}

IOTypeTools.setInputType('group', {
    en: 'group'
}, {
    resolveJson (inputJson, refsArray, bitmapNameObject) {
        inputJson.icon = Utils.deepCopy(Utils.resolveRefs(inputJson.icon, refsArray))
        if (!Utils.isObject(inputJson.icon)) inputJson.icon = {}
        if (!Array.isArray(inputJson.list)) return null
        inputJson.list.forEach(function (tInputJson, index, self) {
            if (!Utils.isObject(tInputJson) || typeof tInputJson.type !== 'string') {
                self[index] = null
                return
            }
            let config = IOTypeTools.getInputTypeConfig(tInputJson.type)
            if (!Utils.isObject(config) || !config.allowGroup)  {
                self[index] = null
                return
            }
            self[index] = System.resolveInputJson(
                Utils.deepCopy(Utils.resolveRefs(tInputJson, refsArray)),
                refsArray,
                bitmapNameObject
            )
        })
        return inputJson
    },
    onLoad (inputJson, toolsCb, cache) {
        let stateObj = toolsCb.getState()
        if (Array.isArray(stateObj.list)) {
            for (let index = 0; index < inputJson.list.length; index++) {
                if (!Utils.isObject(stateObj.list[index])) continue
                if (stateObj.list[index].state === EnumObject.inputState.finished) {
                    stateObj.state = EnumObject.inputState.finished
                    toolsCb.setState({}, stateObj)
                    return
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
                setState: $input_group_Tools.setState.bind(null, toolsCb, index)
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
    getIcon (inputJson, toolsCb, extraInfo) {
        let pos = extraInfo.pos
        let ret = {}
        ret[extraInfo.prefix + 'main'] = {
			type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
            bitmap: (typeof inputJson.icon.bitmap === 'string') ? inputJson.icon.bitmap : 'clear',
            source: Utils.transferItemFromJson(inputJson.icon),
			clicker: {}
        }
        return ret
    },
    getDesc (inputJson, toolsCb, extraInfo) {
        
    }
}, {
    allowRepeat: true,
    allowGroup: false
})
