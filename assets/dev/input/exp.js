/// <reference path='../IOTypeTools.js'/>

IOTypeTools.setInputType('exp', TranAPI.getTranslation('inputType.exp'), {
    resolveJson (inputJson, refsArray, bitmapNameObject) {
        if (typeof inputJson.value !== 'number' || inputJson.value < 0) inputJson.value = 1
        return inputJson
    },
    onLoad (inputJson, toolsCb, cache) {
        if (inputJson.submit) {
            let value = toolsCb.getState().value || 0
            if (value >= inputJson.value) {
                toolsCb.setState({}, {
                    state: EnumObject.inputState.finished,
                    value: 0
                })
            }
        }
    },
    onPacket (inputJson, toolsCb, cache, extraInfo) {
        if (!inputJson.submit) return
        if (extraInfo.packetData.type !== 'submit') return
        let player = extraInfo.client.getPlayerUid()
        let actor = new PlayerActor(player)
        let stateObj = toolsCb.getState()
        let value = stateObj.value || 0
        if (inputJson.isLevel) {
            let level = actor.getLevel()
            if (value + level < inputJson.value) {
                value += level
                actor.setLevel(0)
            } else {
                let cost = inputJson.value - value
                value = inputJson.value
                actor.setLevel(level - cost)
            }
        } else {
            let exp = actor.getExperience()
            if (value + exp < inputJson.value) {
                value += exp
                actor.setExperience(0)
            } else {
                let cost = inputJson.value - value
                value = inputJson.value
                actor.setExperience(exp - cost)
            }
        }
        if (value !== (stateObj.value || 0)) {
            stateObj.value = value
            if (value >= inputJson.value) {
                stateObj.state = EnumObject.inputState.finished
                stateObj.value = 0
            }
            toolsCb.setState({}, stateObj)
        }
    },
    onTick (inputJson, toolsCb, cache, extraInfo) {
        if (inputJson.submit) return
        let playerList = toolsCb.getPlayerList(true)
        let succ = playerList.some(function (player) {
            let actor = new PlayerActor(player)
            if (inputJson.isLevel) return actor.getLevel() >= inputJson.value
            else return actor.getExperience() >= inputJson.value
        })
        if (succ) {
            toolsCb.setState({}, {
                state: EnumObject.inputState.finished
            })
        }
    },
    getIcon (inputJson, toolsCb, extraInfo) {
        let stateObj = toolsCb.getState()
        let finished = stateObj.state === EnumObject.inputState.finished
        let submit = inputJson.submit
        let pos = extraInfo.pos
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: 'cq_clear', source: {
                    id: VanillaItemID.experience_bottle,
                    count: submit ? 1 : inputJson.value
                },
                clicker: {
                    onClick: (submit && !finished) ? Utils.debounce(function () {
                        if (toolsCb.getState().state === EnumObject.inputState.finished) return
                        if (typeof toolsCb.sendPacket === 'function') toolsCb.sendPacket({ type: 'submit' })
                    }, 500) : null,
                    onLongClick: typeof toolsCb.openDescription === 'function' ? Utils.debounce(toolsCb.openDescription, 500) : null
                }
            }],
            [extraInfo.prefix + 'text', submit ? {
                type: 'text',
                x: pos[0] + (40 / 80) * extraInfo.size,
                y: pos[1] + (40 / 80) * extraInfo.size,
                z: 2,
                text: Number(finished ? inputJson.value : (stateObj.value || 0)) + '/' + Number(inputJson.value),
                font: { color: android.graphics.Color.WHITE, size: (20 / 80) * extraInfo.size, align: 1 }
            } : null]
        ]
    },
    getDescription (inputJson, toolsCb, extraInfo) {
        let prefix = extraInfo.prefix
        let maxY = extraInfo.posY + 190
        let elements = [
            [prefix + 'slot', {
                type: 'slot', visual: true, x: 440, y: extraInfo.posY + 10, size: 120,
                bitmap: 'cq_clear', source: {
                    id: VanillaItemID.experience_bottle,
                    count: inputJson.value
                }
            }],
            [prefix + 'text', {
                type: 'text', x: 500, y: extraInfo.posY + 120,
                text: TranAPI.translate(inputJson.isLevel ? 'inputType.exp.isLevel' : 'inputType.exp.notLevel'),
                font: { color: android.graphics.Color.GRAY, size: 30, align: 1 }
            }]
        ]
        if (inputJson.submit) {
            let stateObj = toolsCb.getState()
            let finished = stateObj.state === EnumObject.inputState.finished
            elements.push([prefix + 'submit', {
                type: 'text', x: 500, y: maxY - 30,
                text: Utils.replace(TranAPI.translate('inputType.exp.submited'), [
                    ['{value}', finished ? inputJson.value : (stateObj.value || 0)]
                ]),
                font: { color: android.graphics.Color.GRAY, size: 30, align: 1 }
            }])
            maxY += 40
        }
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
