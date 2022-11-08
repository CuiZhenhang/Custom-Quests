/// <reference path='./Utils.js'/>

/** @type { IOTypeTools } */
const IOTypeTools = {
    inputType: {},
    setInputType (type, name, inputTypeCb, config) {
        if (!this.inputType[type]) {
            this.inputType[type] = {
                name: '',
                cb: {},
                config: {
                    allowGroup: false,
                    allowRepeat: false
                }
            }
        }
        let inputType = this.inputType[type]
        if (typeof name === 'string') {
            if (typeof inputType.name === 'string') {
                inputType.name = name
            }
        } else if (Utils.isObject(name)) {
            if (typeof inputType.name === 'string') {
                inputType.name = name
            } else {
                for (let lang in name) {
                    inputType.name[lang] = name[lang]
                }
            }
        }
        let methods = [
            'resolveJson', 'onPacket', 'onCustomCall',
            'onLoad', 'onUnload', 'onTick',
            'getIcon', 'getDescription', 'onEdit'
        ]
        methods.forEach(function (method) {
            if (typeof inputTypeCb[method] === 'function') {
                inputType.cb[method] = inputTypeCb[method]
            } else if (inputTypeCb[method] === null) {
                inputType.cb[method] = null
            }
        })
        if (Utils.isObject(config)) {
            if (typeof config.allowGroup === 'boolean') {
                inputType.config.allowGroup = config.allowGroup
            }
            if (typeof config.allowRepeat === 'boolean') {
                inputType.config.allowRepeat = config.allowRepeat
            }
        }
    },
    getAllInputType () {
        let ret = []
        for (let type in this.inputType) {
            if (this.inputType[type]) {
                ret.push(type)
            }
        }
        return ret
    },
    getInputTypeName (type) {
        let inputType = this.inputType[type]
        if (!inputType) return ''
        return TranAPI.translate(inputType.name)
    },
    getInputTypeCb (type) {
        let inputType = this.inputType[type]
        if (!inputType) return {}
        let cb = {}
        for (let method in inputType.cb) {
            cb[method] = inputType.cb[method]
        }
        return cb
    },
    getInputTypeConfig (type) {
        let inputType = this.inputType[type]
        if (!inputType) return null
        return inputType.config
    },
    inputObject: {},
    typedInputList: {},
    getAllInputIdByType (type, saveId) {
        if (typeof type === 'string') type = [type]
        let ret = []
        if (saveId) {
            if (saveId === InvalidId) return ret
            let typedInputList = this.typedInputList[saveId]
            if (!typedInputList) return ret
            type.forEach(function (type) {
                if (Array.isArray(typedInputList[type])) {
                    ret = ret.concat(typedInputList[type])
                }
            })
        } else {
            for (let saveId in this.typedInputList) {
                let typedInputList = this.typedInputList[saveId]
                if (!typedInputList) continue
                type.forEach(function (type) {
                    if (Array.isArray(typedInputList[type])) {
                        ret = ret.concat(typedInputList[type])
                    }
                })
            }
        }
        return ret
    },
    createInputId (inputJson, toolsCb, onUnload, saveId) {
        if (!Utils.isObject(inputJson)) return InvalidId
        if (!Utils.isObject(toolsCb)) return InvalidId
        if (typeof toolsCb.getState !== 'function') return InvalidId
        if (toolsCb.getState().state === EnumObject.inputState.finished) return InvalidId
        let type = inputJson.type
        let inputType = this.inputType[type]
        if (!inputType) return InvalidId
        let inputId = Utils.getUUID()
        while (this.isInputIdLoaded(inputId)) inputId = Utils.getUUID()
        if (toolsCb.createChildInputId === undefined) {
            toolsCb.createChildInputId = this.createChildInputId.bind(this, inputId)
        }
        this.inputObject[inputId] = {
            saveId: saveId || InvalidId,
            loaded: false,
            cache: {},
            json: inputJson,
            toolsCb: toolsCb,
            onUnload: onUnload
        }
        return inputId
    },
    createChildInputId (inputId, inputJson, toolsCb, onUnload) {
        if (!this.isInputIdLoaded(inputId)) return InvalidId
        let inputObject = this.inputObject[inputId]
        return this.createInputId(inputJson, toolsCb, onUnload, inputObject.saveId)
    },
    isInputIdLoaded (inputId) {
        if (typeof inputId !== 'string') return false
        if (inputId === InvalidId) return false
        let inputObject = this.inputObject[inputId]
        if (!inputObject) return false
        return inputObject.loaded
    },
    loadInput (inputId) {
        if (inputId === InvalidId) return
        if (this.isInputIdLoaded(inputId)) return
        let inputObject = this.inputObject[inputId]
        let type = inputObject.json.type
        let inputType = this.inputType[type]
        inputObject.loaded = true
        if (!this.typedInputList[inputObject.saveId]) this.typedInputList[inputObject.saveId] = {}
        let typedInputList = this.typedInputList[inputObject.saveId]
        if (!Array.isArray(typedInputList[type])) typedInputList[type] = []
        typedInputList[type].push(inputId)
        if (typeof inputType.cb.onLoad === 'function') {
            try {
                inputType.cb.onLoad.call(null, inputObject.json, inputObject.toolsCb, inputObject.cache)
            } catch (err) {
                Utils.error('Error in loadInput (IOTypeTools.js):\n', err)
            }
        }
    },
    unloadInput (inputId) {
        if (!this.isInputIdLoaded(inputId)) return
        let inputObject = this.inputObject[inputId]
        let type = inputObject.json.type
        let inputType = this.inputType[type]
        if (typeof inputType.cb.onUnload === 'function') {
            try {
                inputType.cb.onUnload.call(null, inputObject.json, inputObject.toolsCb, inputObject.cache)
            } catch (err) {
                Utils.error('Error in unloadInput (IOTypeTools.js):\n', err)
            }
        }
        if (typeof inputObject.onUnload === 'function') {
            try {
                inputObject.onUnload()
            } catch (err) {
                Utils.error('Error in unloadInput (IOTypeTools.js):\n', err)
            }
        }
        delete this.inputObject[inputId]
        let list = this.typedInputList[inputObject.saveId][type]
        let index = list.indexOf(inputId)
        if (index >= 0) list.splice(index, 1)
    },
    callInputTypeCb (inputId, method, extraInfo) {
        if (!this.isInputIdLoaded(inputId)) return null
        if (!Utils.isObject(extraInfo)) extraInfo = {}
        let methods =  []
        if (!Network.inRemoteWorld()) {
            methods = methods.concat([
                'onCustomCall', 'onPacket', 'onTick'
            ])
        }
        if (methods.indexOf(method) < 0) return
        let inputObject = this.inputObject[inputId]
        let type = inputObject.json.type
        let inputType = this.inputType[type]
        if (typeof inputType.cb[method] === 'function') {
            try {
                return inputType.cb[method].call(null, inputObject.json, inputObject.toolsCb, inputObject.cache, extraInfo)
            } catch (err) {
                Utils.error('Error in callInputTypeCb (IOTypeTools.js):\n', err)
            }
        }
        return null
    },
    getPlayerListByInputId (inputId, online) {
        if (!this.isInputIdLoaded(inputId)) return []
        let inputObject = this.inputObject[inputId]
        if (typeof inputObject.toolsCb.getPlayerList === 'function') {
            try {
                return inputObject.toolsCb.getPlayerList(Boolean(online))
            } catch (err) {
                Utils.error('Error in getPlayerListByInputId (IOTypeTools.js):\n', err)
            }
        }
        return []
    },
    getInputJsonByInputId (inputId) {
        if (!this.isInputIdLoaded(inputId)) return null
        let inputObject = this.inputObject[inputId]
        return inputObject.json
    },
    outputType: {},
    setOutputType (type, name, outputTypeCb, config) {
        if (!this.outputType[type]) {
            this.outputType[type] = {
                name: '',
                cb: {},
                config: {
                    allowGroup: false,
                    allowRepeat: false
                }
            }
        }
        let outputType = this.outputType[type]
        if (typeof name === 'string') {
            if (typeof outputType.name === 'string') {
                outputType.name = name
            }
        } else if (Utils.isObject(name)) {
            if (typeof outputType.name === 'string') {
                outputType.name = name
            } else {
                for (let lang in name) {
                    outputType.name[lang] = name[lang]
                }
            }
        }
        let methods = [
            'resolveJson', 'onPacket', 'onCustomCall',
            'onLoad', 'onUnload', 'onReceive',
            'onFastReceive',
            'getIcon', 'getDescription', 'onEdit'
        ]
        methods.forEach(function (method) {
            if (typeof outputTypeCb[method] === 'function') {
                outputType.cb[method] = outputTypeCb[method]
            } else if (outputTypeCb[method] === null) {
                outputType.cb[method] = null
            }
        })
        if (Utils.isObject(config)) {
            if (typeof config.allowGroup === 'boolean') {
                outputType.config.allowGroup = config.allowGroup
            }
            if (typeof config.allowRepeat === 'boolean') {
                outputType.config.allowRepeat = config.allowRepeat
            }
        }
    },
    getAllOutputType () {
        let ret = []
        for (let type in this.outputType) {
            if (this.outputType[type]) {
                ret.push(type)
            }
        }
        return ret
    },
    getOutputTypeName (type) {
        let outputType = this.outputType[type]
        if (!outputType) return ''
        return TranAPI.translate(outputType.name)
    },
    getOutputTypeCb (type) {
        let outputType = this.outputType[type]
        if (!outputType) return {}
        let cb = {}
        for (let method in outputType.cb) {
            cb[method] = outputType.cb[method]
        }
        return cb
    },
    getOutputTypeConfig (type) {
        let outputType = this.outputType[type]
        if (!outputType) return null
        return outputType.config
    },
    outputObject: {},
    typedOutputList: {},
    getAllOutputIdByType (type, saveId) {
        if (typeof type === 'string') type = [type]
        let ret = []
        if (saveId) {
            if (saveId === InvalidId) return ret
            let typedOutputList = this.typedOutputList[saveId]
            if (!typedOutputList) return ret
            type.forEach(function (type) {
                if (Array.isArray(typedOutputList[type])) {
                    ret = ret.concat(typedOutputList[type])
                }
            })
        } else {
            for (let saveId in this.typedOutputList) {
                let typedOutputList = this.typedOutputList[saveId]
                if (!typedOutputList) continue
                type.forEach(function (type) {
                    if (Array.isArray(typedOutputList[type])) {
                        ret = ret.concat(typedOutputList[type])
                    }
                })
            }
        }
        return ret
    },
    createOutputId (outputJson, toolsCb, onUnload, saveId) {
        if (!Utils.isObject(outputJson)) return InvalidId
        if (!Utils.isObject(toolsCb)) return InvalidId
        if (typeof toolsCb.getState !== 'function') return InvalidId
        if (toolsCb.getState().state === EnumObject.outputState.received) return InvalidId
        let type = outputJson.type
        let outputType = this.outputType[type]
        if (!outputType) return InvalidId
        let outputId = Utils.getUUID()
        while (this.isOutputIdLoaded(outputId)) outputId = Utils.getUUID()
        if (toolsCb.createChildOutputId === undefined) {
            toolsCb.createChildOutputId = this.createChildOutputId.bind(this, outputId)
        }
        this.outputObject[outputId] = {
            saveId: saveId || InvalidId,
            loaded: false,
            cache: {},
            json: outputJson,
            toolsCb: toolsCb,
            onUnload: onUnload
        }
        return outputId
    },
    createChildOutputId (outputId, outputJson, toolsCb, onUnload) {
        if (!this.isOutputIdLoaded(outputId)) return InvalidId
        let outputObject = this.outputObject[outputId]
        return this.createOutputId(outputJson, toolsCb, onUnload, outputObject.saveId)
    },
    isOutputIdLoaded (outputId) {
        if (typeof outputId !== 'string') return false
        if (outputId === InvalidId) return false
        let outputObject = this.outputObject[outputId]
        if (!outputObject) return false
        return outputObject.loaded
    },
    loadOutput (outputId) {
        if (outputId === InvalidId) return
        if (this.isOutputIdLoaded(outputId)) return
        let outputObject = this.outputObject[outputId]
        let type = outputObject.json.type
        let outputType = this.outputType[type]
        outputObject.loaded = true
        if (!this.typedOutputList[outputObject.saveId]) this.typedOutputList[outputObject.saveId] = {}
        let typedOutputList = this.typedOutputList[outputObject.saveId]
        if (!Array.isArray(typedOutputList[type])) typedOutputList[type] = []
        typedOutputList[type].push(outputId)
        if (typeof outputType.cb.onLoad === 'function') {
            try {
                outputType.cb.onLoad.call(null, outputObject.json, outputObject.toolsCb, outputObject.cache)
            } catch (err) {
                Utils.error('Error in loadOutput (IOTypeTools.js):\n', err)
            }
        }
    },
    unloadOutput (outputId) {
        if (!this.isOutputIdLoaded(outputId)) return
        let outputObject = this.outputObject[outputId]
        let type = outputObject.json.type
        let outputType = this.outputType[type]
        if (typeof outputType.cb.onUnload === 'function') {
            try {
                outputType.cb.onUnload.call(null, outputObject.json, outputObject.toolsCb, outputObject.cache)
            } catch (err) {
                Utils.error('Error in unloadOutput (IOTypeTools.js):\n', err)
            }
        }
        if (typeof outputObject.onUnload === 'function') {
            try {
                outputObject.onUnload()
            } catch (err) {
                Utils.error('Error in unloadOutput (IOTypeTools.js):\n', err)
            }
        }
        delete this.outputObject[outputId]
        let list = this.typedOutputList[outputObject.saveId][type]
        let index = list.indexOf(outputId)
        if (index >= 0) list.splice(index, 1)
    },
    callOutputTypeCb (outputId, method, extraInfo) {
        if (!this.isOutputIdLoaded(outputId)) return null
        if (!Utils.isObject(extraInfo)) extraInfo = {}
        let methods = []
        if (!Network.inRemoteWorld()) {
            methods = methods.concat([
                'onCustomCall', 'onPacket', 'onReceive',
                'onFastReceive'
            ])
        }
        if (methods.indexOf(method) < 0) return
        let outputObject = this.outputObject[outputId]
        let type = outputObject.json.type
        let outputType = this.outputType[type]
        if (typeof outputType.cb[method] === 'function') {
            try {
                return outputType.cb[method].call(null, outputObject.json, outputObject.toolsCb, outputObject.cache, extraInfo)
            } catch (err) {
                Utils.error('Error in callOutputTypeCb (IOTypeTools.js):\n', err)
            }
        }
        return null
    },
    getPlayerListByOutputId (outputId, online) {
        if (!this.isOutputIdLoaded(outputId)) return []
        let outputObject = this.outputObject[outputId]
        if (typeof outputObject.toolsCb.getPlayerList === 'function') {
            try {
                return outputObject.toolsCb.getPlayerList(Boolean(online))
            } catch (err) {
                Utils.error('Error in getPlayerListByOutputId (IOTypeTools.js):\n', err)
            }
        }
        return []
    },
    getOutputJsonByOutputId (outputId) {
        if (!this.isOutputIdLoaded(outputId)) return null
        let outputObject = this.outputObject[outputId]
        return outputObject.json
    }
}

Callback.addCallback('ServerPlayerTick', Utils.debounce(function () {
    try {
        let playerList = Network.getConnectedPlayers()
        let playerInventory = {}
        for (let i = 0; i < playerList.length; i++) {
            let player = playerList[i]
            let inventory = Utils.getInventory(player)
            let sortInventory = Utils.getSortInventory(inventory)
            let extraInventory = Utils.getExtraInventory(inventory)
            playerInventory[player] = {
                player: player,
                normal: inventory,
                sort: sortInventory,
                extra: extraInventory
            }
        }
        let typeArray = IOTypeTools.getAllInputType().filter(function (type) {
            return typeof IOTypeTools.getInputTypeCb(type).onTick === 'function'
        })
        IOTypeTools.getAllInputIdByType(typeArray).forEach(function (inputId) {
            let playerInventoryArray = []
            IOTypeTools.getPlayerListByInputId(inputId, true).forEach(function (player) {
                playerInventoryArray.push(playerInventory[player])
            })
            IOTypeTools.callInputTypeCb(inputId, 'onTick', {
                playerInventory: playerInventoryArray
            })
        })
    } catch (err) {
        Utils.error('Error in Callback \'ServerPlayerTick\' (IOTypeTools.js):\n', err)
    }
}, 500 /* 0.5s */))

Callback.addCallback('LevelLeft', function () {
    if (Network.inRemoteWorld()) return
    IOTypeTools.getAllInputIdByType(IOTypeTools.getAllInputType()).forEach(function (inputId) {
        IOTypeTools.unloadInput(inputId)
    })
    IOTypeTools.inputObject = {}
    IOTypeTools.getAllOutputIdByType(IOTypeTools.getAllOutputType()).forEach(function (outputId) {
        IOTypeTools.unloadOutput(outputId)
    })
    IOTypeTools.outputObject = {}
})
