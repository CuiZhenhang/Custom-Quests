/// <reference path='../IOTypeTools.js'/>

IOTypeTools.setInputType('kill', TranAPI.getTranslation('inputType.kill'), {
    resolveJson (inputJson, refsArray, bitmapNameObject) {
        inputJson.icon = Utils.resolveIconJson(inputJson.icon, refsArray, bitmapNameObject)
        if (typeof inputJson.entityId !== 'number') return null
        if (typeof inputJson.count !== 'number' || inputJson.count < 1) inputJson.count = 1
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
        stateObj.count = count
        if (count >= inputJson.count) {
            stateObj.state = EnumObject.inputState.finished
            stateObj.count = 0
        }
        toolsCb.setState({}, stateObj)
    },
    getIcon (inputJson, toolsCb, extraInfo) {
        let stateObj = toolsCb.getState()
        let finished = stateObj.state === EnumObject.inputState.finished
        let pos = extraInfo.pos
        let source = Utils.transferItemFromJson(inputJson.icon)
        source.count = 1
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: (typeof inputJson.icon.bitmap === 'string') ? inputJson.icon.bitmap : 'cq_clear',
                source: source,
                clicker: {
                    onLongClick: typeof toolsCb.openDescription === 'function' ? Utils.debounce(toolsCb.openDescription, 500) : null
                }
            }],
            [extraInfo.prefix + 'text', {
                type: 'text',
                x: pos[0] + (40 / 80) * extraInfo.size,
                y: pos[1] + (40 / 80) * extraInfo.size,
                z: 2,
                text: Number(finished ? inputJson.count : (stateObj.count || 0)) + '/' + Number(inputJson.count),
                font: { color: android.graphics.Color.WHITE, size: (20 / 80) * extraInfo.size, align: 1 }
            }]
        ]
    },
    getDescription (inputJson, toolsCb, extraInfo) {
        let stateObj = toolsCb.getState()
        let finished = stateObj.state === EnumObject.inputState.finished
        let prefix = extraInfo.prefix
        let maxY = extraInfo.posY + 140
        let elements = [
            [prefix + 'text', {
                type: 'text', x: 500, y: extraInfo.posY - 10, text: TranAPI.translate('inputType.kill.text'),
                font: { color: android.graphics.Color.BLACK, size: 30, align: 1 }
            }],
            [prefix + 'id', {
                type: 'text', x: 500, y: extraInfo.posY + 30,
                text: Utils.replace(TranAPI.translate('inputType.kill.entity'), [
                    ['{id}', inputJson.entityId],
                    ['{count}', inputJson.count]
                ]),
                font: { color: android.graphics.Color.GRAY, size: 30, align: 1 }
            }],
            [prefix + 'data', {
                type: 'text', x: 500, y: extraInfo.posY + 70,
                text: Utils.replace(TranAPI.translate('inputType.kill.killed'), [
                    ['{count}', Number(finished ? inputJson.count : (stateObj.count || 0))]
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
    allowRepeat: true,
    allowGroup: true
})

Callback.addCallback('EntityDeath', function (entity, attacker) {
    if (Entity.getType(attacker) !== EEntityType.PLAYER) return
    let type = Entity.getType(entity)
    let saveId = ServerSystem.getSaveId(attacker)
    let inputIdArray = IOTypeTools.getAllInputIdByType('kill', saveId)
    inputIdArray.forEach(function (inputId) {
        IOTypeTools.callInputTypeCb(inputId, 'onCustomCall', {
            type: type
        })
    })
})
