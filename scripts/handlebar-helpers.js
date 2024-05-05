//import * from "export-markdown.js";

export const registerHandlebarsHelpers = function () {

        Handlebars.registerHelper('validFileName', function (name) {
                return validFilename(name);
            });

        Handlebars.registerHelper('convertHtml', function (doc, html) {
                return validFilename(name);
            });


        Handlebars.registerHelper('fileconvert', function (filename, label_or_size) {
                return validFilename(name);
            });
}