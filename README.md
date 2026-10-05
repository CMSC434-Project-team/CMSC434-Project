# Kitchen Kompanion

Kitchen Kompanion is a static web application for managing kitchen inventory,
shopping lists, recipes, and a user profile. The project currently uses plain
HTML and CSS, so pages can be opened directly in a browser. It has restrictions on device size (640px * 960px) and others due to CMSC434 project requirements.

## File structure

```text
.
├── index.html                  # Home page
├── shopping.html               # Shopping list page
├── recipes.html                # Recipes page
├── profile.html                # Profile page
├── styles.html                 # Shared style guide and component examples
└── assets/
    ├── fonts/                  # Inter is the best
    ├── images/
    ├── favicons/
    └── styles/
        ├── theme.css           # Design tokens and small reusable utilities
        └── global.css          # Global page styles and components
```

Every HTML page loads `assets/styles/global.css`. That file imports
`assets/styles/theme.css`, so pages should normally include only `global.css`. Read more in the [style guide](/assets/styles/.README.md).
