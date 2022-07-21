/// <reference path='../QuestUi.js'/>

; (function () {

const $ScreenHeight = UI.getScreenHeight()
const $Color = android.graphics.Color

const $MainUi = {
    /** @type { Nullable<CQTypes.sourceId> } */
    sourceId: null,
    /** @type { Nullable<CQTypes.ResolvedMainJson> } */
    mainJson: null,
    /** @type { Nullable<CQTypes.chapterId> } */
    chapterId: null,
    /** @type { Nullable<CQTypes.ResolvedChapterJson> } */
    chapterJson: null,
    questUi: {
        /** @type { Nullable<CQTypes.questId> } */
        questId: null,
        /** @type { Nullable<ReturnType<QuestUi['openQuestUi']>['isClosed']> } */
        isClosed: null,
        /** @type { Nullable<ReturnType<QuestUi['openQuestUi']>['close']> } */
        close: null,
        updateRequest: {
            exist: false,
            timeFirst: 0,
            timeLast: 0
        }
    },
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
            show_list: { type: 'button', x: 8, y: 60 + ($ScreenHeight - 60)/2 - 16, bitmap: 'arrow_right', scale: 32/64,
                clicker: {
                    onClick: Utils.debounce(function () {
                        $MainUi.openChapterListUi()
                    }, 500)
                }
            }
        }
    }, {
        onOpen (ui) {
            $MainUi.chapterUi.open()
        },
        onClose (ui) {
            $MainUi.chapterListUi.close()
            $MainUi.chapterUi.close()
        }
    }, {
        closeOnBackPressed: true,
        blockingBackground: true
    }),
    chapterListUi: QuestUiTools.createUi({
        location: { x: 0, y: 60, width: 200, height: $ScreenHeight - 60, scrollY: 140 * (200/1000) },
        drawing: [
            { type: 'background', color: $Color.TRANSPARENT },
            { type: 'frame', x: 0, y: 0, width: 1000, height: 1000*($ScreenHeight - 60)/200, bitmap: 'classic_frame_bg_light', scale: 2 }
        ],
        elements: {
            close: { type: 'closeButton', x: 860, y: 20, bitmap: 'X', bitmap2: 'XPress', scale: 120/19 },
            title: { type: 'text', x: 60, y: 40, text: TranAPI.translate('gui.chapterList'), font: { color: $Color.BLACK, size: 60 } }
        }
    }, null, {
        closeOnBackPressed: true
    }),
    chapterUi: QuestUiTools.createUi({
        location: { x: 40, y: 60, width: 960 , height: $ScreenHeight - 60, scrollY: 960 * (1/2) },
        drawing: [
            { type: 'background', color: $Color.TRANSPARENT },
            { type: 'frame', x: 0, y: 0, width: 1000, height: 1000 * (1/2), bitmap: 'classic_frame_bg_light', scale: 2 },
            { type: 'bitmap', x: 0 + 2000, y: 0, width: 1000, height: 1000 * (1/2), bitmap: 'clear' }
        ],
        elements: {}
    }),
    /** @type { QuestUi['open'] } */
    open (sourceId) {
        if (typeof sourceId !== 'string') return
        if (this.sourceId !== sourceId) {
            this.sourceId = sourceId
            this.mainJson = Store.localCache.resolvedJson[sourceId]
            this.chapterId = null
            this.chapterJson = null
            if (!Utils.isObject(this.mainJson)) return
        }
        this.mainUi.content.drawing[3].text = TranAPI.translate(this.mainJson.name)
        let empty = true
        for (let chapterId in this.mainJson.chapter) {
            this.updateChapterUi(chapterId)
            empty = false
            break
        }
        if (empty) {
            this.chapterUi.clearNewElements()
            this.chapterUi.refresh()
        }
        this.mainUi.open(true)
    },
    openChapterListUi () {
        let ui = this.chapterListUi
        ui.content.drawing.splice(2)
        ui.clearNewElements()
        if (!Utils.isObject(this.mainJson)) {
            ui.open(true)
            return
        }
        /** @type { {[chapterId: CQTypes.chapterId]: { name: CQTypes.TextJson, icon: CQTypes.IconJson, list: Array<chapterId> }} } */
        let groupObj = {}
        /** @type { {[chapterId: CQTypes.chapterId]: boolean} } */
        let vis = {}
        if (Array.isArray(this.mainJson.group)) {
            this.mainJson.group.forEach(function (groupJson) {
                if (groupJson.list.length === 0) return
                groupObj[groupJson.list[0]] = groupJson
                groupJson.list.forEach(function (chapterId) {
                    vis[chapterId] = true
                })
            })
        }
        let height = 140
        let uuid = Utils.getUUID()
        for (let chapterId in this.mainJson.chapter) {
            let heightBak = height
            if (Utils.isObject(groupObj[chapterId])) {
                let groupJson = groupObj[chapterId]
                /** @todo */
            } else {
                if (vis[chapterId]) continue
                let chapterJson = this.mainJson.chapter[chapterId]
                let chapterIdBak = chapterId
                ui.addElements([
                    [uuid + '_' + chapterId + '_icon', {
                        type: 'slot', visual: true, bitmap: chapterJson.icon.bitmap || 'clear',
                        source: Utils.transferItemFromJson(chapterJson.icon),
                        darken: Boolean(chapterJson.icon.darken),
                        x: 10, y: height + 10, z: 1, size: 180
                    }],
                    [uuid + '_' + chapterId + '_name', {
                        type: 'text', text: TranAPI.translate(chapterJson.name),
                        font: { color: $Color.BLACK, size: 60 },
                        x: 200, y: height + 70, z: 1
                    }],
                    [uuid + '_' + chapterId + '_btn', {
                        type: 'image', x: 10, y: height + 10, z: 11, bitmap: 'clear', width: 980, height: 180,
                        clicker: {
                            onClick: Utils.debounce(function () {
                                $MainUi.updateChapterUi(chapterIdBak)
                                alert(TranAPI.translate(chapterJson.description))
                            }, 500)
                        }
                    }]
                ])
            }
            ui.content.drawing.push({
                type: 'line',
                x1: 10, y1: height,
                x2: 990, y2: height,
                width: 5, color: $Color.GRAY
            })
            height += 200
        }
        ui.content.drawing[1].height = Math.max(height, 1000*($ScreenHeight - 60)/200)
        ui.ui.getLocation().scrollY = ui.content.drawing[1].height * (200/1000)
        ui.open(true)
    },
    /** @type { (chapterId: CQTypes.chapterId) => void } */
    updateChapterUi (chapterId) {
        if (!Utils.isObject(this.mainJson)) return
        if (typeof chapterId !== 'string') return
        this.chapterId = chapterId
        this.chapterJson = this.mainJson.chapter[chapterId]
        let ui = this.chapterUi
        ui.content.drawing.splice(3)
        ui.clearNewElements()
        if (!Utils.isObject(this.chapterJson)) {
            ui.refresh()
            return
        }
        let title = TranAPI.translate(this.mainJson.name) + ' -> ' + TranAPI.translate(this.chapterJson.name)
        this.mainUi.content.drawing[3].text = title
        if (Array.isArray(this.chapterJson.background)) {
            if (typeof this.chapterJson.background[0] === 'string') {
                ui.content.drawing[1].x = 0 + 2000
                ui.content.drawing[2].x = 0
                ui.content.drawing[2].bitmap = this.chapterJson.background[0]
            } else {
                ui.content.drawing[1].x = 0
                ui.content.drawing[2].x = 0 + 2000
                ui.content.drawing[2].bitmap = 'clear'
            }
            if (typeof this.chapterJson.background[1] === 'number') {
                ui.ui.getLocation().scrollY = 960 * this.chapterJson.background[1]
                ui.content.drawing[2].height = ui.content.drawing[1].height = 1000 * this.chapterJson.background[1]
            } else {
                ui.ui.getLocation().scrollY = 960 * (1/2)
                ui.content.drawing[2].height = ui.content.drawing[1].height = 1000 * (1/2)
            }
        } else {
            ui.ui.getLocation().scrollY = 960 * (1/2)
            ui.content.drawing[2].height = ui.content.drawing[1].height = 1000 * (1/2)
            ui.content.drawing[1].x = 0
            ui.content.drawing[2].x = 0 + 2000
            ui.content.drawing[2].bitmap = 'clear'
        }
        let uuid = Utils.getUUID()
        let that = this
        for (let questId in this.chapterJson.quest) {
            let questJson = Utils.deepCopy(this.chapterJson.quest[questId])
            if (questJson.type === 'custom') {
                let elements = Array.isArray(questJson.elem) ? questJson.elem : [questJson.elem]
                ui.addElements(elements.map(function (elem, index) {
                    return [uuid + '_' + questId + '_' + index, elem]
                }))
            } else if (questJson.type === 'quest') {
                let posChild = [questJson.pos[0] + questJson.size/2, questJson.pos[1] + questJson.size/2]
                let saveData = System.getQuestSaveData(Store.localCache.resolvedJson, Store.localCache.saveData, this.sourceId, chapterId, questId)
                if (saveData.inputState === EnumObject.questInputState.locked && questJson.hidden) return
                questJson.parent.forEach(function (path) {
                    if (path[0] !== that.sourceId || path[1] !== that.chapterId) return
                    let width = typeof path[3] === 'number' ? path[3] : 5
                    let tQuestJson = System.getQuestJson(Store.localCache.resolvedJson, path[0], path[1], path[2])
                    if (!Utils.isObject(tQuestJson) || tQuestJson.type !== 'quest') return
                    let posParent = [tQuestJson.pos[0] + tQuestJson.size/2, tQuestJson.pos[1] + tQuestJson.size/2]
                    let tInputState = System.getQuestInputState(Store.localCache.resolvedJson, Store.localCache.saveData, path[0], path[1], path[2])
                    if (tInputState === EnumObject.questInputState.locked && tQuestJson.hidden) return
                    let color = $Color.GRAY
                    if (saveData.inputState >= EnumObject.questInputState.finished) {
                        if (tInputState >= EnumObject.questInputState.finished) color = $Color.rgb(100, 220, 100)
                        else if (tInputState === EnumObject.questInputState.unfinished) color = $Color.rgb(0, 200, 200)
                        else color = $Color.rgb(200, 200, 0)
                    }
                    QuestUiTools.getDependencyLine(posParent, posChild, width, color).forEach(function (drawing) {
                        ui.content.drawing.push(drawing)
                    })
                })
                ui.addElements(QuestUiTools.getQuestIcon(questJson, saveData, {
                    prefix: uuid + '_' + questId + '_',
                    clicker: {
                        onClick: Utils.debounce(that.openQuestUi.bind(that, questId), 500)
                    }
                }))
            }
        }
        ui.refresh()
    },
    /** @type { (questId: CQTypes.questId) => void } */
    openQuestUi (questId) {
        let sourceId = this.sourceId
        let chapterId = this.chapterId
        if (typeof sourceId !== 'string' || typeof chapterId !== 'string') return
        try {
            let questJson = System.getQuestJson(Store.localCache.resolvedJson, sourceId, chapterId, questId)
            if (!Utils.isObject(questJson) || questJson.type !== 'quest') return
            let saveData = System.getQuestSaveData(Store.localCache.resolvedJson, Store.localCache.saveData, sourceId, chapterId, questId)
            let obj = QuestUi.openQuestUi(questJson, saveData, {
                sendInputPacket: ClientSystem.sendInputPacket.bind(ClientSystem, sourceId, chapterId, questId),
                sendOutputPacket: ClientSystem.sendOutputPacket.bind(ClientSystem, sourceId, chapterId, questId),
                openParentListUi: function () {
                    alert('[WIP] Open Parent List UI')
                    /** @todo */
                },
                openChildListUi: function () {
                    alert('[WIP] Open Child List UI')
                    /** @todo */
                }
            })
            this.questUi.questId = questId
            this.questUi.isClosed = obj.isClosed
            this.questUi.close = obj.close
            this.questUi.updateRequest.exist = false
        } catch (err) {
            Utils.log('Error in function \'$MainUi.openQuestUi\' (ui/MainUi.js):\n' + err, 'ERROR')
        }
    },
    /** @type { (questId: CQTypes.questId) => void } */
    addQuestUiUpdateRequest (questId) {
        if (questId !== this.questUi.questId) return
        if (typeof this.questUi.isClosed !== 'function' || this.questUi.isClosed()) return
        let time = Date.now()
        if (!this.questUi.updateRequest.exist) {
            this.questUi.updateRequest.exist = true
            this.questUi.updateRequest.timeFirst = time
        }
        this.questUi.updateRequest.timeLast = time
    }
}

Callback.addCallback('LocalTick', function () {
    if (!$MainUi.questUi.updateRequest.exist) return
    if (typeof $MainUi.questUi.isClosed !== 'function') return
    if ($MainUi.questUi.isClosed()) {
        $MainUi.questUi.updateRequest.exist = false
        return
    }
    let time = Date.now()
    if (time - $MainUi.questUi.updateRequest.timeFirst >= 1000 /* 1s */) {
        $MainUi.openQuestUi($MainUi.questUi.questId)
        return
    }
    if (time - $MainUi.questUi.updateRequest.timeLast >= 200 /* 0.2s */) {
        $MainUi.openQuestUi($MainUi.questUi.questId)
        return
    }
})

Callback.addCallback('CustomQuests.onLocalInputStateChanged', function (path) {
    if (typeof $MainUi.sourceId !== 'string' || typeof $MainUi.chapterId !== 'string') return
    if (path[0] !== $MainUi.sourceId || path[1] !== $MainUi.chapterId || path[2] !== $MainUi.questUi.questId) return
    $MainUi.addQuestUiUpdateRequest(path[2])
})
Callback.addCallback('CustomQuests.onLocalOutputStateChanged', function (path) {
    if (typeof $MainUi.sourceId !== 'string' || typeof $MainUi.chapterId !== 'string') return
    if (path[0] !== $MainUi.sourceId || path[1] !== $MainUi.chapterId || path[2] !== $MainUi.questUi.questId) return
    $MainUi.addQuestUiUpdateRequest(path[2])
})
Callback.addCallback('CustomQuests.onLocalQuestInputStateChanged', function (path) {
    if (typeof $MainUi.sourceId !== 'string' || typeof $MainUi.chapterId !== 'string') return
    if (path[0] !== $MainUi.sourceId || path[1] !== $MainUi.chapterId) return
    if (!$MainUi.chapterUi.isOpened()) return
    $MainUi.updateChapterUi(path[1])
    if (path[2] === $MainUi.questUi.questId) {
        $MainUi.addQuestUiUpdateRequest(path[2])
    }
})
Callback.addCallback('CustomQuests.onLocalQuestOutputStateChanged', function (path) {
    if (typeof $MainUi.sourceId !== 'string' || typeof $MainUi.chapterId !== 'string') return
    if (path[0] !== $MainUi.sourceId || path[1] !== $MainUi.chapterId) return
    if (!$MainUi.chapterUi.isOpened()) return
    $MainUi.updateChapterUi(path[1])
    if (path[2] === $MainUi.questUi.questId) {
        $MainUi.addQuestUiUpdateRequest(path[2])
    }
})
QuestUi.open = $MainUi.open.bind($MainUi)

})()
