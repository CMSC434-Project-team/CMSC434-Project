// Run check: node --check scripts/index.js

console.log("index.js loaded");

// CONSTANTS used for the index page
const container = document.querySelector(".container");
const inventoryList = document.getElementById("inventory-list");

const json = new JsonData("inventory");

const draftItemBlank = {
    name: "",
    ingredient: { name: "", category: "", unit: "" },
    shopping_list: false,
    stock: 0,
    low_stock_threshold: 0,
    tags: [],
    location: "",
    notes: "",
    expiration_date: "",
    last_updated: ""
};
// VARIABLES to hold the current state of the inventory list
let draftItem = null;
let editItemKey = null;

/** @type {Map<string, number>} */
let draftEdit = new Map();

// ELEMENTS for Add Item Form Elements
const addItemButton = document.getElementById('add-item-button');
const itemForm = document.getElementById('add-item-form'); // No save-item-button cuz form submission
const discardItemButton = document.getElementById('discard-item-button');
const closeItemFormButton = document.getElementById('close-add-item-form');
const itemFormTitle = document.getElementById('item-form-title');
const itemNameInput = document.getElementById('item-name');
const itemQuantityInput = document.getElementById('item-quantity');
const itemUnitInput = document.getElementById('item-unit');
const itemExpirationInput = document.getElementById('item-expiration');
const itemLowStockInput = document.getElementById('item-low-stock');
const itemLocationInput = document.getElementById('item-location');
const itemTagsInput = document.getElementById('item-tags');
const itemNotesInput = document.getElementById('item-notes');

// ELEMENTS for Quick Edit Mode
const editButton = document.getElementById('edit-button');
const saveEditButton = document.getElementById('save-edit-button');
const discardEditButton = document.getElementById('discard-edit-button');

// ELEMENTS for Search & Sort
const searchInput = document.getElementById('inventory-search');
const categoriesButton = document.getElementById('inventory-grouped-categories');
const sortDirectionButton = document.getElementById('inventory-sort-direction');
const sortTypeSelect = document.getElementById('inventory-sort-type');

// Add Item Form Logic ================================================================
function cloneInventoryItem(item) {
    return JSON.parse(JSON.stringify(item));
}

function setFormValue(input, value) {
    input.value = value === undefined || value === null ? "" : String(value);
}

function populateItemForm(item, mode) {
    draftItem = cloneInventoryItem(item);
    itemFormTitle.textContent = mode === "edit" ? "Edit item" : "Add item";
    setFormValue(itemNameInput, draftItem.name);
    setFormValue(itemQuantityInput, draftItem.stock);
    setFormValue(itemUnitInput, draftItem.ingredient?.unit || "pcs");
    setFormValue(itemExpirationInput, draftItem.expiration_date);
    setFormValue(itemLowStockInput, draftItem.low_stock_threshold);
    setFormValue(itemLocationInput, draftItem.location);
    setFormValue(itemTagsInput, Array.isArray(draftItem.tags) ? draftItem.tags.join(", ") : "");
    setFormValue(itemNotesInput, draftItem.notes);
}

function closeItemForm() {
    container.setAttribute("data-mode", "normal");
    addItemButton.setAttribute("aria-expanded", "false");
    addItemButton.setAttribute("aria-label", "Add item");
}

function updateDraftFromForm() {
    if (!draftItem) draftItem = cloneInventoryItem(draftItemBlank);

    draftItem.name = itemNameInput.value.trim();
    draftItem.ingredient = {
        ...(draftItem.ingredient || {}),
        name: draftItem.name,
        unit: itemUnitInput.value
    };
    draftItem.stock = Number(itemQuantityInput.value || 0);
    draftItem.expiration_date = itemExpirationInput.value;
    draftItem.low_stock_threshold = Number(itemLowStockInput.value || 0);
    draftItem.location = itemLocationInput.value.trim();
    draftItem.tags = itemTagsInput.value.split(",").map(tag => tag.trim()).filter(Boolean);
    draftItem.notes = itemNotesInput.value.trim();
    draftItem.last_updated = new Date().toISOString();
}

function compareInventoryItems(item1, item2) {
    const comparableItem = item => ({
        name: item.name,
        ingredient: item.ingredient,
        shopping_list: item.shopping_list,
        stock: item.stock,
        low_stock_threshold: item.low_stock_threshold,
        tags: item.tags,
        location: item.location,
        notes: item.notes,
        expiration_date: item.expiration_date
    });

    return JSON.stringify(comparableItem(item1)) === JSON.stringify(comparableItem(item2));
}

addItemButton.addEventListener("click", () => {
    const itemToPopulate = draftItem || cloneInventoryItem(draftItemBlank);
    editItemKey = null;
    populateItemForm(itemToPopulate, "add");
    console.log("[Add] Add item form opened");
    container.setAttribute("data-mode", "add");
});

closeItemFormButton.addEventListener("click", () => {
    updateDraftFromForm();
    console.log("[Add] Add item form closed");
    closeItemForm();
});

discardItemButton.addEventListener("click", () => {
    draftItem = null;
    editItemKey = null;
    console.log("[Add] Discard item form");
    closeItemForm();
});

itemForm.addEventListener("submit", event => {
    event.preventDefault(); // Prevent page refresh on form submission

    updateDraftFromForm();
    if (!itemForm.reportValidity()) return;

    if (editItemKey === null) {
        json.getData().push(draftItem);
        console.log(`[Add] Added ${draftItem.name}`);
    } else {
        // Check if the item name has changed and is unique
        const existingItemIndex = json.getData().findIndex(item => item.name === draftItem.name);
        if (existingItemIndex !== -1 && existingItemIndex !== editItemKey) {
            alert(`[Add] Item name "${draftItem.name}" is already in use`);
            return;
        }
        // Check if actual changes were made
        const originalItem = json.getData()[editItemKey];
        if (compareInventoryItems(originalItem, draftItem)) {
            console.log(`[Add] No changes made to ${draftItem.name}`);
            draftItem = null;
            editItemKey = null;
            closeItemForm();
            return;
        } else {
            // Update the existing item
            const item = json.getData()[editItemKey];
            Object.assign(item, draftItem);
            console.log(`[Add] Updated ${draftItem.name}`);
        }
    }

    json.saveData();
    draftItem = null;
    editItemKey = null;
    closeItemForm();
    refreshInventoryList();
});

// Quick Edit Button Logic ============================================================
function discardDraftEdits() {
    draftEdit.clear();
    console.log("[Edit] Discard draft edits");
}

function saveDraftEdits() {
    json.data.forEach(item => {
        if (draftEdit.has(item.name)) {
            item.stock = draftEdit.get(item.name);
        }
    });
}

editButton.addEventListener("click", () => {
    draftEdit = new Map();
    container.setAttribute("data-mode", "edit");
    console.log("[Edit] Edit mode enabled");
});

discardEditButton.addEventListener("click", () => {
    discardDraftEdits();
    container.setAttribute("data-mode", "normal");
    console.log("[Edit] Discard edits");
});

saveEditButton.addEventListener("click", () => {
    saveDraftEdits();
    container.setAttribute("data-mode", "normal");
    renderInventoryList();
    json.saveData();
    console.log("[Edit] Save edits");
});

// Search & Sort Logic ================================================================
function refreshInventoryList() {
    if (!inventoryList) return;

    const searchVal = searchInput ? searchInput.value : "";
    const groupByCategory = categoriesButton ? categoriesButton.checked : false;

    const selectedSortRadio = sortTypeSelect ? sortTypeSelect.querySelector('input[type="radio"]:checked') : null;
    const sortType = selectedSortRadio ? selectedSortRadio.value : "name";

    renderInventoryList(searchVal, groupByCategory, sortType);
}

searchInput.addEventListener("input", (() => {
    let timeoutId;
    return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            refreshInventoryList();
        }, 200); // 200ms delay
    };
})());

categoriesButton.addEventListener("change", () => {
    console.log(`[Filter] Categories: ${categoriesButton.checked ? "group" : "ungroup"}`);
    refreshInventoryList();
});

sortDirectionButton.addEventListener("change", () => {
    // default: ascending
    // unchecked = ascending, checked = descending
    const inventoryList = document.getElementById("inventory-list");
    const direction = sortDirectionButton.checked ? "descending" : "ascending";
    console.log(`[Filter] Direction: ${direction}`);

    if (inventoryList) {
        inventoryList.setAttribute("data-sort-direction", direction);
    }
});

sortTypeSelect.addEventListener("change", () => {
    const selectedSort = sortTypeSelect.querySelector('input[type="radio"]:checked');
    if (!(selectedSort instanceof HTMLInputElement)) return;

    console.log(`[Filter] Type: ${selectedSort.value}`);
    refreshInventoryList();
});

// Render Inventory List ==============================================================
function renderInventoryList(search = "", groupByCategory = false, sortType = "name") {
    if (!inventoryList) return; // Safety check

    inventoryList.textContent = "";

    // Filter for search
    const normalizedSearch = search.trim().toLowerCase();

    const rawData = json.getData();
    const sortedItems = rawData
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.name.toLowerCase().includes(normalizedSearch))
        .sort((a, b) => {
            if (sortType === "name") return a.item.name.localeCompare(b.item.name);
            if (sortType === "expiration") {
                const dateA = a.item.expiration_date ? new Date(a.item.expiration_date).getTime() : 0;
                const dateB = b.item.expiration_date ? new Date(b.item.expiration_date).getTime() : 0;
                return dateA - dateB;
            }
            if (sortType === "stock") return a.item.stock - b.item.stock;
            return 0;
        });

    // Group items by category if true, otherwise put all items under "All"
    const categoryGroups = {};
    if (groupByCategory) {
        sortedItems.forEach(({ item, index }) => {
            const category = item.ingredient?.category || "Uncategorized";
            if (!categoryGroups[category]) categoryGroups[category] = [];
            categoryGroups[category].push({ item, index });
        });
    } else if (sortedItems.length > 0) {
        categoryGroups["All"] = sortedItems;
    }

    // Render as fragment to minimize reflows and repaints
    const fragment = document.createDocumentFragment();
    Object.entries(categoryGroups).forEach(([category, items]) => {
        let listContainer = fragment;
        if (groupByCategory) {
            const categoryWrapper = document.createElement("div");
            categoryWrapper.className = "inventory-category";
            const categoryHeader = document.createElement("h2");
            categoryHeader.textContent = category;
            categoryWrapper.appendChild(categoryHeader);
            const nestedUl = document.createElement("ul");
            categoryWrapper.appendChild(nestedUl);
            fragment.appendChild(categoryWrapper);
            listContainer = nestedUl;
        }

        items.forEach(({ item, index }) => {
            const rowLi = document.createElement("li");
            rowLi.className = "inventory-item-row";

            // Name Element
            const itemName = document.createElement("h3");
            itemName.className = "item-name";
            itemName.textContent = item.name;
            rowLi.appendChild(itemName);

            // Details Element (Tags or Expiration)
            const itemDetails = document.createElement("div");
            itemDetails.className = "item-details";
            if (sortType === "expiration" && item.expiration_date) {
                itemDetails.textContent = `Expires: ${new Date(item.expiration_date).toLocaleDateString()}`;
            } else if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach(tag => {
                    const tagSpan = document.createElement("span");
                    tagSpan.className = "item-tag";
                    tagSpan.textContent = tag;
                    itemDetails.appendChild(tagSpan);
                });
            }
            rowLi.appendChild(itemDetails);

            // Controls Element (Stock and +/- buttons)
            const controlsDiv = document.createElement("div");
            controlsDiv.className = "item-controls";
            const activeStock = draftEdit.has(item.name) ? draftEdit.get(item.name) : item.stock;
            const unit = item.ingredient?.unit || "";

            const minusBtn = document.createElement("button");
            minusBtn.type = "button";
            minusBtn.textContent = "-";
            minusBtn.className = "btn-minus";
            minusBtn.addEventListener("click", event => {
                event.stopPropagation();
                const currentStock = draftEdit.has(item.name) ? draftEdit.get(item.name) : item.stock;
                const newStock = Math.max(0, currentStock - 1);
                stockDisplay.textContent = `${newStock} ${unit}`.trim();
                draftEdit.set(item.name, newStock);
            });
            controlsDiv.appendChild(minusBtn);

            const stockDisplay = document.createElement("span");
            stockDisplay.className = "item-stock";
            stockDisplay.textContent = `${activeStock} ${unit}`.trim();
            controlsDiv.appendChild(stockDisplay);

            const plusBtn = document.createElement("button");
            plusBtn.type = "button";
            plusBtn.textContent = "+";
            plusBtn.className = "btn-plus";
            plusBtn.addEventListener("click", event => {
                event.stopPropagation();
                const currentStock = draftEdit.has(item.name) ? draftEdit.get(item.name) : item.stock;
                const newStock = currentStock + 1;
                stockDisplay.textContent = `${newStock} ${unit}`.trim();
                draftEdit.set(item.name, newStock);
            });
            controlsDiv.appendChild(plusBtn);

            rowLi.appendChild(controlsDiv);

            // EXTRA: Click on row to edit item (only in normal mode)
            rowLi.addEventListener("click", () => {
                if (container.getAttribute("data-mode") !== "normal") return;
                editItemKey = index;
                populateItemForm(item, "edit");
                container.setAttribute("data-mode", "add");
                console.log(`[Normal] Editing ${item.name}`);
            });

            listContainer.appendChild(rowLi);
        });
    });

    inventoryList.appendChild(fragment);
}

// Initial render of the inventory list
renderInventoryList();
