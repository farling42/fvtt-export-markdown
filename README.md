[![ko-fi](https://img.shields.io/badge/Ko--Fi-farling-success)](https://ko-fi.com/farling)
[![patreon](https://img.shields.io/badge/Patreon-amusingtime-success)](https://patreon.com/amusingtime)
[![paypal](https://img.shields.io/badge/Paypal-farling-success)](https://paypal.me/farling)
![GitHub License](https://img.shields.io/github/license/farling42/fvtt-export-markdown)
![Foundry Info](https://img.shields.io/badge/Foundry-v10-informational)
![Latest Release Download Count](https://img.shields.io/github/downloads/farling42/fvtt-export-markdown/latest/module.zip)
![Forge installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Ffvtt-export-markdown)

# Markdown Exporter

Selecting the "Export to Markdown" option from the Journal Sidebar generates a ZIP file containing the selected journal/folder tree.

It is possible to export:

- one individual journal
- a folder of journals
- the entire sidebar of journals
- the contents of a Journal compendium
- the contents of Journal compendiums in a compendium folder

The contents of the downloaded ZIP can then be exported into your Obsidian Vault.

Links to non-journal entries will be converted to Markdown-format links (which will obviously point to non-existent pages).

## Installation

The module can be installed directly from your Foundry server's module management page.

Alternatively, you can install manually using the link:

https://github.com/farling42/fvtt-export-markdown/releases/latest/download/module.json

## Dependencies

This library requires the libWrapper module in order to work properly.

## Plugins for use with Obsidian.md

- "Front Matter Title" - To have document names appearing in Obsidian's Explorer (left sidebar). The only Feature which needs to be enabled is "Explorer".
- "AidenLX's Folder Note" and "Folder Note Core" - So that journal entries have their main contents page accessible directly from the containing folder.
- "Obsidian Leaflet" - For display of scenes with notes.

## Libraries

- [JSZip](https://stuk.github.io/jszip)
- [JSYAML](https://github.com/nodeca/js-yaml) (for Object to YAML conversion)
- [turndown](https://www.npmjs.com/package/turndown) (for HTML to Markdown conversion) 
- [turndown-plugin-gfm](https://www.npmjs.com/package/turndown-plugin-gfm) (to convert HTML tables to GFM format) 
- [string-replace-async](https://github.com/dsblv/string-replace-async) (to provide async version of String.replaceAll)
