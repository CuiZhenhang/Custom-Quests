/// <reference path='./Utils.js'/>

/** @type { IOTypeTools } */
const IOTypeTools = {
    inputType: {},
    setInputType (type, inputTypeCb, config) {
        const that = this
        if (!Utils.isObject(this.inputType[type])) {
            this.inputType[type] = {
                cb: {},
                config: {
                    allowGroup: false,
                    allowRepeat: false
                }
            }
        }
        const methods = [
            'onLoad', 'onUnload',
            'getIcon', 'getDesc',
            'onEdit', 'onTick',
            'resolveJson'
        ]
        methods.forEach((method) => {
            if (typeof inputTypeCb[method] === 'function') {
                that.inputType[type].cb[method] = inputTypeCb[method]
            } else if (inputTypeCb[method] === null) {
                that.inputType[type].cb[method] = null
            }
        })
        if (Utils.isObject(config)) {
            if (typeof config.allowGroup === 'boolean') {
                this.inputType[type].config.allowGroup = config.allowGroup
            }
            if (typeof config.allowRepeat === 'boolean') {
                this.inputType[type].config.allowRepeat = config.allowRepeat
            }
            if (typeof config.operatorOnly === 'string') {
                this.inputType[type].config.operatorOnly = config.operatorOnly
            }
        }
    },
    getInputTypeCb (type) {
        const obj = this.inputType[type]
        if (!Utils.isObject(obj)) return {}
        const cb = {}
        for (const method in obj.cb) {
            cb[method] = obj.cb[method]
        }
        return cb
    },
    getInputTypeConfig (type) {
        const obj = this.inputType[type]
        if (!Utils.isObject(obj)) return null
        return Utils.deepCopy(obj.config)
    },
    inputObject: {},
    typedInputList: {},
    getAllInputByType (type) {
        const that = this
        if (typeof type === 'string') type = [type]
        let ret = []
        type.forEach(function (type) {
            if (Array.isArray(that.typedInputList[type])) {
                ret = ret.concat(that.typedInputList[type])
            }
        })
        return ret
    },
    loadInput (inputJson, toolsCb, onUnload) {
        if (!Utils.isObject(inputJson)) return
        if (!Utils.isObject(toolsCb)) toolsCb = {}
        inputJson = Utils.deepCopy(inputJson)
        const type = inputJson.type
        const inputType = this.inputType[type]
        if (!Utils.isObject(inputType)) return
        const inputId = Utils.getRandomString()
        if (!Array.isArray(this.typedInputList[type])) this.typedInputList[type] = []
        this.typedInputList[type].push(inputId)
        this.inputObject[inputId] = {
            cache: {},
            json: inputJson,
            toolsCb: toolsCb,
            onUnload: onUnload
        }
        if (typeof inputType.cb.onLoad === 'function') {
            inputType.cb.onLoad(inputJson, toolsCb, this.inputObject[inputId].cache)
        }
    },
    isInputLoaded (inputId) {
        if (typeof inputId !== 'string') return false
        if (inputId === InvalidId) return false
        const inputObject = this.inputObject[inputId]
        return Utils.isObject(inputObject)
    },
    unloadInput (inputId) {
        if (!this.isInputLoaded(inputId)) return
        const inputObject = this.inputObject[inputId]
        const type = inputObject.json.type
        const inputType = this.inputType[type]
        if (typeof inputType.cb.onUnload === 'function') {
            inputType.cb.onUnload(inputObject.json, inputObject.toolsCb, inputObject.cache)
        }
        if (typeof inputObject.onUnload === 'function') {
            inputObject.onUnload()
        }
        this.inputObject[inputId] = null
        const list = this.typedInputList[type]
        const index = list.indexOf(inputId)
        if (index !== -1) {
            list.splice(index, 1)
        }
    },
    callInputTypeCb (inputId, method, extraInfo) {
        if (!this.isInputLoaded(inputId)) return null
        const inputObject = this.inputObject[inputId]
        const type = inputObject.json.type
        const inputType = this.inputType[type]
        if (typeof inputType.cb[method] === 'function') {
            return inputType.cb[method](inputObject.json, inputObject.toolsCb, inputObject.cache, extraInfo)
        }
        return null
    },
    getPlayerListByInputId (inputId, online) {
        if (!this.isInputLoaded(inputId)) return null
        const inputObject = this.inputObject[inputId]
        if (typeof inputObject.toolsCb.getPlayerList === 'function') {
            return inputObject.toolsCb.getPlayerList(Boolean(online))
        }
        return []
    },
    getInputJsonByInputId (inputId) {
        if (!this.isInputLoaded(inputId)) return null
        const inputObject = this.inputObject[inputId]
        return Utils.deepCopy(inputObject.json)
    },
    outputType: {},
    setOutputType (type, outputTypeCb, config) {
        const that = this
        if (!Utils.isObject(this.outputType[type])) {
            this.outputType[type] = {
                cb: {},
                config: {
                    allowGroup: false,
                    allowRepeat: false,
                    operatorOnly: 'player'
                }
            }
        }
        const methods = [
            'onLoad', 'onUnload',
            'getIcon', 'getDesc',
            'onEdit', 'onReceive',
            'onFastReceive', 'resolveJson'
        ]
        methods.forEach((method) => {
            if (typeof outputTypeCb[method] === 'function') {
                that.outputType[type].cb[method] = outputTypeCb[method]
            } else if (outputTypeCb[method] === null) {
                that.outputType[type].cb[method] = null
            }
        })
        if (Utils.isObject(config)) {
            if (typeof config.allowGroup === 'boolean') {
                this.outputType[type].config.allowGroup = config.allowGroup
            }
            if (typeof config.allowRepeat === 'boolean') {
                this.outputType[type].config.allowRepeat = config.allowRepeat
            }
            if (typeof config.operatorOnly === 'string') {
                this.outputType[type].config.operatorOnly = config.operatorOnly
            }
        }
    },
    getOutputTypeCb (type) {
        const obj = this.outputType[type]
        if (!Utils.isObject(obj)) return {}
        const cb = {}
        for (const method in obj.cb) {
            cb[method] = obj.cb[method]
        }
        return cb
    },
    getOutputTypeCb (type) {
        const obj = this.outputType[type]
        if (!Utils.isObject(obj)) return null
        return Utils.deepCopy(obj.config)
    },
    outputObject: {},
    typedOutputList: {},
    getAllOutputByType () {
        const that = this
        if (typeof type === 'string') type = [type]
        let ret = []
        type.forEach(function (type) {
            if (Array.isArray(that.typedOutputList[type])) {
                ret = ret.concat(that.typedOutputList[type])
            }
        })
        return ret
    },
    loadOutput (outputJson, toolsCb, onUnload) {
        if (!Utils.isObject(outputJson)) return
        if (!Utils.isObject(toolsCb)) toolsCb = {}
        outputJson = Utils.deepCopy(outputJson)
        const type = outputJson.type
        const outputType = this.outputType[type]
        if (!Utils.isObject(outputType)) return
        const outputId = Utils.getRandomString()
        if (!Array.isArray(this.typedOutputList[type])) this.typedOutputList[type] = []
        this.typedOutputList[type].push(outputId)
        this.outputObject[outputId] = {
            cache: {},
            json: outputJson,
            toolsCb: toolsCb,
            onUnload: onUnload
        }
        if (typeof outputType.cb.onLoad === 'function') {
            outputType.cb.onLoad(outputJson, toolsCb, this.outputObject[outputId].cache)
        }
    },
    isOutputLoaded (outputId) {
        if (typeof outputId !== 'string') return false
        if (outputId === InvalidId) return false
        const outputObject = this.outputObject[outputId]
        return Utils.isObject(outputObject)
    },
    unloadOutput (outputId) {
        if (!this.isOutputLoaded(outputId)) return
        const outputObject = this.outputObject[outputId]
        const type = outputObject.json.type
        const outputType = this.outputType[type]
        if (typeof outputType.cb.onUnload === 'function') {
            outputType.cb.onUnload(outputObject.json, outputObject.toolsCb, outputObject.cache)
        }
        if (typeof outputObject.onUnload === 'function') {
            outputObject.onUnload()
        }
        this.outputObject[outputId] = null
        const list = this.typedOutputList[type]
        const index = list.indexOf(outputId)
        if (index !== -1) {
            list.splice(index, 1)
        }
    },
    callOutputTypeCb (outputId, method, extraInfo) {
        if (!this.isOutputLoaded(outputId)) return null
        const outputObject = this.outputObject[outputId]
        const type = outputObject.json.type
        const outputType = this.outputType[type]
        if (typeof outputType.cb[method] === 'function') {
            return outputType.cb[method](outputObject.json, outputObject.toolsCb, outputObject.cache, extraInfo)
        }
        return null
    },
    getPlayerListByOutputId (outputId, online) {
        if (!this.isOutputLoaded(outputId)) return null
        const outputObject = this.outputObject[outputId]
        if (typeof outputObject.toolsCb.getPlayerList === 'function') {
            return outputObject.toolsCb.getPlayerList(Boolean(online))
        }
        return []
    },
    getOutputJsonByOutputId (outputId) {
        if (!this.isOutputLoaded(outputId)) return null
        const outputObject = this.outputObject[outputId]
        return Utils.deepCopy(outputObject.json)
    }
}

Callback.addCallback('LocalTick', function () {
    if (Math.random() * 10 < 1 && !Network.inRemoteWorld()) {
        try {
            const playerList = Network.getConnectedPlayers()
            const playerInventory = {}
            for (let i = 0; i < playerList.length; i++) {
                const player = playerList[i]
                const inventory = Utils.getInventory(player)
                const sortInventory = Utils.getSortInventory(inventory)
                const extraInventory = Utils.getExtraInventory(inventory)
                playerInventory[player] = {
                    player: player,
                    sortInventory: sortInventory,
                    extraInventory: extraInventory
                }
            }
            for (const type in IOTypeTools.typedInputList) {
                if (typeof IOTypeTools.getInputTypeCb(type).onTick !== 'function') continue
                IOTypeTools.typedInputList[type].forEach(function (inputId) {
                    const playerInventoryArray = []
                    IOTypeTools.getPlayerListByInputId(inputId, true).forEach(function (player) {
                        playerInventoryArray.push(playerInventory[player])
                    })
                    IOTypeTools.callInputTypeCb(inputId, 'onTick', {
                        playerInventory: playerInventoryArray
                    })
                })
            }
        } catch (err) {
            Utils.log('Error in Callback \'ServerPlayerTick\':\n' + err, 'ERROR', true)
        }
    }
})

Callback.addCallback('LevelLeft', function () {
    if (Network.inRemoteWorld()) return
    for (const type in IOTypeTools.typedInputList) {
        IOTypeTools.typedInputList[type].forEach(function (inputId) {
            IOTypeTools.unloadOutput(inputId)
        })
    }
    IOTypeTools.inputObject = {}
    for (const type in IOTypeTools.typedOutputList) {
        IOTypeTools.typedOutputList[type].forEach(function (outputId) {
            IOTypeTools.unloadOutput(outputId)
        })
    }
    IOTypeTools.outputObject = {}
})
