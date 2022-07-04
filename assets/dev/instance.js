/// <reference path='./Interaction.js'/>

IDRegistry.genItemID('quest_book')
Item.createItem('quest_book', 'Quests Book', { name: 'quest_book' }, { stack: 1 })
Recipes.addShapeless({ id: ItemID.quest_book, count: 1, data: 0 }, [
    { id: VanillaItemID.book, data: 0 },
    { id: VanillaItemID.string, data: 0 }
])
IDRegistry.genItemID('missing_item')
Item.createItem('missing_item', 'Missing Item', { name: 'missing_item' }, { stack: 64 })

; (function () {
    const contents = Utils.readContents(__dir__ + 'custom/')
    ServerSystem.addContents('Default', contents)
})()
