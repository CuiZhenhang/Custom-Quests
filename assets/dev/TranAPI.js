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
    translate (str) {
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
    },
    t (str, sourceId, chapterId, questId, type) {
        if (typeof str === 'string') return str.replace(/\\n/g, '\n')
        let name = sourceId || ''
        if (chapterId) name += '.' + chapterId
        if (questId) name += '.' + questId
        if (type) name += '.' + type
        return this.translate(str).replace(/\\n/g, '\n') || name
    }
}

; (function intTranslation () {
    const QB = {
        book: {},
        admin: {},
        editor: {},
        missing: {}
    }
    const files = FileTools.GetListOfFiles(__dir__ + '/lang/', 'lang')
    for (let index in files) {
        const name = files[index].getName()
        const lang = name.split('_')[0]
        const translations = FileTools.ReadKeyValueFile(__dir__ + '/lang/' + name, '=')
        if (!TranAPI.translation[lang]) TranAPI.translation[lang] = {}

        for (let str in translations) {
            str = str.replace(/\\n/g, '\n')
            TranAPI.translation[lang][str] = translations[str].replace(/\\n/g, '\n')
        }
        if (translations['item.quest_book.name']) QB.book[lang] = translations['item.quest_book.name'].replace(/\\n/g, '\n')
        if (translations['item.quest_book_admin.name']) QB.admin[lang] = translations['item.quest_book_admin.name'].replace(/\\n/g, '\n')
        if (translations['item.quest_book_editor.name']) QB.editor[lang] = translations['item.quest_book_editor.name'].replace(/\\n/g, '\n')
        if (translations['item.missing_item.name']) QB.missing[lang] = translations['item.missing_item.name'].replace(/\\n/g, '\n')
        const obj = {}
        obj[lang] = lang
        Translation.addTranslation('CustomQuests.lang', obj)
    }
    TranAPI.lang = Translation.translate('CustomQuests.lang') || 'en'
    Translation.addTranslation('Quests Book', QB.book)
    Translation.addTranslation('Quests Admin Book', QB.admin)
    Translation.addTranslation('Quests Editor Book', QB.editor)
    Translation.addTranslation('Missing Item', QB.missing)
})()
