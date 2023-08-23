import "./lib/jszip.min.js";
import { TurndownService } from "./lib/turndown.js";
import { turndownPluginGfm } from "./lib/turndown-plugin-gfm.js";

const MODULE_NAME = "export-markdown";
const FRONTMATTER = "---\n";

const destForImages = "zz_asset-files/";

let zip;

/**
 * 
 * @param {Object} from Either a folder or a Journal, selected from the sidebar
 */

function validFilename(name) {
    const regexp = /[<>:"/\\|?*]/g;
    return name.replaceAll(regexp, '_');
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
    setTimeout(() => window.URL.revokeObjectURL(a.href), 100);
}

function folderpath(journal) {
    let result = "";
    let folder = journal.folder;
    while (folder) {
        const foldername = validFilename(folder.name);
        result = result ? (foldername + "/" + result) : foldername;
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
    let basefilename = filename.slice(filename.lastIndexOf('/') + 1);

    zip.file(destForImages + basefilename, 
        // Provide a Promise which ZIP can use
        fetch(filename).then(resp => {
            if (resp.status !== 200) {
                console.error(`Failed to fetch image from '${filename}'`)
                return Blob();
            } else {
                console.debug(`Adding image file ${basefilename}`);
                return resp.blob();
            }
        }).catch(e => { console.log(`Failed to fetch image from '${filename}'`, e)}),
    {binary:true});
    return `![[${basefilename}]]`;
}

let turndownService, gfm;

function convertHtml(doc, html) {
    if (!turndownService) {
        // Setup Turndown service to use GFM for tables
        turndownService = new TurndownService({ headingStyle: "atx" });
        gfm = turndownPluginGfm.gfm;
        turndownService.use(gfm);
    }
    let markdown;
    try {
        markdown = turndownService.turndown(html);
    } catch (error) {
        console.warn(`Error: failed to decode html:`, html)
    }

    function convertLink(str, id, section, label, offset, string, groups) {
        if (id.startsWith("Compendium.")) return str;
        let linkeddoc = str.startsWith('@UUID') ? fromUuidSync(id, { relative: doc }) : game.journal.get(id);
        if (!(linkeddoc instanceof JournalEntry || linkeddoc instanceof JournalEntryPage)) return str;
        let journal = linkeddoc.parent || linkeddoc;

        let filename = id.startsWith('.') ? validFilename(linkeddoc.name) :
            (journal.pages?.size > 1) ? (folderpath(journal) + "/" + validFilename(linkeddoc.name)) : folderpath(journal);
        if (label == filename)
            return `[[${filename}]]`;
        else
            return `[[${filename}|${label}]]`;
    }

    // Convert all the links
    // Replace Journal Links
    if (markdown.includes('@JournalEntry')) {
        // The square brackets in @JournalEntry will already have been escaped! if text was converted to markdown
        const pattern1 = /@([a-zA-Z]+)\\\[([^\]]*)\\\]{([^\}]*)}/g;
        markdown = markdown.replaceAll(pattern1, convertLink);
        // Foundry V10 allows markdown, which won't have escaped markers
        const pattern2 = /@([a-zA-Z]+)\[([^\]]*)\]{([^\}]*)}/g;
        markdown = markdown.replaceAll(pattern2, convertLink);
    }
    // Converted text has the first [ escaped
    if (markdown.includes('@UUID\\[')) {
        // The square brackets in @JournalEntry will already have been escaped!
        const pattern = /@UUID\\\[([^#\\]+)(?:#([^\\]+))?\\\](?:{([^}]+)})?/g;
        //cst pattern = /@UUID\\\[([a-zA-Z]*)\.([^\]]*)\\\]{([^\}]*)}/g;
        markdown = markdown.replaceAll(pattern, convertLink);
    }
    // Converted markdown does NOT include the escape flag
    if (markdown.includes('@UUID[')) {
        const pattern = new RegExp(`@UUID\\[([^#\\]]+)(?:#([^\\]]+))?](?:{([^}]+)})?`, "g");
        //const pattern = /@UUID\[([a-zA-Z]*)\.([^\]]*)\]{([^\}]*)}/g;
        markdown = markdown.replaceAll(pattern, convertLink);
    }
    // Replace file references
    if (markdown.includes('![](')) {
        //console.log(`File ${item.filename} has images`);
        const filepattern = /!\[\]\(([^)]*)\)/g;
        markdown = markdown.replaceAll(filepattern, fileconvert);
    }

    return markdown;
}

function oneJournal(zip, journal) {
    let topfolder = validFilename(journal.name);
    let onepage = journal.pages.size === 1;
    const dirname = onepage ? folderpath(journal) : (folderpath(journal) + "/" + validFilename(journal.name));
    if (!onepage) {
        // TOC page 
        // This is a Folder note, so goes INSIDE the folder for this journal entry
        const notename = journal.name;
        let markdown = "## Table of Contents\n";
        for (let page of journal.pages) {
            markdown += `\n- [[${validFilename(page.name)}]]`;
        }
        markdown = FRONTMATTER + `title: "${notename}"\n` + `aliases: "${notename}"\n` + `foundryId: ${journal.uuid}\n` + FRONTMATTER + markdown;
        zip.file(`${dirname}/${validFilename(notename)}.md`, markdown, { binary: false });
    }

    for (const page of journal.pages) {
        let markdown;
        const notename = onepage ? journal.name : page.name;
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
                if (page.src) markdown = `![](${page.src})`;
                break;
        }
        if (markdown) {
            markdown = FRONTMATTER + `title: "${page.name}"\n` + `aliases: "${journal.name}"\n` + `foundryId: ${page.uuid}\n` + FRONTMATTER + (markdown || "");
            zip.file(`${dirname}/${validFilename(notename)}.md`, markdown, { binary: false });
        }
    }
}

function oneFolder(zip, folder) {
    const subzip = zip.folder(validFilename(folder.name));

    for (const journal of folder.contents) {
        oneJournal(subzip, journal);
    }
    for (const childfolder of folder.getSubfolders(/*recursive*/false)) {
        oneFolder(subzip, childfolder);
    }
}

export function exportMarkdown(from, zipname) {
    zip = new JSZip();

    if (from instanceof JournalEntry) {
        console.debug(`Processing one JournalEntry`)
        oneJournal(zip, from);
    } else if (from instanceof Folder) {
        console.debug(`Processing one Folder`)
        // Do we put in the full hierarchy that might be ABOVE the indicated folder
        oneFolder(zip, from);
    }
    else if (from instanceof JournalDirectory) {
        console.debug(`Processing the entire JournalDirectory`)
        // All folders in the JournalDirectory.
        for (const journal of from.collection) {
            oneJournal(zip, journal);
        }
    }
    else {
        ui.notifications.err('Invalid object passed to exportMarkdown')
        return;
    }

    zip.generateAsync({ type: "blob" }).then((blob) => saveDataToFile(blob, `${validFilename(zipname)}.zip`));
}

Hooks.once('init', async () => {
    // If not done during "init" hook, then the journal entry context menu doesn't work

    // JOURNAL ENTRY context menu
    function addEntryMenu(wrapped, ...args) {
        return wrapped(...args).concat({
            name: `${MODULE_NAME}.exportToMarkdown`,
            icon: '<i class="fas fa-file-zip"></i>',
            condition: game.user.isGM,
            callback: async header => {
                const li = header.closest(".directory-item");
                const entry = this.collection.get(li.data("entryId"));
                if (!entry) return;
                exportMarkdown(entry, entry.name)
            },
        });
    }
    libWrapper.register(MODULE_NAME, "JournalDirectory.prototype._getEntryContextOptions", addEntryMenu, libWrapper.WRAPPER);

    // FOLDER context menu: needs 
    function addFolderMenu(wrapped, ...args) {
        return wrapped(...args).concat({
            name: `${MODULE_NAME}.exportToMarkdown`,
            icon: '<i class="fas fa-file-zip"></i>',
            condition: game.user.isGM,
            callback: async header => {
                const li = header.closest(".directory-item")[0];
                const folder = await fromUuid(li.dataset.uuid);
                if (!folder) return;
                exportMarkdown(folder, folder.name)
            },
        });
    }
    libWrapper.register(MODULE_NAME, "JournalDirectory.prototype._getFolderContextOptions", addFolderMenu, libWrapper.WRAPPER);
})

Hooks.on("renderSidebarTab", async (app, html) => {
    if (game.user.isGM && app instanceof JournalDirectory) {
        const label = game.i18n.localize(`${MODULE_NAME}.exportToMarkdown`);
        let button = $(`<button class='import-cd'><i class='fas fa-file-zip'></i>${label}</button>`)
        button.click(function () {
            exportMarkdown(app, "JournalDirectory");
        });

        // 3.5 SRD doesn't have a directory-header
        let anchor = html.find(".directory-footer");
        anchor.append(button);
    }
})