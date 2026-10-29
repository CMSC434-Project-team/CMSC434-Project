// Run check: node --check scripts/index.js

console.log("index.js loaded");

// CONSTANTS used for the index page
const today = new Date();
const container = document.querySelector(".container");
const inventoryList = document.getElementById("inventory-list");

const json = new JsonData("inventory");

const draftItemBlank = {
    name: "",
    ingredient: { name: "", category: "", unit: "pcs" },
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
let lastEditItemKey = null;
let lastEditedDraft = null;

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

function updateDraftIndicator() {
    addItemButton.classList.toggle("has-draft", draftItem !== null);
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
    const itemToPopulate = lastEditedDraft || cloneInventoryItem(draftItemBlank);
    draftItem = cloneInventoryItem(itemToPopulate);
    editItemKey = lastEditedDraft ? lastEditItemKey : null;
    populateItemForm(itemToPopulate, editItemKey === null ? "add" : "edit");
    console.log("[Add] Add item form opened");
    container.setAttribute("data-mode", "add");
});

closeItemFormButton.addEventListener("click", () => {
    updateDraftFromForm();
    const baseline = editItemKey === null
        ? draftItemBlank
        : json.getData()[editItemKey];

    if (compareInventoryItems(draftItem, baseline)) {
        if (lastEditedDraft) {
            draftItem = cloneInventoryItem(lastEditedDraft);
            editItemKey = null;
        } else {
            draftItem = null;
            editItemKey = null;
            lastEditItemKey = null;
        }
    } else {
        lastEditItemKey = editItemKey;
        lastEditedDraft = cloneInventoryItem(draftItem);
        editItemKey = null;
    }
    updateDraftIndicator();
    console.log("[Add] Add item form closed");
    closeItemForm();
});

discardItemButton.addEventListener("click", () => {
    draftItem = null;
    editItemKey = null;
    lastEditItemKey = null;
    lastEditedDraft = null;
    updateDraftIndicator();
    console.log("[Add] Discard item form");
    closeItemForm();
});

itemForm.addEventListener("submit", event => {
    event.preventDefault(); // Prevent page refresh on form submission

    updateDraftFromForm();
    if (!itemForm.reportValidity()) return;

    // Check if the item name has changed and is unique
    const existingItemIndex = json.getData().findIndex(item => item.name === draftItem.name);
    if (existingItemIndex !== -1 && existingItemIndex !== editItemKey) {
        alert(`[Add] Item name "${draftItem.name}" is already in use`);
        return;
    }

    if (editItemKey === null) {
        json.getData().push(draftItem);
        console.log(`[Add] Added ${draftItem.name}`);
    } else {
        // Check if actual changes were made
        const originalItem = json.getData()[editItemKey];
        if (compareInventoryItems(originalItem, draftItem)) {
            console.log(`[Add] No changes made to ${draftItem.name}`);
            draftItem = null;
            editItemKey = null;
            lastEditItemKey = null;
            lastEditedDraft = null;
            updateDraftIndicator();
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
    lastEditItemKey = null;
    lastEditedDraft = null;
    updateDraftIndicator();
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

function updateInventoryEditMode(isEditMode) {
    container.setAttribute("data-mode", isEditMode ? "edit" : "normal");

    inventoryList.querySelectorAll(".inventory-item-row").forEach(row => {
        const inventoryIcon = row.querySelector(".inventory-icon");
        if (!(inventoryIcon instanceof HTMLElement)) return;

        if (!isEditMode) {
            inventoryIcon.textContent = "";
            inventoryIcon.style.color = "";
            return;
        }

        const itemName = row.dataset.itemName;
        const originalStock = Number(inventoryIcon.dataset.originalStock);
        const currentStock = draftEdit.has(itemName) ? draftEdit.get(itemName) : originalStock;
        const stockChange = currentStock - originalStock;
        inventoryIcon.textContent = stockChange === 0 ? "0" : stockChange > 0 ? `+${stockChange}` : stockChange;
        inventoryIcon.style.color = stockChange < 0 ? "var(--color-error)" : "var(--color-success)";
        inventoryIcon.setAttribute("aria-label", `${stockChange} change`);
    });
}

editButton.addEventListener("click", () => {
    draftEdit = new Map();
    updateInventoryEditMode(true);
    console.log("[Edit] Edit mode enabled");
});

discardEditButton.addEventListener("click", () => {
    discardDraftEdits();
    updateInventoryEditMode(false);
    console.log("[Edit] Discard edits");
});

saveEditButton.addEventListener("click", () => {
    saveDraftEdits();
    container.setAttribute("data-mode", "normal");
    refreshInventoryList();
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
function getInventoryGroup(item, sortType) {
    if (sortType === "name") {
        return item.ingredient?.category || "Uncategorized";
    }

    if (sortType === "expiration") {
        if (!item.expiration_date) return "Never";

        const expirationTime = new Date(item.expiration_date).getTime();
        if (Number.isNaN(expirationTime)) return "Never";
        const now = today.getTime();
        const day = 24 * 60 * 60 * 1000;
        if (expirationTime < now) return "Expired";
        if (expirationTime <= now + (2 * day)) return "Within 2 days";
        if (expirationTime <= now + (7 * day)) return "Within a week";
        if (expirationTime <= now + (30 * day)) return "Within a month";
        return "More than a month";
    }

    const stock = Number(item.stock) || 0;
    const threshold = Number(item.low_stock_threshold) || 0;
    if (stock <= 0) return "Out of stock";
    if (threshold <= 0) return "No limit / not set";
    if (stock < threshold) return "Low on stock";
    if (stock < threshold * 2) return "Maybe low on stock";
    return "Above low-stock range";
}

function renderInventoryList(search = "", groupByCategory = false, sortType = "name") {
    if (!inventoryList) return; // Safety check

    inventoryList.textContent = "";
    inventoryList.setAttribute("data-sort-type", sortType);
    const noStockList = document.getElementById("no-stock-list");
    if (noStockList) noStockList.textContent = "";

    // Filter for search
    const normalizedSearch = search.trim().toLowerCase();

    const rawData = json.getData();
    const sortedItems = rawData
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => {
            if (!item.name.toLowerCase().includes(normalizedSearch)) return false;
            return sortType === "stock" || Number(item.stock) > 0;
        })
        .sort((a, b) => {
            if (sortType === "name") return a.item.name.localeCompare(b.item.name);
            if (sortType === "expiration") {
                const dateA = a.item.expiration_date ? new Date(a.item.expiration_date).getTime() : Infinity;
                const dateB = b.item.expiration_date ? new Date(b.item.expiration_date).getTime() : Infinity;
                return dateA - dateB;
            }
            if (sortType === "stock") return a.item.stock - b.item.stock;
            return 0;
        });

    // Group by category, expiration window, or stock level based on the sort type.
    const categoryGroups = {};
    if (groupByCategory) {
        sortedItems.forEach(({ item, index }) => {
            const group = getInventoryGroup(item, sortType);
            if (!categoryGroups[group]) categoryGroups[group] = [];
            categoryGroups[group].push({ item, index });
        });
    } else if (sortedItems.length > 0) {
        categoryGroups["All"] = sortedItems;
    }

    // Render as fragment to minimize reflows and repaints
    const fragment = document.createDocumentFragment();
    Object.entries(categoryGroups).forEach(([category, items]) => {
        let listContainer = fragment;
        if (groupByCategory) {
            const categoryWrapper = document.createElement("details");
            categoryWrapper.className = "inventory-category";
            categoryWrapper.open = true;
            const categoryHeader = document.createElement("summary");
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
            rowLi.dataset.itemName = item.name;

            const activeStock = draftEdit.has(item.name) ? draftEdit.get(item.name) : item.stock;
            const unit = item.ingredient?.unit || "";

            const inventoryIcon = document.createElement("span");
            inventoryIcon.className = "inventory-icon";
            inventoryIcon.dataset.originalStock = item.stock;
            const updateInventoryIcon = stock => {
                const stockChange = stock - item.stock;
                const isNegative = stockChange < 0;
                inventoryIcon.style.color = isNegative ? "var(--color-error)" : "var(--color-success)";
                inventoryIcon.textContent = stockChange === 0 ? "0" : isNegative ? stockChange : `+${stockChange}`;
                inventoryIcon.setAttribute("aria-label", `${stockChange} ${unit} change`.trim());
            };
            if (container.getAttribute("data-mode") === "edit") {
                updateInventoryIcon(activeStock);
            }
            rowLi.appendChild(inventoryIcon);

            // Name Element
            const itemName = document.createElement("h3");
            itemName.className = "item-name";
            itemName.textContent = item.name;
            rowLi.appendChild(itemName);

            // Details Element (Tags or Expiration)
            const itemDetails = document.createElement("div");
            itemDetails.className = "item-details";
            if (sortType === "stock") {
                if (item.location) {
                    itemDetails.textContent = `Location: ${item.location}`;
                } else {
                    itemDetails.textContent = "No location";
                    itemDetails.style.color = "var(--color-text-muted)";
                    itemDetails.style.fontStyle = "italic";
                }
            } else if (sortType === "expiration") {
                if (item.expiration_date) {
                    const expirationDate = new Date(item.expiration_date);
                    itemDetails.textContent = `Expires: ${expirationDate.toLocaleDateString()}`;
                    if (expirationDate < today) {
                        itemDetails.style.color = "var(--color-error)";
                        itemDetails.style.fontWeight = "bold";
                    }
                } else {
                    itemDetails.textContent = "No expiration date";
                    itemDetails.style.color = "var(--color-text-muted)";
                    itemDetails.style.fontStyle = "italic";
                }
            } else if (item.tags && Array.isArray(item.tags)) {
                if (item.notes && item.notes.length > 0) {
                    itemDetails.textContent = `Notes: ${item.notes}`;
                } else if (item.tags && item.tags.length > 0) {
                    itemDetails.textContent = `Tags: ${item.tags.join(", ")}`;
                } else {
                    itemDetails.textContent = "No tags or notes";
                    itemDetails.style.color = "var(--color-text-muted)";
                    itemDetails.style.fontStyle = "italic";
                }
            }
            rowLi.appendChild(itemDetails);

            // Controls Element (Stock and +/- buttons)
            const controlsDiv = document.createElement("div");
            controlsDiv.className = "item-controls";

            const minusBtn = document.createElement("button");
            minusBtn.type = "button";
            minusBtn.textContent = "-";
            minusBtn.className = "btn-minus error";
            minusBtn.addEventListener("click", event => {
                event.stopPropagation();
                const currentStock = draftEdit.has(item.name) ? draftEdit.get(item.name) : item.stock;
                const newStock = Math.max(0, currentStock - 1);
                stockDisplay.textContent = `${newStock} ${unit}`.trim();
                updateInventoryIcon(newStock);
                draftEdit.set(item.name, newStock);
            });

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
                updateInventoryIcon(newStock);
                draftEdit.set(item.name, newStock);
            });

            const stockButtons = document.createElement("div");
            stockButtons.className = "stock-buttons";
            stockButtons.append(minusBtn, plusBtn);
            controlsDiv.appendChild(stockButtons);

            rowLi.appendChild(controlsDiv);

            // EXTRA: Click on row to edit item (only in normal mode)
            rowLi.addEventListener("click", () => {
                if (container.getAttribute("data-mode") !== "normal") return;
                editItemKey = index;
                const shouldRestoreDraft = lastEditedDraft && editItemKey === lastEditItemKey;
                if (shouldRestoreDraft) {
                    draftItem = cloneInventoryItem(lastEditedDraft);
                }
                const itemToPopulate = shouldRestoreDraft ? draftItem : item;
                populateItemForm(itemToPopulate, "edit");
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
