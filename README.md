# Kitchen Kompanion

Kitchen Kompanion is a static web application for managing kitchen inventory,
shopping lists, recipes, and a user profile. The project currently uses plain
HTML and CSS, so pages can be opened directly in a browser. It has restrictions on device size (640px \* 960px) and others due to CMSC434 project requirements.

## File structure

```text
.
├── index.html                  # Home page
├── shopping.html               # Shopping list page
├── recipes.html                # Recipes page
├── profile.html                # Profile page
├── styles.html                 # Shared style guide and component examples
├── scripts/
│   ├── _global.js              # Global script
│   ├── index.js                # [local] Home page scripts
│   ├── shopping.js             # [local] Shopping list page scripts
│   ├── recipes.js              # [local] Recipes page scripts
│   ├── profile.js              # [local] Profile page scripts
│   └── styles.js               # [local] Style guide page scripts
└── assets/
    ├── fonts/                  # Inter is the best
    ├── images/
    ├── favicons/
    └── styles/
        ├── _theme.css          # Global design tokens and small reusable utilities
        ├── _global.css         # Global styles and components
        ├── index.css           # [local] Home page styles
        ├── shopping.css        # [local] Shopping list page styles
        ├── recipes.css         # [local] Recipes page styles
        ├── profile.css         # [local] Profile page styles
        └── styles.css          # [local] Style guide page styles
```

Every HTML page loads `assets/styles/_global.css`. That file imports
`assets/styles/_theme.css`, so pages should normally include only `_global.css`. Read more in the [style guide](assets/styles/_README.md).

## Styling

### EditorConfig

This project uses [EditorConfig](https://editorconfig.org) to maintain consistent basic formatting across editors. The repository's [`.editorconfig`](.editorconfig) file defines UTF-8 encoding, LF line endings, final newlines, and specific indentation rules:

* **Tabs:** HTML, CSS, and JavaScript.
* **Spaces:** Dotfiles, Markdown, JSON, TOML, YAML, and JSON5.
* **Trailing whitespace:** (may break code so) preserved. 

### VS Code Setup

1. Install the [EditorConfig for VS Code extension](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig).
2. Open the project folder. The extension automatically applies `.editorconfig` settings. Do not override these settings per file.

The included [`.vscode/settings.json`](.vscode/settings.json) enables default formatting on save/paste and disables indentation detection to keep EditorConfig authoritative. It also locks in VS Code's built-in formatters for HTML, CSS, JavaScript, and JSON to prevent external formatters (like Prettier) from overriding them.
