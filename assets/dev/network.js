/// <reference path='./System.js'/>

Network.addServerPacket('CustomQuests.Server.', function (client, packetData) {

})

Network.addClientPacket('CustomQuests.Client.message', function (packetData) {
    if (!Array.isArray(packetData.text)) return
    let msg = ''
    packetData.text.forEach(function (str) {
        if (str[0] === '$') {
            str = TranAPI.translate(str.replace(/^\$/, ''))
        }
        msg += str
    })
    Game.message(msg)
})
Network.addClientPacket('CustomQuests.Client.alert', function (packetData) {
    if (!Array.isArray(packetData.text)) return
    let msg = ''
    packetData.text.forEach(function (str) {
        if (str[0] === '$') {
            str = TranAPI.translate(str.replace(/^\$/, ''))
        }
        msg += str
    })
    alert(msg)
})
Network.addClientPacket('CustomQuests.Client.resolveJson', function (packetData) {
    if (!Utils.isObject(packetData.json)) return
    const obj = System.resolveJson(packetData.json)
    Store.localCache.resolvedJson = obj.json
    Store.localCache.jsonConfig = obj.config
    packetData.bitmaps.forEach(function (bitmapObject) {
        if (!Utils.isObject(bitmapObject)) return
        if (typeof bitmapObject.name !== 'string') return
        if (typeof bitmapObject.base64 !== 'string') return
        Utils.putTextureSourceFromBase64(bitmapObject.name, bitmapObject.base64)
    })
})

