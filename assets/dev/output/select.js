/// <reference path='../Integration.js'/>

IOTypeTools.setOutputType('select', {
    en: 'select'
}, {
    resolveJson (outputJson, refsArray, bitmapNameObject) {
        return outputJson
    },
    onLoad (outputJson, toolsCb, cache) {
        
    },
    onPacket (outputJson, toolsCb, cache, extraInfo) {
        
    },
    onFastReceive (outputJson, toolsCb, cache, extraInfo) {
        
    },
    onReceive (outputJson, toolsCb, cache, extraInfo) {
        
    },
    getIcon (outputJson, toolsCb, extraInfo) {
        let pos = extraInfo.pos
        let ret = {}
        return ret
    },
    getDesc (outputJson, toolsCb, extraInfo) {
        
    }
}, {
    allowRepeat: true,
    allowGroup: false
})
