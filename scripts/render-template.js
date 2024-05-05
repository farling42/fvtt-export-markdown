// Foundry only allows the templatePath to be html, hbs, handlebars
// Foundry FilePicker dialog doesn't make files with those extensions pickable or uploadable

// Global template cache
let _templateCache = {};

export function clearTemplateCache() {
    _templateCache = {};
}

export async function myRenderTemplate(templatePath, data) {
    const template = await myGetTemplate(templatePath);
    return template(data || {}, {
      allowProtoMethodsByDefault: true,
      allowProtoPropertiesByDefault: true
    });
}


async function myGetTemplate(templatePath) {
    if ( !_templateCache.hasOwnProperty(templatePath) ) {
        //let files = FilePicker.browse(source, target, options);
        const resp = await fetch(templatePath).catch(() => {});
        if (resp) {
            const compiled = Handlebars.compile(await resp.text());
            //Handlebars.registerPartial(id ?? path, compiled);
            _templateCache[templatePath] = compiled;
            console.log(`Foundry VTT | Retrieved and compiled template ${templatePath}`);              
        }
    }
    return _templateCache[templatePath];
  }