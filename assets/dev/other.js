IDRegistry.genItemID('quest_book')
Item.createItem('quest_book', 'Quests Book', { name: 'quest_book' }, { stack: 1 })
Recipes.addShapeless({ id: ItemID.quest_book, count: 1, data: 0 }, [
    { id: VanillaItemID.book, data: 0 },
    { id: VanillaItemID.string, data: 0 }
])
IDRegistry.genItemID('missing_item')
Item.createItem('missing_item', 'Missing Item', { name: 'missing_item' }, { stack: 64 })

ModAPI.registerAPI('CustomQuestsAPI', {
    version: '2.0.0-alpha.0.1',
    TranAPI: TranAPI,
    Utils: Utils,
    /** @type { (cmd: string): unknown } */
    requireGlobal: function (cmd) { return eval(cmd) }
})
Logger.Log('The API of Custom Quests is named CustomQuestsAPI.', 'API')
