import { validFilename, convertHtml, fileconvert } from "./export-markdown.js";

export const registerHandlebarsHelpers = function () {
    
    //Handlebar Helpers
    
    // Escapes file names to make them valid
    Handlebars.registerHelper('EMDvalidFilename', function (name) {
        return validFilename(name);
    });

    // Convert HTML to Markdown
    Handlebars.registerHelper('EMDconvertHtml', function (context, text) {
        if (text) text = convertHtml(context, text);
        return text;
    });

    // Converts an image file reference to a wikilinks Markdown format
    Handlebars.registerHelper('EMDfileConvert', function (filename, label_or_size) {
            return fileconvert(filename, label_or_size);
    });

    // Retrieves the items of a given type
    Handlebars.registerHelper('EMDitemsOfType', function (items, type) {
        return items.filter(item => item.type === type);
    });

    // Convert String to Title Case
    Handlebars.registerHelper('EMDtitleCase', function (str) {
        // Foundry provides an additional method to the Namespace String:
        // https://foundryvtt.com/api/modules/primitives.String.html#titleCase
        return str.titleCase();
    });
}