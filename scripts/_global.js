// Global script for shared functionality across all scripts
// Run check: node --check scripts/_global.js
// @ts-check

console.log("_global.js loaded");

/**
 * @typedef {"gluten-free"|"dairy-free"|"nut-free"|"vegan"|"vegetarian"|"pescatarian"|"kosher"|"halal"|"low-carb"|"low-fat"|"low-sodium"|"high-protein"|"high-fiber"|"sugar-free"|"organic"} Tag
 * 
 * @typedef {Object} Ingredient
 * @property {string} name
 * @property {string} category
 * @property {string} unit
 * 
 * @typedef {Object} InventoryItem
 * @property {string} name
 * @property {Ingredient | null} ingredient
 * @property {number} stock
 * @property {number} low_stock_threshold
 * @property {string} location
 * @property {string} notes
 * @property {string} expiration_date
 * @property {string} last_updated
 * @property {Tag[]} tags
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
 * @typedef {InventoryItem[] | RecipeItem[] | PeopleItem[]} DataSet
 * 
 * @typedef {Object} KitchenDataStore
 * @property {InventoryItem[]} inventory
 * @property {RecipeItem[]} recipes
 * @property {PeopleItem[]} people
 */

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
            console.log(`Loaded data from localStorage key "${this.storageKey}"`);
        } catch (error) {
            console.error(`Could not load data from localStorage key "${this.storageKey}":`, error);
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
            ingredient: { name: "Tomato", category: "Produce", unit: "each" },
            stock: 4,
            low_stock_threshold: 2,
            tags: ["vegan", "vegetarian", "organic"],
            location: "Fridge",
            notes: "Organic tomatoes",
            expiration_date: "2023-10-15",
            last_updated: "2023-10-01"
        },
        {
            name: "Brown rice",
            ingredient: { name: "Brown rice", category: "Grains", unit: "cup" },
            stock: 6,
            low_stock_threshold: 2,
            tags: ["gluten-free", "vegan", "vegetarian", "high-fiber"],
            location: "Pantry",
            notes: "",
            expiration_date: "2024-06-30",
            last_updated: "2023-10-01"
        },
        {
            name: "Black beans",
            ingredient: { name: "Black beans", category: "Canned goods", unit: "can" },
            stock: 1,
            low_stock_threshold: 2,
            tags: ["gluten-free", "vegan", "vegetarian", "high-protein"],
            location: "Pantry",
            notes: "Rinse before use",
            expiration_date: "2024-01-15",
            last_updated: "2023-10-01"
        }
    ],
    recipes: [
        {
            name: "Black Bean Rice Bowl",
            time: 25,
            ingredients: [
                { ingredient: { name: "Brown rice", category: "Grains", unit: "cup" }, quantity: 1 },
                { ingredient: { name: "Black beans", category: "Canned goods", unit: "can" }, quantity: 1 }
            ],
            steps: ["Cook the brown rice.", "Warm the black beans.", "Serve the beans over the rice."]
        },
        {
            name: "Tomato Rice",
            time: 20,
            ingredients: [
                { ingredient: { name: "Tomato", category: "Produce", unit: "each" }, quantity: 2 },
                { ingredient: { name: "Brown rice", category: "Grains", unit: "cup" }, quantity: 1 }
            ],
            steps: ["Cook the brown rice.", "Dice and sauté the tomatoes.", "Stir the tomatoes into the rice."]
        },
        {
            name: "Three Ingredient Salad",
            time: 10,
            ingredients: [
                { ingredient: { name: "Tomato", category: "Produce", unit: "each" }, quantity: 2 }
            ],
            steps: ["Dice tomatoes.", "Toss together in a bowl."]
        }
    ],
    people: []
};
