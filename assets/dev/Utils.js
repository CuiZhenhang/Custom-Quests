/// <reference path='./TranAPI.js'/>

/** @type { Utils } */
const Utils = {
    voidFunc() {},
    log (message, type, hasAlert) {
        const msg = '<Custom Quests> ' + message
        if (hasAlert) alert(msg)
        Logger.Log(msg, type)
    },
    randomString() {
        return ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx').replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0
            const v = c === 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        }) + '_'
    },
    isDefined(length, arr) {
        for (const i = 0; i < length; i++) {
            if (arr[i] === void 0) return false
        }
        return true
    },
    hasKeyOfKeys (obj, keys) {
        if(typeof obj !== 'object') return false
        if(!Array.isArray(keys)) return false
        return keys.some(function (key) {
            return obj[key] !== void 0
        })
    },
    debounce (func, delay, func2, ths) {
        if(typeof func !== 'function') return func
        if(typeof delay !== 'number' || isNaN(delay)) return func
        let time = 0
        return function () {
            const now = Date.now()
            if (now >= time) {
                time = now + delay
                return func.apply(ths, arguments)
            } else {
                time = now + delay
                if(typeof func2 === 'function') {
                    return func2.apply(ths, arguments)
                }
            }
        }
    },
    transferIdFromJson(id, onServer) {
        if (!id) return ItemID.missing_item
        if (typeof id === 'number') {
            return onServer ? id : Network.serverToLocalId(id)
        }
        if (typeof id !== 'string') {
            return ItemID.missing_item
        }
        if (id.match(/^item[a-z]*(:|.)/i)) {
            return ItemID[id.replace(/^item[a-z]*(:|.)/i, '')] || ItemID.missing_item
        }
        if (id.match(/^block[a-z]*(:|.)/i)) {
            return BlockID[id.replace(/^block[a-z]*(:|.)/i, '')] || ItemID.missing_item
        }
        if (id.match(/^v[a-z]*item[a-z]*(:|.)/i)) {
            return VanillaItemID[id.replace(/^v[a-z]*item[a-z]*(:|.)/i), ''] || ItemID.missing_item
        }
        if (id.match(/^v[a-z]*block[a-z]*(:|.)/i)) {
            return VanillaBlockID[id.replace(/^v[a-z]*block[a-z]*(:|.)/i, '')] || ItemID.missing_item
        }
        return ItemID.missing_item
    },
    idFromItem: (function () {
        const idFromItem = {}
        Callback.addCallback('PostLoaded', function () {
            new java.lang.Thread(new java.lang.Runnable({
                run() {
                    for (const name in VanillaItemID) idFromItem[VanillaItemID[name]] = 'vitem:' + name
                    for (const name in VanillaBlockID) idFromItem[VanillaBlockID[name]] = 'vblock:' + name
                    for (const name in ItemID) idFromItem[ItemID[name]] = 'item:' + name
                    for (const name in BlockID) idFromItem[BlockID[name]] = 'block:' + name
                }
            })).start()
        })
        return idFromItem
    })(),
    transferIdFromItem(id) {
        if (typeof id !== 'number') return '0'
        return this.idFromItem[id] || String(id)
    },
    extraType: {},
    setExtraTypeCb(type, { fromJson, fromItem, isPassed }) {
        if (typeof type !== 'string' || !type) return
        if (typeof this.extraType[type] !== 'object') this.extraType[type] = {}
        if (typeof fromJson === 'function') this.extraType[type].fromJson = fromJson
        if (typeof fromItem === 'function') this.extraType[type].fromItem = fromItem
        if (typeof isPassed === 'function') this.extraType[type].isPassed = isPassed
    },
    getExtraTypeCb(type, from) {
        if (typeof type !== 'string' || !type) return
        if (typeof from !== 'string') return
        if (typeof this.extraType[type] !== 'object') return this.voidFunc
        return this.extraType[type][from] || this.voidFunc
    },
    transferItemFromJson(itemJson, onServer) {
        if (typeof itemJson !== 'object') return {}
        const that = this
        const item = {
            id: this.transferIdFromJson(itemJson.id, onServer),
            count: itemJson.count || 1,
            data: itemJson.data || 0,
            extra: null
        }
        if (typeof itemJson.extra === 'object') {
            item.extra = new ItemExtraData()
            if (Array.isArray(itemJson.extra)) {
                itemJson.extra.forEach(function (extraJson) {
                    if (typeof extraJson !== 'object') return
                    that.getExtraTypeCb(extraJson.type, 'fromJson')(item, extraJson, onServer)
                })
            } else {
                this.getExtraTypeCb(itemJson.extra.type, 'fromJson')(item, itemJson.extra, onServer)
            }
        }
        return item
    },
    transferItemFromItem(item) {
        if (typeof item !== 'object') return {}
        const itemJson = {
            id: this.transferIdFromItem(item.id),
            count: item.count || 1,
            data: item.data || 0,
            extra: null
        }
        if (item.extra && !item.extra.isEmpty()) {
            itemJson.extra = []
            for (const type in this.extraType) {
                if (typeof this.extraType[type].fromItem !== 'function') continue
                const extraJson = { type: type }
                if (this.extraType[type].fromItem(item, extraJson)) continue
                itemJson.extra.push(extraJson)
            }
        }
        return itemJson
    },
    isItemExtraPassed(item, extraJsonArray) {
        if (typeof item !== 'object') return false
        if (typeof extraJsonArray !== 'object') return false
        if (!item.extra) item.extra = new ItemExtraData()
        const that = this
        let passed = true
        if (Array.isArray(extraJsonArray)) {
            extraJsonArray.every(function (extraJson) {
                if (typeof extraJson !== 'object') return true
                const cb = that.getExtraTypeCb(extraJson.type, 'isPassed')
                if (cb === that.voidFunc) return true
                return passed = passed && cb(item, extraJson)
            })
        } else {
            const cb = that.getExtraTypeCb(extraJsonArray.type, 'isPassed')
            if (cb !== that.voidFunc) passed = passed && cb(item, extraJsonArray)
        }
        return passed
    },
    readQuestsData(path) {
        if (typeof path !== 'string') return {}
        const that = this
        try {
            if (FileTools.isExists(path + 'contents.json')) {
                const mainJson = FileTools.ReadJSON(path + 'contents.json')
                if (mainJson.main) {
                    mainJson.main.forEach(function (pathChapter, indexChapter) {
                        if (typeof pathChapter === 'string') {
                            try {
                                mainJson.main[indexChapter] = FileTools.ReadJSON(path + pathChapter) || {}
                            } catch (err) {
                                that.log('Error in readQuestsData:\n' + err, 'ERROR')
                                mainJson.main[indexChapter] = {}
                            }
                        }
                        const chapterJson = mainJson.main[indexChapter]
                        if (chapterJson.quest) {
                            chapterJson.quest.forEach(function (pathQuest, indexQuest) {
                                if (typeof pathQuest === 'string') {
                                    try {
                                        chapterJson.quest[indexQuest] = FileTools.ReadJSON(path + pathQuest) || {}
                                    } catch (err) {
                                        that.log('Error in readQuestsData:\n' + err, 'ERROR')
                                        chapterJson.quest[indexQuest] = {}
                                    }
                                }
                            })
                        }
                    })
                    return mainJson
                }
            } else if (FileTools.isExists(path + 'CustomQuests.json')) {
                const mainJson = FileTools.ReadJSON(path + 'CustomQuests.json')
                if (mainJson.main) return mainJson
            } else {
                that.log('Failed to ReadPath:\nThere is no files: ' + path, 'WARN', true)
            }
            return {}
        } catch (err) {
            that.log('Error in readQuestsData:\n' + err, 'ERROR', true)
            return {}
        }
    },
    packetHelper: (function () {
        return function () {
            const packetList = {}
            this.addPacket = function (name, func) {
                if (typeof func !== 'function') return
                packetList[name] = func
            }
            this.callPacket = function (name, args) {
                if (typeof packetList[name] !== 'function') return
                if (!Array.isArray(args)) args = []
                packetList[name].apply(null, args)
            }
        }
    })()
}

Utils.setExtraTypeCb('name', {
    fromJson: function (item, extraJson, onServer) {
        item.extra.setCustomName(extraJson.name)
    },
    fromItem: function (item, extraJson) {
        extraJson.name = item.extra.getCustomName()
        return !extraJson.name
    },
    isPassed: function(item, extraJson) {
        return item.extra.getCustomName() === extraJson.name
    }
})

Utils.setExtraTypeCb('enchant', {
    fromJson: function (item, extraJson, onServer) {
        if(!Array.isArray(extraJson.array)) return
        extraJson.array.forEach(function (obj) {
            if (typeof obj !== 'object') return
            if (typeof obj.type !== 'number') return
            if (typeof obj.level !== 'number') return
            item.extra.addEnchant(obj.type, obj.level)
        })
    },
    fromItem: function (item, extraJson) {
        if (item.extra.getEnchantCount() <= 0) return true
        extraJson.array = []
        const enchants = item.extra.getEnchants()
        for (const id in enchants) {
            if (enchants[id] <= 0) continue
            extraJson.array.push({
                type: id,
                level: enchants[id]
            })
        }
        return false
    },
    isPassed: function(item, extraJson) {
        if(!Array.isArray(extraJson.array)) return true
        const enchants = item.extra.getEnchants()
        return extraJson.array.every(function (obj) {
            if (typeof obj !== 'object') return true
            if (typeof obj.type !== 'number') return true
            if (typeof obj.level !== 'number') obj.level = 0
            if (typeof obj.operator !== 'string') obj.operator = '>='
            switch (obj.operator) {
                case '<': return enchants[obj.type] < obj.level
                case '>': return enchants[obj.type] > obj.level
                case '=': return enchants[obj.type] === obj.level
                case '<=': return enchants[obj.type] <= obj.level
                case '>=': return enchants[obj.type] >= obj.level
                case '==': return enchants[obj.type] === obj.level
                case '!=': return enchants[obj.type] !== obj.level
                default: return true
            }
        })
    }
})

Utils.setExtraTypeCb('energy', {
    fromJson: function (item, extraJson, onServer) {
        ChargeItemRegistry.setEnergyStored(item, extraJson.energy)
    },
    fromItem: function (item, extraJson) {
        const energyData = ChargeItemRegistry.getItemData(item.id)
        if (typeof energyData !== 'object') return true
        const energy = ChargeItemRegistry.getEnergyStored(item, energyData.energy)
        if (typeof energy !== 'number') return true
        extraJson.energy = energy
        return false
    },
    isPassed: function(item, extraJson) {
        const energy = item.extra.getInt('energy')
        if (typeof extraJson.operator !== 'string') extraJson.operator = '>='
        switch (obj.operator) {
            case '<': return energy < extraJson.energy
            case '>': return energy > extraJson.energy
            case '=': return energy === extraJson.energy
            case '<=': return energy <= extraJson.energy
            case '>=': return energy >= extraJson.energy
            case '==': return energy === extraJson.energy
            case '!=': return energy !== extraJson.energy
            default: return true
        }
    }
})
