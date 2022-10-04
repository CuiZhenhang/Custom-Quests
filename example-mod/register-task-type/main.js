
/**
 * register input type 'eat'
 * @param { CustomQuestsAPI } API 
 */
function registerTaskType (API) {
    // id of our custom task type
    const typeId = 'eat'
    // name of our custom task type
    const typeName = 'Eat food'

    // call [[IOTypeTools.setInputType]]
    API.IOTypeTools.setInputType(typeId, typeName, {
        // process and modify task description data
        // ! atention that this is the only where we are allowed to change [[inputJson]]
        resolveJson (inputJson, refsArray, bitmapNameObject) {
            if (typeof inputJson.id !== 'string' && typeof inputJson.id !== 'number') return null
            // add default data that can be omitted in JSON
            if (typeof inputJson.count !== 'number' || inputJson.count < 1) inputJson.count = 1
            // -1 means allow any item data
            if (typeof inputJson.data !== 'number' || inputJson.data < 0) inputJson.data = -1
            return inputJson
        },
        // called when load the task
        onLoad (inputJson, toolsCb, cache) {
            // we can put some data into the cache
            // the cache belongs to this inputId only
            cache.id = API.Utils.transferIdFromJson(inputJson.id)
            // check if the task has been completed
            // get saved count (0 if undefined)
            let count = toolsCb.getState().count || 0
            // if count is enough, set state to finished and clear saved count
            if (count >= inputJson.count) {
                // save the state
                toolsCb.setState({}, {
                    state: API.EnumObject.inputState.finished,
                    count: 0
                })
            }
        },
        // called only by us
        onCustomCall (inputJson, toolsCb, cache, extraInfo) {
            // break if item id or data don't match the requirements
            if (typeof extraInfo.id !== 'number' || extraInfo.id !== cache.id) return
            if (inputJson.data !== -1 && extraInfo.data !== inputJson.data) return
            // get state as an object
            let stateObj = toolsCb.getState()
            // get saved count (0 if undefined)
            let count = stateObj.count || 0
            // add 1 to [[count]]
            count += 1
            // set saved count
            stateObj.count = count
            // if count is enough, set state to finished and clear saved count
            if (count >= inputJson.count) {
                stateObj.state = API.EnumObject.inputState.finished
                stateObj.count = 0
            }
            // save the state
            toolsCb.setState({}, stateObj)
        },
        // provide elements to GUI
        getIcon (inputJson, toolsCb, extraInfo) {
            // return an array containing arrays of [elements-id, elements-object] format
            // ! attention that elements-id should use the given prefix
            return [
                [extraInfo.prefix + 'main', {
                    type: 'slot', visual: true, bitmap: 'clear',
                    // ! attention that the pos and size should be calculated using the given data
                    x: extraInfo.pos[0], y: extraInfo.pos[1], z: 1, size: extraInfo.size,
                    // determine the displayed item using [[source]]
                    source: {
                        // we can transfer the id using function [[Utils.transferIdFromJson]]
                        id: API.Utils.transferIdFromJson(inputJson),
                        count: inputJson.count,
                        data: inputJson.data
                    }
                }]
            ]
        }
    }, {
        // whether our custom task type can be used in task group
        allowGroup: true,
        // whether state of our custom task type can be changed to repeat_unfinished
        // in another word, whether our custom task type can work repeatly
        allowRepeat: true
    })

    // update state of our task type when food is eaten
    Callback.addCallback('FoodEaten', function (food, ratio, player) {
        let item = Entity.getCarriedItem(player)
        // get saveId of this player
        let saveId = API.ServerSystem.getSaveId(player)
        // get all task that we'll affect as an array
        // they're of our custom task type and loaded by this saveId
        let inputIdArray = API.ServerSystem.getTypedInputId(saveId, typeId)
        // iterate through this array
        inputIdArray.forEach(function (inputId) {
            // invoke the callback 'onCustomCall'
            // we give the food's id and data to it
            API.IOTypeTools.callInputTypeCb(inputId, 'onCustomCall', {
                id: item.id,
                data: item.data
            })
        })
    })
}

ModAPI.addAPICallback('CustomQuestsAPI', function (API) {
    // register task type 'eat'
    registerTaskType(API)

    // simple-use: define quests
    const sourceId = 'eat_test'
    API.ServerSystem.addContents(sourceId, API.Utils.readContents(__dir__ + 'custom'))

    // open GUI when using an apple
    Item.registerUseFunction(VanillaItemID.apple, function (coords, item, block, player) {
        API.QuestUi.openForPlayer(sourceId, player)
    })
})
