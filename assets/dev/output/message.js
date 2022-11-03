/// <reference path='../IOTypeTools.js'/>

Network.addClientPacket('CustomQuests.output.message', function (packetData) {
    let message = ''
    if (typeof packetData.message === 'string') {
        message = packetData.message
    } else if (Utils.isObject(packetData.message)) {
        message = TranAPI.translate(packetData.message)
    }
    if (packetData.isAlert) alert(message)
    else Game.message(message)
})

IOTypeTools.setOutputType('message', TranAPI.getTranslation('outputType.message'), {
    onLoad (outputJson, toolsCb, cache) {
        if (outputJson.autoReceive) {
            toolsCb.setState({}, {
                state: EnumObject.outputState.received
            })
        }
    },
    onPacket (outputJson, toolsCb, cache, extraInfo) {
        if (extraInfo.packetData.type !== 'receive') return
        toolsCb.setState({
            operator: {
                type: 'player',
                player: extraInfo.client.getPlayerUid()
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
        let client = new NetworkConnectedClientList()
        if (outputJson.toAll) client.setupAllPlayersPolicy()
        else if (outputJson.mutiReward) client = toolsCb.getConnectedClientList()
        else {
            if (Utils.isObject(extraInfo.operator) && extraInfo.operator.type === 'player') {
                client.add(Network.getClientForPlayer(extraInfo.operator.player))
            } else {
                let tPlayerList = toolsCb.getPlayerList(true)
                client.add(Network.getClientForPlayer(tPlayerList[Math.floor(Math.random() * tPlayerList.length)]))
            }
        }
        client.send('CustomQuests.output.message', {
            message: outputJson.message,
            isAlert: Boolean(outputJson.isAlert)
        })
    },
    getIcon (outputJson, toolsCb, extraInfo) {
        let received = toolsCb.getState().state === EnumObject.outputState.received
        let pos = extraInfo.pos
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: 'cq_reward_message',
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
                type: 'text', x: 500, y: extraInfo.posY - 10, text: TranAPI.translate('outputType.message.text'),
                font: { color: android.graphics.Color.BLACK, size: 30, align: 1 }
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
