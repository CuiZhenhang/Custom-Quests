/// <reference path='../IOTypeTools.js'/>

IOTypeTools.setOutputType('command', TranAPI.getTranslation('outputType.command'), {
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
        playerList.forEach(function (player) {
            let pos = Entity.getPosition(player)
            outputJson.commands.forEach(function (command) {
                if (typeof command !== 'string') return
                Commands.execAt(command, pos.x, pos.y, pos.z)
            })
        })
    },
    getIcon (outputJson, toolsCb, extraInfo) {
        let received = toolsCb.getState().state === EnumObject.outputState.received
        let pos = extraInfo.pos
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: 'cq_reward_command',
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
        let prefix = extraInfo.prefix
        let maxY = extraInfo.posY + 60
        let elements = [
            [prefix + 'text', {
                type: 'text', x: 500, y: extraInfo.posY - 10, text: TranAPI.translate('outputType.command.text'),
                font: { color: android.graphics.Color.BLACK, size: 30, align: 1 }
            }]
        ]
        QuestUiTools.resolveText(TranAPI.translate(outputJson.description), function (str) {
            if (typeof str !== 'string') return 1
            return QuestUiTools.getTextWidth(str, 30) / 900
        }).forEach(function (str, index) {
            elements.push([prefix + 'desc_' + index, {
                type: 'text', x: 50, y: maxY, text: str,
                font: { color: android.graphics.Color.BLACK, size: 30 }
            }])
            maxY += 40
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
