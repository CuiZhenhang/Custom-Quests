/// <reference path='../IOTypeTools.js'/>

IOTypeTools.setOutputType('item', TranAPI.getTranslation('outputType.item'), {
    resolveJson (outputJson, refsArray, bitmapNameObject) {
        if (typeof outputJson.id !== 'string' && typeof outputJson.id !== 'number') return null
        if (typeof outputJson.count !== 'number' || outputJson.count <= 0) outputJson.count = 1
        if (typeof outputJson.data !== 'number' || outputJson.data < 0) outputJson.data = 0
        if (typeof outputJson.bitmap === 'string') {
            outputJson.bitmap = Utils.resolveBitmap(outputJson.bitmap, bitmapNameObject)
        } else outputJson.bitmap = null
        return outputJson
    },
    onLoad (outputJson, toolsCb, cache) {
        if (outputJson.autoReceive) {
            toolsCb.setState({}, {
                state: EnumObject.outputState.received
            })
        }
    },
    onPacket (outputJson, toolsCb, cache, extraInfo) {
        if (extraInfo.packetData.type !== 'receive') return
        if (toolsCb.getState().state === EnumObject.outputState.received) return
        let player = extraInfo.client.getPlayerUid()
        toolsCb.setState({
            operator: {
                type: 'player',
                player: player
            }
        }, {
            state: EnumObject.outputState.received
        })
    },
    onFastReceive (outputJson, toolsCb, cache, extraInfo) {
        toolsCb.setState(extraInfo, {
            state: EnumObject.outputState.received
        })
    },
    onReceive (outputJson, toolsCb, cache, extraInfo) {
        /** @type { Array<number> } */
        let playerList = []
        if (outputJson.mutiReward) playerList = toolsCb.getPlayerList(true)
        else {
            if (Utils.isObject(extraInfo.operator) && extraInfo.operator.type === 'player') {
                playerList.push(extraInfo.operator.player)
            } else {
                let tPlayerList = toolsCb.getPlayerList(true)
                playerList.push(tPlayerList[Math.floor(Math.random() * tPlayerList.length)])
            }
        }
        let item = Utils.transferItemFromJson(outputJson)
        playerList.forEach(function (player) {
            let actor = new PlayerActor(player)
            actor.addItemToInventory(item.id, item.count, item.data, item.extra, true)
        })
    },
    getIcon (outputJson, toolsCb, extraInfo) {
        let received = toolsCb.getState().state === EnumObject.outputState.received
        let pos = extraInfo.pos
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: (typeof outputJson.bitmap === 'string') ? outputJson.bitmap : 'cq_clear',
                source: Utils.transferItemFromJson(outputJson),
                clicker: {
                    onClick: (!received) ? Utils.debounce(function () {
                        if (toolsCb.getState().state === EnumObject.outputState.received) return
                        if (typeof toolsCb.sendPacket === 'function') toolsCb.sendPacket({ type: 'receive' })
                    }, 500) : null,
                    onLongClick: typeof toolsCb.openDescription === 'function' ? Utils.debounce(toolsCb.openDescription, 500) : null
                }
            }]
        ]
    },
    getDescription (outputJson, toolsCb, extraInfo) {
        let source = Utils.transferItemFromJson(outputJson)
        let prefix = extraInfo.prefix
        let maxY = extraInfo.posY + 190
        let elements = [
            [prefix + 'slot', {
                type: 'slot', visual: true, x: 440, y: extraInfo.posY + 10, size: 120,
                bitmap: (typeof outputJson.bitmap === 'string') ? outputJson.bitmap : 'cq_clear',
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
        let description = QuestUiTools.resolveTextJsonToElements(outputJson.description, {
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
    allowRepeat: true,
    allowGroup: true
})
