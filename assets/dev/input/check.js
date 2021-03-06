/// <reference path='../Integration.js'/>

IOTypeTools.setInputType('check', {
    en: 'check'
}, {
    onPacket (inputJson, toolsCb, cache, extraInfo) {
        if (extraInfo.packetData.type !== 'check') return
        toolsCb.setState({}, {
            state: EnumObject.inputState.finished
        })
    },
    getIcon (inputJson, toolsCb, extraInfo) {
        let finished = toolsCb.getState().state === EnumObject.inputState.finished
        let pos = extraInfo.pos
        return [
            [extraInfo.prefix + 'main', {
                type: 'slot', visual: true, x: pos[0], y: pos[1], z: 1, size: extraInfo.size,
                bitmap: finished ? 'task_check' : 'task_check_grey',
                clicker: {
                    onClick: finished ? null : Utils.debounce(function () {
                        if (toolsCb.getState().state === EnumObject.inputState.finished) return
                        toolsCb.sendPacket({ type: 'check' })
                    }, 500)
                }
            }]
        ]
    },
    getDesc (inputJson, toolsCb, extraInfo) {
        
    }
}, {
    allowRepeat: true,
    allowGroup: false
})
