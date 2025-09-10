# CHANGELOG

## 0.13.6

- Add an option to only export Player-viewable material, based on ownership of documents and journal pages, and the SECRET block style. (See the new module option "Include GM-only content" which defaults to enabled.)
- Address deprecation warnings from Foundry V13.

## 0.13.5

- Use a different (more reliable?) method to read links to documents in Compendiums.
- Remove warnings about new location of Foundry V13 classes.

## 0.13.4

- Fix an issue with decoding links when real-name (not UUID) is used for created MD filenames and the links do not have an explicit label ({something})

## 0.13.3

- Set verified to 13.345

## 0.13.2

- V13: Context Menu working on individual documents and folders.

## 0.13.1

- Set minimum compatibility to Foundry 13.336, due to fundamental changes in hooks.
- It should be fully working on Foundry 13.336 onwards.

## 0.13.0

- Use Hooks directly, rather than libWrapper (which removes the dependence on libWrapper).
- Set minimum compatibility to Foundry V11 (in preparation for Foundry V13).
- V13 compatibility is awaiting support from Foundry to allow the popup Context Menu to be extended by modules (e.g. the `getSidebarTabEntryContext` and `getSidebarTabFolderContext` hooks.)

## 0.12.3

- Mark as NOT compatible with Foundry V13.

## 0.12.2

- Fix marker coordinates in Foundry V12.

## 0.12.1

- Update verified version to Foundry 12.331

## 0.12.0

- Provide some useful built-in handlebars functions, updates by @AmbientSilence (see README for more details)
  - `{{EMDvalidFilename string}}` converts string into a valid filename
  - `{{EMDconvertHtml context string}}` converts the supplied string into HTML
  - `{{EMDfileConvert filename label_or_size}}` to store a referenced file and create a link to it.
  - `{{EMDitemsOfType items type}}` reduce a collection/array to only those of a particular type.
  - `{{EMDtitleCase string}}` convert a string to title case.
- Support folders inside compendium packs.
- NOTE: Internally change the `convertHtml` function to be synchronous (so that it can be called from a handlebars helper). Please report if this causes failures.

## 0.11.1

- Switch method of detecting the system's Actors and Items to avoid a warning in Foundry V12.
- Ensure that Actor/Item settings sections have their header appear in Foundry V12.

## 0.11.0

- Allow a Handlebars template to be specified for each type of Actor and Item.
- The "img" of each Actor and Item will always be uploaded, in case it is referenced from the generated Markdown.
- The handlebars template file should specify the full contents of the generated markdown file (including the frontmatter, if required).
- Note that the markdown template files should be uploaded into your Foundry storage using the ".md" extension.
- See https://foundryvtt.com/api/classes/client.HandlebarsHelpers.html for the Foundry-supplied helpers available, although that page is missing the comparison helpers (eq, ne, lt, gt, lte, gte, not, and, or).

## 0.10.0

- All filenames are now the Foundry UUID, in order to see document titles in the sidebar Explorer Obsidian's "Front Matter Title" plugin should be used.
- All pages have a H1 header containing the name of the note.
- This will ensure that over transfers of multiple ZIP files that all the links will resolve themselves normally.
- Scenes will always have the leaflet data generated (previously a simple image was used if there were no Notes on the scene.)
- Scene Notes now only show the name of the destination note.
- Sort Journal Table of Contents into correct order, and use correct indentation for the three levels of headers.
- Remove warning generated when exporting the chat log.
- Line breaks in table cells should be honoured.
- Put Foundry document type into the tags part of the frontmatter (e.g. Actor, Item, JournalEntry, JournalEntryPage)
- use string-replace-async library to convert links that might point to compendium entries.

## 0.9.1

- Ensure that the module works on Foundry V10.
- Tidy-up the positioning of the "Export Markdown" button at the bottom of each sidebar tab.

## 0.9.0

- Add Tiles as additional layers to Scenes.
- The Leaflet plugin does not allow a Scene marker to have a colon (":") in it's label, apparently - so they are now replaced by underscores ("_").
- The generation of Leaflet format data for Scenes is now optional.
- Export ChatLog as markdown (TODO: fix the colour of the "Export Markdown" button)
- Export Encounters as markdown (TODO: improve the position/size of the "Export Markdown" button)

## 0.8.0

- Convert Scenes into an annotation block that can be used by Obsidian's [leaflet](https://github.com/javalent/obsidian-leaflet) plugin.
- If a scene has a foreground image, it is NOT displayed by default, but can be displayed via the layers control in the leaflet plugin.
- Create Notes for Playlists - one note per playlist, with a separate audio player for each track within the playlist.
- Store all ASSETS in a LONG filename which includes the path to that file (to avoid issues with the base filename being the same in different folders).

## 0.7.0

- Include document type in the ZIP filename.
- Export other document types as JSON or YAML in an annotation block (includes limited support for fetching image and description from the correct place in known game-systems: currently DND5E and PF2E).

## 0.6.0

- Make a better attempt at converting tables from HTML to markdown (which involved switching to @guyplusplus updated version of turndown-plugin-gfm)

## 0.5.0

- Export Roll Tables
- Ensure folder names in the ZIP file match the selected item(s) for export.
- Add a suitable icon to the frontmatter of each note (for use with Obsidian's Icon Shortcodes plugin).

## 0.4.1

- Default for non-journal links will replace "." with "/" so that creating notes from those links will not fill your root folder with loads of folders.

## 0.4.0

- Allow Journal Entries from Compendiums to be exported (Choosing a folder in the compendium sidebar will output all the contained Journal (only) entries into a single zip file).
- Convert non-journal links to Obsidian format, which will link to non-existent pages (any '|' in the link id are replaced by '¬').

## 0.3.0

- Links no longer contain the path of folders to the relevant Note.
- Links to Notes now include the section header, if provided.

## 0.2.2

- Produce INFO banner to indicate that the export is occurring.

## 0.2.1

- Prevent a blocking error if a referenced image is not found by fetch()

## 0.2.0

- Fetch files linked from journal entries which are stored within the Foundry data area (external URLs will remain as external URLs).
- Fetch files for src from Image pages.
- Tables appear to be getting converted properly.

## 0.1.0

- First provisional release:
- Tables won't always get converted
- Images aren't transferred.
