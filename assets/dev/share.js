ModAPI.registerAPI('CustomQuestsAPI', {
    version: '2.0.0-alpha.1',
    invalidId: InvalidId,
    EnumObject: Utils.deepCopy(EnumObject),
    Store: Store,
    TranAPI: TranAPI,
    Utils: Utils,
    IOTypeTools: IOTypeTools,
    System: System,
    ServerSystem: ServerSystem,
    ClientSystem: ClientSystem,
    requireGlobal: function (cmd) { return eval(cmd) }
})
Logger.Log('The API of Custom Quests is named CustomQuestsAPI.', 'API')
