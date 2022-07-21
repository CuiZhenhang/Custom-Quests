/// <reference path='../Integration.js'/>

IOTypeTools.setOutputType('exp', {
    en: 'exp'
}, {
    resolveJson (outputJson, refsArray, bitmapNameObject) {
        if (typeof outputJson.value !== 'number' || outputJson.value < 0) outputJson.value = 1
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
        let actor = new PlayerActor(player)
        if (outputJson.isLevel) actor.setLevel(actor.getLevel() + outputJson.value);
        else actor.addExperience(outputJson.value)
    },
    getIcon (outputJson, toolsCb, extraInfo) {
        let received = toolsCb.getState().state === EnumObject.outputState.received
        let pos = extraInfo.pos
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: 'clear', source: { id: VanillaItemID.experience_bottle, count: outputJson.value },
                clicker: {
                    onClick: (!received) ? Utils.debounce(function () {
                            if (toolsCb.getState().state === EnumObject.outputState.received) return
                            toolsCb.sendPacket({ type: 'receive' })
                        }, 500) : null
                }
            }]
        ]
    },
    getDesc (outputJson, toolsCb, extraInfo) {
        
    }
}, {
    allowRepeat: true,
    allowGroup: true
})
