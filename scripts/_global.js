// Global script for shared functionality across all scripts
// Run check: node --check scripts/_global.js
// @ts-check

console.log("_global.js loaded");

/**
 * @typedef {"vegetarian"|"vegan"|"pescatarian"|"gluten-free"|"dairy-free"|"nut-free"} Tag
 * 
 * @typedef {Object} Ingredient
 * @property {string} name
 * @property {string} unit
 * 
 * @typedef {Object} InventoryItem
 * @property {string} name                  // required for all
 * @property {Ingredient | null} ingredient // required for all
 * @property {number} stock                 // required for adding to inventory, optional for adding to shopping list
 * @property {number} low_stock_threshold   // optional, used for low stock alerts
 * @property {string} location              // optional, used for inventory organization (TODO: not searchable yet)
 * @property {string} notes                 // optional, used for inventory notes
 * @property {string} expiration_date       // optional, used for inventory expiration tracking
 * @property {string} last_updated          // optional, used for inventory last updated tracking
 * @property {Tag[]} tags                   // optional, used for inventory filtering
 * 
 * @typedef {Object} RecipeIngredient
 * @property {Ingredient} ingredient
 * @property {number} quantity
 * 
 * @typedef {Object} RecipeItem
 * @property {string} name
 * @property {number} time
 * @property {RecipeIngredient[]} ingredients
 * @property {string[]} steps
 * 
 * @typedef {Object} PeopleItem
 * @property {string} name
 * @property {Tag[]} restricted_tags
 * 
 * @typedef {InventoryItem[] | RecipeItem[] | PeopleItem[] | ShoppingItem[]} DataSet
 * 
 * @typedef {Object} KitchenDataStore
 * @property {InventoryItem[]} inventory
 * @property {RecipeItem[]} recipes
 * @property {PeopleItem[]} people
 * @property {ShoppingItem[]} shopping
 * 
 *
 * @typedef {Object} ShoppingItem
 * @property {Ingredient} ingredient
 * @property {number} quantity
 * @property {boolean} checked
 */

/**
 * @type {Record<Tag, string>}
 */
const DIETARY_LABELS = {
    vegetarian: "Vegetarian", vegan: "Vegan", pescatarian: "Pescatarian",
    "gluten-free": "Gluten-free", "dairy-free": "Dairy-free", "nut-free": "Nut-free"
};

/**
 * @param {string} tag
 */
function dietaryLabel(tag) {
    return DIETARY_LABELS[/** @type {Tag} */ (tag)] || tag;
}

/**
 * @param {PeopleItem[]} people
 * @param {string[]} recipeTags
 */
function peopleSuitedTo(people, recipeTags) {
    return people.filter(person =>
        (person.restricted_tags || []).every(tag => recipeTags.includes(tag)));
}

class JsonData {
    /**
     * Creates an instance of JsonData backed by localStorage.
     * @param {keyof KitchenDataStore} dataName
     */
    constructor(dataName) {
        this.dataName = dataName;
        this.storageKey = `kitchen-kompanion-${dataName}`;
        this.data = appWindow.KitchenData[dataName];
        this.ready = Promise.resolve(this.data);
        this.loadData();
    }

    /** @returns {DataSet | null} */
    getData() {
        return this.data;
    }

    /** @returns {DataSet} */
    loadData() {
        const savedData = localStorage.getItem(this.storageKey);
        if (!savedData) return this.data;

        try {
            const parsedData = JSON.parse(savedData);
            if (!Array.isArray(parsedData)) throw new Error("Stored data is not an array.");
            this.data = parsedData;
            this.ready = Promise.resolve(this.data);
            console.log(`Loaded data from "${this.storageKey}"`);
        } catch (error) {
            console.error(`Could not load data from "${this.storageKey}":`, error);
        }
        return this.data;
    }

    /** @param {DataSet} data */
    setData(data) {
        this.data = data;
        this.saveData();
    }

    /** @param {boolean} [downloadFile=false] */
    saveData(downloadFile = false) {
        if (!this.data) {
            console.error("No data available to save.");
            return;
        }

        const jsonString = JSON.stringify(this.data, null, 2);
        localStorage.setItem(this.storageKey, jsonString);

        if (downloadFile) {
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `${this.storageKey}.json`;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log(`Downloaded ${this.storageKey}.json successfully.`);
        }
    }
}

/** @type {Window & { JsonData: any, KitchenData: KitchenDataStore }} */
const appWindow = /** @type {any} */ (window);
appWindow.JsonData = JsonData;

/** @type {KitchenDataStore} */
appWindow.KitchenData = {
    inventory: [
        {
            name: "Tomato",
            ingredient: { name: "Tomato", unit: "piece" },
            stock: 4,
            low_stock_threshold: 2,
            tags: ["vegan", "vegetarian", "organic"],
            location: "Fridge",
            notes: "Organic tomatoes",
            expiration_date: "2026-10-15",
            last_updated: "2026-10-01"
        },
        {
            name: "Brown rice",
            ingredient: { name: "Brown rice", unit: "cup" },
            stock: 6,
            low_stock_threshold: 2,
            tags: ["gluten-free", "vegan", "vegetarian", "high-fiber"],
            location: "Pantry",
            notes: "",
            expiration_date: "2026-11-30",
            last_updated: "2026-10-01"
        },
        {
            name: "Black beans",
            ingredient: { name: "Black beans", unit: "can" },
            stock: 1,
            low_stock_threshold: 2,
            tags: ["gluten-free", "vegan", "vegetarian", "high-protein"],
            location: "Pantry",
            notes: "Rinse before use",
            expiration_date: "2027-01-15",
            last_updated: "2026-10-01"
        }
    ],
    recipes: [
        {
            name: "Black Bean Rice Bowl",
            time: 25,
            ingredients: [
                { ingredient: { name: "Brown rice", unit: "cup" }, quantity: 1 },
                { ingredient: { name: "Black beans", unit: "can" }, quantity: 1 }
            ],
            steps: ["Cook the brown rice.", "Warm the black beans.", "Serve the beans over the rice."]
        },
        {
            name: "Tomato Rice",
            time: 20,
            ingredients: [
                { ingredient: { name: "Tomato", unit: "piece" }, quantity: 2 },
                { ingredient: { name: "Brown rice", unit: "cup" }, quantity: 1 }
            ],
            steps: ["Cook the brown rice.", "Dice and sauté the tomatoes.", "Stir the tomatoes into the rice."]
        },
        {
            name: "Three Ingredient Salad",
            time: 10,
            ingredients: [
                { ingredient: { name: "Tomato", unit: "piece" }, quantity: 2 }
            ],
            steps: ["Dice tomatoes.", "Toss together in a bowl."]
        }
    ],
    people: [
        {
            name: "Alex",
            restricted_tags: ["nut-free"]
        },
        {
            name: "Jordan",
            restricted_tags: ["dairy-free", "vegetarian"]
        },
        {
            name: "Sam",
            restricted_tags: ["gluten-free"]
        }
    ],
    shopping: [
        {
            ingredient: { name: "Black beans", unit: "can" },
            quantity: 1,
            checked: false
        },
        {
            ingredient: { name: "Egg", unit: "piece" },
            quantity: 12,
            checked: false
        },
        {
            ingredient: { name: "Milk", unit: "gallon" },
            quantity: 1,
            checked: false
        }
    ]
};

/***************************************************************
Recipe → Shopping list helpers
***************************************************************/

/**
 * Find an inventory item by ingredient name (ignores case and extra spaces).
 * @param {InventoryItem[]} inventory
 * @param {string} ingredientName
 * @returns {InventoryItem | undefined}
 */
function findInventoryItem(inventory, ingredientName) {
    const key = ingredientName.trim().toLowerCase();
    return inventory.find(
        (item) => (item.ingredient?.name ?? item.name).trim().toLowerCase() === key
    );
}

/**
 * List what a recipe needs that the inventory doesn't have enough of.
 * @param {RecipeItem} recipe
 * @param {InventoryItem[]} inventory
 */
function getMissingIngredients(recipe, inventory) {
    return recipe.ingredients
        .map(({ ingredient, quantity }) => {
            const invItem = findInventoryItem(inventory, ingredient.name);
            const have = invItem ? invItem.stock : 0;
            return { ingredient, need: quantity, have, missing: Math.max(0, quantity - have) };
        })
        .filter((row) => row.missing > 0);
}

/**
 * Add a recipe's missing ingredients to the shopping list and save.
 * @param {RecipeItem} recipe
 */
function addMissingToShoppingList(recipe) {
    const inventory = /** @type {InventoryItem[]} */ (new JsonData("inventory").getData());
    const shoppingStore = new JsonData("shopping");
    let shopping = /** @type {ShoppingItem[]} */ (shoppingStore.getData());

    const missing = getMissingIngredients(recipe, inventory);

    for (const row of missing) {
        const key = row.ingredient.name.trim().toLowerCase();
        const existing = shopping.find(
            (item) => item.ingredient.name.trim().toLowerCase() === key
        );

        if (existing) {
            // Already on the list: make sure the amount covers what's missing
            shopping = shopping.map((item) =>
                item === existing
                    ? { ...item, quantity: Math.max(item.quantity, row.missing), checked: false }
                    : item
            );
        } else {
            shopping = [
                ...shopping,
                { ingredient: { ...row.ingredient }, quantity: row.missing, checked: false },
            ];
        }
    }

    shoppingStore.setData(shopping);
    return missing;
}
