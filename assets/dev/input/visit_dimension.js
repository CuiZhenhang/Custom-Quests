/// <reference path='../IOTypeTools.js'/>

IOTypeTools.setInputType('visit_dimension', TranAPI.getTranslation('inputType.visit_dimension'), {
    resolveJson (inputJson, refsArray, bitmapNameObject) {
        inputJson.icon = Utils.resolveIconJson(inputJson.icon, refsArray, bitmapNameObject)
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
    onTick (inputJson, toolsCb, cache, extraInfo) {
        let playerList = toolsCb.getPlayerList(true)
        let succ = playerList.some(function (player) {
            return Entity.getDimension(player) === inputJson.dimension
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
        let prefix = extraInfo.prefix
        let maxY = extraInfo.posY + 100
        let elements = [
            [prefix + 'text', {
                type: 'text', x: 500, y: extraInfo.posY - 10, text: TranAPI.translate('inputType.visit_dimension.text'),
                font: { color: android.graphics.Color.BLACK, size: 30, align: 1 }
            }],
            [prefix + 'id', {
                type: 'text', x: 500, y: extraInfo.posY + 30,
                text: Utils.replace(TranAPI.translate('inputType.visit_dimension.dimensionId'), [
                    ['{id}', inputJson.dimension]
                ]),
                font: { color: android.graphics.Color.GRAY, size: 30, align: 1 }
            }]
        ]
        QuestUiTools.resolveText(TranAPI.translate(inputJson.description), function (str) {
            if (typeof str !== 'string') return 1
            return QuestUiTools.getTextWidth(str, 30) / 900
        }).forEach(function (str, index) {
            elements.push([prefix + 'desc_' + index, {
                type: 'text', x: 50, y: maxY, text: str,
                font: { color: android.graphics.Color.BLACK, size: 30 }
            }])
            maxY += 40
        })
        maxY += 20
        return {
            maxY: maxY,
            elements: elements
        }
    }
}, {
    allowRepeat: false,
    allowGroup: true
})
