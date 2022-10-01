/// <reference path='./instance.js'/>

ModAPI.registerAPI('CustomQuestsAPI', {
    version: (function getModVersion () {
        let json = FileTools.ReadJSON(__dir__ + 'mod.info')
        if (typeof json !== 'object') return 'unknow'
        return String(json.version || 'unknow')
    })(),
    invalidId: InvalidId,
    EnumObject: Utils.deepCopy(EnumObject),
    Store: Store,
    TranAPI: TranAPI,
    Utils: Utils,
    IOTypeTools: IOTypeTools,
    System: System,
    ServerSystem: ServerSystem,
    ClientSystem: ClientSystem,
    QuestUi: QuestUi,
    QuestUiTools: QuestUiTools,
    requireGlobal: function (cmd) { return eval(cmd) }
})
Logger.Log('The API of Custom Quests is named CustomQuestsAPI.', 'API')
