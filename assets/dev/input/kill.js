/// <reference path='../Integration.js'/>

IOTypeTools.setInputType('kill', {
    en: 'kill'
}, {
    resolveJson (inputJson, refsArray, bitmapNameObject) {
        inputJson.icon = Utils.resolveIconJson(inputJson.icon, refsArray, bitmapNameObject)
        if (typeof inputJson.entityId !== 'number') return null
        if (typeof inputJson.count !== 'number' || inputJson.count < 0) inputJson.count = 1
        return inputJson
    },
    onLoad (inputJson, toolsCb, cache) {
        let count = toolsCb.getState().count || 0
        if (count >= inputJson.count) {
            toolsCb.setState({}, {
                state: EnumObject.inputState.finished,
                count: 0
            })
        }
    },
    onCustomCall (inputJson, toolsCb, cache, extraInfo) {
        if (typeof extraInfo.type !== 'number') return
        if (extraInfo.type !== inputJson.entityId) return
        let stateObj = toolsCb.getState()
        let count = stateObj.count || 0
        count += 1
        if (count >= inputJson.count) stateObj.state = EnumObject.inputState.finished
        stateObj.count = 0
        toolsCb.setState({}, stateObj)
    },
    getIcon (inputJson, toolsCb, extraInfo) {
        let pos = extraInfo.pos
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: (typeof inputJson.icon.bitmap === 'string') ? inputJson.icon.bitmap : 'clear',
                source: Utils.transferItemFromJson(inputJson.icon),
                clicker: {}
            }]
        ]
    },
    getDesc (inputJson, toolsCb, extraInfo) {
        
    }
}, {
    allowRepeat: true,
    allowGroup: true
})

Callback.addCallback('EntityDeath', function (entity, attacker) {
    if (!Player.isPlayer(attacker)) return
    let type = Entity.getType(entity)
    let saveId = ServerSystem.getSaveId(attacker)
    let inputIdArray = ServerSystem.getTypedInputId(saveId, 'kill')
    inputIdArray.forEach(function (inputId) {
        IOTypeTools.callInputTypeCb(inputId, 'onCustomCall', {
            type: type
        })
    })
})
