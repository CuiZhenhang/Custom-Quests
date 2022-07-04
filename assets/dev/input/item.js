/// <reference path='../interaction.js'/>

IOTypeTools.setInputType('item', {
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
            const count = toolsCb.getState().count || 0
            if (count >= inputJson.count) {
                toolsCb.setState({}, {
                    state: EnumObject.inputState.finished,
                    count: count
                })
            }
        }
    },
    onPacket (inputJson, toolsCb, cache, extraInfo) {
        if (!inputJson.submit) return
        if (extraInfo.packetData.type !== 'submit') return
        const extra = Array.isArray(inputJson.extra)
        const player = extraInfo.client.getPlayerUid()
        const actor = new PlayerActor(player)
        const stateObj = toolsCb.getState()
        let count = stateObj.count || 0
        for (let i = 0; i < 36; i++) {
            const item = actor.getInventorySlot(i)
            if (item.id !== cache.id) continue
            if (inputJson.data !== -1 && inputJson.data !== item.data) continue
            if (extra && !Utils.isItemExtraPassed(item, inputJson.extra)) continue
            if (count + item.count < inputJson.count) {
                count += item.count
                actor.setInventorySlot(i, 0, 0, 0, null)
            } else {
                const cost = inputJson.count - count
                count = inputJson.count
                actor.setInventorySlot(i, item.id, item.count - cost, item.data, item.extra)
            }
        }
        if (count !== (stateObj.count || 0)) {
            const finished = count >= inputJson.count
            toolsCb.setState({}, {
                state: finished ? EnumObject.inputState.finished : stateObj.state,
                count: count
            })
        }
    },
    onTick (inputJson, toolsCb, cache, extraInfo) {
        if (inputJson.submit) return
        let succ = false
        if (Array.isArray(inputJson.extra)) {
            succ = extraInfo.playerInventory.some(function (obj) {
                /** @type { ItemInstance[] } */
                const items = obj.extra[cache.key]
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
        const submit = inputJson.submit
        const pos = extraInfo.pos
        const ret = {}
        ret[extraInfo.prefix + 'main'] = {
			type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
            bitmap: (typeof inputJson.bitmap === 'string') ? inputJson.bitmap : 'clear',
            source: Utils.transferItemFromJson(inputJson),
			clicker: {
                onClick: (submit && toolsCb.getState().state !== EnumObject.inputState.finished)
                  ? Utils.debounce(function () {
                        if (toolsCb.getState().state === EnumObject.inputState.finished) return
                        toolsCb.sendPacket({
                            'type': 'submit'
                        })
                    }, 500)
                  : null
            }
        }
        return ret
    },
    getDesc (inputJson, toolsCb, extraInfo) {
        
    }
}, {
    allowRepeat: true,
    allowGroup: true
})
