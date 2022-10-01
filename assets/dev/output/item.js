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
        let player
        if (Utils.isObject(extraInfo.operator)) {
            if (extraInfo.operator.type === 'tileEntity') {
                /** @todo */
                return
            }
            player = extraInfo.operator.player
        } else {
            let playerList = toolsCb.getPlayerList(true)
            player = playerList[Math.floor(Math.random() * playerList.length)]
        }
        let item = Utils.transferItemFromJson(outputJson)
        let actor = new PlayerActor(player)
        actor.addItemToInventory(item.id, item.count, item.data, item.extra, true)
    },
    getIcon (outputJson, toolsCb, extraInfo) {
        let received = toolsCb.getState().state === EnumObject.outputState.received
        let pos = extraInfo.pos
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: (typeof outputJson.bitmap === 'string') ? outputJson.bitmap : 'clear',
                source: Utils.transferItemFromJson(outputJson),
                clicker: {
                    onClick: (!received) ? Utils.debounce(function () {
                        if (toolsCb.getState().state === EnumObject.outputState.received) return
                        toolsCb.sendPacket({ type: 'receive' })
                    }, 500) : null,
                    onLongClick: Utils.debounce(toolsCb.openDescription, 500)
                }
            }]
        ]
    },
    getDescription (outputJson, toolsCb, extraInfo) {
        let source = Utils.transferItemFromJson(outputJson)
        let prefix = extraInfo.prefix
        let maxY = extraInfo.posY + 200
        let elements = [
            [prefix + 'slot', {
                type: 'slot', visual: true, x: 440, y: extraInfo.posY + 10, size: 120,
                bitmap: (typeof outputJson.bitmap === 'string') ? outputJson.bitmap : 'clear',
                source: source,
                clicker: {
                    onClick: Utils.debounce(function () { Integration.openRecipeUI(source, false) }, 500),
                    onLongClick: Utils.debounce(function () { Integration.openRecipeUI(source, true) }, 500)
                }
            }],
            [prefix + 'name', {
                type: 'text', x: 500, y: extraInfo.posY + 120,
                text: Item.getName(source.id, source.data).split('\n')[0].replace(/\u00A7./g, ''),
                font: { color: android.graphics.Color.GRAY, size: 40, align: 1 }
            }]
        ]
        QuestUiTools.resolveText(TranAPI.translate(outputJson.description), function (str) {
            if (typeof str !== 'string') return 1
            return QuestUiTools.getTextWidth(str, 40) / 900
        }).forEach(function (str, index) {
            elements.push([prefix + 'desc_' + index, {
                type: 'text', x: 50, y: maxY, text: str,
                font: { color: android.graphics.Color.BLACK, size: 40 }
            }])
            maxY += 50
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
