/// <reference path='../Integration.js'/>

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
        let pos = Entity.getPosition(player)
        outputJson.commands.forEach(function (command) {
            if (typeof command !== 'string') return
            Commands.execAt(command, pos.x, pos.y, pos.z)
        })
    },
    getIcon (outputJson, toolsCb, extraInfo) {
        let received = toolsCb.getState().state === EnumObject.outputState.received
        let pos = extraInfo.pos
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: 'reward_command',
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
