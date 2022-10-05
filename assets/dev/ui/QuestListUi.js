/// <reference path='../QuestUi.js'/>

; (function () {

const $ScreenHeight = UI.getScreenHeight()
const $Color = android.graphics.Color

/**
 * @typedef { {[sourceId: CQTypes.sourceId]: {[chapterId: CQTypes.chapterId]: Array<CQTypes.questId>}} } QuestListObject
 */
const $QuestListUi = {
    /** @type { Array<CQTypes.PathArray> } */
    questList: [],
    /** @type { QuestListObject } */
    questListObject: {},
    /** @type { Nullable<(path: CQTypes.PathArray) => void> } */
    onSelect: null,
    mainUi: QuestUiTools.createUi({
        location: { x: 0, y: 0, width: 1000, height: $ScreenHeight },
        drawing: [
            { type: 'background', color: $Color.TRANSPARENT },
            { type: 'frame', x: 0, y: 0, width: 1000, height: $ScreenHeight, bitmap: 'classic_frame_bg_light', scale: 4 },
            { type: 'frame', x: 0, y: 0, width: 1000, height: 60, bitmap: 'classic_frame_bg_light', scale: 4 },
            { type: 'text', text: '', x: 500, y: 30, font: { color: $Color.BLACK, align: 1, size: 20 } },
            { type: 'frame', x: 0, y: 60, width: 40, height: $ScreenHeight - 60, bitmap: 'classic_frame_bg_light', scale: 1 }
        ],
        elements: {
            close: { type: 'closeButton', x: 947, y: 12, bitmap: 'X', bitmap2: 'XPress', scale: 36 / 19 },
            info: { type: 'button', x: 22, y: 12, bitmap: 'info', scale: 36 / 16,
                clicker: {
                    onClick: Utils.debounce(function () {
                        Utils.dialog({
                            text: TranAPI.translate('mod.dialog')
                        })
                    }, 500)
                }
            },
            show_list_btn: { type: 'image', x: 4, y: 60 + ($ScreenHeight - 60) / 4, z: 2, bitmap: 'clear', width: 32, height: ($ScreenHeight - 60) / 2,
                clicker: {
                    onClick: Utils.debounce(function () {
                        $QuestListUi.sourceListUi.open()
                    }, 500)
                }
            },
            show_list: { type: 'image', x: 8, y: 60 + ($ScreenHeight - 60) / 2 - 16, z: 1, bitmap: 'arrow_right', scale: 32 / 64 }
        }
    }, {
        onOpen (ui) {
            $QuestListUi.questListUi.open()
        },
        onClose (ui) {
            $QuestListUi.sourceListUi.close()
            $QuestListUi.questListUi.close()
        }
    }, {
        closeOnBackPressed: true,
        blockingBackground: true
    }),
    sourceListUi: QuestUiTools.createUi({
        location: { x: 0, y: 60, width: 300, height: $ScreenHeight - 60, scrollY: 100 * (300/1000) },
        drawing: [
            { type: 'background', color: $Color.TRANSPARENT },
            { type: 'frame', x: 0, y: 0, width: 1000, height: 1000*($ScreenHeight - 60)/300, bitmap: 'classic_frame_bg_light', scale: 2 }
        ],
        elements: {
            close: { type: 'closeButton', x: 910, y: 10, bitmap: 'X', bitmap2: 'XPress', scale: 80/19 },
            title: { type: 'text', x: 60, y: 30, text: TranAPI.translate('gui.questList.sourceList'), font: { color: $Color.BLACK, size: 40 } }
        }
    }, null, {
        closeOnBackPressed: true
    }),
    questListUi: QuestUiTools.createUi({
        location: { x: 40, y: 60, width: 960 , height: $ScreenHeight - 60, scrollY: $ScreenHeight - 60 },
        drawing: [
            { type: 'background', color: $Color.TRANSPARENT },
            { type: 'frame', x: 0, y: 0, width: 1000, height: ($ScreenHeight - 60) * (1000/960), bitmap: 'classic_frame_bg_light', scale: 2 }
        ],
        elements: {
            name: { type: 'text', x: 500, y: 10, text: '', font: { color: $Color.BLACK, size: 30, align: 1 } }
        }
    }),
    /** @type { QuestUi['openQuestListUi'] } */
    open (title, questList, onSelect) {
        this.questList = questList
        this.questListObject = this.resolveQuestList(questList)
        this.onSelect = onSelect
        this.mainUi.content.drawing[3].text = title
        this.updateSourceListUi()
        let empty = true
        for (let sourceId in this.questListObject) {
            this.updateQuestListUi(sourceId)
            empty = false
            break
        }
        if (empty) {
            this.questListUi.content.elements['name'].text = TranAPI.translate('gui.questList.empty')
            this.questListUi.clearNewElements()
            this.questListUi.refresh()
        }
        this.mainUi.open(true)
    },
    updateSourceListUi () {
        let ui = this.sourceListUi
        ui.content.drawing.splice(2)
        ui.clearNewElements()
        let height = 100
        let uuid = Utils.getUUID()
        for (let sourceId in this.questListObject) {
            let mainJson = Store.localCache.resolvedJson[sourceId]
            if (!Utils.isObject(mainJson)) continue
            ui.addElements([
                [uuid + '_' + sourceId + '_name', {
                    type: 'text', text: TranAPI.translate(mainJson.name),
                    font: { color: $Color.BLACK, size: 50, align: 1 },
                    x: 500, y: height + 10, z: 1
                }],
                [uuid + '_' + sourceId + '_btn', {
                    type: 'image', x: 10, y: height + 10, z: 2, bitmap: 'clear', width: 980, height: 100,
                    clicker: {
                        onClick: Utils.debounce(this.updateQuestListUi.bind(this, sourceId), 500)
                    }
                }]
            ])
            ui.content.drawing.push({
                type: 'line',
                x1: 10, y1: height,
                x2: 990, y2: height,
                width: 5, color: $Color.GRAY
            })
            height += 120
        }
        ui.content.drawing[1].height = Math.max(height + 10, 1000*($ScreenHeight - 60)/300)
        ui.ui.getLocation().scrollY = ui.content.drawing[1].height * (300/1000)
        ui.refresh()
    },
    /** @type { (sourceId: CQTypes.sourceId) => void } */
    updateQuestListUi (sourceId) {
        let ui = this.questListUi
        let mainQuestListObject = this.questListObject[sourceId]
        let mainJson = Store.localCache.resolvedJson[sourceId]
        ui.clearNewElements()
        if (!mainQuestListObject || !Utils.isObject(mainJson)) {
            ui.content.elements['name'].text = TranAPI.translate('gui.questList.empty')
            ui.refresh()
            return
        }
        ui.content.elements['name'].text = TranAPI.translate(mainJson.name)
        let height = 50
        let uuid = Utils.getUUID()
        let that = this
        for (let chapterId in mainQuestListObject) {
            let questIdArray = mainQuestListObject[chapterId]
            let chapterJson = mainJson.chapter[chapterId]
            ui.addElements([[uuid + '_' + chapterId + '_name', {
                type: 'text', x: 60, y: height + 10, text: TranAPI.translate(chapterJson.name),
                font: { color: $Color.BLACK, size: 20 }
            }]])
            questIdArray.forEach(function (questId, index) {
                let questJson = chapterJson.quest[questId]
                if (!questJson || questJson.type !== 'quest') return
                let saveData = System.getQuestSaveData(Store.localCache.resolvedJson, Store.localCache.saveData, sourceId, chapterId, questId)
                let name = TranAPI.translate(questJson.inner.name)
                let pathArray = [sourceId, chapterId, questId]
                ui.addElements(QuestUiTools.getQuestIcon(questJson, saveData, {
                    prefix: uuid + '_' + chapterId + '_' + questId + '_',
                    pos: [50 + (index % 13) * 70, height + 40 + Math.floor(index / 13) * 70],
                    size: 60,
                    clicker: {
                        onClick: Utils.debounce(function () {
                            Utils.dialog({
                                text: Utils.replace(TranAPI.translate('gui.questList.select'), [
                                    ['{name}', name]
                                ])
                            }, function () {
                                if (typeof that.onSelect === 'function') that.onSelect(pathArray)
                                that.mainUi.close()
                            })
                        }, 500),
                        onLongClick: Utils.debounce(function () {
                            alert(name)
                        }, 500)
                    }
                }))
            })
            height += 110 + Math.floor((questIdArray.length - 1) / 13) * 70
        }
        ui.content.drawing[1].height = Math.max(height, 1000*($ScreenHeight - 60)/960)
        ui.ui.getLocation().scrollY = ui.content.drawing[1].height * (960 / 1000)
        ui.refresh()
    },
    /** @type { (questList: Array<CQTypes.PathArray>) => QuestListObject } */
    resolveQuestList (questList) {
        const DEFAULT_SOURCEID = 'Default'
        /** @type { QuestListObject } */
        let obj = {}
        questList.forEach(function (pathArray) {
            if (!obj[pathArray[0]]) obj[pathArray[0]] = {}
            if (!obj[pathArray[0]][pathArray[1]]) obj[pathArray[0]][pathArray[1]] = []
            obj[pathArray[0]][pathArray[1]].push(pathArray[2])
        })
        for (let sourceId in obj) {
            let mainJson = Store.localCache.resolvedJson[sourceId]
            if (!Utils.isObject(mainJson)) {
                delete obj[sourceId]
                continue
            }
            /** @type { {[chapterId: CQTypes.chapterId]: Array<CQTypes.chapterId>} } */
            let groupObj = {}
            /** @type { {[chapterId: CQTypes.chapterId]: boolean} } */
            let visInGroup = {}
            if (Array.isArray(mainJson.group)) {
                mainJson.group.forEach(function (groupJson) {
                    if (groupJson.list.length === 0) return
                    if (Utils.isObject(groupObj[groupJson.list[0]])) return
                    groupObj[groupJson.list[0]] = groupJson.list
                    groupJson.list.forEach(function (chapterId) {
                        visInGroup[chapterId] = true
                    })
                })
            }
            let mainObj = obj[sourceId]
            /** @type { QuestListObject[CQTypes.sourceId] } */
            let mainQuestListObject = {}
            for (let chapterId in mainJson.chapter) {
                if (groupObj[chapterId]) {
                    groupObj[chapterId].forEach(function (chapterId) {
                        if (mainObj[chapterId]) {
                            mainQuestListObject[chapterId] = mainObj[chapterId]
                        }
                    })
                } else if (!visInGroup[chapterId]) {
                    if (mainObj[chapterId]) {
                        mainQuestListObject[chapterId] = mainObj[chapterId]
                    }
                }
            }
            for (let chapterId in mainQuestListObject) {
                let questIdArray = mainQuestListObject[chapterId]
                if (questIdArray.length === 0) {
                    delete mainQuestListObject[chapterId]
                    continue
                }
                questIdArray.sort()
            }
            obj[sourceId] = mainQuestListObject
        }
        /** @type { QuestListObject } */
        let questListObject = {}
        /** @type { Array<CQTypes.sourceId> } */
        let sourceIdArray = []
        for (let sourceId in obj) sourceIdArray.push(sourceId)
        let index = sourceIdArray.indexOf(DEFAULT_SOURCEID)
        if (index !== -1) {
            sourceIdArray.splice(index, 1)
            questListObject[DEFAULT_SOURCEID] = obj[DEFAULT_SOURCEID]
        }
        sourceIdArray.sort()
        sourceIdArray.forEach(function (sourceId) {
            questListObject[sourceId] = obj[sourceId]
        })
        return questListObject
    }
}
QuestUi.openQuestListUi = $QuestListUi.open.bind($QuestListUi)

})()
