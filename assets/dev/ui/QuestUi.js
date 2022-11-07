/// <reference path='../QuestUi.js'/>

; (function () {

const $ScreenHeight = UI.getScreenHeight()
const $Color = android.graphics.Color

const $QuestUi = {
    uuid: '',
    /** @type { Nullable<CQTypes.QuestSaveData> } */
    saveData: null,
    /** @type { Nullable<() => void> } */
    openParentListUi: null,
    /** @type { Nullable<() => void> } */
    openChildListUi: null,
    /** @type { Array<() => void> } */
    closeListener: [],
    /** @type { Array<() => void> } */
    reloadListener: [],
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
            {type: 'text', text: TranAPI.translate('gui.reward'), x: 750, y: 125, font: {color: $Color.parseColor('#dd8800'), size: 30, align: 1}}
        ],
        elements: {
            close: {type: 'closeButton', x: 920, y: 20, bitmap: 'X', bitmap2: 'XPress', scale: 60/19},
            show_parent: {type: 'button', x: 20, y: 110, bitmap: 'cq_parent', scale: 40/48,
                clicker: {
                    onClick: Utils.debounce(function () {
                        if (typeof $QuestUi.openParentListUi === 'function') {
                            $QuestUi.openParentListUi()
                        }
                    }, 500),
                    onLongClick: Utils.debounce(function () {
                        alert(TranAPI.translate('alert.description.show_parent'))
                    }, 500)
                }
            },
            show_child: {type: 'button', x: 940, y: 110, bitmap: 'cq_child', scale: 40/48,
                clicker: {
                    onClick: Utils.debounce(function () {
                        if (typeof $QuestUi.openChildListUi === 'function') {
                            $QuestUi.openChildListUi()
                        }
                    }, 500),
                    onLongClick: Utils.debounce(function () {
                        alert(TranAPI.translate('alert.description.show_child'))
                    }, 500)
                }
            }
        }
    }, {
        onClose (ui) {
            $QuestUi.invokeCloseListener()
            $QuestUi.saveData = null
        }
    }, {
        closeOnBackPressed: true,
        blockingBackground: true,
        hideNavigation: true
    }),
    /** @type { QuestUi['openQuestUi'] } */
    open (questJson, saveData, params) {
        this.saveData = saveData
        this.openParentListUi = params.openParentListUi || null
        this.openChildListUi = params.openChildListUi || null
        if (!params.isReload) this.invokeCloseListener()
        let uuid = Utils.getUUID()
        this.uuid = uuid
        let name = TranAPI.translate(questJson.inner.name)
        let numIO = Math.max(questJson.inner.input.length, questJson.inner.output.length, 1)
        let textElements = QuestUiTools.resolveTextJsonToElements(questJson.inner.text, {
            prefix: uuid + '_desc_',
            pos: [20, 160 + Math.ceil(numIO/5)*100],
            maxWidth: 960,
            rowSpace: 10,
            font: {
                color: $Color.BLACK,
                size: 30
            }
        })
        this.questUi.clearNewElements(null, true)
        let location = this.questUi.ui.getLocation()
        let content = this.questUi.content
        location.scrollY = (textElements.maxY + 20) * (600/1000)
        location.height = Math.min(location.scrollY, $ScreenHeight)
        location.y = ($ScreenHeight - location.height)/2
        content.drawing[1].height = location.scrollY * (1000/600)
        content.drawing[2].text = name
        content.drawing[5].y2 = content.drawing[4].y2 = content.drawing[4].y1 = 150 + Math.ceil(numIO/5)*100
        this.questUi.addElements(QuestUiTools.getQuestIcon(questJson, saveData, {
            pos: [20, 20],
            size: 70,
            prefix: uuid + '_icon_'
        }))
        this.questUi.addElements(textElements.elements)
        let that = this
        let sendInputPacket = typeof params.sendInputPacket === 'function' ? params.sendInputPacket : null
        questJson.inner.input.forEach(function (inputJson, index) {
            if (!inputJson) return
            let getIcon = IOTypeTools.getInputTypeCb(inputJson.type).getIcon
            if (typeof getIcon !== 'function') return
            let elements = getIcon(inputJson, {
                getState: that.getInputStateSafe.bind(that, index),
                sendPacket: sendInputPacket ? sendInputPacket.bind(null, index) : null,
                openDescription: QuestUi.openDescriptionUi.bind(QuestUi, true, inputJson, { getState: that.getInputStateSafe.bind(that, index) })
            }, {
                pos: [96*(index % 5) + 20, 100*Math.floor(index/5) + 160],
                size: 80,
                prefix: uuid + '_input_' + index + '_',
                setCloseListener: that.setCloseListener.bind(that),
                setReloadListener: that.setReloadListener.bind(that)
            })
            if (!Utils.isObject(elements)) return
            that.questUi.addElements(elements)
            if (saveData.input[index] && saveData.input[index].state === EnumObject.inputState.finished) {
                that.questUi.addElements([[uuid + '_input_bingo_' + index, {
                    type: 'image', z: 10, width: 30, height: 30 * 16 / 22, bitmap: 'cq_bingo',
                    x: 96*(index % 5) + 20 + 45,
                    y: 100*Math.floor(index/5) + 160 + 5
                }]])
            }
        })
        let sendOutputPacket = typeof params.sendOutputPacket === 'function' ? params.sendOutputPacket : null
        questJson.inner.output.forEach(function (outputJson, index) {
            if (!outputJson) return
            let getIcon = IOTypeTools.getOutputTypeCb(outputJson.type).getIcon
            if (typeof getIcon !== 'function') return
            let elements = getIcon(outputJson, {
                getState: that.getOutputStateSafe.bind(that, index),
                sendPacket: sendOutputPacket ? sendOutputPacket.bind(null, index) : null,
                openDescription: QuestUi.openDescriptionUi.bind(QuestUi, false, outputJson, { getState: that.getOutputStateSafe.bind(that, index) })
            }, {
                pos: [96*(index % 5) + 520, 100*Math.floor(index/5) + 160],
                size: 80,
                prefix: uuid + '_output_' + index + '_',
                setCloseListener: that.setCloseListener.bind(that),
                setReloadListener: that.setReloadListener.bind(that)
            })
            if (!Utils.isObject(elements)) return
            that.questUi.addElements(elements)
            if (saveData.inputState < EnumObject.questInputState.finished) {
                that.questUi.addElements([[uuid + '_output_dot_' + index, {
                    type: 'image', z: 10, width: 20, height: 20, bitmap: 'cq_dot_grey',
                    x: 96*(index % 5) + 520 + 55,
                    y: 100*Math.floor(index/5) + 160 + 5
                }]])
            } else {
                if (!saveData.output[index] || saveData.output[index].state !== EnumObject.outputState.received) {
                    that.questUi.addElements([[uuid + '_output_dot_' + index, {
                        type: 'image', z: 10, width: 20, height: 20, bitmap: 'cq_dot_green',
                        x: 96*(index % 5) + 520 + 55,
                        y: 100*Math.floor(index/5) + 160 + 5
                    }]])
                }
            }
        })
        this.questUi.open(true)
        if (params.isReload) this.invokeReloadListener()
        return {
            isClosed: this.isClosed.bind(this, uuid),
            close: this.close.bind(this, uuid)
        }
    },
    /** @type { (index: number) => CQTypes.InputStateObject } */
    getInputStateSafe (index) {
        if (!this.saveData || !this.saveData.input[index]) {
            return { state: EnumObject.inputState.unfinished }
        }
        return Utils.deepCopy(this.saveData.input[index])
    },
    /** @type { (index: number) => CQTypes.OutputStateObject } */
    getOutputStateSafe (index) {
        if (!this.saveData || !this.saveData.output[index]) {
            return { state: EnumObject.outputState.unreceived }
        }
        return Utils.deepCopy(this.saveData.output[index])
    },
    /** @type { (uuid: string) => boolean } */
    isClosed (uuid) {
        if (uuid !== this.uuid) return true
        return !this.questUi.isOpened()
    },
    /** @type { (uuid: string) => void } */
    close (uuid) {
        if (uuid !== this.uuid) return
        this.questUi.close()
    },
    /** @type { (listener: () => void) => void } */
    setCloseListener (listener) {
        if (typeof listener !== 'function') return
        this.closeListener.push(listener)
    },
    invokeCloseListener () {
        this.closeListener.forEach(function (listener) {
            try {
                listener()
            } catch (err) {
                Utils.error('Error in invokeCloseListener (QuestUi.js):\n', err)
            }
        })
        this.closeListener.length = 0
        this.reloadListener.length = 0
    },
    /** @type { (listener: () => void) => void } */
    setReloadListener (listener) {
        if (typeof listener !== 'function') return
        this.reloadListener.push(listener)
    },
    invokeReloadListener () {
        this.reloadListener.forEach(function (listener) {
            try {
                listener()
            } catch (err) {
                Utils.error('Error in invokeReloadListener (QuestUi.js):\n', err)
            }
        })
    }
}

QuestUi.openQuestUi = $QuestUi.open.bind($QuestUi)

})()
