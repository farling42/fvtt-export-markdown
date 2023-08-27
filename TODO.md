## ICONS (Icon Shortcodes plugin)

## ACTORS and ITEMS

A page showing the `JSON.stringify(json, null, 2)` (see exportToJSON)

Or use a user-provided handlebars template for the note

## SCENE

Convert to whatever Obsidian has as a map plugin:

- scene background
- scene notes
- tokens?
- tiles?

## PLAYLIST

Simply store the file as a binary file

## CHAT LIST

One note per entry?

## Encounter Statblocks

```code
  \```encounter
    name: A01 Damp Entrance
    creatures:
    - 3: Mitflit
  \```
  \```statblock
    monster: mitflit
  \```
```

## BUGS

- Links inside tables created by HTML->markdown converter don't have their "|" escaped to be "\|", so the table isn't formatted properly.
- Tables aren't appearing with a blank line before them.