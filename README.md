# Quick New File: A VSCode Extension

Quicker way to create a new file (that looks like the current one).

## Features

Hit <kbd>ctrl+shift+N</kbd> to create a new file that has the same context as the current one:
- Same extension and directory
- Same package declaration (where applicable)
- Same imports (**new!**)
- Same hashbang (`#!`) string (also, `chmod +x`)
- Boilerplate code (where applicable)

### Supported Languages
- Go (Package, imports and build constraints)
- Java (Package, imports and `class` boilerplate)
- PHP (`<?php`)
- Python (Imports) (**new!**)
- Shellscript (`set` statement)
