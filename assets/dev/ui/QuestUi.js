/// <reference path='../QuestUi.js'/>

; (function () {

const $ScreenHeight = UI.getScreenHeight()
const $Color = android.graphics.Color

/** @type { <T = any>(x: T) => T } */
const $SimpleFunc = function (x) { return x }

const $QuestUi = {
    uuid: '',
    /** @type { Nullable<() => void> } */
    openParentListUi: null,
    /** @type { Nullable<() => void> } */
    openChildListUi: null,
    questUi: QuestUiTools.createUi({
        location: {x: 200, y: ($ScreenHeight - 400) / 2, width: 600, height: 400, scrollY: 400},
        drawing: [
            {type: 'background', color: $Color.TRANSPARENT},
            {type: 'frame', x: 0, y: 0, width: 1000, height: 1000*400/600, bitmap: 'classic_frame_bg_light', scale: 4},
            {type: 'text', text: '', x: 100, y: 70, font: {color: $Color.BLACK, size: 40}},
            {type: 'line', x1: 0, y1: 100, x2: 1000, y2: 100, width: 5, color: $Color.BLACK},
            {type: 'line', x1: 0, y1: 250, x2: 1000, y2: 250, width: 5, color: $Color.BLACK},
            {type: 'line', x1: 500, y1: 100, x2: 500, y2: 250, width: 5, color: $Color.BLACK},
            {type: 'text', text: TranAPI.translate('gui.task'), x: 250, y: 125, font: {color: $Color.parseColor('#5555FF'), size: 30, align: 1}},
            {type: 'text', text: TranAPI.translate('gui.reward'), x: 750, y: 125, font: {color: $Color.parseColor('#dd8800'), size: 30, align: 1}},
        ],
        elements: {
            close: {type: 'closeButton', x: 920, y: 20, bitmap: 'X', bitmap2: 'XPress', scale: 60/19},
            show_parent: {type: 'button', x: 20, y: 105, bitmap: 'parent', scale: 40/48,
                clicker: {
                    onClick: Utils.debounce(function () {
                        if (typeof $QuestUi.openParentListUi === 'function') {
                            $QuestUi.openParentListUi()
                        }
                    }, 500)
                }
            },
            show_child: {type: 'button', x: 940, y: 105, bitmap: 'child', scale: 40/48,
                clicker: {
                    onClick: Utils.debounce(function () {
                        if (typeof $QuestUi.openChildListUi === 'function') {
                            $QuestUi.openChildListUi()
                        }
                    }, 500)
                }
            }
        }
    }, null, {
        closeOnBackPressed: true,
        blockingBackground: true
    }),
    /** @type { QuestUi['openQuestUi'] } */
    open (questJson, saveData, params) {
        this.openParentListUi = params.openParentListUi
        this.openChildListUi = params.openChildListUi
        let uuid = Utils.getUUID()
        let name = TranAPI.translate(questJson.inner.name)
        let text = QuestUiTools.resolveText(TranAPI.translate(questJson.inner.text), this.getWidthRatio)
        let numIO = Math.max(questJson.inner.input.length, questJson.inner.output.length, 1)
        this.questUi.clearNewElements()
        let location = this.questUi.ui.getLocation()
        let content = this.questUi.content
        location.scrollY = (280 + Math.floor(numIO/5 - 0.1)*100 + 50*text.length) * (600/1000)
        location.height = Math.min(location.scrollY, $ScreenHeight)
        location.y = ($ScreenHeight - location.scrollY)/2
        content.drawing[1].height = location.scrollY * (1000/600)
        content.drawing[2].text = name
        content.drawing[5].y2 = content.drawing[4].y2 = content.drawing[4].y1 = 250 + Math.floor(numIO/5 - 0.1)*100
        this.questUi.addElements(QuestUiTools.getQuestIcon(questJson, saveData, {
            pos: [20, 20],
            size: 70,
            prefix: uuid + '_icon_'
        }))
        this.questUi.addElements(text.map(function (str, index) {
            return [uuid + '_desc_' + index, {
                type: 'text', text: str, font: {color: $Color.BLACK, size: 40},
                x: 20, y: content.drawing[5].y2 + 10 + 50*index
            }]
        }))
        let that = this
        let sendInputPacket = typeof params.sendInputPacket === 'function' ? params.sendInputPacket : null
        questJson.inner.input.forEach(function (inputJson, index) {
            let func = IOTypeTools.getInputTypeCb(inputJson.type).getIcon
            if (typeof func !== 'function') return
            let elements = func(inputJson, {
                getState: $SimpleFunc.bind(null, saveData.input[index] || { state: EnumObject.inputState.unfinished }),
                sendPacket: sendInputPacket ? sendInputPacket.bind(null, index) : null
            }, {
                pos: [96*(index % 5) + 20, 100*Math.floor(index/5) + 160],
                size: 80,
                prefix: uuid + '_input_' + index + '_'
            })
            if (!Utils.isObject(elements)) return
            that.questUi.addElements(elements)
            if (Utils.isObject(saveData.input[index]) && saveData.input[index].state === EnumObject.inputState.finished) {
                that.questUi.addElements([[uuid + '_input_bingo', {
                    type: 'image', z: 10, width: 30, height: 30 * 16 / 22, bitmap: 'bingo',
                    x: 96*(index % 5) + 20 + 45,
                    y: 100*Math.floor(index/5) + 160 + 5
                }]])
            }
        })
        let sendOutputPacket = typeof params.sendOutputPacket === 'function' ? params.sendOutputPacket : null
        questJson.inner.output.forEach(function (outputJson, index) {
            let func = IOTypeTools.getOutputTypeCb(outputJson.type).getIcon
            if (typeof func !== 'function') return
            let elements = func(outputJson, {
                getState: $SimpleFunc.bind(null, saveData.output[index] || { state: EnumObject.outputState.unreceived }),
                sendPacket: sendOutputPacket ? sendOutputPacket.bind(null, index) : null
            }, {
                pos: [96*(index % 5) + 520, 100*Math.floor(index/5) + 160],
                size: 80,
                prefix: uuid + '_output_' + index + '_'
            })
            if (!Utils.isObject(elements)) return
            that.questUi.addElements(elements)
            if (saveData.inputState < EnumObject.questInputState.finished) {
                that.questUi.addElements([[uuid + '_output_dot', {
                    type: 'image', z: 10, width: 20, height: 20, bitmap: 'dot_grey',
                    x: 96*(index % 5) + 520 + 55,
                    y: 100*Math.floor(index/5) + 160 + 5
                }]])
            } else {
                if (Utils.isObject(saveData.output[index]) && saveData.output[index].state !== EnumObject.outputState.received) {
                    that.questUi.addElements([[uuid + '_output_dot', {
                        type: 'image', z: 10, width: 20, height: 20, bitmap: 'dot_green',
                        x: 96*(index % 5) + 520 + 55,
                        y: 100*Math.floor(index/5) + 160 + 5
                    }]])
                }
            }
        })
        this.questUi.open(true)
        this.uuid = uuid
        return {
            isClosed: this.isClosed.bind(this, uuid),
            close: this.close.bind(this, uuid)
        }
    },
    /** @type { (str: string) => number } */
    getWidthRatio:  (function () {
        let size = 40
        let width = 960
        let font = new UI.Font({size: size})
        return function (str) {
            if (typeof str !== 'string') return 1
            return font.getTextWidth(str, 1) / width
        }
    })(),
    /** @type { (uuid: string) => boolean } */
    isClosed (uuid) {
        if (uuid !== this.uuid) return true
        return !this.questUi.isOpened()
    },
    /** @type { (uuid: string) => void } */
    close (uuid) {
        if (uuid !== this.uuid) return
        this.questUi.close()
    }
}

QuestUi.openQuestUi = $QuestUi.open.bind($QuestUi)

})()
