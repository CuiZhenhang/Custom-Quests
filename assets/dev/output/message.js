/// <reference path='../Integration.js'/>

Network.addClientPacket('CustomQuests.output.message', function (packetData) {
    let message = ''
    if (typeof packetData.message === 'string') {
        message = packetData.message
    } else if (Utils.isObject(packetData.message)) {
        message = TranAPI.t(packetData.message)
    }
    Game.message(message)
})

IOTypeTools.setOutputType('message', {
    en: 'message'
}, {
    onLoad (outputJson, toolsCb, cache) {
        if (outputJson.autoReceive) {
            toolsCb.setState({}, {
                state: EnumObject.outputState.received
            })
        }
    },
    onPacket (outputJson, toolsCb, cache, extraInfo) {
        if (extraInfo.packetData.type !== 'receive') return
        toolsCb.setState({}, {
            state: EnumObject.outputState.received
        })
    },
    onFastReceive (outputJson, toolsCb, cache, extraInfo) {
        toolsCb.setState(extraInfo, {
            state: EnumObject.outputState.received
        })
    },
    onReceive (outputJson, toolsCb, cache, extraInfo) {
        /** @type { NetworkConnectedClientList } */
        let client
        if (outputJson.toAll) {
            client = new NetworkConnectedClientList()
            client.setupAllPlayersPolicy()
        } else {
            client = toolsCb.getConnectedClientList()
        }
        client.send('CustomQuests.output.message', {
            message: outputJson.message
        })
    },
    getIcon (outputJson, toolsCb, extraInfo) {
        let received = toolsCb.getState().state === EnumObject.outputState.received
        let pos = extraInfo.pos
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: 'reward_message',
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
