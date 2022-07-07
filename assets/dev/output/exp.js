/// <reference path='../interaction.js'/>

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
