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
                bitmap: 'reward_message',
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
        let prefix = extraInfo.prefix
        let maxY = extraInfo.posY + 60
        let elements = [
            [prefix + 'text', {
                type: 'text', x: 500, y: extraInfo.posY - 10, text: TranAPI.translate('outputType.message.text'),
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
