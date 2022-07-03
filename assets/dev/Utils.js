/// <reference path='./TranAPI.js'/>

/** @type { Utils } */
const Utils = {
    voidFunc () {},
    log (message, type, hasAlert) {
        const msg = '<Custom Quests> ' + message
        if (hasAlert) alert(msg)
        Logger.Log(msg, type)
    },
    getUUID () {
        return String(java.util.UUID.randomUUID().toString())
    },
    md5 (str) {
        if (typeof str !== 'string') return
        try {
            const jStr = new java.lang.String(str)
            const secretBytes = java.security.MessageDigest.getInstance('md5').digest(jStr.getBytes('UTF8'))
            const ret = new java.math.BigInteger(1, secretBytes).toString(16)
            return String(ret)
        } catch (err) {
            this.log('Error in md5 (Utils.js):\n' + err, 'ERROR', false)
            return str
        }
    },
    isDefined (length, arr) {
        for (const i = 0; i < length; i++) {
            if (arr[i] === void 0) return false
        }
        return true
    },
    isObject (obj) {
        if (typeof obj !== 'object') return false
        if (obj === null) return false
        return true
    },
    hasKeyOfKeys (obj, keys) {
        if(this.isObject(obj)) return false
        if(!Array.isArray(keys)) return false
        return keys.some(function (key) {
            return obj[key] !== void 0
        })
    },
    deepCopy (obj) {
        if (!this.isObject(obj)) return obj
        return JSON.parse(JSON.stringify(obj))
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
    operate (a, operator, b, defaultValue) {
        switch (operator) {
            case '<': return a < b
            case '>': return a > b
            case '=': return a === b
            case '<=': return a <= b
            case '>=': return a >= b
            case '==': return a === b
            case '!=': return a !== b
            default: return Boolean(defaultValue)
        }
    },
    transferIdFromJson (id) {
        if (!id) return ItemID.missing_item
        if (typeof id === 'number') {
            return Network.inRemoteWorld() ? Network.serverToLocalId(id) : id
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
    transferIdFromItem (id) {
        if (typeof id !== 'number') return '0'
        return this.idFromItem[id] || String(id)
    },
    extraType: {},
    setExtraTypeCb (type, extraTypeCb) {
        if (typeof type !== 'string' || !type) return
        if (!this.isObject(extraTypeCb)) return
        if (!this.isObject(this.extraType[type])) this.extraType[type] = {}
        const that = this
        const methods = ['fromJson', 'fromItem', 'isPassed']
        methods.forEach(function (method) {
            if (typeof extraTypeCb[method] === 'function') {
                that.extraType[type][method] = extraTypeCb[method]
            } else if (extraTypeCb[method] === null) {
                that.extraType[type][method] = null
            }
        })
    },
    getExtraTypeCb (type, from) {
        if (typeof type !== 'string' || !type) return
        if (typeof from !== 'string') return
        if (!this.isObject(this.extraType[type])) return this.voidFunc
        return this.extraType[type][from] || this.voidFunc
    },
    transferItemFromJson (itemJson) {
        if (!this.isObject(itemJson)) return {}
        const that = this
        const item = {
            id: this.transferIdFromJson(itemJson.id),
            count: itemJson.count || 1,
            data: itemJson.data || 0,
            extra: null
        }
        if (this.isObject(itemJson.extra)) {
            item.extra = new ItemExtraData()
            if (Array.isArray(itemJson.extra)) {
                itemJson.extra.forEach(function (extraJson) {
                    if (!that.isObject(extraJson)) return
                    that.getExtraTypeCb(extraJson.type, 'fromJson')(item, extraJson)
                })
            } else {
                this.getExtraTypeCb(itemJson.extra.type, 'fromJson')(item, itemJson.extra)
            }
        }
        return item
    },
    transferItemFromItem (item) {
        if (!this.isObject(item)) return {}
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
    isItemExtraPassed (item, extraJsonArray) {
        if (!this.isObject(item)) return false
        if (!this.isObject(extraJsonArray)) return false
        if (!item.extra) item.extra = new ItemExtraData()
        const that = this
        let passed = true
        if (Array.isArray(extraJsonArray)) {
            extraJsonArray.every(function (extraJson) {
                if (!that.isObject(extraJson)) return true
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
    readContents (path) {
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
                                that.log('Error in readContents:\n' + err, 'ERROR')
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
                                        that.log('Error in readContents:\n' + err, 'ERROR')
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
                that.log('Failed to read contents:\nThere is no files: ' + path, 'WARN', true)
            }
        } catch (err) {
            that.log('Error in readContents:\n' + err, 'ERROR', true)
        }
        return {}
    },
    resolveRefs (value, refsArray) {
        if (typeof value !== 'string') return value
        if (!value.match(/^ref:/i)) return value
        const that = this
        const refId = value.replace(/^ref:/i, '')
        let ret = value
        refsArray.some(function (refs) {
            if (!that.isObject(refs)) return false
            if (typeof refs[refId] !== 'undefined' && refs[refId] !== null) {
                ret = refs[refId]
                return true
            }
            return false
        })
        return ret
    },
    resolveBitmap (bitmap, bitmapNameObject) {
        if (typeof bitmap !== 'string') return null
        if (!this.isObject(bitmapNameObject)) return bitmap
        if (bitmapNameObject[bitmap]) {
            return 'cq_custom_bitmap:' + bitmap
        }
        return bitmap
    },
    resolveTextJson (textJson) {
        if (typeof textJson === 'string') return textJson
        if (Utils.isObject(textJson)) {
            const ret = {}
            for (const lang in textJson) {
                ret[lang] = String(textJson[lang])
            }
            return ret
        }
        return ''
    },
    putTextureSourceFromBase64: (function () {
        const TextureSource = new com.zhekasmirnov.innercore.api.mod.ui.TextureSource()
        /** @type { Utils['putTextureSourceFromBase64'] } */
        return function (name, encodedString) {
            if (typeof name !== 'string') return
            if (typeof encodedString !== 'string') return
            try {
                const encodeByte = android.util.Base64.decode(encodedString, 0)
                const bitmap = android.graphics.BitmapFactory.decodeByteArray(encodeByte, 0, encodeByte.length)
                TextureSource.put(name, bitmap)
            } catch (err) {
                this.log('Error in putTextureSourceFromBase64', 'ERROR', false)
            }
        }
    })(),
    getInput ({text, hint, title, button}, cb){
        UI.getContext().runOnUiThread(new java.lang.Runnable({
            run () {
                try {
                    const editText = new android.widget.EditText(UI.getContext())
                    editText.setHint(hint || '')
                    editText.setSingleLine(true)
                    if(typeof text == 'string') editText.setText(text)
                    new android.app.AlertDialog.Builder(UI.getContext())
                        .setTitle(title || '')
                        .setView(editText)
                        .setPositiveButton(
                            button || TranAPI.translate('Utils.dialog.confirm'),
                            new android.content.DialogInterface.OnClickListener({
                                onClick: Utils.Debounce(function () {
                                    if (typeof cb === 'function') {
                                        cb(editText.getText().toString() + '')
                                    }
                                }, 500)
                            })
                        )
                        .setNegativeButton(TranAPI.translate('Utils.dialog.cancel'), null)
                        .show()
                } catch (err) {}
            }
        }))
    },
    dialog ({text, title, button}, cb){
        UI.getContext().runOnUiThread(new java.lang.Runnable({
            run () {
                try {
                    new android.app.AlertDialog.Builder(UI.getContext())
                        .setTitle(title || '')
                        .setMessage(text)
                        .setPositiveButton(
                            button || TranAPI.translate('Utils.dialog.confirm'),
                            new android.content.DialogInterface.OnClickListener({
                                onClick: Utils.Debounce(function () {
                                    if(typeof cb === 'function') cb()
                                }, 500)
                            })
                        )
                        .setNegativeButton(TranAPI.translate('Utils.dialog.cancel'), null)
                        .show()
                } catch (err) {}
            }
        }))
    },
    getInventory (player) {
		const inventory = []
		const actor = new PlayerActor(player)
		for (const i = 0; i < 36; i++) {
			inventory[i] = actor.getInventorySlot(i)
		}
		return inventory
    },
    getSortInventory (inventory) {
		const sortInventory = {}
		inventory.forEach(function (item) {
			if (item.id === 0) return
            if (sortInventory[item.id + ':' + item.data]) {
                sortInventory[item.id + ':' + item.data] += item.count
                if(item.data !== -1) sortInventory[item.id + ':-1'] += item.count
            } else {
                sortInventory[item.id + ':' + item.data] = item.count
                sortInventory[item.id + ':-1'] = item.count
            }
		})
		return sortInventory
    },
    getExtraInventory (inventory) {
        const extraInventory = {}
        inventory.forEach(function (item) {
            if (!item.extra || item.extra.isEmpty()) return
            if (extraInventory[item.id + ':' + item.data]) {
                extraInventory[item.id + ':' + item.data].push(item)
                if(item.data !== -1) extraInventory[item.id + ':-1'].push(item)
            } else {
                extraInventory[item.id + ':' + item.data] = [item]
                extraInventory[item.id + ':-1'] = [item]
            }
        })
        return extraInventory
    }
}

Utils.setExtraTypeCb('name', {
    fromJson: function (item, extraJson) {
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
    fromJson: function (item, extraJson) {
        if(!Array.isArray(extraJson.array)) return
        extraJson.array.forEach(function (obj) {
            if (!Utils.isObject(obj)) return
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
            if (!Utils.isObject(obj)) return true
            if (typeof obj.type !== 'number') return true
            if (typeof obj.level !== 'number') obj.level = 0
            if (typeof obj.operator !== 'string') obj.operator = '>='
            return Utils.operate(Number(enchants[obj.type]), obj.operator, obj.level, true)
        })
    }
})

Utils.setExtraTypeCb('energy', {
    fromJson: function (item, extraJson) {
        ChargeItemRegistry.setEnergyStored(item, extraJson.energy)
    },
    fromItem: function (item, extraJson) {
        const energyData = ChargeItemRegistry.getItemData(item.id)
        if (!Utils.isObject(energyData)) return true
        const energy = ChargeItemRegistry.getEnergyStored(item, energyData.energy)
        if (typeof energy !== 'number') return true
        extraJson.energy = energy
        return false
    },
    isPassed: function(item, extraJson) {
        const energy = item.extra.getInt('energy')
        if (typeof extraJson.operator !== 'string') extraJson.operator = '>='
        if (typeof extraJson.energy !== 'number') extraJson.energy = 0
        return Utils.operate(energy, extraJson.operator, extraJson.energy, true)
    }
})
