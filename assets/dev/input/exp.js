/// <reference path='../interaction.js'/>

IOTypeTools.setInputType('exp', {
    en: 'experience'
}, {
    resolveJson (inputJson, refsArray, bitmapNameObject) {
        if (typeof inputJson.value !== 'number' || inputJson.value < 0) inputJson.data = 1
        return inputJson
    },
    onLoad (inputJson, toolsCb, cache) {
        if (inputJson.submit) {
            let value = toolsCb.getState().value || 0
            if (value >= inputJson.value) {
                toolsCb.setState({}, {
                    state: EnumObject.inputState.finished,
                    value: value
                })
            }
        }
    },
    onPacket (inputJson, toolsCb, cache, extraInfo) {
        if (!inputJson.submit) return
        if (extraInfo.packetData.type !== 'submit') return
        let player = extraInfo.client.getPlayerUid()
        let actor = new PlayerActor(player)
        let stateObj = toolsCb.getState()
        let value = stateObj.value || 0
        if (inputJson.isLevel) {
            let level = actor.getLevel()
            if (value + level < inputJson.value) {
                value += level
                actor.setLevel(0)
            } else {
                let cost = inputJson.value - value
                value = inputJson.value
                actor.setLevel(level - cost)
            }
        }
        if (value !== (stateObj.value || 0)) {
            if (value >= inputJson.value) stateObj.state = EnumObject.inputState.finished
            stateObj.value = value
            toolsCb.setState({}, stateObj)
        }
    },
    onTick (inputJson, toolsCb, cache, extraInfo) {
        if (inputJson.submit) return
        let playerList = toolsCb.getPlayerList(true)
        let succ = playerList.some(function (player) {
            let actor = new PlayerActor(player)
            if (inputJson.isLevel) return actor.getLevel() >= inputJson.value
            else return actor.getExperience() >= inputJson.value
        })
        if (succ) {
            toolsCb.setState({}, {
                state: EnumObject.inputState.finished
            })
        }
    },
    getIcon (inputJson, toolsCb, extraInfo) {
        let submit = inputJson.submit
        let pos = extraInfo.pos
        let ret = {}
        return ret
    },
    getDesc (inputJson, toolsCb, extraInfo) {
        
    }
}, {
    allowRepeat: true,
    allowGroup: true
})
