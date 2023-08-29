import "./lib/jszip.min.js";
import { TurndownService } from "./lib/turndown.js";
import { TurndownPluginGfmService } from "./lib/turndown-plugin-gfm.js";
import "./lib/js-yaml.min.js";

const MODULE_NAME = "export-markdown";
const FRONTMATTER = "---\n";
const EOL = "\n";
const MARKER = "```";

const destForImages = "zz_asset-files";

let zip;

const OPTION_DUMP = "dataType";
const OPTION_OBSIDIAN = "obsidian";
const OPTION_LEAFLET = "leaflet";

class DOCUMENT_ICON {
    // indexed by CONST.DOCUMENT_TYPES
    static table = {
        Actor: "user",
        Cards: "space",
        ChatMessage: "messages-square",
        Combat: "swords",
        Item: "luggage",
        Folder: "folder",
        JournalEntry: "book-open",
        JournalEntryPage: "sticky-note",   // my own addition
        //Macro: "",
        Playlist: "music",
        RollTable: "list",
        Scene: "map"
    };

    //User: ""
    static lookup(document) {
        return DOCUMENT_ICON.table?.[document.documentName] || "file-question";
    }
}

/**
 * 
 * @param {Object} from Either a folder or a Journal, selected from the sidebar
 */

function validFilename(name) {
    const regexp = /[<>:"/\\|?*]/g;
    return name.replaceAll(regexp, '_');
}

function formpath(dir,file) {
    return dir ? (dir + "/" + file) : file;
}

/**
 * Export data content to be saved to a local file
 * @param {string} blob       The Blob of data
 * @param {string} filename   The filename of the resulting download
 */
function saveDataToFile(blob, filename) {
    // Create an element to trigger the download
    let a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = filename;

    // Dispatch a click event to the element
    a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    return new Promise(resolve => setTimeout(() => { window.URL.revokeObjectURL(a.href); resolve()}, 100));
}

function folderpath(journal) {
    let result = "";
    let folder = journal.folder;
    while (folder) {
        const foldername = validFilename(folder.name);
        result = result ? formpath(foldername, result) : foldername;
        folder = folder.folder;
    }
    return result;
}

function fileconvert(str, filename) {
    // See if we can grab the file.
    //console.log(`fileconvert for '${filename}'`);
    if (filename.startsWith("data:image") || filename.startsWith(":")) {
        // e.g.
        // http://URL
        // https://URL
        // data:image;inline binary
        console.log(`Ignoring image file/external URL in '${str}':\n${filename}`);
        return str;
    }
    filename = decodeURIComponent(filename);
    //let basefilename = filename.slice(filename.lastIndexOf("/") + 1);
    // ensure same base filename in different paths are stored as different files,
    // whilst keeping the total length below the ZIP limit of 260 characters.
    let basefilename = filename.replaceAll("/","-").slice(-250 + destForImages.length); 

    zip.folder(destForImages).file(basefilename, 
        // Provide a Promise which JSZIP will wait for before saving the file.
        // (Note that a CORS request will fail at this point.)
        fetch(filename).then(resp => {
            if (resp.status !== 200) {
                console.error(`Failed to fetch image from '${filename}' (response ${resp.status})`)
                return new Blob();
            } else {
                console.debug(`Adding image file ${basefilename}`);
                return resp.blob();
            }
        }).catch(e => { 
            console.log(e);
            return new Blob();
        }),
    {binary:true});
    return `![[${basefilename}]]`;
}

function notefilename(doc) {
    let docname;
    if (doc instanceof JournalEntryPage)
        docname = (doc.parent.pages.size === 1) ? doc.parent.name : docname = doc.name;
    else 
        docname = doc.name;
    return validFilename(docname);
}

let turndownService, gfm;

function pathify(id) {
    return id.replaceAll('.','/').replaceAll('|','¬');
}

function convertLinks(markdown, doc) {

    // Needs to be nested so that we have access to 'doc'
    function replaceLink(str, type, id, section, label, offset, string, groups) {

        function dummyLink() {
            // Make sure that "|" in the ID don't start the label early (e.g. @PDF[whatever|page=name]{label})
            return `[[${type}/${pathify(id)}|${label}]]`
        }
        if (id.startsWith("Compendium.") || type === "Compendium") return dummyLink();
    
        let linkdoc = (type === 'UUID') ? fromUuidSync(id, { relative: doc }) : game.journal.get(id);
        if (!linkdoc) return dummyLink();
        // Some types not supported yet
        if (!['JournalEntry','JournalEntryPage','RollTable'].includes(linkdoc?.documentName)) 
            return dummyLink();
    
        // A journal with only one page is put into a Note using the name of the Journal, not the only Page.
        let filename = notefilename(linkdoc);
        if (filename.length === 0) return dummyLink();
    
        // FOUNDRY uses slugified section names, rather than the actual text of the HTML header.
        // So we need to look up the slug in the Journal Page's TOC.
        let result = filename;
        if (section && linkdoc instanceof JournalEntryPage) {
            const toc = linkdoc.toc;
            if (toc[section]) 
                result += `#${toc[section].text}`;
        }
        if (label !== filename) result += `|${label}`;
        return `[[${result}]]`;
    }
    
    // Convert all the links
    const pattern = /@([A-Za-z]+)\[([^#\]]+)(?:#([^\]]+))?](?:{([^}]+)})?/g;
    markdown = markdown.replaceAll(pattern, replaceLink);
    
    // Replace file references (TBD AFTER HTML conversion)
    const filepattern = /!\[\]\(([^)]*)\)/g;
    markdown = markdown.replaceAll(filepattern, fileconvert);

    return markdown;
}

function convertHtml(doc, html) {
    // Foundry uses "showdown" rather than "turndown":
    /*{
        let mark = JournalTextPageSheet._converter.makeMarkdown(html);
        return convertLinks(mark, doc).replaceAll("\\[\\[","[[").replaceAll("\\]\\]","]]");
        // SHOWDOWN fails to parse tables at all
    }*/

    if (!turndownService) {
        // Setup Turndown service to use GFM for tables
        // headingStyle: "atx"  <-- use "###" to indicate heading (whereas setext uses === or --- to underline headings)
        turndownService = new TurndownService({ 
            headingStyle: "atx",
            codeBlockStyle: "fenced"
        });
        // GFM provides supports for strikethrough, tables, taskListItems, highlightedCodeBlock
        gfm = TurndownPluginGfmService.gfm;
        turndownService.use(gfm);
    }
    let markdown;
    try {
        // Convert links BEFORE doing HTML->MARKDOWN (to get links inside tables working properly)
        // The conversion "escapes" the "[[...]]" markers, so we have to remove those markers afterwards
        markdown = turndownService.turndown(convertLinks(html, doc)).replaceAll("\\[\\[","[[").replaceAll("\\]\\]","]]");
        // Now convert file references
        const filepattern = /!\[\]\(([^)]*)\)/g;
        markdown = markdown.replaceAll(filepattern, fileconvert);    
    } catch (error) {
        console.warn(`Error: failed to decode html:`, html)
    }

    //markdown = convertLinks(markdown, doc);

    return markdown;
}

function frontmatter(doc) {
    return FRONTMATTER + 
        `title: "${doc.name}"\n` + 
        `icon: ${DOCUMENT_ICON.lookup(doc)}\n` +
        `aliases: "${doc.name}"\n` + 
        `foundryId: ${doc.uuid}\n` + 
        FRONTMATTER;
}

function oneJournal(path, journal) {
    let subpath = path;
    if (journal.pages.size > 1) {
        const jnlname = validFilename(journal.name);
        // Put all the notes in a sub-folder
        subpath = formpath(path, jnlname);
        // TOC page 
        // This is a Folder note, so goes INSIDE the folder for this journal entry
        let markdown = "## Table of Contents\n" + frontmatter(journal);
        for (let page of journal.pages) {
            markdown += `\n- [[${validFilename(page.name)}]]`;
        }
        zip.folder(subpath).file(`${jnlname}.md`, markdown, { binary: false });
    }

    for (const page of journal.pages) {
        let markdown;
        switch (page.type) {
            case "text":
                switch (page.text.format) {
                    case 1: // HTML
                        markdown = convertHtml(page, page.text.content);
                        break;
                    case 2: // MARKDOWN
                        markdown = page.text.markdown;
                        break;
                }
                break;
            case "image": case "pdf": case "video":
                if (page.src) markdown = fileconvert(`![](${page.src})`, page.src);
                if (page.image?.caption) markdown += `\n\n${page.image.caption}`;
                break;
        }
        if (markdown) {
            markdown = frontmatter(page) + markdown;
            zip.folder(subpath).file(`${notefilename(page)}.md`, markdown, { binary: false });
        }
    }
}

function oneRollTable(path, table) {
    let markdown = frontmatter(table);
    
    if (table.description) markdown += table.description + "\n\n";

    markdown += 
        `| ${table.formula || Roll} | result |\n` +
        `|------|--------|\n`;

    for (const tableresult of table.results) {
        const range  = (tableresult.range[0] == tableresult.range[1]) ? tableresult.range[0] : `${tableresult.range[0]}-${tableresult.range[1]}`;
        // Escape the "|" in any links
        markdown += `| ${range} | ${convertLinks(tableresult.getChatText(), table).replaceAll("|","\\|")} |\n`;
    }

    // No path for tables
    zip.folder(path).file(`${notefilename(table)}.md`, markdown, { binary: false });
}

function oneScene(path, scene) {

    const sceneBottom = scene.dimensions.sceneRect.bottom;
    const sceneLeft   = scene.dimensions.sceneRect.left;
    const units_per_pixel = /*units*/ scene.grid.distance / /*pixels*/ scene.grid.size;

    function coord(pixels) {
        return pixels * units_per_pixel;
    }
    function coord2(pixely, pixelx) { return `${coord(sceneBottom - pixely)}, ${coord(pixelx - sceneLeft)}` };

    let markdown = frontmatter(scene);

    if (scene.notes.size === 0) {
        // No notes, so simply include the actual image
        markdown += fileconvert(scene.background.src, scene.background.src) + EOL;
        zip.folder(path).file(`${notefilename(scene)}.md`, markdown, { binary: false });
    }

    // Two "image:" lines just appear as separate layers in leaflet.
    let overlays=[]
    if (scene.foreground) {
        overlays.push(`${fileconvert(scene.foreground, scene.foreground).replace("!","").replace("]","|Foreground]")}`);
    }

    for (const tile of scene.tiles) {
        // tile.overhead
        // tile.roof
        // tile.hidden
        // tile.z
        // tile.alpha
        // - [ [[ImageFile2|Optional Alias]], [Top Left Coordinates], [Bottom Right Coordinates] ]
        let name = tile.texture.src;
        let pos = name.lastIndexOf('/');
        if (pos) name = name.slice(pos+1);
        overlays.push(`${fileconvert(tile.texture.src, tile.texture.src).replace("!","").replace("]","|" + name + "]")}, [${coord2(tile.y+tile.height-1, tile.x)}], [${coord2(tile.y, tile.x+tile.width-1)}]`);
    }

    let layers = (overlays.length === 0) ? "" : 'imageOverlay:\n' + overlays.map(layer => `    - [ ${layer} ]\n`).join("");
    // scene.navName - maybe an alias in the frontmatter (if non-empty, and different from scene.name)
    markdown += 
        `\n${MARKER}leaflet\n` +
        `id: ${scene.uuid}\n` +
        `bounds:\n    - [0, 0]\n    - [${coord(scene.dimensions.sceneRect.height)}, ${coord(scene.dimensions.sceneRect.width)}]\n` +
        "defaultZoom: 2\n" +
        `lat: ${coord(scene.dimensions.sceneRect.height/2)}}\n` +
        `long: ${coord(scene.dimensions.sceneRect.width/2)}}\n` +
        `height: 100%\n` +
        `draw: false\n` +
        `unit: ${scene.grid.units}\n` +
        `showAllMarkers: true\n` +
        `preserveAspect: true\n` +
        `image: ${fileconvert(scene.background.src, scene.background.src).replace("!","")}\n` +
        layers;

    // scene.dimensions.distance / distancePixels / height / maxR / ratio
    // scene.dimensions.rect: (x, y, width, height, type:1)
    // scene.dimensions.sceneHeight/sceneWidth/size/height/width
    // scene.grid: { alpha: 0.2, color: "#000000", distance: 5, size: 150, type: 1, units: "ft"}
    // scene.height/width

    for (const note of scene.notes) {
        const linkdoc = note.page || note.entry;
        const linkfile = linkdoc ? notefilename(linkdoc) : "Not Linked";
        // Leaflet plugin doesn't like ":" appearsing in the Note's label.
        const label = note.label.replaceAll(":","_");

        // invert Y coordinate, and remove the padding from the note's X,Y position
        markdown += `marker: default, ${coord2(note.y, note.x)}, [[${linkfile}]], "${label}"\n`;
            //`    icon: ${note.texture.src}` + EOL +
    }
    markdown += MARKER;

    // scene.lights?

    zip.folder(path).file(`${notefilename(scene)}.md`, markdown, { binary: false });
}

function onePlaylist(path, playlist) {
    // playlist.description
    // playlist.fade
    // playlist.mode
    // playlist.name
    // playlist.seed
    // playlist._playbackOrder (array, containing list of keys into playlist.sounds)
    // playlist.sounds (collection of PlaylistSound)
    //    - debounceVolume
    //    - description
    //    - fade
    //    - name
    //    - path (filename)
    //    - pausedTime
    //    - repeat (bool)
    //    - volume

    let markdown = frontmatter(playlist);

    if (playlist.description) markdown += playlist.description + EOL + EOL;

    for (const id of playlist._playbackOrder) {
        const sound = playlist.sounds.get(id);
        // HOW to encode volume of each track?
        markdown += `#### ${sound.name}` + EOL;
        if (sound.description) markdown += sound.description + EOL
        markdown += fileconvert(sound.path, sound.path) + EOL;
    }

    zip.folder(path).file(`${notefilename(playlist)}.md`, markdown, { binary: false });
}

function documentToJSON(path, doc) {
    // see Foundry exportToJSON

    const data = doc.toCompendium(null);
    // Remove things the user is unlikely to need
    if (data.prototypeToken) delete data.prototypeToken;

    let markdown = frontmatter(doc);
    if (doc.img) markdown += fileconvert(`![](${doc.img})`, doc.img) + EOL + EOL;

    // Some common locations for descriptions
    const DESCRIPTIONS = [
        "system.details.biography.value",  // Actor: DND5E
        "system.details.publicNotes",       // Actor: PF2E
        "system.description.value",        // Item: DND5E and PF2E
    ]
    for (const field of DESCRIPTIONS) {
        let text = foundry.utils.getProperty(doc, field);
        if (text) markdown += convertHtml(doc, text) + EOL + EOL;
    }

    let datastring;
    let dumpoption = game.settings.get(MODULE_NAME, OPTION_DUMP);
    if (dumpoption === "YAML")
        datastring = jsyaml.dump(data);
    else if (dumpoption === "JSON")
        datastring = JSON.stringify(data, null, 2) + EOL;
    else
        console.error(`Unknown option for dumping objects: ${dumpoption}`)
    // TODO: maybe extract Items as separate notes?

    markdown +=
        MARKER + doc.documentName + EOL + 
        datastring +
        MARKER + EOL;

    zip.folder(path).file(`${notefilename(doc)}.md`, markdown, { binary: false });
}

function oneDocument(path, doc) {
    if (doc instanceof JournalEntry)
        oneJournal(path, doc);
    else if (doc instanceof RollTable)
        oneRollTable(path, doc);
    else if (doc instanceof Scene && game.settings.get(MODULE_NAME, OPTION_LEAFLET))
        oneScene(path, doc);
    else if (doc instanceof Playlist)
        onePlaylist(path, doc);
    else
        documentToJSON(path, doc);
    // Actor
    // Cards
    // ChatMessage
    // Combat
    // Item
    // Macro
}

function oneFolder(path, folder) {
    let subpath = formpath(path, validFilename(folder.name));
    for (const journal of folder.contents) {
        oneDocument(subpath, journal);
    }
    for (const childfolder of folder.getSubfolders(/*recursive*/false)) {
        oneFolder(subpath, childfolder);
    }
}

async function onePack(path, pack) {
    let type = pack.metadata.type;
    console.debug(`Collecting pack '${pack.title}'`)
    let subpath = formpath(path, validFilename(pack.title));
    const documents = await pack.getDocuments();
    for (const doc of documents) {
        oneDocument(subpath, doc);
    }
}

async function onePackFolder(path, folder) {
    let subpath = formpath(path, validFilename(folder.name));
    for (const pack of game.packs.filter(pack => pack.folder === folder)) {
        await onePack(subpath, pack);
    }
}

export async function exportMarkdown(from, zipname) {
    let noteid = ui.notifications.info(`${MODULE_NAME}.ProgressNotification`, {permanent: true, localize: true})
    // Wait for the notification to get drawn
    await new Promise(resolve => setTimeout(resolve, 100));

    zip = new JSZip();

    const TOP_PATH = "";

    if (from instanceof Folder) {
        console.debug(`Processing one Folder`)
        // Do we put in the full hierarchy that might be ABOVE the indicated folder
        if (from.type === "Compendium")
            await onePackFolder(TOP_PATH, from);
        else
            oneFolder(TOP_PATH, from);
    }
    else if (from instanceof DocumentDirectory) {
        for (const doc of from.collection) {
            oneDocument(folderpath(doc), doc);
        }
    } else if (from instanceof CompendiumDirectory) {
        for (const doc of from.collection) {
            await onePack(folderpath(doc), doc);
        }
    } else if (from instanceof CompendiumCollection) {
        await onePack(TOP_PATH, from);
    } else
        await oneDocument(TOP_PATH, from);


    let blob = await zip.generateAsync({ type: "blob" });
    await saveDataToFile(blob, `${validFilename(zipname)}.zip`);
    ui.notifications.remove(noteid);
}

function zipfilename(name, type) {
    if (!type) return name;
    return `${type}-${name}`;
}

Hooks.once('init', async () => {
    // If not done during "init" hook, then the journal entry context menu doesn't work

    // JOURNAL ENTRY context menu
    function addEntryMenu(wrapped, ...args) {
        return wrapped(...args).concat({
            name: `${MODULE_NAME}.exportToMarkdown`,
            icon: '<i class="fas fa-file-zip"></i>',
            condition: () => game.user.isGM,
            callback: async header => {
                const li = header.closest(".directory-item");
                const entry = this.collection.get(li.data("entryId"));
                if (!entry) return;
                exportMarkdown(entry, zipfilename(entry.name, entry.constructor.name));
            },
        });
    }
    libWrapper.register(MODULE_NAME, "DocumentDirectory.prototype._getEntryContextOptions", addEntryMenu, libWrapper.WRAPPER);

    function addCompendiumEntryMenu(wrapped, ...args) {
        return wrapped(...args).concat({
            name: `${MODULE_NAME}.exportToMarkdown`,
            icon: '<i class="fas fa-file-zip"></i>',
            condition: li => game.user.isGM,
            callback: async li => {
                const pack = game.packs.get(li.data("pack"));
                exportMarkdown(pack, zipfilename(pack.title, pack.metadata.type));
            },
        });
    }
    libWrapper.register(MODULE_NAME, "CompendiumDirectory.prototype._getEntryContextOptions", addCompendiumEntryMenu, libWrapper.WRAPPER);

    // FOLDER context menu: needs 
    function addFolderMenu(wrapped, ...args) {
        return wrapped(...args).concat({
            name: `${MODULE_NAME}.exportToMarkdown`,
            icon: '<i class="fas fa-file-zip"></i>',
            condition: () => game.user.isGM,
            callback: async header => {
                const li = header.closest(".directory-item")[0];
                const folder = await fromUuid(li.dataset.uuid);
                if (!folder) return;
                exportMarkdown(folder, zipfilename(folder.name, folder.type));
            },
        });
    }
    libWrapper.register(MODULE_NAME, "DocumentDirectory.prototype._getFolderContextOptions", addFolderMenu, libWrapper.WRAPPER);
    libWrapper.register(MODULE_NAME, "CompendiumDirectory.prototype._getFolderContextOptions", addFolderMenu, libWrapper.WRAPPER);
})

Hooks.on("renderSidebarTab", async (app, html) => {
    if (!game.user.isGM) return;

    if (app instanceof DocumentDirectory ||
        app instanceof CompendiumDirectory) {
        const label = game.i18n.localize(`${MODULE_NAME}.exportToMarkdown`);
        let button = $(`<button class='import-cd'><i class='fas fa-file-zip'></i>${label}</button>`)
        button.click(function () {
            exportMarkdown(app, zipfilename(app.constructor.name));
        });

        let anchor = html.find(".directory-footer");
        anchor.append(button);
    }
})


/*
 * MODULE OPTIONS
 */

Hooks.once('init', () => {
    game.settings.register(MODULE_NAME, OPTION_DUMP, {
		name: "Format for non-decoded data",
		hint: "For document types not otherwise decoded, use this format for the data dump.",
		scope: "world",
		type:  String,
		choices: { 
            "YAML": "YAML",
            "JSON": "JSON"
        },
		default: "YAML",
		config: true,
	});

    game.settings.register(MODULE_NAME, OPTION_LEAFLET, {
		name: "Format Scenes for Leaflet plugin",
		hint: "Create Notes in a format suitable for use with Obsidian's Leaflet plugin",
		scope: "world",
		type:  Boolean,
		default: true,
		config: true,
	});
})