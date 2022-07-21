/// <reference path='../Integration.js'/>

IOTypeTools.setInputType('location', {
    en: 'location'
}, {
    resolveJson (inputJson, refsArray, bitmapNameObject) {
        inputJson.icon = Utils.resolveIconJson(inputJson.icon, refsArray, bitmapNameObject)
        if (!Array.isArray(inputJson.pos)) return null
        if (!Array.isArray(inputJson.radius)) inputJson.radius = [1, 1, 1]
        if (!inputJson.ignoreDimension) {
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
        }
        return inputJson
    },
    onLoad (inputJson, toolsCb, cache) {
        cache.x = [
            Number(inputJson.pos[0]) - Number(inputJson.radius[0]),
            Number(inputJson.pos[0]) + Number(inputJson.radius[0])
        ]
        cache.y = [
            Number(inputJson.pos[1]) - Number(inputJson.radius[1]),
            Number(inputJson.pos[1]) + Number(inputJson.radius[1])
        ]
        cache.z = [
            Number(inputJson.pos[2]) - Number(inputJson.radius[2]),
            Number(inputJson.pos[2]) + Number(inputJson.radius[2])
        ]
    },
    onTick (inputJson, toolsCb, cache, extraInfo) {
        let playerList = toolsCb.getPlayerList(true)
        let succ = playerList.some(function (player) {
            if (!inputJson.ignoreDimension) {
                if (Entity.getDimension(player) !== inputJson.dimension) {
                    return false
                }
            }
            let pos = Entity.getPosition(player)
            if (pos.x < cache.x[0] || pos.x > cache.x[1]) return false
            if (pos.y < cache.y[0] || pos.y > cache.y[1]) return false
            if (pos.z < cache.z[0] || pos.z > cache.z[1]) return false
            return true
        })
        if (succ) {
            toolsCb.setState({}, {
                state: EnumObject.inputState.finished
            })
        }
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
    allowRepeat: false,
    allowGroup: true
})
