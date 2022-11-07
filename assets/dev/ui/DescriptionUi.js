/// <reference path='../QuestUi.js'/>

; (function () {

const $ScreenHeight = UI.getScreenHeight()
const $Color = android.graphics.Color

const $DescriptionUi = {
    uuid: '',
    /** @type { Array<() => void> } */
    closeListener: [],
    descriptionUi: QuestUiTools.createUi({
        location: {x: 250, y: ($ScreenHeight - 400) / 2, width: 500, height: 400, scrollY: 400},
        drawing: [
            {type: 'background', color: $Color.TRANSPARENT},
            {type: 'frame', x: 0, y: 0, width: 1000, height: 1000*400/500, bitmap: 'classic_frame_bg_light', scale: 4},
            {type: 'text', text: '', x: 30, y: 70, font: {color: $Color.BLACK, size: 40}},
            {type: 'line', x1: 20, y1: 100, x2: 980, y2: 100, width: 2, color: $Color.GRAY}
        ],
        elements: {
            close: {type: 'closeButton', x: 920, y: 20, bitmap: 'X', bitmap2: 'XPress', scale: 60/19}
        }
    }, {
        onClose (ui) {
            $DescriptionUi.callCloseListener()
        }
    }, {
        closeOnBackPressed: true,
        blockingBackground: true,
        hideNavigation: true
    }),
    /** @type { (isInput: boolean, ioJson: CQTypes.IOTypes.InputJson|CQTypes.IOTypes.OutputJson, toolsCb: CQTypes.IOTypeToolsLocalCb) => ReturnType<QuestUi['openDescriptionUi']> } */
    open (isInput, ioJson, toolsCb) {
        this.callCloseListener()
        let uuid = Utils.getUUID()
        let type = ioJson.type
        let name = isInput ? IOTypeTools.getInputTypeName(type) : IOTypeTools.getOutputTypeName(type)
        let title = Utils.replace(TranAPI.translate(isInput ? 'gui.description.inputType' : 'gui.description.outputType'), [
            ['{name}', name]
        ])
        let getDescription = isInput ? IOTypeTools.getInputTypeCb(type).getDescription : IOTypeTools.getOutputTypeCb(type).getDescription
        if (typeof getDescription !== 'function') {
            return {
                isClosed: function () {
                    return true
                },
                close: function () {}
            }
        }
        let obj = getDescription(ioJson, toolsCb, {
            posY: 100,
            prefix: uuid + '_',
            setCloseListener: this.setCloseListener.bind(this)
        })
        if (!Utils.isObject(obj)) {
            return {
                isClosed: function () {
                    return true
                },
                close: function () {}
            }
        }
        let ui = this.descriptionUi
        ui.clearNewElements(null, true)
        let location = ui.ui.getLocation()
        location.scrollY = Math.max(obj.maxY * (500/1000), $ScreenHeight * 0.6)
        location.height = Math.min(location.scrollY, $ScreenHeight)
        location.y = ($ScreenHeight - location.height)/2
        ui.content.drawing[1].height = location.scrollY * (1000/500)
        ui.content.drawing[2].text = title
        ui.addElements(obj.elements)
        ui.open(true)
        this.uuid = uuid
        return {
            isClosed: this.isClosed.bind(this, uuid),
            close: this.close.bind(this, uuid)
        }
    },
    /** @type { (uuid: string) => boolean } */
    isClosed (uuid) {
        if (uuid !== this.uuid) return true
        return !this.descriptionUi.isOpened()
    },
    /** @type { (uuid: string) => void } */
    close (uuid) {
        if (uuid !== this.uuid) return
        this.descriptionUi.close()
    },
    /** @type { (listener: () => void) => void } */
    setCloseListener (listener) {
        if (typeof listener !== 'function') return
        this.closeListener.push(listener)
    },
    callCloseListener () {
        this.closeListener.forEach(function (listener) {
            try {
                listener()
            } catch (err) {
                Utils.error('Error in callCloseListener (Description.js):\n', err)
            }
        })
        this.closeListener.length = 0
    }
}

QuestUi.openDescriptionUi = $DescriptionUi.open.bind($DescriptionUi)

})()
