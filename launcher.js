ConfigureMultiplayer({
    name: 'Custom Quests',
    version: (function getModVersion () {
        let json = FileTools.ReadJSON(__dir__ + 'mod.info')
        if (typeof json !== 'object') return 'unknow'
        return String(json.version || 'unknow')
    })(),
    isClientOnly: false
})
Launch()
