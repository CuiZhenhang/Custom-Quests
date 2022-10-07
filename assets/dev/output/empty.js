/// <reference path='../IOTypeTools.js'/>

IOTypeTools.setOutputType('empty', TranAPI.getTranslation('outputType.empty'), {
    resolveJson (outputJson, refsArray, bitmapNameObject) {
        return outputJson
    },
    onLoad (outputJson, toolsCb, cache) {
        toolsCb.setState({}, {
            state: EnumObject.outputState.received
        })
    },
    getIcon (outputJson, toolsCb, extraInfo) {
        let pos = extraInfo.pos
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: 'reward_empty',
                clicker: {
                    onLongClick: typeof toolsCb.openDescription === 'function' ? Utils.debounce(toolsCb.openDescription, 500) : null
                }
            }]
        ]
    },
    getDescription (outputJson, toolsCb, extraInfo) {
        let prefix = extraInfo.prefix
        let maxY = extraInfo.posY + 60
        let elements = [
            [prefix + 'text', {
                type: 'text', x: 500, y: extraInfo.posY - 10, text: TranAPI.translate('outputType.empty.text'),
                font: { color: android.graphics.Color.BLACK, size: 30, align: 1 }
            }]
        ]
        QuestUiTools.resolveText(TranAPI.translate(outputJson.description), function (str) {
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
    allowRepeat: true,
    allowGroup: true
})
