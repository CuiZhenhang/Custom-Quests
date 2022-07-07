/// <reference path='../interaction.js'/>

IOTypeTools.setOutputType('command', {
    en: 'command'
}, {
    resolveJson (outputJson, refsArray, bitmapNameObject) {
        if (!Array.isArray(outputJson.commands)) return null
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
        let pos = Entity.getPosition(player)
        outputJson.commands.forEach(function (command) {
            if (typeof command !== 'string') return
            Commands.execAt(command, pos.x, pos.y, pos.z)
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
