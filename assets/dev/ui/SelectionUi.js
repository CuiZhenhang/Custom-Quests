/// <reference path='../QuestUi.js'/>

; (function () {

const $ScreenHeight = UI.getScreenHeight()
const $Color = android.graphics.Color

QuestUi.openSelectionUi = function (title, selection) {
    if (!Array.isArray(selection)) return
    if (typeof title !== 'string') title = TranAPI.translate('gui.selection.title')
    let ui = QuestUiTools.createUi({
        location: {x: 300, y: ($ScreenHeight - 400) / 2, width: 400, height: 400, scrollY: 400},
        drawing: [
            {type: 'background', color: $Color.TRANSPARENT},
            {type: 'frame', x: 0, y: 0, width: 1000, height: 1000*400/400, bitmap: 'classic_frame_bg_light', scale: 4},
            {type: 'text', text: '', x: 500, y: 50, font: {color: $Color.BLACK, size: 50, align: 1}}
        ],
        elements: {
            close: {type: 'closeButton', x: 910, y: 20, bitmap: 'X', bitmap2: 'XPress', scale: 70/19}
        }
    }, {
        onClose () {
            ui = null
            selection.length = 0
        }
    }, {
        closeOnBackPressed: true,
        blockingBackground: true
    })
    let location = ui.ui.getLocation()
    let content = ui.content
    let height = 100
    let time = 0
    selection.forEach(function (obj, index) {
        if (!Utils.isObject(obj)) return
        content.elements[index + '_btn'] = {
            type: 'image', x: 0, y: height, z: 1, bitmap: 'clear', width: 1000, height: 120,
            clicker: {
                onClick () {
                    if (Date.now() <= time + 500) return
                    time = Date.now()
                    if (!obj.onSelect()) ui.close()
                }
            }
        }
        content.elements[index + '_text'] = {
            type: 'text', x: 500, y: height + 20, z: 2, text: obj.text,
            font: obj.darken
                ? { color: $Color.GRAY, size: 40, align: 1, cursive: true }
                : { color: $Color.BLACK, size: 40, align: 1, bold: true }
        }
        content.drawing.push({
            type: 'line', x1: 20, y1: height, x2: 980, y2: height, width: 5, color: $Color.GRAY
        })
        height += 120
    })
    height += 10
    location.scrollY = height * 400 / 1000
    location.height = Math.min(location.scrollY, $ScreenHeight)
    location.y = ($ScreenHeight - location.height) / 2
    content.drawing[1].height = height
    content.drawing[2].text = title
    ui.open(true)
}

})()
