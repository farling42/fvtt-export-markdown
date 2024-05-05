import { /*validFileName,*/ convertHtml, fileconvert } from "./export-markdown.js";

export const registerHandlebarsHelpers = function () {
    
    //Handlebar Helpers
    
    /*  IMPORT OF THE FUNCTION BREAKS THE MODULE SETTINGS.
    // Escapes file names to make them valid
    Handlebars.registerHelper('validFileName', function (name) {
                return validFilename(name);
            });
            */

    // Convert HTML to Markdown
    Handlebars.registerHelper('convertHtml', function (context, text) {
        if (text) {
            text = convertHtml(context, text);
        }
        return text;
        });


    // Converts an image file reference to a wikilinks Markdown format
    Handlebars.registerHelper('fileconvert', function (filename, label_or_size) {
            return fileconvert(filename, label_or_size);
        });

    // Retrieves the items of a given type
    Handlebars.registerHelper('itemsOfType', function (items, type) {
        let _itemsOfType = [];
        for (let item of items) {
            if(item.type === type) {
                _itemsOfType.push(item);
            }
        }
        return _itemsOfType;
    });
}