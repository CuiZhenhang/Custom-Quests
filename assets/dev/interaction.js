/// <reference path='./ClientSystem.js'/>

/** @type { Interaction } */
const Interaction = {
    openRecipeUI: (function () {
        ModAPI.addAPICallback('RecipeViewer', function (RecipeViewer) {
            if (Utils.isObject(RecipeViewer.RecipeTypeRegistry) &&
                typeof RecipeViewer.RecipeTypeRegistry.openRecipePageByItem === 'function'
            ) {
                Interaction.openRecipeUI = function (item, isUsage) {
                    if (typeof isUsage !== 'boolean') isUsage = Boolean(isUsage)
                    if (item.data >= 0) {
                        if (RecipeViewer.RecipeTypeRegistry.openRecipePageByItem(item.id, item.data, isUsage)) {
                            alert(TranAPI.translate('Interaction.RecipeViewer.noRecipe'))
                        }
                    } else {
                        if (RecipeViewer.RecipeTypeRegistry.openRecipePageByItem(item.id, -1, isUsage)) {
                            if (RecipeViewer.RecipeTypeRegistry.openRecipePageByItem(item.id, 0, isUsage)) {
                                alert(TranAPI.translate('Interaction.RecipeViewer.noRecipe'))
                            }
                        }
                    }
                }
            } else {
                Interaction.openRecipeUI = function (item, isUsage) {
                    alert(TranAPI.translate('Interaction.RecipeViewer.oldVersion'))
                }
            }
        })
        return function (item, isUsage) {
            alert(TranAPI.translate('Interaction.RecipeViewer.disabled'))
        }
    })()
}
