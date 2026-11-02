// Run check: node --check scripts/shopping.js
const shoppingStore = new JsonData("shopping");
let shoppingItems = shoppingStore.getData();

let undoStack = [];
let redoStack = [];

const list = document.getElementById("shopping-list");
const clearBtn = document.getElementById("clear-all");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const addBtn = document.getElementById("add-button");
const addForm = document.getElementById("add-form");
const nameInput = document.getElementById("new-name");
const qtyInput = document.getElementById("new-qty");
const unitInput = document.getElementById("new-unit");

// Replace the list, save it for other pages, and redraw
function update(newItems) {
    shoppingItems = newItems;
    shoppingStore.setData(shoppingItems);
    renderList();
}

// Save the current list before removing something
function saveHistory() {
    undoStack.push(shoppingItems);
    redoStack = [];
}

function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(shoppingItems);
    update(undoStack.pop());
}

function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(shoppingItems);
    update(redoStack.pop());
}

// Checkbox = "got it in the cart" (not undoable)
function toggleItem(index) {
    update(shoppingItems.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
    ));
}

// Click the item = delete it (undoable)
function deleteItem(index) {
    saveHistory();
    update(shoppingItems.filter((_, i) => i !== index));
}

// Empty the whole list (undoable)
function clearAll() {
    if (shoppingItems.length === 0) return;
    saveHistory();
    update([]);
}

// Add an item, or increase its quantity if it's already on the list
function addItem(name, quantity, unit) {
    const key = name.toLowerCase();
    const existing = shoppingItems.find(
        (item) => item.ingredient.name.trim().toLowerCase() === key
    );

    if (existing) {
        update(shoppingItems.map((item) =>
            item === existing ? { ...item, quantity: item.quantity + quantity } : item
        ));
    } else {
        update([
            ...shoppingItems,
            { ingredient: { name, category: "Other", unit }, quantity, checked: false },
        ]);
    }
}

function toggleAddForm() {
    const opening = addForm.hidden;
    addForm.hidden = !opening;
    addBtn.setAttribute("aria-expanded", String(opening));
    if (opening) nameInput.focus();
}

function createItem(item, index) {
    const li = document.createElement("li");
    li.classList.toggle("checked", item.checked);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.checked;
    checkbox.setAttribute("aria-label", `Got ${item.ingredient.name}`);
    checkbox.addEventListener("change", () => toggleItem(index));

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
    li.append(checkbox, itemBtn);
    return li;
}

function renderList() {
    clearBtn.disabled = shoppingItems.length === 0;
    undoBtn.disabled = undoStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;

    if (shoppingItems.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-message";
        empty.textContent = "Your shopping list is empty";
        list.replaceChildren(empty);
        return;
    }
    list.replaceChildren(...shoppingItems.map((item, i) => createItem(item, i)));
}

clearBtn.addEventListener("click", clearAll);
undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);
addBtn.addEventListener("click", toggleAddForm);

addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    const quantity = Number.isFinite(qtyInput.valueAsNumber) ? qtyInput.valueAsNumber : 1;
    const unit = unitInput.value.trim() || "each";
    addItem(name, quantity, unit);
    addForm.reset();
    nameInput.focus();
});

renderList();