import "./lib/jszip.min.js";

const MODULE_NAME = "export-markdown";

/**
 * 
 * @param {Object} from Either a folder or a Journal, selected from the sidebar
 */

function validFilename(name) {
    const regexp = /[<>:"/\\|?*]/g;
    return name.replaceAll(regexp,'_');
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
    a.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true, view: window}));
    setTimeout(() => window.URL.revokeObjectURL(a.href), 100);
}

function oneJournal(zip, journal) {
    let topfolder = validFilename(journal.name);
    for (const page of journal.pages)
        if (page.type === 'text') {
            zip.folder(topfolder).file(`${validFilename(page.name)}.md`, JournalTextPageSheet._converter.makeMarkdown(page.text.content.trim()), {binary:false});
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

export function exportMarkdown(from) {
    console.debug('exportMarkdown', from)
    const zip = new JSZip();

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
        for (const topfolder of from.getSubfolders(/*recursive*/false)) {
            oneFolder(zip, topfolder);
        }
    }
    else {
        ui.notifications.err('Invalid object passed to exportMarkdown')
        return;
    }
    zip.generateAsync({type:"blob"}).then((blob) => saveDataToFile(blob, `${validFilename(from.name)}.zip`));
}

Hooks.once('init', async () => {
    function addFolderMenu(wrapped, ...args) {
       return wrapped(...args).concat({
            name: `${MODULE_NAME}.exportToMarkdown`,
            icon: '<i class="fas fa-file-zip"></i>',
            callback: async header => {
                const li = header.closest(".directory-item")[0];
                const folder = await fromUuid(li.dataset.uuid);
                if (!folder) return;
                exportMarkdown(folder)
            },
        });
    }
    function addEntryMenu(wrapped, ...args) {
        return wrapped(...args).concat({
             name: `${MODULE_NAME}.exportToMarkdown`,
             icon: '<i class="fas fa-file-zip"></i>',
             callback: async header => {
                const li = header.closest(".directory-item");
                const entry = this.collection.get(li.data("entryId"));
                if ( !entry ) return;
                exportMarkdown(entry)
             },
         });
    }
    libWrapper.register(MODULE_NAME, "JournalDirectory.prototype._getEntryContextOptions",  addEntryMenu,  libWrapper.WRAPPER);
    libWrapper.register(MODULE_NAME, "JournalDirectory.prototype._getFolderContextOptions", addFolderMenu, libWrapper.WRAPPER);
})