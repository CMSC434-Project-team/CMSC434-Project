// Run check: node --check scripts/index.js

console.log("index.js loaded");

// CONSTANTS used for the index page
const container = document.querySelector(".container");
const inventoryList = document.getElementById("inventory-list");

const json = new JsonData("inventory");
// // CATEGORIES: Get unique categories (disabled for now)
// const categories = json.getData()
//     .map(item => item.ingredient?.category)
//     .filter(category => category);

const draftItemBlank = {
    name: "",
    ingredient: { name: "", category: "", unit: "" },
    stock: 0,
    low_stock_threshold: 0,
    tags: [],
    location: "",
    notes: "",
    expiration_date: "",
    last_updated: ""
};
// VARIABLES to hold the current state of the inventory list
let draftItem = draftItemBlank;
/** @type {Map<string, number>} */
let draftEdit = new Map();
let beforeEdit = null;

// ELEMENTS for Add Item Form Elements
const addItemButton = document.getElementById('add-item-button');
const itemForm = document.getElementById('add-item-form'); // No save-item-button cuz form submission
const discardItemButton = document.getElementById('discard-item-button');
const closeItemFormButton = document.getElementById('close-add-item-form');

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
addItemButton.addEventListener("click", () => {
    console.log("[Add] Add item form opened");
    container.setAttribute("data-mode", "add");
});

closeItemFormButton.addEventListener("click", () => {
    console.log("[Add] Add item form closed");
    container.setAttribute("data-mode", "normal");
    addItemButton.setAttribute("aria-expanded", "false");
    addItemButton.setAttribute("aria-label", "Add item");
});

discardItemButton.addEventListener("click", () => {
    console.log("[Add] Discard item form");
    container.setAttribute("data-mode", "normal");
    addItemButton.setAttribute("aria-expanded", "false");
    addItemButton.setAttribute("aria-label", "Add item");
});

itemForm.addEventListener("submit", event => {
    event.preventDefault(); // Prevent page refresh on form submission

    const formData = Object.fromEntries(new FormData(itemForm));
    console.log("[Add] Save item form", formData);
    container.setAttribute("data-mode", "normal");
    addItemButton.setAttribute("aria-expanded", "false");
    addItemButton.setAttribute("aria-label", "Add item");
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
    const sortedItems = json.getData()
        .filter(item => item.name.toLowerCase().includes(normalizedSearch))
        .sort((a, b) => {
            if (sortType === "name") return a.name.localeCompare(b.name);
            if (sortType === "expiration") {
                return (a.expiration ? new Date(a.expiration).getTime() : 0) -
                    (b.expiration ? new Date(b.expiration).getTime() : 0);
            }
            if (sortType === "stock") return a.stock - b.stock;
            return 0;
        });

    // Group items by category if true, otherwise put all items under "All"
    const categoryGroups = {};
    if (groupByCategory) {
        // Sort categories by category item with the minimum sortType
        sortedItems.forEach(item => {
            const category = item.ingredient?.category || "Uncategorized";
            if (!categoryGroups[category]) categoryGroups[category] = [];
            categoryGroups[category].push(item);
        });

        // // CATEGORIES: Initialize empty arrays for each category
        // categories.forEach(category => {
        //     categoryGroups[category] = sortedItems.filter(item => item.ingredient?.category === category);
        // });
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

        items.forEach(item => {
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

            if (sortType === "expiration" && item.expiration) {
                itemDetails.textContent = `Expires: ${new Date(item.expiration).toLocaleDateString()}`;
            } else if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach(tag => {
                    const tagSpan = document.createElement("span");
                    tagSpan.className = "item-tag";
                    tagSpan.textContent = tag;
                    itemDetails.appendChild(tagSpan);
                });
            }
            rowLi.appendChild(itemDetails);

            const controlsDiv = document.createElement("div");
            controlsDiv.className = "item-controls";

            const activeStock = draftEdit.has(item.name) ? draftEdit.get(item.name) : item.stock;
            const unit = item.ingredient?.unit || "";

            const minusBtn = document.createElement("button");
            minusBtn.type = "button";
            minusBtn.textContent = "-";
            minusBtn.className = "btn-minus";
            minusBtn.addEventListener("click", () => {
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
            plusBtn.addEventListener("click", () => {
                const currentStock = draftEdit.has(item.name) ? draftEdit.get(item.name) : item.stock;
                const newStock = currentStock + 1;
                stockDisplay.textContent = `${newStock} ${unit}`.trim();
                draftEdit.set(item.name, newStock);
            });
            controlsDiv.appendChild(plusBtn);

            rowLi.appendChild(controlsDiv);
            listContainer.appendChild(rowLi);
        });
    });

    inventoryList.appendChild(fragment);
}

// Initial render of the inventory list
renderInventoryList();
