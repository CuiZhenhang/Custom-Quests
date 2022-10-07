/// <reference path='../QuestUi.js'/>

; (function () {

const $ScreenHeight = UI.getScreenHeight()
const $Color = android.graphics.Color

const $TeamUi = {
    mainUi: QuestUiTools.createUi({
        location: { x: 0, y: 0, width: 1000, height: $ScreenHeight },
        drawing: [
            { type: 'background', color: $Color.TRANSPARENT },
            { type: 'frame', x: 0, y: 0, width: 1000, height: $ScreenHeight, bitmap: 'classic_frame_bg_light', scale: 2 },
            { type: 'frame', x: 0, y: 0, width: 1000, height: 60, bitmap: 'classic_frame_bg_light', scale: 2 },
            { type: 'text', text: TranAPI.translate('gui.team'), x: 500, y: 30, font: { color: $Color.BLACK, align: 1, size: 20 } },
            { type: 'line', x1: 390, y1: 70, x2: 390, y2: $ScreenHeight - 20, width: 1, color: $Color.BLACK },
            { type: 'frame', x: 50, y: 150, width: 300, height: $ScreenHeight - 40 - 150, bitmap: 'classic_frame_bg_light', scale: 1 },
            { type: 'frame', x: 430, y: 180, width: 520, height: $ScreenHeight - 40 - 180, bitmap: 'classic_frame_bg_light', scale: 1 }
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
            search_bg: { type: 'image', x: 50, y: 100, z: 1, bitmap: 'search_bg', width: 300, height: 40,
                clicker: {
                    onClick: Utils.debounce(function () {
                        let teamList = Store.localCache.teamList
                        if (!Array.isArray(teamList)) return
                        Utils.getInput({
                            title: TranAPI.translate('gui.team.search.title'),
                            hint: TranAPI.translate('gui.team.search.hint'),
                            button: TranAPI.translate('gui.team.search')
                        }, function (keyword) {
                            $TeamUi.mainUi.content.elements['search_text'].text = keyword || TranAPI.translate('gui.team.search')
                            keyword = keyword.trim().toLowerCase()
                            if (keyword) {
                                teamList = teamList.filter(function (team) {
                                    return (team.name || '').toLowerCase().indexOf(keyword) >= 0
                                })
                            }
                            $TeamUi.updateTeamListUi(teamList)
                        })
                    }, 500)
                }
            },
            search_img: { type: 'image', x: 65, y: 110, z: 2, bitmap: 'search', width: 20, height: 20 },
            search_text: { type: 'text', x: 100, y: 110, z: 2, text: TranAPI.translate('gui.team.search'), font: { color: $Color.GRAY, size: 20 } },
            icon: { type: 'slot', visual: true, x: 430, y: 90, size: 80, bitmap: 'clear', source: {}, darken: false },
            name: { type: 'text', x: 530, y: 90, text: '', font: { color: $Color.BLACK, size: 30 } },
            subname: { type: 'text', x: 530, y: 130, text: '', font: { color: $Color.GRAY, size: 20 } },
            operate: { type: 'button', x: 850, y: 110, z: 1, bitmap: 'button_long_up', bitmap2: 'button_long_down', scale: 100 / 50,
                clicker: {
                    onClick: Utils.debounce(function () {
                        if (!Utils.isObject(Store.localCache.team)) return
                        let admin = Store.localCache.team.players[Player.get()] >= EnumObject.playerState.admin
                        QuestUi.openSelectionUi(null, [
                            {
                                text: TranAPI.translate('gui.team.operate.exit'),
                                onSelect () {
                                    Utils.dialog({
                                        title: TranAPI.translate('gui.team.operate.exit'),
                                        text: TranAPI.translate('gui.team.operate.exit.warn')
                                    }, function () {
                                        ClientSystem.exitTeam()
                                    })
                                    return false
                                }
                            }, {
                                text: TranAPI.translate('gui.team.operate.rename'),
                                darken: !admin,
                                onSelect () {
                                    if (!admin) return true
                                    Utils.getInput({
                                        title: TranAPI.translate('gui.team.operate.rename'),
                                        hint: TranAPI.translate('gui.team.enterName'),
                                        mutiLine: true
                                    }, function (name) {
                                        if (name.length <= 3 || name.length > 100) {
                                            alert(TranAPI.translate('alert.fail.nameLength'))
                                            return
                                        }
                                        ClientSystem.renameTeam(name)
                                    })
                                    return false
                                }
                            }, {
                                text: TranAPI.translate('gui.team.operate.changePassword'),
                                darken: !admin,
                                onSelect () {
                                    if (!admin) return true
                                    Utils.getInput({
                                        title: TranAPI.translate('gui.team.operate.changePassword'),
                                        hint: TranAPI.translate('gui.team.enterPassword')
                                    }, function (password) {
                                        if (Utils.md5(password) !== Store.localCache.team.password) {
                                            alert(TranAPI.translate('alert.fail.passwordWrong'))
                                            return
                                        }
                                        Utils.getInput({
                                            title: TranAPI.translate('gui.team.operate.changePassword'),
                                            hint: TranAPI.translate('gui.team.enterNewPassword')
                                        }, function (password) {
                                            if (password.length < 3) {
                                                alert(TranAPI.translate('alert.fail.passwordLength'))
                                                return
                                            }
                                            ClientSystem.changePasswordTeam(password)
                                        })
                                    })
                                    return false
                                }
                            }
                        ])
                    }, 500)
                }
            },
            operate_text: { type: 'text', x: 900, y: 115, z: 2, text: TranAPI.translate('gui.team.operate'), font: { color: $Color.BLACK, size: 15, align: 1 } },
            noteam_text: { type: 'text', x: 700, y: 135, text: TranAPI.translate('gui.team.noTeam'), font: { color: $Color.BLACK, size: 30, align: 1 } },
            noteam_subtext: { type: 'text', x: 700, y: 190, text: TranAPI.translate('gui.team.joinOrCreate'), font: { color: $Color.GRAY, size: 20, align: 1 } },
            noteam_create: { type: 'button', x: 600, y: 270, z: 1, bitmap: 'button_long_up', bitmap2: 'button_long_down', scale: 200 / 50,
                clicker: {
                    onClick: Utils.debounce(function () {
                        if (Utils.isObject(Store.localCache.team)) return
                        Utils.getInput({
                            title: TranAPI.translate('gui.team.create'),
                            hint: TranAPI.translate('gui.team.enterName'),
                            button: TranAPI.translate('gui.team.create.next'),
                            mutiLine: true
                        }, function (name) {
                            if (name.length <= 3 || name.length > 100) {
                                alert(TranAPI.translate('alert.fail.nameLength'))
                                return
                            }
                            Utils.getInput({
                                title: TranAPI.translate('gui.team.create'),
                                hint: TranAPI.translate('gui.team.enterPassword'),
                                button: TranAPI.translate('gui.team.create.next')
                            }, function (password) {
                                if (password.length < 3) {
                                    alert(TranAPI.translate('alert.fail.passwordLength'))
                                    return
                                }
                                ClientSystem.createTeam({
                                    bitmap: { id: 'VanillaBlockID.grass', count: 1 },
                                    name: name,
                                    password: password,
                                    setting: {}
                                })
                            })
                        })
                    }, 500)
                }
            },
            noteam_create_text: { type: 'text', x: 700, y: 290, z: 2, text: TranAPI.translate('gui.team.create'), font: { color: $Color.BLACK, size: 20, align: 1 } }
        }
    }, {
        onOpen (ui) {
            $TeamUi.teamListUi.open()
            if (Utils.isObject(Store.localCache.team)) $TeamUi.teamPlayerListUi.open()
        },
        onClose (ui) {
            $TeamUi.teamListUi.close()
            $TeamUi.teamPlayerListUi.close()
        }
    }, {
        closeOnBackPressed: true,
        blockingBackground: true
    }),
    teamListUi: QuestUiTools.createUi({
        location: { x: 54, y: 154, width: 292, height: $ScreenHeight - 198, scrollY: 0 },
        drawing: [{ type: 'background', color: $Color.TRANSPARENT }],
        elements: {}
    }),
    teamPlayerListUi: QuestUiTools.createUi({
        location: { x: 434, y: 184, width: 512, height: $ScreenHeight - 228, scrollY: 0 },
        drawing: [
            { type: 'background', color: $Color.TRANSPARENT },
            { type: 'line', x1: 500, y1: 10, x2: 500, y2: 0, width: 1, color: $Color.GRAY }
        ],
        elements: {}
    }),
    /** @type { QuestUi['openTeamUi'] } */
    open () {
        let team = Store.localCache.team
        let ui = this.mainUi
        let drawing = ui.content.drawing
        let elements = ui.content.elements
        if (Utils.isObject(team)) {
            let name = team.name.split('\n')
            elements['search_text'].text = TranAPI.translate('gui.team.search')
            elements['icon'].bitmap = team.bitmap.bitmap || 'clear'
            elements['icon'].source = Utils.transferItemFromJson(team.bitmap)
            elements['icon'].darken = Boolean(team.bitmap.darken)
            elements['name'].text = name[0]
            elements['subname'].text = name[1]
            drawing[6].x = 430
            elements['icon'].x = 430
            elements['name'].x = 530
            elements['subname'].x = 530
            elements['operate'].x = 850
            elements['operate_text'].x = 900
            elements['noteam_text'].x = 700 + 2000
            elements['noteam_subtext'].x = 700 + 2000
            elements['noteam_create'].x = 600 + 2000
            elements['noteam_create_text'].x = 700 + 2000
            this.updateTeamPlayerListUi()
            if (ui.isOpened() && !this.teamPlayerListUi.isOpened()) this.teamPlayerListUi.open()
        } else {
            drawing[6].x = 430 + 2000
            elements['icon'].x = 430 + 2000
            elements['name'].x = 530 + 2000
            elements['subname'].x = 530 + 2000
            elements['operate'].x = 850 + 2000
            elements['operate_text'].x = 900 + 2000
            elements['noteam_text'].x = 700
            elements['noteam_subtext'].x = 700
            elements['noteam_create'].x = 600
            elements['noteam_create_text'].x = 700
            if (this.teamPlayerListUi.isOpened()) this.teamPlayerListUi.close()
        }
        this.updateTeamListUi(Store.localCache.teamList)
        ui.open(true)
    },
    /** @type { (teamList: ReturnType<ServerSystem['getTeamList']>) => void } */
    updateTeamListUi (teamList) {
        let uuid = Utils.getUUID()
        let ui = this.teamListUi
        ui.content.drawing.splice(1)
        ui.clearNewElements()
        if (!Array.isArray(teamList)) teamList = []
        ui.ui.getLocation().scrollY = (160*Math.min(teamList.length, 15 + 1) + 5) * (292/1000)
        teamList.some(function (team, index) {
            if (index >= 15) {
                ui.addElements([
                    [uuid + '_' + index + '_warn', {
                        type: 'text', x: 500, y: 60 + 160*index, text: TranAPI.translate('gui.team.omitList'),
                        font: { color: $Color.BLACK, size: 40 }
                    }]
                ])
                return true
            }
            let name = String(team.name).split('\n')
            let teamId = team.teamId
            ui.content.drawing.push({
                type: 'line', x1: 20, y1: 160 + 160*index, x2: 980, y2: 160 + 160*index,
                width: 1, color: $Color.GRAY
            })
            ui.addElements([
                [uuid + '_' + index + '_bg', {
                    type: 'image', x: 0, y: 160*index, bitmap: 'clear', width: 1000, height: 160,
                    clicker: {
                        onClick: Utils.debounce(function () {
                            Utils.getInput({
                                title: TranAPI.translate('gui.team.joinTeam'),
                                hint: TranAPI.translate('gui.team.enterPassword')
                            }, function (str) {
                                ClientSystem.joinTeam(teamId, str)
                                alert(TranAPI.translate('gui.team.applicationSent'))
                            })
                        }, 500)
                    }
                }],
                [uuid + '_' + index + '_icon', {
                    type: 'slot', visual: true, x: 20, y: 10 + 160*index, size: 140,
                    bitmap: team.bitmap.bitmap || 'clear',
                    source: Utils.transferItemFromJson(team.bitmap),
                    darken: Boolean(team.bitmap.darken)
                }],
                [uuid + '_' + index + '_name', {
                    type: 'text', x: 180, y: 20 + 160*index, text: name[0] || '',
                    font: { color: $Color.BLACK, size: 60 }
                }],
                [uuid + '_' + index + '_subname', {
                    type: 'text', x: 180, y: 90 + 160*index, text: name[1] || '',
                    font: { color: $Color.GRAY, size: 40 }
                }]
            ])
        })
        ui.refresh()
    },
    updateTeamPlayerListUi () {
        let teamPlayerList = Utils.deepCopy(Store.localCache.teamPlayerList)
        let team = Store.localCache.team
        let uuid = Utils.getUUID()
        let ui = this.teamPlayerListUi
        ui.content.drawing.splice(2)
        ui.clearNewElements()
        if (!Array.isArray(teamPlayerList) || !Utils.isObject(team)) teamPlayerList = []
        teamPlayerList.sort(function (a, b) { return Number(b.online) - Number(a.online) })
        ui.content.drawing[1].y2 = 100*Math.ceil(teamPlayerList.length / 2)
        ui.ui.getLocation().scrollY = (ui.content.drawing[1].y2 + 5) * (512/1000)
        teamPlayerList.forEach(function (obj, index) {
            let pos = [500*(index % 2), 100*Math.floor(index / 2)]
            if (index % 2 == 0) {
                ui.content.drawing.push({
                    type: 'line', x1: 10, y1: 100 + pos[1],
                    x2: 990, y2: 100 + pos[1],
                    width: 1, color: $Color.GRAY
                })
            }
            let state = team.players[obj.player]
            let stateKeyStr = 'gui.team.playerState.absent'
            if (state === EnumObject.playerState.member) stateKeyStr = 'gui.team.playerState.member'
            else if (state === EnumObject.playerState.admin) stateKeyStr = 'gui.team.playerState.admin'
            else if (state === EnumObject.playerState.owner) stateKeyStr = 'gui.team.playerState.owner'
            ui.addElements([
                [uuid + '_' + index + '_bg', {
                    type: 'image', x: pos[0], y: pos[1], bitmap: 'clear', width: 500, height: 100,
                    clicker: {
                        onClick: Utils.debounce(function () {
                            alert(obj.name)
                        }, 500)
                    }
                }],
                [uuid + '_' + index + '_name', {
                    type: 'text', x: 40 + pos[0], y: 10 + pos[1], text: obj.name || '',
                    font: { color: $Color.BLACK, size: 40 }
                }],
                [uuid + '_' + index + '_state', {
                    type: 'text', x: 20 + pos[0], y: 60 + pos[1], text: TranAPI.translate(stateKeyStr),
                    font: { color: $Color.GRAY, size: 30 }
                }],
                [uuid + '_' + index + '_online', {
                    type: 'image', x: 15 + pos[0], y: 25 + pos[1],
                    width: 20, height: 20, bitmap: obj.online ? 'dot_green' : 'dot_grey'
                }]
            ])
        })
        ui.refresh()
    }
}
Callback.addCallback('CustomQuests.onLocalCacheChanged', function (packetData, oldLocalCache) {
    if ($TeamUi.mainUi.isOpened() && (
        (Utils.isObject(packetData.team) || packetData.team === null) || 
        (Array.isArray(packetData.teamPlayerList) || packetData.teamPlayerList === null)
    )) {
        $TeamUi.open()
        return
    }
    if (Array.isArray(packetData.teamList) && $TeamUi.teamListUi.isOpened()) {
        $TeamUi.updateTeamListUi(packetData.teamList)
    }
})

QuestUi.openTeamUi = $TeamUi.open.bind($TeamUi)

})()
