// define quests for our mods
ModAPI.addAPICallback('CustomQuestsAPI', function (API) {
    // id of our custom source
    const sourceId = 'TestSource'
    API.ServerSystem.addContents(sourceId, API.Utils.readContents(__dir__ + 'custom'))

    // open GUI when using a stick
    Item.registerUseFunction(VanillaItemID.stick, function (coords, item, block, player) {
        API.QuestUi.openForPlayer(sourceId, player)
    })
})
