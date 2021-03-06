/// <reference path='./Utils.js'/>

/** @type { IOTypeTools } */
const IOTypeTools = {
    inputType: {},
    setInputType (type, name, inputTypeCb, config) {
        if (!Utils.isObject(this.inputType[type])) {
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
            'getIcon', 'getDesc', 'onEdit'
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
            if (Utils.isObject(this.inputType[type])) {
                ret.push(type)
            }
        }
        return ret
    },
    getInputTypeName (type) {
        let inputType = this.inputType[type]
        if (!Utils.isObject(inputType)) return ''
        return TranAPI.translate(inputType.name)
    },
    getInputTypeCb (type) {
        let inputType = this.inputType[type]
        if (!Utils.isObject(inputType)) return {}
        let cb = {}
        for (let method in inputType.cb) {
            cb[method] = inputType.cb[method]
        }
        return cb
    },
    getInputTypeConfig (type) {
        let inputType = this.inputType[type]
        if (!Utils.isObject(inputType)) return null
        return Utils.deepCopy(inputType.config)
    },
    inputObject: {},
    typedInputList: {},
    getAllInputIdByType (type) {
        let that = this
        if (typeof type === 'string') type = [type]
        let ret = []
        type.forEach(function (type) {
            if (Array.isArray(that.typedInputList[type])) {
                ret = ret.concat(that.typedInputList[type])
            }
        })
        return ret
    },
    createInputId (inputJson, toolsCb, onUnload) {
        if (!Utils.isObject(inputJson)) return InvalidId
        if (!Utils.isObject(toolsCb)) return InvalidId
        if (typeof toolsCb.getState !== 'function') return InvalidId
        if (toolsCb.getState().state === EnumObject.inputState.finished) return InvalidId
        inputJson = Utils.deepCopy(inputJson)
        let type = inputJson.type
        let inputType = this.inputType[type]
        if (!Utils.isObject(inputType)) return InvalidId
        let inputId = Utils.getUUID()
        while (this.isInputIdLoaded(inputId)) inputId = Utils.getUUID()
        this.inputObject[inputId] = {
            loaded: false,
            cache: {},
            json: inputJson,
            toolsCb: toolsCb,
            onUnload: onUnload
        }
        return inputId
    },
    isInputIdLoaded (inputId) {
        if (typeof inputId !== 'string') return false
        if (inputId === InvalidId) return false
        let inputObject = this.inputObject[inputId]
        if (!Utils.isObject(inputObject)) return false
        return inputObject.loaded
    },
    loadInput (inputId) {
        if (inputId === InvalidId) return
        if (this.isInputIdLoaded(inputId)) return
        let inputObject = this.inputObject[inputId]
        let type = inputObject.json.type
        let inputType = this.inputType[type]
        inputObject.loaded = true
        if (!Array.isArray(this.typedInputList[type])) this.typedInputList[type] = []
        this.typedInputList[type].push(inputId)
        if (typeof inputType.cb.onLoad === 'function') {
            inputType.cb.onLoad(inputObject.json, inputObject.toolsCb, inputObject.cache)
        }
    },
    unloadInput (inputId) {
        if (!this.isInputIdLoaded(inputId)) return
        let inputObject = this.inputObject[inputId]
        let type = inputObject.json.type
        let inputType = this.inputType[type]
        if (typeof inputType.cb.onUnload === 'function') {
            inputType.cb.onUnload(inputObject.json, inputObject.toolsCb, inputObject.cache)
        }
        if (typeof inputObject.onUnload === 'function') {
            inputObject.onUnload()
        }
        delete this.inputObject[inputId]
        let list = this.typedInputList[type]
        let index = list.indexOf(inputId)
        if (index >= 0) list.splice(index, 1)
    },
    callInputTypeCb (inputId, method, extraInfo) {
        if (!this.isInputIdLoaded(inputId)) return null
        if (!Utils.isObject(extraInfo)) extraInfo = {}
        let methods = [
            'onCustomCall', 'onPacket', 'onTick'
        ]
        if (methods.indexOf(method) < 0) return
        let inputObject = this.inputObject[inputId]
        let type = inputObject.json.type
        let inputType = this.inputType[type]
        if (typeof inputType.cb[method] === 'function') {
            return inputType.cb[method](inputObject.json, inputObject.toolsCb, inputObject.cache, extraInfo)
        }
        return null
    },
    getPlayerListByInputId (inputId, online) {
        if (!this.isInputIdLoaded(inputId)) return null
        let inputObject = this.inputObject[inputId]
        if (typeof inputObject.toolsCb.getPlayerList === 'function') {
            return inputObject.toolsCb.getPlayerList(Boolean(online))
        }
        return []
    },
    getInputJsonByInputId (inputId) {
        if (!this.isInputIdLoaded(inputId)) return null
        let inputObject = this.inputObject[inputId]
        return Utils.deepCopy(inputObject.json)
    },
    outputType: {},
    setOutputType (type, name, outputTypeCb, config) {
        if (!Utils.isObject(this.outputType[type])) {
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
            'getIcon', 'getDesc', 'onEdit'
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
        for (let type in this.inputType) {
            if (Utils.isObject(this.inputType[type])) {
                ret.push(type)
            }
        }
        return ret
    },
    getOutputTypeName (type) {
        let outputType = this.outputType[type]
        if (!Utils.isObject(outputType)) return ''
        return TranAPI.translate(outputType.name)
    },
    getOutputTypeCb (type) {
        let outputType = this.outputType[type]
        if (!Utils.isObject(outputType)) return {}
        let cb = {}
        for (let method in outputType.cb) {
            cb[method] = outputType.cb[method]
        }
        return cb
    },
    getOutputTypeConfig (type) {
        let outputType = this.outputType[type]
        if (!Utils.isObject(outputType)) return null
        return Utils.deepCopy(outputType.config)
    },
    outputObject: {},
    typedOutputList: {},
    getAllOutputIdByType (type) {
        let that = this
        if (typeof type === 'string') type = [type]
        let ret = []
        type.forEach(function (type) {
            if (Array.isArray(that.typedOutputList[type])) {
                ret = ret.concat(that.typedOutputList[type])
            }
        })
        return ret
    },
    createOutputId (outputJson, toolsCb, onUnload) {
        if (!Utils.isObject(outputJson)) return InvalidId
        if (!Utils.isObject(toolsCb)) return InvalidId
        if (typeof toolsCb.getState !== 'function') return InvalidId
        if (toolsCb.getState().state === EnumObject.outputState.received) return InvalidId
        outputJson = Utils.deepCopy(outputJson)
        let type = outputJson.type
        let outputType = this.outputType[type]
        if (!Utils.isObject(outputType)) return InvalidId
        let outputId = Utils.getUUID()
        while (this.isOutputIdLoaded(outputId)) outputId = Utils.getUUID()
        this.outputObject[outputId] = {
            loaded: false,
            cache: {},
            json: outputJson,
            toolsCb: toolsCb,
            onUnload: onUnload
        }
        return outputId
    },
    isOutputIdLoaded (outputId) {
        if (typeof outputId !== 'string') return false
        if (outputId === InvalidId) return false
        let outputObject = this.outputObject[outputId]
        if (!Utils.isObject(outputObject)) return false
        return outputObject.loaded
    },
    loadOutput (outputId) {
        if (outputId === InvalidId) return
        if (this.isOutputIdLoaded(outputId)) return
        let outputObject = this.outputObject[outputId]
        let type = outputObject.json.type
        let outputType = this.outputType[type]
        outputObject.loaded = true
        if (!Array.isArray(this.typedOutputList[type])) this.typedOutputList[type] = []
        this.typedOutputList[type].push(outputId)
        if (typeof outputType.cb.onLoad === 'function') {
            outputType.cb.onLoad(outputObject.json, outputObject.toolsCb, outputObject.cache)
        }
    },
    unloadOutput (outputId) {
        if (!this.isOutputIdLoaded(outputId)) return
        let outputObject = this.outputObject[outputId]
        let type = outputObject.json.type
        let outputType = this.outputType[type]
        if (typeof outputType.cb.onUnload === 'function') {
            outputType.cb.onUnload(outputObject.json, outputObject.toolsCb, outputObject.cache)
        }
        if (typeof outputObject.onUnload === 'function') {
            outputObject.onUnload()
        }
        delete this.outputObject[outputId]
        let list = this.typedOutputList[type]
        let index = list.indexOf(outputId)
        if (index >= 0) list.splice(index, 1)
    },
    callOutputTypeCb (outputId, method, extraInfo) {
        if (!this.isOutputIdLoaded(outputId)) return null
        if (!Utils.isObject(extraInfo)) extraInfo = {}
        let methods = [
            'onCustomCall', 'onPacket', 'onReceive', 'onFastReceive'
        ]
        if (methods.indexOf(method) < 0) return
        let outputObject = this.outputObject[outputId]
        let type = outputObject.json.type
        let outputType = this.outputType[type]
        if (typeof outputType.cb[method] === 'function') {
            return outputType.cb[method](outputObject.json, outputObject.toolsCb, outputObject.cache, extraInfo)
        }
        return null
    },
    getPlayerListByOutputId (outputId, online) {
        if (!this.isOutputIdLoaded(outputId)) return null
        let outputObject = this.outputObject[outputId]
        if (typeof outputObject.toolsCb.getPlayerList === 'function') {
            return outputObject.toolsCb.getPlayerList(Boolean(online))
        }
        return []
    },
    getOutputJsonByOutputId (outputId) {
        if (!this.isOutputIdLoaded(outputId)) return null
        let outputObject = this.outputObject[outputId]
        return Utils.deepCopy(outputObject.json)
    }
}

Callback.addCallback('LocalTick', function () {
    /* 0.5s */
    if (Math.random() * 10 < 1 && !Network.inRemoteWorld()) {
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
            Utils.log('Error in Callback \'LocalTick\' (IOTypeTools.js):\n' + err, 'ERROR', true)
        }
    }
})

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
