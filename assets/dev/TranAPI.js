/// <reference path='./header.js'/>

/** @type { TranAPI } */
const TranAPI = {
    lang: 'en',
    translation: {},
    addTranslation (str, params) {
        for (let lang in params) {
            if (typeof params[lang] === 'string') {
                if (!this.translation[lang]) this.translation[lang] = {}
                this.translation[lang][str] = params[lang]
            }
        }
    },
    getTranslation (str) {
        /** @type { ReturnType<TranAPI['getTranslation']> } */
        let ret = { 'en': str }
        for (let lang in this.translation) {
            if (this.translation[lang] && typeof this.translation[lang][str] === 'string') {
                ret[lang] = this.translation[lang][str]
            }
        }
        return ret
    },
    translate (str) {
        if (str === undefined) return ''
        if (typeof str === 'string') {
            if (this.translation[this.lang] && typeof this.translation[this.lang][str] === 'string') {
                return this.translation[this.lang][str]
            }
            if (this.translation['en'] && typeof this.translation['en'][str] === 'string') {
                return this.translation['en'][str]
            }
            return str
        } else {
            if (typeof str[this.lang] === 'string') return str[this.lang]
            if (typeof str['en'] === 'string') return str['en']
            return ''
        }
    }
}

; (function () {
    let QB = {
        book: {},
        admin: {},
        editor: {},
        missing: {}
    }
    let files = FileTools.GetListOfFiles(__dir__ + '/lang/', 'lang')
    for (let index in files) {
        let name = files[index].getName()
        let lang = name.split('_')[0]
        let translations = FileTools.ReadKeyValueFile(__dir__ + '/lang/' + name, '=')
        if (!TranAPI.translation[lang]) TranAPI.translation[lang] = {}

        for (let str in translations) {
            str = str.replace(/\\n/g, '\n')
            TranAPI.translation[lang][str] = translations[str].replace(/\\n/g, '\n')
        }
        if (translations['item.quest_book']) QB.book[lang] = translations['item.quest_book'].replace(/\\n/g, '\n')
        if (translations['item.quest_book_admin']) QB.admin[lang] = translations['item.quest_book_admin'].replace(/\\n/g, '\n')
        if (translations['item.quest_book_editor']) QB.editor[lang] = translations['item.quest_book_editor'].replace(/\\n/g, '\n')
        if (translations['item.missing_item']) QB.missing[lang] = translations['item.missing_item'].replace(/\\n/g, '\n')
        let obj = {}
        obj[lang] = lang
        Translation.addTranslation('CustomQuests.lang', obj)
    }
    TranAPI.lang = Translation.translate('CustomQuests.lang') || 'en'
    Translation.addTranslation('Quests Book', QB.book)
    Translation.addTranslation('Quests Admin Book', QB.admin)
    Translation.addTranslation('Quests Editor Book', QB.editor)
    Translation.addTranslation('Missing Item', QB.missing)
})()
