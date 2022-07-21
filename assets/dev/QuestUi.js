/// <reference path='./ClientSystem.js'/>

/** @type { QuestUi } */
const QuestUi = {
    open (sourceId) {},
    openForPlayer (sourceId, player) {
        if (typeof sourceId !== 'string') return
        if (!ServerSystem.isPlayerLoaded(player)) return
        Network.getClientForPlayer(player).send('CustomQuests.Client.openUi', {
            sourceId: sourceId
        })
    },
    openQuestUi (questJson, saveData, params) {},
    openQuestListUi (questList, onSelect) {},
    openTeamUi () {},
    openItemChooseUi (isValid, onSelect) {}
}

/** @type { QuestUiTools } */
const QuestUiTools = {
    createUi (content, eventListener, option) {
        /** @type { ReturnType<QuestUiTools['createUi']> } */
        let ret = {
            content: content,
            ui: new UI.Window(content),
            newElements: [],
            addElements (elementsObj) {
                if (!Utils.isObject(elementsObj)) return
                if (Array.isArray(elementsObj)) {
                    elementsObj.forEach(function (elements) {
                        ret.newElements.push(elements[0])
                        ret.content.elements[elements[0]] = elements[1]
                    })
                } else {
                    for (let key in elementsObj) {
                        ret.newElements.push(key)
                        ret.content.elements[key] = elementsObj[key]
                    }
                }
            },
            clearNewElements () {
                let elements = ret.content.elements
                ret.newElements.forEach(function (key) {
                    elements[key] = null
                })
                ret.newElements.length = 0
                return ret
            },
            refresh () {
                if (!ret.ui.isOpened()) return
                ret.ui.invalidateAllContent()
                ret.ui.updateWindowLocation()
            },
            open (refresh) {
                if (ret.isOpened() && refresh) ret.refresh()
                else ret.ui.open()
            },
            close () { ret.ui.close() },
            isOpened () { return ret.ui.isOpened() }
        }
        if (!Utils.isObject(eventListener)) eventListener = {}
        ret.ui.setEventListener({
            onOpen () {
                if (typeof eventListener.onOpen !== 'function') return
                eventListener.onOpen(ret)
            },
            onClose () {
                if (typeof eventListener.onClose !== 'function') return
                eventListener.onClose(ret)
            }
        })
        if (!Utils.isObject(option)) option = {}
        if (option.closeOnBackPressed) ret.ui.setCloseOnBackPressed(true)
        if (option.blockingBackground) ret.ui.setBlockingBackground(true)
        return ret
    },
    getQuestIcon (questJson, saveData, option) {
        if (!Array.isArray(option.pos)) option.pos = questJson.pos
        if (typeof option.pos[0] !== 'number') option.pos[0] = questJson.pos[0]
        if (typeof option.pos[1] !== 'number') option.pos[1] = questJson.pos[1]
        if (typeof option.size !== 'number') option.size = questJson.size
        let icon = questJson.icon[0]
        if (saveData.inputState > EnumObject.questInputState.locked) icon = questJson.icon[1]
        if (saveData.inputState == EnumObject.questInputState.finished) icon = questJson.icon[2]
        let overBitmap = 'clear'
        if (saveData.inputState === EnumObject.questInputState.unfinished
            || saveData.inputState === EnumObject.questInputState.repeat_unfinished
        ) {
            overBitmap = 'dot_blue'
        } else if (saveData.inputState === EnumObject.questInputState.finished) {
            if (saveData.outputState !== EnumObject.questOutputState.received) {
                overBitmap = 'remind'
            }
        }
        return [
            [option.prefix + 'main', {
                type: 'slot', visual: true, bitmap: icon.bitmap || 'clear',
                source: Utils.transferItemFromJson(icon), darken: Boolean(icon.darken),
                x: option.pos[0], y: option.pos[1], z: 1, size: option.size,
                clicker: option.clicker
            }],
            [option.prefix + 'over', {
                type: 'image',
                x: option.pos[0] + (55 / 80) * option.size,
                y: option.pos[1] + (5 / 80) * option.size,
                z: 2,
                width: option.size * (20 / 80),
                height: option.size * (20 / 80),
                bitmap: overBitmap
            }]
        ]
    },
    getDependencyLine (posParent, posChild, width, color) {
        return [{
            type: 'line',
            x1: posParent[0], y1: posParent[1],
            x2: posChild[0], y2: posChild[1],
            width: width, color: color
        }]
        // let ret = [{
        //     type: 'custom',
        //     onDraw: function (canvas, scale) {
        //         let paint = new android.graphics.Paint()
        //     }
        // }]
    },
    resolveText (text, getWidthRatio) {
        if (typeof text !== 'string') return []
        if (typeof getWidthRatio !== 'function') return text.split('\n')
        return text.split('\n')
    }
}
