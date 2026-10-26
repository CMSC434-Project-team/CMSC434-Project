// Global script for shared functionality across all scripts
// Run check: node --check scripts/_global.js

// VSCode already has a ts checking builtin so we can use JSDoc for type checking and intellisense
// @ts-check

console.log("_global.js loaded");

/**
 * @typedef {"gluten-free" | "dairy-free" | "nut-free" | "vegan" | "vegetarian" |
 * "pescatarian" | "kosher" | "halal" | "low-carb" | "low-fat" | "low-sodium" |
 * "high-protein" | "high-fiber" | "sugar-free" | "organic"} Tag
 */

/**
 * @typedef {Object} Ingredient
 * @property {string} name
 * @property {string} category
 * @property {string} unit
 */

/**
 * @typedef {Object} InventoryItem
 * @property {string} name
 * @property {Ingredient | null} ingredient
 * @property {number} stock
 * @property {number} low_stock_threshold
 * @property {string} location
 * @property {string} notes
 * @property {Date} expiration_date
 * @property {Date} last_updated
 * @property {Tag[]} tags
 */

/**
 * @typedef {Object} RecipeIngredient
 * @property {Ingredient} ingredient
 * @property {number} quantity
 */

/**
 * @typedef {Object} RecipeItem
 * @property {string} name
 * @property {number} time
 * @property {RecipeIngredient[]} ingredients
 * @property {string[]} steps
 */

/**
 * @typedef {Object} PeopleItem
 * @property {string} name
 * @property {Tag[]} restricted_tags
 */

/** @typedef {Ingredient[] | InventoryItem[] | RecipeItem[] | PeopleItem[]} DataSet */

export class JsonData {
    /**
     * Loads a JSON file and returns a ready-to-use JsonData instance.
     * The promise rejects if the file cannot be fetched or parsed.
     * @param {string} filename
     * @returns {Promise<JsonData>}
     */
    static async create(filename) {
        const jsonData = new JsonData(filename);
        await jsonData.ready;
        return jsonData;
    }

    /**
     * Creates an instance of JsonData for a given JSON file.
     * @param {string} filename
     *
     * @functions
     * - loadData(): Promise<DataSet> - Asynchronously loads the JSON data from the specified file.
     * - getData(): DataSet | null - Returns the loaded data or null if not yet loaded.
     * - saveData(downloadFile?: boolean): void - Saves the data to localStorage and optionally triggers a file download.
     */
    constructor(filename) {
        this.filename = filename;
        /** @type {DataSet | null} */
        this.data = null;

        /** @type {Promise<DataSet>} */
        this.ready = this.loadData();
    }

    /**
     * Returns the data or null if not yet loaded
     * @returns {DataSet | null}
     * */
    getData() {
        return this.data;
    }

    /**
     * Saves to localStorage or triggers a file download
     * @param {boolean} [downloadFile=false]
     * set to "true" ONLY IF you want to force a download of the JSON file.
     * Otherwise, just saves to localStorage.
     */
    saveData(downloadFile = false) {
        if (!this.data) {
            console.error("No data available to save.");
            return;
        }

        localStorage.setItem(this.filename, JSON.stringify(this.data, null, 2));

        if (downloadFile) {
            if (!this.data) {
                console.error("No data available to download.");
                return;
            }

            const jsonString = JSON.stringify(this.data, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = this.filename.endsWith(".json") ? this.filename : `${this.filename}.json`;

            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log(`Downloaded ${this.filename} successfully.`);
        }
    }

    /**
     * Correctly awaits and loads the JSON data
     * @returns {Promise<DataSet>}
     * */
    async loadData() {
        try {
            const response = await fetch(this.filename);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            if (!Array.isArray(this.data)) {
                throw new Error("Loaded data is not an array.");
            }
            return this.data;
        } catch (error) {
            console.error(`Failed to load JSON from ${this.filename}:`, error);
            throw error;
        }
    }
}
