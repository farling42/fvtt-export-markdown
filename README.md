[![ko-fi](https://img.shields.io/badge/Ko--Fi-farling-success)](https://ko-fi.com/farling)
[![patreon](https://img.shields.io/badge/Patreon-amusingtime-success)](https://patreon.com/amusingtime)
[![paypal](https://img.shields.io/badge/Paypal-farling-success)](https://paypal.me/farling)
![GitHub License](https://img.shields.io/github/license/farling42/fvtt-export-markdown)
![Foundry Info](https://img.shields.io/badge/Foundry-v10-informational)
![Latest Release Download Count](https://img.shields.io/github/downloads/farling42/fvtt-export-markdown/latest/module.zip)
![Forge installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Ffvtt-export-markdown)

# Export to Markdown

Selecting the "Export to Markdown" option from the Journal Sidebar generates a ZIP file containing the selected journal/folder tree.

It is possible to export:

- one individual journal
- a folder of journals
- the entire sidebar of journals

The contents of the downloaded ZIP can then be exported into your Obsidian Vault.

All created links assume that the ZIP is extracted into the root folder of the Vault.

## Libraries

- [JSZip](https://stuk.github.io/jszip)
- [turndown](https://www.npmjs.com/package/turndown) (for HTML to Markdown conversion) 
- [turndown-plugin-gfm](https://www.npmjs.com/package/turndown-plugin-gfm)  (to convert HTML tables to GFM format) 