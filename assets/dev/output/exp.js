/// <reference path='../IOTypeTools.js'/>

IOTypeTools.setOutputType('exp', TranAPI.getTranslation('outputType.exp'), {
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
                    }, 500) : null,
                    onLongClick: Utils.debounce(toolsCb.openDescription, 500)
                }
            }]
        ]
    },
    getDescription (outputJson, toolsCb, extraInfo) {
        let prefix = extraInfo.prefix
        let maxY = extraInfo.posY + 190
        let elements = [
            [prefix + 'slot', {
                type: 'slot', visual: true, x: 440, y: extraInfo.posY + 10, size: 120,
                bitmap: 'clear', source: {
                    id: VanillaItemID.experience_bottle,
                    count: outputJson.value
                }
            }],
            [prefix + 'text', {
                type: 'text', x: 500, y: extraInfo.posY + 120,
                text: TranAPI.translate(outputJson.isLevel ? 'outputType.exp.isLevel' : 'outputType.exp.notLevel'),
                font: { color: android.graphics.Color.GRAY, size: 30, align: 1 }
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
