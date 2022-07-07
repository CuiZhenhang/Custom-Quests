/// <reference path='../interaction.js'/>

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
        let pos = extraInfo.pos
        let ret = {}
        return ret
    },
    getDesc (outputJson, toolsCb, extraInfo) {
        
    }
}, {
    allowRepeat: true,
    allowGroup: true
})
