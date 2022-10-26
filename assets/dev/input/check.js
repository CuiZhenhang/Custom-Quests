/// <reference path='../IOTypeTools.js'/>

IOTypeTools.setInputType('check', TranAPI.getTranslation('inputType.check'), {
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
                bitmap: finished ? 'cq_task_check' : 'cq_task_check_gray',
                clicker: {
                    onClick: finished ? null : Utils.debounce(function () {
                        if (toolsCb.getState().state === EnumObject.inputState.finished) return
                        if (typeof toolsCb.sendPacket === 'function') toolsCb.sendPacket({ type: 'check' })
                    }, 500)
                }
            }]
        ]
    }
}, {
    allowRepeat: true,
    allowGroup: false
})
