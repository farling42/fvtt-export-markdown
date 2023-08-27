# CHANGELOG

## 0.8.0

- Convert Scenes into an annotation block that can be used by Obsidian's [leaflet](https://github.com/javalent/obsidian-leaflet) plugin.
- Create Notes for Playlists - one note per playlist, with a separate audio player for each track within the playlist.

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
