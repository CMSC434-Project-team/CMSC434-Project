// Run check: node --check scripts/shopping.js
const shoppingStore = new JsonData("shopping");
const inventoryStore = new JsonData("inventory");
let shoppingItems = shoppingStore.getData();
const container = document.querySelector(".container");
let undoStack = [];
let redoStack = [];

const list = document.getElementById("shopping-list");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const editHistory = document.getElementById("edit-history");
const addBtn = document.getElementById("add-button");
const addForm = document.getElementById("add-form");
const nameInput = document.getElementById("new-name");
const qtyInput = document.getElementById("new-qty");
const unitInput = document.getElementById("new-unit");
const editButton = document.getElementById("edit-button");
const saveEditButton = document.getElementById("save-edit-button");

function normalizeUnit(value) {
    return ({
        unit: "each", each: "each", piece: "each", pieces: "each", pcs: "each",
        units: "each", cups: "cup", cans: "can"
    }[String(value || "").trim().toLowerCase()] || String(value || "").trim().toLowerCase());
}

function autofillUnitFromInventory() {
    const name = nameInput.value.trim().toLowerCase();
    const item = inventoryStore.getData().find(inventoryItem =>
        inventoryItem.name?.trim().toLowerCase() === name ||
        inventoryItem.ingredient?.name?.trim().toLowerCase() === name
    );
    if (!item) return;

    nameInput.value = item.ingredient?.name || item.name;
    const unit = item.ingredient?.unit || "unit";
    if (![...unitInput.options].some(option => option.value === unit)) {
        unitInput.add(new Option(unit, unit));
    }
    unitInput.value = unit;
}

// Replace the list, save it for other pages, and redraw
function update(newItems) {
    shoppingItems = newItems;
    shoppingStore.data = shoppingItems;
    shoppingStore.saveData();
    renderList();
}

function saveHistory() {
    undoStack.push(JSON.parse(JSON.stringify(shoppingItems)));
    redoStack = [];
}

function undo() {
    if (container.dataset.mode !== "edit" || undoStack.length === 0) return;
    redoStack.push(JSON.parse(JSON.stringify(shoppingItems)));
    update(undoStack.pop());
}

function redo() {
    if (container.dataset.mode !== "edit" || redoStack.length === 0) return;
    undoStack.push(JSON.parse(JSON.stringify(shoppingItems)));
    update(redoStack.pop());
}

// Checkbox = "got it in the cart"
function toggleItem(index) {
    const item = shoppingItems[index];
    if (!item) return;

    const inventory = inventoryStore.getData();
    const matchingInventory = inventory.find(inventoryItem =>
        (inventoryItem.name?.trim().toLowerCase() === item.ingredient.name.trim().toLowerCase() ||
            inventoryItem.ingredient?.name?.trim().toLowerCase() === item.ingredient.name.trim().toLowerCase()) &&
        normalizeUnit(inventoryItem.ingredient?.unit) === normalizeUnit(item.ingredient.unit)
    );

    if (item.checked) {
        if (!matchingInventory) {
            console.error(`Cannot remove "${item.ingredient.name}" from inventory: matching item not found.`);
        } else {
            matchingInventory.stock = Math.max(0,
                (Number(matchingInventory.stock) || 0) - (Number(item.quantity) || 0));
            matchingInventory.last_updated = new Date().toISOString();
            inventoryStore.data = inventory;
            inventoryStore.saveData();
        }
        update(shoppingItems.map((shoppingItem, i) =>
            i === index ? { ...shoppingItem, checked: !shoppingItem.checked } : shoppingItem
        ));
        return;
    }

    // Add a week to the expiration date if it exists, otherwise leave it blank
    const defaultExpiration = matchingInventory?.expiration_date
        ? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
        : "";
    const expirationDate = prompt(
        `Expiration date for ${item.ingredient.name} (YYYY-MM-DD). Leave blank for no expiration:`,
        defaultExpiration
    );
    if (expirationDate === null) return;
    if (expirationDate && !isValidExpirationDate(expirationDate)) {
        alert("Enter today's date or a future date, or leave it blank.");
        return;
    }

    if (matchingInventory) {
        matchingInventory.stock = (Number(matchingInventory.stock) || 0) + (Number(item.quantity) || 0);
        matchingInventory.expiration_date = expirationDate;
        matchingInventory.last_updated = new Date().toISOString();
    } else {
        inventory.push({
            name: item.ingredient.name,
            ingredient: { ...item.ingredient },
            stock: item.quantity,
            low_stock_threshold: 0,
            tags: [],
            location: "",
            notes: "",
            expiration_date: expirationDate,
            last_updated: new Date().toISOString()
        });
    }

    function isValidExpirationDate(value) {
        const date = new Date(`${value}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
            !Number.isNaN(date.getTime()) && date >= today;
    }
    inventoryStore.data = inventory;
    inventoryStore.saveData();

    update(shoppingItems.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
    ));
}

// Click the item = delete it
function deleteItem(index) {
    if (container.dataset.mode !== "edit") return;
    saveHistory();
    update(shoppingItems.filter((_, i) => i !== index));
}

// Add an item, or increase its quantity if it's already on the list
function addItem(name, quantity, unit) {
    const key = name.toLowerCase();
    const normalizedUnit = normalizeUnit(unit);
    const existing = shoppingItems.find(
        (item) => item.ingredient.name.trim().toLowerCase() === key &&
            normalizeUnit(item.ingredient.unit) === normalizedUnit
    );

    if (existing) {
        update(shoppingItems.map((item) =>
            item === existing
                ? { ...item, quantity: (Number(item.quantity) || 0) + quantity }
                : item
        ));
    } else {
        update([
            ...shoppingItems,
            { ingredient: { name, unit }, quantity, checked: false },
        ]);
    }
}

function toggleAddForm() {
    const opening = addForm.hidden;
    addForm.hidden = !opening;
    addBtn.setAttribute("aria-expanded", String(opening));
    if (opening) nameInput.focus();
}

function setEditMode(enabled) {
    container.dataset.mode = enabled ? "edit" : "normal";
    editButton.classList.toggle("hidden", enabled);
    saveEditButton.classList.toggle("hidden", !enabled);
    editHistory.classList.toggle("hidden", !enabled);
    if (!enabled) {
        undoStack = [];
        redoStack = [];
    }
    renderList();
    editButton.setAttribute("aria-pressed", String(enabled));
    saveEditButton.setAttribute("aria-pressed", String(enabled));
}

function createItem(item, index) {
    const li = document.createElement("li");
    li.classList.toggle("checked", item.checked);

    const checkbox = document.createElement("input");
    checkbox.id = `item-${index}`;
    checkbox.type = "checkbox";
    checkbox.checked = item.checked;
    checkbox.setAttribute("aria-label", `Got ${item.ingredient.name}`);
    checkbox.addEventListener("change", () => toggleItem(index));

    const label = document.createElement("label");
    label.setAttribute("for", `item-${index}`);

    const itemBtn = document.createElement("button");
    itemBtn.className = "item-button";
    itemBtn.setAttribute("aria-label", `Delete ${item.ingredient.name}`);
    itemBtn.addEventListener("click", () => deleteItem(index));

    const name = document.createElement("span");
    name.className = "item-name";
    name.textContent = item.ingredient.name;

    const qty = document.createElement("span");
    qty.className = "quantity text-sm";
    qty.textContent = `${item.quantity} ${item.ingredient.unit}`;

    itemBtn.append(name, qty);
    li.append(checkbox, label, itemBtn);
    return li;
}

function renderList() {
    undoBtn.disabled = container.dataset.mode !== "edit" || undoStack.length === 0;
    redoBtn.disabled = container.dataset.mode !== "edit" || redoStack.length === 0;
    if (shoppingItems.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-message";
        empty.textContent = "Your shopping list is empty";
        list.replaceChildren(empty);
        return;
    }
    list.replaceChildren(...shoppingItems.map((item, i) => createItem(item, i)));
}

addBtn.addEventListener("click", toggleAddForm);
editButton.addEventListener("click", () => {
    setEditMode(true);
});
saveEditButton.addEventListener("click", () => {
    setEditMode(false);
});
undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);
nameInput.addEventListener("change", autofillUnitFromInventory);
nameInput.addEventListener("blur", autofillUnitFromInventory);

addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    const quantity = Number(qtyInput.value);
    if (!Number.isFinite(quantity) || quantity <= 0) {
        qtyInput.setCustomValidity("Enter a quantity greater than zero.");
        qtyInput.reportValidity();
        return;
    }
    qtyInput.setCustomValidity("");
    const unit = unitInput.value.trim() || "unit";
    addItem(name, quantity, unit);
    addForm.reset();
    nameInput.focus();
});

window.addEventListener("pageshow", renderList);
window.addEventListener("storage", renderList);
renderList();