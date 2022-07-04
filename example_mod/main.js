// Define quests for your mods.
ModAPI.addAPICallback("CustomQuestsAPI", function (API) {
	const sourceId = "TestSource"
	const contents = API.Utils.readContents(__dir__ + 'custom/')
	API.ServerSystem.addContents(sourceId, contents)

	Item.registerUseFunction(VanillaItemID.stick, function (coords, item, block, player) {
		// open GUI
		
	})
})
