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
    chapterGroup: {
        exist: false,
        /** @type { Nullable<CQTypes.chapterId> } */
        chapterId: null,
        /** @type { Array<string> } */
        newElements: []
    },
    chapterUiUpdateRequest: {
        exist: false,
        timeFirst: 0,
        timeLast: 0
    },
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
            { type: 'frame', x: 0, y: 0, width: 1000, height: $ScreenHeight, bitmap: 'classic_frame_bg_light', scale: 2 },
            { type: 'frame', x: 0, y: 0, width: 1000, height: 60, bitmap: 'classic_frame_bg_light', scale: 2 },
            { type: 'text', text: '', x: 500, y: 30, font: { color: $Color.BLACK, align: 1, size: 20 } },
            { type: 'frame', x: 0, y: 60, width: 40, height: $ScreenHeight - 60, bitmap: 'classic_frame_bg_light', scale: 1 }
        ],
        elements: {
            close: { type: 'closeButton', x: 947, y: 12, bitmap: 'X', bitmap2: 'XPress', scale: 36 / 19 },
            info: { type: 'button', x: 22, y: 12, bitmap: 'cq_info', scale: 36 / 16,
                clicker: {
                    onClick: Utils.debounce(function () {
                        Utils.dialog({
                            text: TranAPI.translate('mod.dialog')
                        })
                    }, 500)
                }
            },
            team: { type: 'button', x: 72, y: 12, z: 1, bitmap: 'cq_team', scale: 36 / 32,
                clicker: {
                    onClick: Utils.debounce(function () {
                        QuestUi.openTeamUi()
                    }, 500)
                }
            },
            team_remind: {
                type: 'image',
                x: 72 + 36 * (55 / 80),
                y: 12 + 36 * (5 / 80),
                z: 2,
                width: 36 * (20 / 80),
                height: 36 * (20 / 80),
                bitmap: 'cq_remind'
            },
            fast_receive: { type: 'button', x: 122, y: 12, bitmap: 'cq_fast_receive', scale: 36 / 16,
                clicker: {
                    onClick: Utils.debounce(function () {
                        if (typeof $MainUi.sourceId === 'string' && $MainUi.mainJson) {
                            ClientSystem.receiveAllQuest($MainUi.sourceId, {})
                        }
                    }, 1000),
                    onLongClick: Utils.debounce(function () {
                        alert(TranAPI.translate('alert.fast_receive.description'))
                    }, 500)
                }
            },
            show_list_btn: { type: 'image', x: 4, y: 60 + ($ScreenHeight - 60) / 4, z: 2, bitmap: 'cq_clear', width: 32, height: ($ScreenHeight - 60) / 2,
                clicker: {
                    onClick: Utils.debounce(function () {
                        $MainUi.openChapterListUi()
                    }, 500)
                }
            },
            show_list: { type: 'image', x: 8, y: 60 + ($ScreenHeight - 60) / 2 - 16, z: 1, bitmap: 'cq_arrow_right', scale: 32 / 64 }
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
        blockingBackground: true,
        hideNavigation: true
    }),
    chapterListUi: QuestUiTools.createUi({
        location: { x: 0, y: 60, width: 300, height: $ScreenHeight - 60, scrollY: 100 * (300/1000) },
        drawing: [
            { type: 'background', color: $Color.TRANSPARENT },
            { type: 'frame', x: 0, y: 0, width: 1000, height: 1000*($ScreenHeight - 60)/300, bitmap: 'classic_frame_bg_light', scale: 2 }
        ],
        elements: {
            close: { type: 'closeButton', x: 910, y: 10, bitmap: 'X', bitmap2: 'XPress', scale: 80/19 },
            title: { type: 'text', x: 60, y: 30, text: TranAPI.translate('gui.chapterList'), font: { color: $Color.BLACK, size: 40 } },
            group_frame: { type: 'frame', x: 140 + 2000, y: 0, z: 10, width: 860, height: 140, bitmap: 'classic_frame_bg_light', scale: 2 }
        }
    }, null, {
        closeOnBackPressed: true,
        hideNavigation: true
    }),
    chapterUi: QuestUiTools.createUi({
        location: { x: 40, y: 60, width: 960 , height: $ScreenHeight - 60, scrollY: 960 * (1/2) },
        drawing: [
            { type: 'background', color: $Color.TRANSPARENT },
            { type: 'frame', x: 0, y: 0, width: 1000, height: 1000 * (1/2), bitmap: 'classic_frame_bg_light', scale: 2 },
            { type: 'bitmap', x: 0 + 2000, y: 0, width: 1000, height: 1000 * (1/2), bitmap: 'cq_clear' }
        ],
        elements: {}
    }, {
        onOpen (ui) {
            ui.refresh()
        }
    }),
    /** @type { QuestUi['open'] } */
    open (sourceId) {
        if (typeof sourceId !== 'string') return
        if (this.sourceId !== sourceId) {
            this.sourceId = sourceId
            this.mainJson = Store.localCache.resolvedJson[sourceId]
            this.chapterId = null
            this.chapterJson = null
            if (this.chapterListUi.isOpened()) this.chapterListUi.close()
            if (!this.mainJson) return
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
        } else {
            if (typeof this.chapterId === 'string') {
                this.updateChapterUi(this.chapterId)
            }
        }
        this.mainUi.open(true)
    },
    openChapterListUi () {
        let ui = this.chapterListUi
        if ($MainUi.chapterGroup.exist) {
            ui.content.elements['group_frame'].x = 140 + 2000
            $MainUi.chapterGroup.exist = false
            $MainUi.chapterGroup.chapterId = null
            $MainUi.chapterGroup.newElements.length = 0
        }
        ui.content.drawing.splice(2)
        ui.clearNewElements(null, true)
        if (!Utils.isObject(this.mainJson)) {
            ui.open(true)
            return
        }
        /** @type { {[chapterId: CQTypes.chapterId]: { name: CQTypes.TextJson, icon: CQTypes.IconJson, list: Array<CQTypes.chapterId> }} } */
        let groupObj = {}
        /** @type { {[chapterId: CQTypes.chapterId]: boolean} } */
        let visInGroup = {}
        if (Array.isArray(this.mainJson.group)) {
            this.mainJson.group.forEach(function (groupJson) {
                if (groupJson.list.length === 0) return
                if (groupObj[groupJson.list[0]]) return
                groupObj[groupJson.list[0]] = groupJson
                groupJson.list.forEach(function (chapterId) {
                    visInGroup[chapterId] = true
                })
            })
        }
        let height = 100
        let maxY = height
        let uuid = Utils.getUUID()
        for (let chapterId in this.mainJson.chapter) {
            if (groupObj[chapterId]) {
                let groupJson = groupObj[chapterId]
                ui.addElements([
                    [uuid + '_' + chapterId + '_icon', {
                        type: 'slot', visual: true, bitmap: groupJson.icon.bitmap || 'cq_clear',
                        source: Utils.transferItemFromJson(groupJson.icon),
                        darken: Boolean(groupJson.icon.darken),
                        x: 10, y: height + 10, z: 1, size: 120
                    }],
                    [uuid + '_' + chapterId + '_name', {
                        type: 'text', text: TranAPI.translate(groupJson.name),
                        font: { color: $Color.BLACK, size: 40 },
                        x: 140, y: height + 50, z: 1
                    }],
                    [uuid + '_' + chapterId + '_btn', {
                        type: 'image', x: 10, y: height + 10, z: 2, bitmap: 'cq_clear', width: 980, height: 120,
                        clicker: {
                            onClick: Utils.debounce(this.toggleChapterGroup.bind(this, groupJson, height), 500)
                        }
                    }]
                ])
                let tmpY = height + (groupJson.list.length + 1) * 140
                if (tmpY > maxY) maxY = tmpY
            } else {
                if (visInGroup[chapterId]) continue
                let chapterJson = this.mainJson.chapter[chapterId]
                ui.addElements([
                    [uuid + '_' + chapterId + '_icon', {
                        type: 'slot', visual: true, bitmap: chapterJson.icon.bitmap || 'cq_clear',
                        source: Utils.transferItemFromJson(chapterJson.icon),
                        darken: Boolean(chapterJson.icon.darken),
                        x: 10, y: height + 10, z: 1, size: 120
                    }],
                    [uuid + '_' + chapterId + '_name', {
                        type: 'text', text: TranAPI.translate(chapterJson.name),
                        font: { color: $Color.BLACK, size: 40 },
                        x: 140, y: height + 50, z: 1
                    }],
                    [uuid + '_' + chapterId + '_btn', {
                        type: 'image', x: 10, y: height + 10, z: 2, bitmap: 'cq_clear', width: 980, height: 120,
                        clicker: {
                            onClick: Utils.debounce(this.updateChapterUi.bind(this, chapterId), 500)
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
            height += 140
            if (height > maxY) maxY = height
        }
        ui.content.drawing[1].height = Math.max(maxY + 10, 1000*($ScreenHeight - 60)/300)
        ui.ui.getLocation().scrollY = ui.content.drawing[1].height * (300/1000)
        ui.open(true)
    },
    /** @type { (groupJson: { name: CQTypes.TextJson, icon: CQTypes.IconJson, list: Array<CQTypes.chapterId> }, height: number) => void } */
    toggleChapterGroup (groupJson, height) {
        let ui = this.chapterListUi
        if (this.chapterGroup.exist) {
            ui.content.elements['group_frame'].x = 140 + 2000
            ui.clearNewElements(this.chapterGroup.newElements, true)
            this.chapterGroup.exist = false
            this.chapterGroup.newElements.length = 0
            if (this.chapterGroup.chapterId === groupJson.list[0]) {
                this.chapterGroup.chapterId = null
                ui.refresh()
                return
            }
            this.chapterGroup.chapterId = null
        }
        if (!this.mainJson) return
        this.chapterGroup.exist = true
        this.chapterGroup.chapterId = groupJson.list[0]
        let listHeight = 0
        let uuid = Utils.getUUID()
        let that = this
        groupJson.list.forEach(function (chapterId) {
            let chapterJson = that.mainJson.chapter[chapterId]
            if (!chapterJson) return
            that.chapterGroup.newElements.push(
                uuid + '_group_' + chapterId + '_icon',
                uuid + '_group_' + chapterId + '_name',
                uuid + '_group_' + chapterId + '_btn'
            )
            ui.addElements([
                [uuid + '_group_' + chapterId + '_icon', {
                    type: 'slot', visual: true, bitmap: chapterJson.icon.bitmap || 'cq_clear',
                    source: Utils.transferItemFromJson(chapterJson.icon),
                    darken: Boolean(chapterJson.icon.darken),
                    x: 150, y: height + 140 + listHeight + 10, z: 11, size: 120
                }],
                [uuid + '_group_' + chapterId + '_name', {
                    type: 'text', text: TranAPI.translate(chapterJson.name),
                    font: { color: $Color.BLACK, size: 40 },
                    x: 280, y: height + 140 + listHeight + 50, z: 11
                }],
                [uuid + '_group_' + chapterId + '_btn', {
                    type: 'image', x: 150, y: height + 140 + listHeight + 10, z: 12, bitmap: 'cq_clear', width: 840, height: 120,
                    clicker: {
                        onClick: Utils.debounce(that.updateChapterUi.bind(that, chapterId), 500)
                    }
                }]
            ])
            listHeight += 140
        })
        ui.content.elements['group_frame'].x = 140
        ui.content.elements['group_frame'].y = height + 140
        ui.content.elements['group_frame'].height = listHeight
        ui.refresh()
    },
    /** @type { (chapterId: Nullable<CQTypes.chapterId>) => void } */
    updateChapterUi (chapterId) {
        if (!this.mainJson) return
        if (typeof chapterId !== 'string') return
        this.chapterId = chapterId
        this.chapterJson = this.mainJson.chapter[chapterId]
        this.chapterUiUpdateRequest.exist = false
        let ui = this.chapterUi
        ui.clearNewElements(null, true)
        if (!this.chapterJson) {
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
                ui.content.drawing[2].bitmap = 'cq_clear'
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
            ui.content.drawing[2].bitmap = 'cq_clear'
        }
        let uuid = Utils.getUUID()
        let that = this
        for (let questId in this.chapterJson.quest) {
            let questJson = this.chapterJson.quest[questId]
            if (questJson.type === 'custom') {
                let elements = Array.isArray(questJson.elem) ? questJson.elem : [questJson.elem]
                ui.addElements(elements.map(function (elem, index) {
                    return [uuid + '_' + questId + '_' + index, elem]
                }))
            } else if (questJson.type === 'quest') {
                let posChild = [questJson.pos[0] + questJson.size/2, questJson.pos[1] + questJson.size/2]
                let saveData = System.getQuestSaveData(Store.localCache.resolvedJson, Store.localCache.saveData, this.sourceId, chapterId, questId)
                if (saveData.inputState === EnumObject.questInputState.locked && questJson.hidden) continue
                questJson.parent.forEach(function (path) {
                    if (path[0] !== that.sourceId || path[1] !== that.chapterId) return
                    let tQuestJson = System.getQuestJson(Store.localCache.resolvedJson, path[0], path[1], path[2])
                    if (!tQuestJson || tQuestJson.type !== 'quest') return
                    let posParent = [tQuestJson.pos[0] + tQuestJson.size/2, tQuestJson.pos[1] + tQuestJson.size/2]
                    let tInputState = System.getQuestInputState(Store.localCache.resolvedJson, Store.localCache.saveData, path[0], path[1], path[2])
                    if (tInputState === EnumObject.questInputState.locked && tQuestJson.hidden) return
                    let color = $Color.GRAY
                    if (tInputState >= EnumObject.questInputState.finished) {
                        if (saveData.inputState >= EnumObject.questInputState.finished) color = $Color.rgb(100, 220, 100)
                        else if (saveData.inputState === EnumObject.questInputState.unfinished) color = $Color.rgb(0, 200, 200)
                        else color = $Color.rgb(200, 200, 0)
                    }
                    let elements = QuestUiTools.getDependencyLine(posParent, posChild, path[3], color)
                    ui.addElements(elements.map(function (elem, index) {
                        return [uuid + '_' + questId + '_from_' + path[2] + '_' + index, elem]
                    }))
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
    /** @type { (questId: Nullable<CQTypes.questId>, isReload?: boolean) => void } */
    openQuestUi (questId, isReload) {
        if (!questId) return
        let sourceId = this.sourceId
        let chapterId = this.chapterId
        if (typeof sourceId !== 'string' || typeof chapterId !== 'string') return
        try {
            let questJson = System.getQuestJson(Store.localCache.resolvedJson, sourceId, chapterId, questId)
            if (!questJson || questJson.type !== 'quest') return
            let saveData = System.getQuestSaveData(Store.localCache.resolvedJson, Store.localCache.saveData, sourceId, chapterId, questId)
            let that = this
            let obj = QuestUi.openQuestUi(questJson, saveData, {
                sendInputPacket: ClientSystem.sendInputPacket.bind(ClientSystem, sourceId, chapterId, questId),
                sendOutputPacket: ClientSystem.sendOutputPacket.bind(ClientSystem, sourceId, chapterId, questId),
                openParentListUi: function () {
                    QuestUi.openQuestListUi(TranAPI.translate('gui.parentList.title'), questJson.parent, function (path) {
                        let questJson = System.getQuestJson(Store.localCache.resolvedJson, path[0], path[1], path[2])
                        if (!questJson || questJson.type !== 'quest') return true
                        if (questJson.hidden) {
                            let inputState = System.getQuestInputState(Store.localCache.resolvedJson, Store.localCache.saveData, path[0], path[1], path[2])
                            if (inputState === EnumObject.questInputState.locked) {
                                alert(TranAPI.translate('alert.fail.questHidden'))
                                return true
                            }
                        }
                        that.open(path[0])
                        that.updateChapterUi(path[1])
                        that.openQuestUi(path[2])
                    })
                },
                openChildListUi: function () {
                    let questList = questJson.child.filter(function (path) {
                        let questJson = System.getQuestJson(Store.localCache.resolvedJson, path[0], path[1], path[2])
                        if (!questJson || questJson.type !== 'quest') return false
                        if (!questJson.hidden) return true
                        let inputState = System.getQuestInputState(Store.localCache.resolvedJson, Store.localCache.saveData, path[0], path[1], path[2])
                        return inputState !== EnumObject.questInputState.locked
                    })
                    QuestUi.openQuestListUi(TranAPI.translate('gui.childList.title'), questList, function (path) {
                        that.open(path[0])
                        that.updateChapterUi(path[1])
                        that.openQuestUi(path[2])
                    })
                },
                isReload: isReload
            })
            this.questUi.questId = questId
            this.questUi.isClosed = obj.isClosed
            this.questUi.close = obj.close
            this.questUi.updateRequest.exist = false
        } catch (err) {
            Utils.error('Error in function $MainUi.openQuestUi (ui/MainUi.js):\n', err)
        }
    },
    /** @type { (chapterId: Nullable<CQTypes.chapterId>) => void } */
    addChapterUiUpdateRequest (chapterId) {
        if (!chapterId || chapterId !== this.chapterId) return
        if (!this.chapterUi.isOpened()) return
        let time = Date.now()
        if (!this.chapterUiUpdateRequest.exist) {
            this.chapterUiUpdateRequest.exist = true
            this.chapterUiUpdateRequest.timeFirst = time
        }
        this.chapterUiUpdateRequest.timeLast = time
    },
    /** @type { (questId: Nullable<CQTypes.questId>) => void } */
    addQuestUiUpdateRequest (questId) {
        if (!questId || questId !== this.questUi.questId) return
        if (typeof this.questUi.isClosed !== 'function' || this.questUi.isClosed()) return
        let time = Date.now()
        if (!this.questUi.updateRequest.exist) {
            this.questUi.updateRequest.exist = true
            this.questUi.updateRequest.timeFirst = time
        }
        this.questUi.updateRequest.timeLast = time
    }
}

QuestUi.open = $MainUi.open.bind($MainUi)

Callback.addCallback('LocalTick', function () {
    if (!$MainUi.chapterUiUpdateRequest.exist) return
    if (!$MainUi.chapterUi.isOpened()) {
        $MainUi.chapterUiUpdateRequest.exist = false
        return
    }
    let time = Date.now()
    if (time - $MainUi.chapterUiUpdateRequest.timeFirst >= 500 /* 0.5s */) {
        $MainUi.updateChapterUi($MainUi.chapterId)
        return
    }
    if (time - $MainUi.chapterUiUpdateRequest.timeLast >= 100 /* 0.1s */) {
        $MainUi.updateChapterUi($MainUi.chapterId)
        return
    }
})

Callback.addCallback('LocalTick', function () {
    if (!$MainUi.questUi.updateRequest.exist) return
    if (typeof $MainUi.questUi.isClosed !== 'function') return
    if ($MainUi.questUi.isClosed()) {
        $MainUi.questUi.updateRequest.exist = false
        return
    }
    let time = Date.now()
    if (time - $MainUi.questUi.updateRequest.timeFirst >= 500 /* 0.5s */) {
        $MainUi.openQuestUi($MainUi.questUi.questId, true)
        return
    }
    if (time - $MainUi.questUi.updateRequest.timeLast >= 100 /* 0.1s */) {
        $MainUi.openQuestUi($MainUi.questUi.questId, true)
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
    $MainUi.addChapterUiUpdateRequest(path[1])
    if (path[2] === $MainUi.questUi.questId) {
        $MainUi.addQuestUiUpdateRequest(path[2])
    }
})
Callback.addCallback('CustomQuests.onLocalQuestOutputStateChanged', function (path) {
    if (typeof $MainUi.sourceId !== 'string' || typeof $MainUi.chapterId !== 'string') return
    if (path[0] !== $MainUi.sourceId || path[1] !== $MainUi.chapterId) return
    if (!$MainUi.chapterUi.isOpened()) return
    $MainUi.addChapterUiUpdateRequest(path[1])
    if (path[2] === $MainUi.questUi.questId) {
        $MainUi.addQuestUiUpdateRequest(path[2])
    }
})
Callback.addCallback('CustomQuests.onLocalCacheChanged', function (packetData, oldLocalCache) {
    if ($MainUi.chapterUi.isOpened() &&
        typeof $MainUi.chapterId === 'string' &&
        (Utils.isObject(packetData.saveData) || packetData.saveData === null)
    ) {
        $MainUi.addChapterUiUpdateRequest($MainUi.chapterId)
        $MainUi.addQuestUiUpdateRequest($MainUi.questUi.questId)
    }
    if (Utils.isObject(packetData.team) || packetData.team === null) {
        let hasTeam = packetData.team !== null
        $MainUi.mainUi.content.elements['team_remind'].x = 72 + 36 * (55 / 80) + (hasTeam ? 2000 : 0)
        $MainUi.mainUi.refresh()
    }
})

})()
