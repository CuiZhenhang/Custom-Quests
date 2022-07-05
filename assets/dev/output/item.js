/// <reference path='../interaction.js'/>

IOTypeTools.setOutputType('item', {
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
        let pos = extraInfo.pos
        let ret = {}
        ret[extraInfo.prefix + 'main'] = {
			type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
            bitmap: (typeof outputJson.bitmap === 'string') ? outputJson.bitmap : 'clear',
            source: Utils.transferItemFromJson(outputJson),
			clicker: {
                onClick: (toolsCb.getState().state !== EnumObject.outputState.received)
                  ? Utils.debounce(function () {
                        if (toolsCb.getState().state === EnumObject.outputState.received) return
                        toolsCb.sendPacket({
                            'type': 'receive'
                        })
                    }, 500)
                  : null
            }
        }
        return ret
    },
    getDesc (outputJson, toolsCb, extraInfo) {
        
    }
}, {
    allowRepeat: true,
    allowGroup: true
})
