# Kitchen Kompanion

Kitchen Kompanion is a static web application for managing kitchen inventory,
shopping lists, recipes, and a user profile. Pages can be opened directly in a
browser by opening any HTML file; no web server is required. It has
restrictions on device size (640px \* 960px) and others due to CMSC434 project
requirements.

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
        ├── icons.css           # Global icons
        ├── index.css           # [local] Home page styles
        ├── shopping.css        # [local] Shopping list page styles
        ├── recipes.css         # [local] Recipes page styles
        ├── profile.css         # [local] Profile page styles
        └── styles.css          # [local] Style guide page styles
```

The JSON files in `data/` remain the editable source/reference data. The
browser pages use the matching data embedded in `scripts/data.js`, because
browser security prevents loading JSON with `fetch()` from a `file://` page.

Each page stylesheet imports `assets/styles/_global.css` first. That file
imports `assets/styles/_theme.css`, so local styles can use the global
variables while each HTML page only loads its page stylesheet. Read more in
the [style guide](assets/styles/_README.md).
