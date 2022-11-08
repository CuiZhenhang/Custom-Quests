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
    openQuestUi (questJson, saveData, params) {
        return {
            isClosed: function () {
                return true
            },
            close: function () {}
        }
    },
    openDescriptionUi (isInput, ioJson, toolsCb) {
        return {
            isClosed: function () {
                return true
            },
            close: function () {}
        }
    },
    openTeamUi () {},
    openQuestListUi (title, questList, onSelect) {},
    openItemChooseUi (title, isValid, onSelect) {},
    openSelectionUi (title, selection) {}
}

/** @type { QuestUiTools } */
const QuestUiTools = {
    createUi (content, eventListener, option) {
        if (!Utils.isObject(option)) option = {}
        /** @type { ReturnType<QuestUiTools['createUi']> } */
        let ret = {
            content: content,
            ui: new UI.Window(content),
            newElements: [],
            binElements: [],
            addElements (elementsObj) {
                if (!ret.content.elements || !Utils.isObject(elementsObj)) return
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
            clearNewElements (newElements, lazy) {
                if (!ret.content.elements) return
                try {
                    if (lazy) {
                        if (!Array.isArray(newElements)) {
                            ret.binElements = ret.binElements.concat(ret.newElements)
                            ret.newElements.length = 0
                        } else {
                            newElements.forEach(function (key) {
                                let index = ret.newElements.indexOf(key)
                                if (index < 0) return
                                ret.binElements.push(key)
                                ret.newElements.splice(index, 1)
                            })
                        }
                    } else {
                        let elements = ret.content.elements
                        let elementMap = ret.ui.getElements()
                        let provider = ret.ui.getElementProvider()
                        if (!Array.isArray(newElements)) {
                            ret.newElements.forEach(function (key) {
                                delete elements[key]
                                provider.removeElement(elementMap.get(key))
                            })
                            ret.newElements.length = 0
                        } else {
                            newElements.forEach(function (key) {
                                let index = ret.newElements.indexOf(key)
                                if (index < 0) return
                                delete elements[key]
                                provider.removeElement(elementMap.get(key))
                                ret.newElements.splice(index, 1)
                            })
                        }
                    }
                } catch (err) {
                    Utils.error('Error in clearNewElements (QuestUi.js):\n', err)
                }
            },
            refresh () {
                try {
                    let elements = ret.content.elements
                    let elementMap = ret.ui.getElements()
                    let provider = ret.ui.getElementProvider()
                    ret.binElements.forEach(function (key) {
                        if (ret.newElements.indexOf(key) >= 0) return
                        if (typeof elements[key] === 'undefined') return
                        delete elements[key]
                        provider.removeElement(elementMap.get(key))
                    })
                    ret.binElements.length = 0
                } catch (err) {
                    Utils.error('Error in refresh (QuestUi.js):\n', err)
                }
                try {
                    if (ret.ui.isOpened()) {
                        ret.ui.updateWindowLocation()
                        if (typeof ret.ui.updateScrollDimensions === 'function') {
                            ret.ui.updateScrollDimensions()
                        }
                    }
                    ret.ui.getContentProvider().refreshDrawing()
                    ret.ui.getContentProvider().refreshElements()
                    ret.ui.getElementProvider().invalidateAll()
                    ret.ui.forceRefresh()
                } catch (err) {
                    Utils.error('Error in refresh (QuestUi.js):\n', err)
                }
            },
            open (refresh) {
                if (refresh) ret.refresh()
                if (!ret.isOpened()) ret.ui.open()
            },
            close () { ret.ui.close() },
            isOpened () { return ret.ui.isOpened() }
        }
        let listener = Utils.isObject(eventListener) ? eventListener : {}
        let needListen = Boolean(option.hideNavigation)
        ret.ui.setEventListener({
            onOpen () {
                if (needListen) {
                    needListen = false
                    UI.getContext().runOnUiThread(new java.lang.Runnable({
                        run () {
                            // https://developer.android.google.cn/training/system-ui/status?hl=zh-cn
                            /** @type { (visibility: number) => void } */
                            let updateVisibility = function (visibility) {
                                if (!(visibility & android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION)) {
                                    ret.ui.layout.setVisibility(
                                        android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                                        | android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                        | android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                                        | android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                    )
                                }
                            }
                            ret.ui.layout.setOnSystemUiVisibilityChangeListener({
                                onSystemUiVisibilityChange (visibility) {
                                    updateVisibility(visibility)
                                }
                            })
                        }
                    }))
                }
                if (typeof listener.onOpen === 'function') {
                    listener.onOpen(ret)
                }
            },
            onClose () {
                if (typeof listener.onClose === 'function') {
                    listener.onClose(ret)
                }
            }
        })
        if (option.closeOnBackPressed) ret.ui.setCloseOnBackPressed(true)
        if (option.blockingBackground) ret.ui.setBlockingBackground(true)
        if (option.asGameOverlay) ret.ui.setAsGameOverlay(true)
        if (option.notTouchable) ret.ui.setTouchable(false)
        return ret
    },
    getQuestIcon (questJson, saveData, option) {
        if (!Array.isArray(option.pos)) option.pos = questJson.pos
        if (typeof option.size !== 'number') option.size = questJson.size
        let icon = questJson.icon[0]
        if (saveData.inputState !== EnumObject.questInputState.locked) icon = questJson.icon[1]
        if (saveData.inputState === EnumObject.questInputState.finished) icon = questJson.icon[2]
        let overBitmap = 'cq_clear'
        switch (saveData.inputState) {
            case EnumObject.questInputState.unfinished:
            case EnumObject.questInputState.repeat_unfinished: {
                overBitmap = 'cq_dot_blue'
                break
            }
            case EnumObject.questInputState.finished: {
                if (saveData.outputState !== EnumObject.questOutputState.received) {
                    overBitmap = 'cq_remind'
                }
                break
            }
        }
        return [
            [option.prefix + 'main', {
                type: 'slot', visual: true, bitmap: icon.bitmap || 'cq_clear',
                source: Utils.transferItemFromJson(icon), darken: Boolean(icon.darken),
                x: option.pos[0], y: option.pos[1], z: 1, size: option.size,
                clicker: option.clicker
            }],
            [option.prefix + 'over', {
                type: 'image',
                x: option.pos[0] + option.size * (55 / 80),
                y: option.pos[1] + option.size * (5 / 80),
                z: 2,
                width: option.size * (20 / 80),
                height: option.size * (20 / 80),
                bitmap: overBitmap
            }]
        ]
    },
    getDependencyLine: (function () {
        let Rect = android.graphics.Rect
        let RectF = android.graphics.RectF
        let Paint = android.graphics.Paint
        let nullPaint = new Paint()
        let lineBitmap = android.graphics.Bitmap.createBitmap(100 * 64, 64, android.graphics.Bitmap.Config.ARGB_8888)
        let lineSrc = new Rect(0, 0, 100 * 64, 64)
        Callback.addCallback('PostLoaded', function () {
            let bitmap = UI.TextureSource.getNullable('cq_dependency')
            if (bitmap === null) return
            let canvas = new android.graphics.Canvas(lineBitmap)
            for (let x = 0; x < 100; x++) {
                canvas.drawBitmap(bitmap, x * 64, 0, nullPaint)
            }
        })
        return function (posParent, posChild, width, color) {
            if (typeof width !== 'number' || width <= 0) width = 10
            let deltaPos = [posChild[0] - posParent[0], posChild[1] - posParent[1]]
            let dis = Math.sqrt(deltaPos[0] * deltaPos[0] + deltaPos[1] * deltaPos[1])
            if (dis <= width) return []
            let angle = Math.acos(Math.max(Math.min(deltaPos[0] / dis, 1), -1)) * (180 / Math.PI)
            if (deltaPos[1] < 0) angle = -angle
            let argb = [(color >>> 24) & 0xff, (color >>> 16) & 0xff, (color >>> 8) & 0xff, (color >>> 0) & 0xff]
            if (argb[0] > 0xcc) argb[0] = 0xcc
            let paint = new Paint()
            paint.setStyle(Paint.Style.FILL)
            paint.setAntiAlias(true)
            paint.setARGB(argb[0], argb[1], argb[2], argb[3])
            /** @type { (canvas: android.graphics.Canvas, scale: number) => void } */
            let draw = function (canvas, scale) {
                let realWidth = width * scale
                canvas.save()
                canvas.translate(posParent[0] * scale, posParent[1] * scale)
                canvas.rotate(angle)
                canvas.translate(0, -realWidth / 2)
                canvas.drawRect(new RectF(0, 0, dis * scale, realWidth), paint)
                if (dis <= 100 * width) {
                    canvas.drawBitmap(
                        lineBitmap,
                        new Rect(0, 0, Math.floor(dis / width * 64), 64),
                        new RectF(0, 0, dis * scale, realWidth),
                        nullPaint
                    )
                } else {
                    let left = 0
                    for (let w = dis / width; w > 0; w -= 100) {
                        if (w <= 100) {
                            canvas.drawBitmap(
                                lineBitmap,
                                new Rect(0, 0, Math.floor(w * 64), 64),
                                new RectF(left * scale, 0, (left + w * width) * scale, realWidth),
                                nullPaint
                            )
                            break
                        } else {
                            canvas.drawBitmap(
                                lineBitmap,
                                lineSrc,
                                new RectF(left * scale, 0, (left + 100 * width) * scale, realWidth),
                                nullPaint
                            )
                            left += 100 * width
                        }
                    }
                }
                canvas.restore()
            }
            return [{
                type: 'custom',
                onDraw: draw,
                custom: {
                    onDraw: function (element, canvas, scale) {
                        draw(canvas, scale)
                    }
                }
            }]
        }
    })(),
    getTextWidth: (function () {
        let baseSize = 100
        let font = new UI.Font({ size: baseSize })
        return function (text, size) {
            if (typeof size !== 'number') return NaN
            if (typeof text !== 'string') text = String(text)
            return font.getTextWidth(text, size) / baseSize
        }
    })(),
    resolveText: (function () {
        /**
         * The RegExp is translated by Babel.
         * Here is the code in ES6.
         * ```javascript
         * let UnicodeReg = {
         *     isCJK: (str) => /(\p{sc=Hira}|\p{sc=Kana}|\p{sc=Hang}|\p{sc=Hani})+/u.test(str),
         *     isPunctuation: (str) => /(\p{P})+/u.test(str),
         *     isInitialPunctuation: (str) => /(\p{Pi}|\p{Ps})+/u.test(str),
         *     isMathSymbol: (str) => /(\p{Sm})+/u.test(str),
         *     isSeparator: (str) => /(\p{Z})+/u.test(str),
         *     is_UTF16L: (str) => /(\p{Cs})+/u.test(str)
         * }
         * ```
         */
        const UnicodeReg = {
            /** @type { (str: string) => boolean } */
            isCJK (str) {
                return /((?:[\u3041-\u3096\u309D-\u309F]|\uD82C[\uDC01-\uDD1F\uDD50-\uDD52]|\uD83C\uDE00)|(?:[\u30A1-\u30FA\u30FD-\u30FF\u31F0-\u31FF\u32D0-\u32FE\u3300-\u3357\uFF66-\uFF6F\uFF71-\uFF9D]|\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD82C[\uDC00\uDD20-\uDD22\uDD64-\uDD67])|[\u1100-\u11FF\u302E\u302F\u3131-\u318E\u3200-\u321E\u3260-\u327E\uA960-\uA97C\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|(?:[\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFA6D\uFA70-\uFAD9]|\uD81B[\uDFE2\uDFE3\uDFF0\uDFF1]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF38\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A]))+/.test(str);
            },
            /** @type { (str: string) => boolean } */
            isPunctuation (str) {
                return /((?:[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]))+/.test(str);
            },
            /** @type { (str: string) => boolean } */
            isInitialPunctuation (str) {
                return /([\xAB\u2018\u201B\u201C\u201F\u2039\u2E02\u2E04\u2E09\u2E0C\u2E1C\u2E20]|[\(\[\{\u0F3A\u0F3C\u169B\u201A\u201E\u2045\u207D\u208D\u2308\u230A\u2329\u2768\u276A\u276C\u276E\u2770\u2772\u2774\u27C5\u27E6\u27E8\u27EA\u27EC\u27EE\u2983\u2985\u2987\u2989\u298B\u298D\u298F\u2991\u2993\u2995\u2997\u29D8\u29DA\u29FC\u2E22\u2E24\u2E26\u2E28\u2E42\u2E55\u2E57\u2E59\u2E5B\u3008\u300A\u300C\u300E\u3010\u3014\u3016\u3018\u301A\u301D\uFD3F\uFE17\uFE35\uFE37\uFE39\uFE3B\uFE3D\uFE3F\uFE41\uFE43\uFE47\uFE59\uFE5B\uFE5D\uFF08\uFF3B\uFF5B\uFF5F\uFF62])+/.test(str);
            },
            /** @type { (str: string) => boolean } */
            isMathSymbol (str) {
                return /((?:[\+<->\|~\xAC\xB1\xD7\xF7\u03F6\u0606-\u0608\u2044\u2052\u207A-\u207C\u208A-\u208C\u2118\u2140-\u2144\u214B\u2190-\u2194\u219A\u219B\u21A0\u21A3\u21A6\u21AE\u21CE\u21CF\u21D2\u21D4\u21F4-\u22FF\u2320\u2321\u237C\u239B-\u23B3\u23DC-\u23E1\u25B7\u25C1\u25F8-\u25FF\u266F\u27C0-\u27C4\u27C7-\u27E5\u27F0-\u27FF\u2900-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2AFF\u2B30-\u2B44\u2B47-\u2B4C\uFB29\uFE62\uFE64-\uFE66\uFF0B\uFF1C-\uFF1E\uFF5C\uFF5E\uFFE2\uFFE9-\uFFEC]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD83B[\uDEF0\uDEF1]))+/.test(str);
            },
            /** @type { (str: string) => boolean } */
            isSeparator (str) {
                return /([ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000])+/.test(str);
            },
            /** @type { (str: string) => boolean } */
            is_UTF16L (str) {
                return /((?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))+/.test(str);
            }
        }
        return function (text, getWidthRatio) {
            if (typeof text !== 'string') return []
            if (typeof getWidthRatio !== 'function') return text.split('\n')
            /** @type { Array<string> } */
            let ret = []
            text.split('\n').forEach(function (str) {
                str = str.replace(/\s+$/, '')
                if (getWidthRatio(str) <= 1) {
                    ret.push(str)
                    return
                }
                let strGroup = ['']
                let isCJK = false
                for (let i = 0; i < str.length; i++) {
                    let char = str[i]
                    if (UnicodeReg.is_UTF16L(char)) char += str[++i]
                    if (UnicodeReg.isSeparator(char) || UnicodeReg.isMathSymbol(char) || UnicodeReg.isPunctuation(char)) {
                        if (UnicodeReg.isInitialPunctuation(char)) {
                            strGroup.push(char)
                        } else {
                            strGroup[strGroup.length-1] += char
                            strGroup.push('')
                        }
                        isCJK = false
                    } else if (UnicodeReg.isCJK(char)) {
                        strGroup.push(char)
                        isCJK = true
                    } else {
                        if (isCJK) strGroup.push(char)
                        else strGroup[strGroup.length-1] += char
                        isCJK = false
                    }
                }
                /** @type { Array<string> } */
                let newStrGroup = []
                strGroup.forEach(function (str) {
                    if (str.length === 0) return
                    while (getWidthRatio(str) > 1) {
                        let l = 0
                        let r = str.length
                        while (l + 1 < r) {
                            let mid = Math.floor((l + r) / 2)
                            if (getWidthRatio(str.substring(0, mid)) <= 1) l = mid
                            else r = mid - 1
                        }
                        if (getWidthRatio(str.substring(0, r)) <= 1) l = r
                        newStrGroup.push(str.substring(0, l))
                        str = str.substring(l)
                    }
                    if (str.length > 0) newStrGroup.push(str)
                })
                let line = ''
                newStrGroup.forEach(function (str) {
                    if (getWidthRatio(line + str) <= 1) line += str
                    else if ((/\s+$/.test(str)) && getWidthRatio(line + str.replace(/\s+$/, '')) <= 1) {
                        ret.push(line + str.replace(/\s+$/, ''))
                        line = ''
                    } else {
                        ret.push(line)
                        line = str
                    }
                })
                if (line.length > 0) ret.push(line)
            })
            return ret
        }
    })(),
    resolveTextJsonToElements (textJson, params) {
        if (typeof textJson !== 'string' && !Utils.isObject(textJson)) {
            return {
                maxY: params.pos[1],
                elements: []
            }
        }
        let size = params.font.size || 20
        let that = this
        let text = TranAPI.translate(textJson)
        let maxY = params.pos[1]
        /** @type { Array<[string, UI.Elements]> } */
        let elements = []
        this.resolveText(text, function (str) {
            if (typeof str !== 'string') return 1
            return that.getTextWidth(str, size) / params.maxWidth
        }).forEach(function (str, index) {
            elements.push([params.prefix + 'text_' + index, {
                type: 'text',
                x: params.pos[0],
                y: maxY,
                z: params.pos[2],
                text: str,
                font: params.font
            }])
            maxY += size + params.rowSpace
        })
        return {
            maxY: maxY,
            elements: elements
        }
    },
    createAnimator (duration, update) {
        if (typeof duration !== 'number' || duration < 0) return
        if (typeof update !== 'function') return
        let animator = android.animation.ValueAnimator.ofFloat([0, 1])
        animator.setDuration(duration)
        animator.addUpdateListener({
            onAnimationUpdate (animator) {
                update(animator)
            }
        })
        UI.getContext().runOnUiThread(new java.lang.Runnable({
            run () {
                animator.start()
            }
        }))
        return animator
    }
}
