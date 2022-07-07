/// <reference path='../interaction.js'/>

IOTypeTools.setInputType('visit_dimension', {
    en: 'visit dimension'
}, {
    resolveJson (inputJson, refsArray, bitmapNameObject) {
        inputJson.icon = Utils.deepCopy(Utils.resolveRefs(inputJson.icon, refsArray))
        if (!Utils.isObject(inputJson.icon)) inputJson.icon = {}
        if (typeof inputJson.dimension !== 'number') {
            if (typeof inputJson.dimension !== 'string') return null
            try {
                let dimension = Dimensions.getDimensionByName(inputJson.dimension)
                if (!Utils.isObject(dimension)) return null
                inputJson.dimension = dimension.id
            } catch (err) {
                return null
            }
        }
        return inputJson
    },
    onCustomCall (inputJson, toolsCb, cache, extraInfo) {
        if (typeof extraInfo.dimension !== 'number') return
        if (extraInfo.dimension !== inputJson.dimension) return
        toolsCb.setState({}, {
            state: EnumObject.inputState.finished
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
    allowRepeat: false,
    allowGroup: true
})

Callback.addCallback('CustomDimensionTransfer', function (entity, from, to) {
    if (!Player.isPlayer(entity)) return
    let saveId = ServerSystem.getSaveId(entity)
    let inputIdArray = ServerSystem.getTypedInputId(saveId, 'visit_dimension')
    inputIdArray.forEach(function (inputId) {
        IOTypeTools.callInputTypeCb(inputId, 'onCustomCall', {
            dimension: to
        })
    })
})
