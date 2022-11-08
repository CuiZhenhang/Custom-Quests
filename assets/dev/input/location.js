/// <reference path='../IOTypeTools.js'/>

IOTypeTools.setInputType('location', TranAPI.getTranslation('inputType.location'), {
    resolveJson (inputJson, refsArray, bitmapNameObject) {
        inputJson.icon = Utils.resolveIconJson(inputJson.icon, refsArray, bitmapNameObject)
        if (!Array.isArray(inputJson.pos)) return null
        if (!Array.isArray(inputJson.radius)) inputJson.radius = [1, 1, 1]
        if (!inputJson.ignoreDimension) {
            if (typeof inputJson.dimension !== 'number') {
                let ignoreDimension = true
                do {
                    if (typeof inputJson.dimension !== 'string') break
                    try {
                        let dimension = Dimensions.getDimensionByName(inputJson.dimension)
                        if (!dimension) break
                        inputJson.dimension = dimension.id
                        ignoreDimension = false
                    } catch (err) {
                        break
                    }
                } while (false)
                if (ignoreDimension) inputJson.ignoreDimension = true
            }
        }
        return inputJson
    },
    onLoad (inputJson, toolsCb, cache) {
        cache.x = [
            Number(inputJson.pos[0]) - Number(inputJson.radius[0]),
            Number(inputJson.pos[0]) + Number(inputJson.radius[0]),
            Number(inputJson.radius[0]) >= 0
        ]
        cache.y = [
            Number(inputJson.pos[1]) - Number(inputJson.radius[1]),
            Number(inputJson.pos[1]) + Number(inputJson.radius[1]),
            Number(inputJson.radius[1]) >= 0
        ]
        cache.z = [
            Number(inputJson.pos[2]) - Number(inputJson.radius[2]),
            Number(inputJson.pos[2]) + Number(inputJson.radius[2]),
            Number(inputJson.radius[2]) >= 0
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
            if (cache.x[2] && (pos.x < cache.x[0] || pos.x > cache.x[1])) return false
            if (cache.y[2] && (pos.y < cache.y[0] || pos.y > cache.y[1])) return false
            if (cache.z[2] && (pos.z < cache.z[0] || pos.z > cache.z[1])) return false
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
                bitmap: (typeof inputJson.icon.bitmap === 'string') ? inputJson.icon.bitmap : 'cq_clear',
                source: Utils.transferItemFromJson(inputJson.icon),
                clicker: {
                    onLongClick: typeof toolsCb.openDescription === 'function' ? Utils.debounce(toolsCb.openDescription, 500) : null
                }
            }]
        ]
    },
    getDescription (inputJson, toolsCb, extraInfo) {
        let pos = {
            x: Number(inputJson.radius[0]) >= 0 ? [
                Number(inputJson.pos[0]) - Number(inputJson.radius[0]),
                Number(inputJson.pos[0]) + Number(inputJson.radius[0])
            ].join(' ~ ') : TranAPI.translate('inputType.location.ignore'),
            y: Number(inputJson.radius[1]) >= 0 ? [
                Number(inputJson.pos[1]) - Number(inputJson.radius[1]),
                Number(inputJson.pos[1]) + Number(inputJson.radius[1])
            ].join(' ~ ') : TranAPI.translate('inputType.location.ignore'),
            z: Number(inputJson.radius[2]) >= 0 ? [
                Number(inputJson.pos[2]) - Number(inputJson.radius[2]),
                Number(inputJson.pos[2]) + Number(inputJson.radius[2])
            ].join(' ~ ') : TranAPI.translate('inputType.location.ignore')
        }
        let prefix = extraInfo.prefix
        let maxY = extraInfo.posY + 220
        let elements = [
            [prefix + 'text', {
                type: 'text', x: 500, y: extraInfo.posY - 10, text: TranAPI.translate('inputType.location.text'),
                font: { color: android.graphics.Color.BLACK, size: 30, align: 1 }
            }],
            [prefix + 'pos_x', {
                type: 'text', x: 500, y: extraInfo.posY + 30, text: 'x: [' + pos.x + ']',
                font: { color: android.graphics.Color.GRAY, size: 30, align: 1 }
            }],
            [prefix + 'pos_y', {
                type: 'text', x: 500, y: extraInfo.posY + 70, text: 'y: [' + pos.y + ']',
                font: { color: android.graphics.Color.GRAY, size: 30, align: 1 }
            }],
            [prefix + 'pos_z', {
                type: 'text', x: 500, y: extraInfo.posY + 110, text: 'z: [' + pos.z + ']',
                font: { color: android.graphics.Color.GRAY, size: 30, align: 1 }
            }],
            [prefix + 'id', {
                type: 'text', x: 500, y: extraInfo.posY + 150,
                text: Utils.replace(TranAPI.translate('inputType.location.dimensionId'), [
                    ['{id}', inputJson.ignoreDimension ? TranAPI.translate('inputType.location.ignoreDimension') : inputJson.dimension]
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
    allowRepeat: false,
    allowGroup: true
})
