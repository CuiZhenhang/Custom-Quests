/// <reference path='./TranAPI.js'/>

/** @type { Utils } */
const Utils = {
    voidFunc () {},
    log (message, type, hasAlert) {
        let msg = '<Custom Quests> ' + message
        if (hasAlert) alert(msg)
        Logger.Log(msg, type)
    },
    getUUID () {
        let uuid = String(java.util.UUID.randomUUID().toString()).split('-')
        let time = (Date.now() % 65535).toString(16)
        while (time.length < 4) time = '0' + time
        return uuid[0] + uuid[1] + time
    },
    md5 (str) {
        if (typeof str !== 'string') return 'error-md5'
        try {
            let jStr = new java.lang.String(str)
            let secretBytes = java.security.MessageDigest.getInstance('md5').digest(jStr.getBytes('UTF8'))
            let ret = new java.math.BigInteger(1, secretBytes).toString(16)
            return String(ret)
        } catch (err) {
            this.log('Error in md5 (Utils.js):\n' + err, 'ERROR', false)
            return 'error-md5'
        }
    },
    isObject (obj) {
        try {
            if (typeof obj !== 'object' && typeof obj !== 'function') return false
            if (obj === null) return false
            return true
        } catch (err) {
            return false
        }
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
            let now = Date.now()
            let ret
            if (now >= time) ret = func.apply(ths, arguments)
            else if (typeof func2 === 'function') ret = func2.apply(ths, arguments)
            time = now + delay
            return ret
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
    replace (str, replaceArray) {
        if (typeof str !== 'string') return ''
        if (!Array.isArray(replaceArray)) return str
        replaceArray.forEach(function (replacement) {
            if (!Array.isArray(replacement)) return
            str = str.replace(String(replacement[0]), String(replacement[1]))
        })
        return str
    },
    transferIdFromJson (id) {
        if (typeof id !== 'number' && typeof id !== 'string') return 0
        if (typeof id === 'string' && !isNaN(Number(id))) id = Number(id)
        if (typeof id === 'number') {
            return Network.inRemoteWorld() ? Network.serverToLocalId(id) : id
        }
        if ((/^(v|m)[a-z]*item[a-z]*(:|.)/i).test(id)) {
            id = id.replace(/^(v|m)[a-z]*item[a-z]*(:|.)/i, '')
            return VanillaItemID[id] || ItemID[id] || ItemID.missing_item
        }
        if ((/^(v|m)[a-z]*block[a-z]*(:|.)/i).test(id)) {
            id = id.replace(/^(v|m)[a-z]*block[a-z]*(:|.)/i, '')
            return VanillaBlockID[id] || BlockID[id] || ItemID.missing_item
        }
        if ((/^item[a-z]*(:|.)/i).test(id)) {
            id = id.replace(/^item[a-z]*(:|.)/i, '')
            return ItemID[id] || VanillaItemID[id] || ItemID.missing_item
        }
        if ((/^block[a-z]*(:|.)/i).test(id)) {
            id = id.replace(/^block[a-z]*(:|.)/i, '')
            return BlockID[id] || VanillaBlockID[id] || ItemID.missing_item
        }
        return ItemID.missing_item
    },
    idFromItem: (function () {
        /** @type { typeof Utils['idFromItem'] } */
        let idFromItem = {}
        Callback.addCallback('PostLoaded', function () {
            Threading.initThread('CustomQuests.initId', function () {
                for (let name in VanillaItemID) {
                    idFromItem[VanillaItemID[name]] = 'vitem:' + name
                }
                for (let name in VanillaBlockID) {
                    idFromItem[VanillaBlockID[name]] = 'vblock:' + name
                }
                for (let name in ItemID) {
                    idFromItem[ItemID[name]] = 'item:' + name
                }
                for (let name in BlockID) {
                    idFromItem[BlockID[name]] = 'block:' + name
                }
            })
        })
        return idFromItem
    })(),
    transferIdFromItem (id) {
        if (typeof id !== 'number') return '0'
        return this.idFromItem[id] || String(Network.localToServerId(id))
    },
    extraType: {},
    setExtraTypeCb (type, extraTypeCb) {
        if (typeof type !== 'string' || !type) return
        if (!this.isObject(extraTypeCb)) return
        if (!this.isObject(this.extraType[type])) this.extraType[type] = {}
        let that = this
        let methods = ['fromJson', 'fromItem', 'isPassed']
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
        if (!this.isObject(itemJson)) return { id: 0, count: 0, data: 0 }
        let that = this
        let item = {
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
            }
        }
        return item
    },
    transferItemFromItem (item) {
        if (!this.isObject(item)) return { id: '0' }
        let itemJson = {
            id: this.transferIdFromItem(item.id),
            count: item.count || 1,
            data: item.data || 0,
            extra: null
        }
        if (item.extra && !item.extra.isEmpty()) {
            itemJson.extra = []
            for (let type in this.extraType) {
                if (typeof this.extraType[type].fromItem !== 'function') continue
                let extraJson = { type: type }
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
        let that = this
        let passed = true
        if (Array.isArray(extraJsonArray)) {
            extraJsonArray.every(function (extraJson) {
                if (!that.isObject(extraJson)) return true
                let cb = that.getExtraTypeCb(extraJson.type, 'isPassed')
                if (cb === that.voidFunc) return true
                return passed = passed && Boolean(cb(item, extraJson))
            })
        }
        return passed
    },
    readContents (path) {
        if (typeof path !== 'string') return {}
        if (!path.endsWith('/')) path += '/'
        let that = this
        try {
            if (FileTools.isExists(path + 'contents.json')) {
                let mainJson = FileTools.ReadJSON(path + 'contents.json')
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
                        let chapterJson = mainJson.main[indexChapter]
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
                let mainJson = FileTools.ReadJSON(path + 'CustomQuests.json')
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
        if (!(/^ref:/i).test(value)) return value
        let that = this
        let refId = value.replace(/^ref:/i, '')
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
        if (this.isObject(textJson)) {
            let ret = {}
            for (let lang in textJson) {
                ret[lang] = String(textJson[lang])
            }
            return ret
        }
        return ''
    },
    resolveIconJson (iconJson, refsArray, bitmapNameObject) {
        let ret = this.deepCopy(this.resolveRefs(iconJson, refsArray))
        if (!this.isObject(ret)) return {}
        if (typeof ret.bitmap === 'string') {
            ret.bitmap = this.resolveBitmap(ret.bitmap, bitmapNameObject)
        }
        return ret
    },
    putTextureSourceFromBase64 (name, encodedString) {
        if (typeof name !== 'string') return
        if (typeof encodedString !== 'string') return
        try {
            let encodeByte = android.util.Base64.decode(encodedString, 0)
            let bitmap = android.graphics.BitmapFactory.decodeByteArray(encodeByte, 0, encodeByte.length)
            UI.TextureSource.put(name, bitmap)
        } catch (err) {
            this.log('Error in putTextureSourceFromBase64', 'ERROR', false)
        }
    },
    getInput ({text, hint, title, button, mutiLine}, cb){
        UI.getContext().runOnUiThread(new java.lang.Runnable({
            run () {
                try {
                    let editText = new android.widget.EditText(UI.getContext())
                    editText.setHint(hint || '')
                    if (!mutiLine) editText.setSingleLine(true)
                    if(typeof text == 'string') editText.setText(text)
                    new android.app.AlertDialog.Builder(UI.getContext())
                        .setTitle(title || '')
                        .setView(editText)
                        .setPositiveButton(
                            button || TranAPI.translate('Utils.dialog.confirm'),
                            new android.content.DialogInterface.OnClickListener({
                                onClick: Utils.debounce(function (dialogInterface) {
                                    if (typeof cb === 'function') {
                                        try {
                                            cb(editText.getText().toString() + '')
                                        } catch (err) {}
                                    }
                                    dialogInterface.dismiss()
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
                                onClick: Utils.debounce(function (dialogInterface) {
                                    if (typeof cb === 'function') {
                                        try {
                                            cb()
                                        } catch (err) {}
                                    }
                                    dialogInterface.dismiss()
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
		let inventory = []
		let actor = new PlayerActor(player)
		for (let i = 0; i < 36; i++) {
			inventory[i] = actor.getInventorySlot(i)
		}
		return inventory
    },
    getSortInventory (inventory) {
        /** @type { ReturnType<Utils['getSortInventory']> } */
		let sortInventory = {}
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
        /** @type { ReturnType<Utils['getExtraInventory']> } */
        let extraInventory = {}
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
        item.extra.setCustomName(String(extraJson.name))
    },
    fromItem: function (item, extraJson) {
        extraJson.name = item.extra.getCustomName()
        return !extraJson.name
    },
    isPassed: function(item, extraJson) {
        return item.extra.getCustomName() === String(extraJson.name)
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
        let enchants = item.extra.getEnchants()
        for (let id in enchants) {
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
        let enchants = item.extra.getEnchants()
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
        let energyData = ChargeItemRegistry.getItemData(item.id)
        if (!Utils.isObject(energyData)) return true
        let energy = ChargeItemRegistry.getEnergyStored(item, energyData.energy)
        if (typeof energy !== 'number') return true
        extraJson.energy = energy
        return false
    },
    isPassed: function(item, extraJson) {
        let energy = item.extra.getInt('energy')
        if (typeof extraJson.operator !== 'string') extraJson.operator = '>='
        if (typeof extraJson.energy !== 'number') extraJson.energy = 0
        return Utils.operate(energy, String(extraJson.operator), Number(extraJson.energy), true)
    }
})
