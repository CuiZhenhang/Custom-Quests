/// <reference path='./Integration.js'/>

IDRegistry.genItemID('quest_book')
Item.createItem('quest_book', 'Quests Book', { name: 'quest_book' }, { stack: 1 })
Recipes.addShapeless({ id: ItemID.quest_book, count: 1, data: 0 }, [
    { id: VanillaItemID.book, data: 0 },
    { id: VanillaItemID.string, data: 0 }
])
Item.registerUseFunction(ItemID.quest_book, function (coords, item, block, player) {
    QuestUi.openForPlayer('Default', player)
})
{
    // DEV
    Network.addClientPacket('cq.dev.eval', function (packetData) {
        eval(packetData.t)
    })
    Item.registerNoTargetUseFunction(ItemID.quest_book, function (item, player) {
        Network.getClientForPlayer(player).send('cq.dev.eval', {
            t: 'QuestUi.openTeamUi()'
        })
    })
}

IDRegistry.genItemID('missing_item')
Item.createItem('missing_item', 'Missing Item', { name: 'missing_texture' }, { stack: 64 })

ServerSystem.addContents('Default', Utils.readContents(__dir__ + Setting.path))
