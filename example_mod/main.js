// Define quests for your mods.
ModAPI.addAPICallback('CustomQuestsAPI', function (API) {
    // Your custom source id
    const sourceId = 'TestSource'
    API.ServerSystem.addContents(sourceId, API.Utils.readContents(__dir__ + 'custom'))

    // open GUI
    Item.registerUseFunction(VanillaItemID.stick, function (coords, item, block, player) {
        API.QuestUi.openForPlayer(sourceId, player)
    })
})
