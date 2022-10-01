/// <reference path='../IOTypeTools.js'/>

IOTypeTools.setInputType('item', TranAPI.getTranslation('inputType.item'), {
    resolveJson (inputJson, refsArray, bitmapNameObject) {
        if (typeof inputJson.id !== 'string' && typeof inputJson.id !== 'number') return null
        if (typeof inputJson.count !== 'number' || inputJson.count <= 0) inputJson.count = 1
        if (typeof inputJson.data !== 'number' || inputJson.data < 0) inputJson.data = -1
        if (typeof inputJson.submit !== 'boolean') inputJson.submit = Boolean(inputJson.submit)
        if (typeof inputJson.bitmap === 'string') {
            inputJson.bitmap = Utils.resolveBitmap(inputJson.bitmap, bitmapNameObject)
        } else inputJson.bitmap = null
        return inputJson
    },
    onLoad (inputJson, toolsCb, cache) {
        cache.id = Utils.transferIdFromJson(inputJson.id)
        cache.key = cache.id + ':' + inputJson.data
        if (inputJson.submit) {
            let count = toolsCb.getState().count || 0
            if (count >= inputJson.count) {
                toolsCb.setState({}, {
                    state: EnumObject.inputState.finished,
                    count: 0
                })
            }
        }
    },
    onPacket (inputJson, toolsCb, cache, extraInfo) {
        if (!inputJson.submit) return
        if (extraInfo.packetData.type !== 'submit') return
        let extra = Array.isArray(inputJson.extra)
        let player = extraInfo.client.getPlayerUid()
        let actor = new PlayerActor(player)
        let stateObj = toolsCb.getState()
        let count = stateObj.count || 0
        for (let i = 0; i < 36; i++) {
            let item = actor.getInventorySlot(i)
            if (item.id !== cache.id) continue
            if (inputJson.data !== -1 && inputJson.data !== item.data) continue
            if (extra && !Utils.isItemExtraPassed(item, inputJson.extra)) continue
            if (count + item.count < inputJson.count) {
                count += item.count
                actor.setInventorySlot(i, 0, 0, 0, null)
            } else {
                let cost = inputJson.count - count
                count = inputJson.count
                actor.setInventorySlot(i, item.id, item.count - cost, item.data, item.extra)
            }
        }
        if (count !== (stateObj.count || 0)) {
            stateObj.count = count
            if (count >= inputJson.count) {
                stateObj.state = EnumObject.inputState.finished
                stateObj.count = 0
            }
            toolsCb.setState({}, stateObj)
        }
    },
    onTick (inputJson, toolsCb, cache, extraInfo) {
        if (inputJson.submit) return
        let succ = false
        if (Array.isArray(inputJson.extra)) {
            succ = extraInfo.playerInventory.some(function (obj) {
                /** @type { ItemInstance[] } */
                let items = obj.extra[cache.key]
                if (!Array.isArray(items)) return false
                let passedCount = 0
                succ = items.some(function (item) {
                    if (Utils.isItemExtraPassed(item, inputJson.extra)){
                        passedCount += item.count
                        if (passedCount >= inputJson.count) return true
                    }
                    return false
                })
            })
        } else {
            succ = extraInfo.playerInventory.some(function (obj) {
                return obj.sort[cache.key] >= inputJson.count
            })
        }
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
        let source = Utils.transferItemFromJson(inputJson)
        if (submit) source.count = 1
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: (typeof inputJson.bitmap === 'string') ? inputJson.bitmap : 'clear',
                source: source,
                clicker: {
                    onClick: (submit && !finished) ? Utils.debounce(function () {
                        if (toolsCb.getState().state === EnumObject.inputState.finished) return
                        toolsCb.sendPacket({ type: 'submit' })
                    }, 500) : null,
                    onLongClick: Utils.debounce(toolsCb.openDescription, 500)
                }
            }],
            [extraInfo.prefix + 'text', submit ? {
                type: 'text',
                x: pos[0] + (40 / 80) * extraInfo.size,
                y: pos[1] + (40 / 80) * extraInfo.size,
                z: 2,
                text: Number(finished ? inputJson.count : (stateObj.count || 0)) + '/' + Number(inputJson.count),
                font: { color: android.graphics.Color.WHITE, size: 20, align: 1 }
            } : null]
        ]
    },
    getDescription (inputJson, toolsCb, extraInfo) {
        let source = Utils.transferItemFromJson(inputJson)
        let prefix = extraInfo.prefix
        let maxY = extraInfo.posY + 190
        let elements = [
            [prefix + 'slot', {
                type: 'slot', visual: true, x: 440, y: extraInfo.posY + 10, size: 120,
                bitmap: (typeof inputJson.bitmap === 'string') ? inputJson.bitmap : 'clear',
                source: source,
                clicker: {
                    onClick: Utils.debounce(function () { Integration.openRecipeUI(source, false) }, 500),
                    onLongClick: Utils.debounce(function () { Integration.openRecipeUI(source, true) }, 500)
                }
            }],
            [prefix + 'name', {
                type: 'text', x: 500, y: extraInfo.posY + 120,
                text: Item.getName(source.id, source.data).split('\n')[0].replace(/\u00A7./g, ''),
                font: { color: android.graphics.Color.GRAY, size: 30, align: 1 }
            }]
        ]
        if (inputJson.submit) {
            let stateObj = toolsCb.getState()
            let finished = stateObj.state === EnumObject.inputState.finished
            elements.push([prefix + 'submit', {
                type: 'text', x: 500, y: maxY - 20,
                text: Utils.replace(TranAPI.translate('inputType.item.submited'), [
                    ['{count}', (finished ? inputJson.count : (stateObj.count || 0))]
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
