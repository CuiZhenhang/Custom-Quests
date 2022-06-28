/// <reference path='./header.js'/>

/** @type { TranAPI } */
const TranAPI = {
    translation: {},
    lang: 'en',
    intTranslation () {
        const languages = {}
        const QB = {
            default: {},
            admin: {},
            editor: {},
            missing: {}
        }
        const files = FileTools.GetListOfFiles(__dir__ + '/lang/', 'lang')
        for (const index in files) {
            const name = files[index].getName()
            languages[name] = name.split('_')[0]
        }
        for (const name in languages) {
            const lang = languages[name]
            const translations = FileTools.ReadKeyValueFile(__dir__ + '/lang/' + name, '=')
            if (!this.translation[lang]) this.translation[lang] = {}

            for (const str in translations) {
                str = str.replace(/\\n/g, '\n')
                this.translation[lang][str] = translations[str].replace(/\\n/g, '\n')
            }
            if (translations['item.quest_book.name']) QB.default[lang] = translations['item.quest_book.name'].replace(/\\n/g, '\n')
            if (translations['item.quest_book_admin.name']) QB.admin[lang] = translations['item.quest_book_admin.name'].replace(/\\n/g, '\n')
            if (translations['item.quest_book_editor.name']) QB.editor[lang] = translations['item.quest_book_editor.name'].replace(/\\n/g, '\n')
            if (translations['item.missing_item.name']) QB.missing[lang] = translations['item.missing_item.name'].replace(/\\n/g, '\n')
            Translation.addTranslation('CustomQuests.lang', {[lang]: lang})
        }
        this.lang = Translation.translate('CustomQuests.lang') || 'en'
        Translation.addTranslation('Quests Book', QB.default)
        Translation.addTranslation('Quests Admin Book', QB.admin)
        Translation.addTranslation('Quests Editor Book', QB.editor)
        Translation.addTranslation('Missing Item', QB.missing)
    },
    addTranslation (str, params) {
        for (const lang in params) {
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
    t (str, source, chapter, quest, type) {
        if (typeof str === 'string') return str
        let name = source || ''
        if (chapter) name += '.' + chapter
        if (quest) name += '.' + quest
        if (type) name += '.' + type
        return this.translate(str) || name
    }
}
TranAPI.intTranslation();
