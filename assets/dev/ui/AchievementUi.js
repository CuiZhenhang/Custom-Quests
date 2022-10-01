/// <reference path='../QuestUi.js'/>

; (function () {

const $ScreenHeight = UI.getScreenHeight()
const $Color = android.graphics.Color
const displayLength = Math.max(Math.floor($ScreenHeight * 2/3 / 50), 1)

const $AchievementUi = {
    /** @type { Array<{exist: boolean, bg: UI.UIImageElement, slot: UI.UISlotElement, title: UI.UITextElement, name: UI.UITextElement}> } */
    display: [],
    /** @type { Array<{icon: CQTypes.IconJson, name: string, time: number}> } */
    waiting: [],
    achievementUi: QuestUiTools.createUi({
        location: {x: 750, y: 0, width: 250, height: displayLength * 50},
        drawing: [{type: 'background', color: $Color.TRANSPARENT}],
        elements: {}
    }, null, {
        asGameOverlay: true,
        notTouchable: true
    }),
    /** @type { (obj: {icon: CQTypes.IconJson, name: string}) => void } */
    addWaiting (obj) {
        if (!Utils.isObject(obj)) return
        this.waiting.push({
            icon: obj.icon,
            name: obj.name,
            time: Date.now()
        })
        this.update()
    },
    /** @type { () => Nullable<{icon: CQTypes.IconJson, name: string}> } */
    popWaiting () {
        let now = Date.now()
        let ret = this.waiting.shift()
        while (ret && ret.time < now - 30*1000) ret = this.waiting.shift()
        if (!ret) return null
        return {
            icon: ret.icon,
            name: ret.name
        }
    },
    /** @type { () => number } */
    getEmptyDisplayIndex () {
        for (let index = 0; index < this.display.length; index++) {
            if (!this.display[index].exist) {
                return index
            }
        }
        return -1
    },
    /** @type { (index: number, obj: {icon: CQTypes.IconJson, name: string}) => void } */
    addDisplay (index, obj) {
        if (index < 0 || index >= this.display.length) return
        if (this.display[index].exist) return
        if (!Utils.isObject(obj)) return
        let ui = this.achievementUi
        let display = this.display[index]
        display.exist = true
        display.slot.bitmap = obj.icon.bitmap || 'clear'
        display.slot.source = Utils.transferItemFromJson(obj.icon)
        display.name.text = obj.name
        QuestUiTools.createAnimator(1000, function (animator) {
            let posX = 1000 - animator.getAnimatedValue() * 1000
            let deltaX = posX - display.bg.x
            display.bg.x += deltaX
            display.slot.x += deltaX
            display.title.x += deltaX
            display.name.x += deltaX
            ui.ui.forceRefresh()
        }).addListener({
            onAnimationEnd () {
                let time = 0
                Updatable.addLocalUpdatable({
                    update () {
                        if (++time < 60) return
                        QuestUiTools.createAnimator(1000, function (animator) {
                            let posX = animator.getAnimatedValue() * 1000
                            let deltaX = posX - display.bg.x
                            display.bg.x += deltaX
                            display.slot.x += deltaX
                            display.title.x += deltaX
                            display.name.x += deltaX
                            ui.ui.forceRefresh()
                        }).addListener({
                            onAnimationEnd () {
                                let deltaX = 2000 - display.bg.x
                                display.bg.x += deltaX
                                display.slot.x += deltaX
                                display.title.x += deltaX
                                display.name.x += deltaX
                                display.exist = false
                            }
                        })
                        this.remove = true
                    }
                })
            }
        })
    },
    update () {
        while (true) {
            let index = this.getEmptyDisplayIndex()
            if (index < 0) return
            let obj = this.popWaiting()
            if (!Utils.isObject(obj)) return
            this.addDisplay(index, obj)
        }
    }
}

let bit = 200 / 64
$AchievementUi.display.length = displayLength
for (let index = 0; index < displayLength; index++) {
    $AchievementUi.display[index] = {
        exist: false,
        bg: {
            type: 'image', x: 0 + 2000, y: index * 200, z: 1,
            bitmap: 'achievement_bg', width: 1000, height: 64 * bit
        },
        slot: {
            type: 'slot', x: 8 * bit + 2000, y: index * 200 + 8 * bit, z: 2,
            size: 48 * bit, visual: true, bitmap: 'clear', source: {}
        },
        title: {
            type: 'text', x: 59 * bit + 2000, y: index * 200 + 10 * bit, z: 2,
            text: TranAPI.translate('gui.questFinished'),
            font: { color: $Color.YELLOW, size: 20 * bit }
        },
        name: {
            type: 'text', x: 59 * bit + 2000, y: index * 200 + 34 * bit, z: 2,
            text: '', font: { color: $Color.WHITE, size: 20 * bit }
        }
    }
    $AchievementUi.achievementUi.addElements([
        [index + '_bg', $AchievementUi.display[index].bg],
        [index + '_slot', $AchievementUi.display[index].slot],
        [index + '_title', $AchievementUi.display[index].title],
        [index + '_name', $AchievementUi.display[index].name],
    ])
}

Callback.addCallback('NativeGuiChanged', function (screenName) {
    let inGame = screenName === 'in_game_play_screen' || screenName === 'hud_screen'
    let isOpened = $AchievementUi.achievementUi.isOpened()
    if (inGame && !isOpened) $AchievementUi.achievementUi.open(true)
    else if (!inGame && isOpened) $AchievementUi.achievementUi.close()
})

Callback.addCallback('LevelLeft', function () {
    $AchievementUi.waiting.length = 0
})

Callback.addCallback('CustomQuests.onLocalQuestInputStateChanged', function (path, newState, oldState) {
    if (newState === oldState) return
    if (newState === EnumObject.questInputState.finished) {
        let config = Store.localCache.jsonConfig[path[0]]
        if (!Utils.isObject(config) || !config.guiMessage) return
        let questJson = System.getQuestJson(Store.localCache.resolvedJson, path[0], path[1], path[2])
        if (!Utils.isObject(questJson) || questJson.type !== 'quest') return
        $AchievementUi.addWaiting({
            icon: questJson.icon[2],
            name: TranAPI.translate(questJson.inner.name)
        })
    }
})

})()
