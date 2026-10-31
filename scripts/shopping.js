// Run check: node --check scripts/shopping.js
let shoppingItems = [
    { id: 1, name: "Eggs", quantity: "1 dozen", checked: false },
    { id: 2, name: "Milk", quantity: "1 gallon", checked: false },
    { id: 3, name: "Flour", quantity: "5 lb", checked: false },
    { id: 4, name: "Butter", quantity: "2 sticks", checked: false },
];

let undoStack = [];
let redoStack = [];

const list = document.getElementById("shopping-list");
const clearBtn = document.getElementById("clear-all");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const addBtn = document.getElementById("add-button");
const addForm = document.getElementById("new-name");
const addQty = document.getElementById("new-qty");


// save current list before removing an item
function saveHistory() {
    undoStack.push(shoppingItems);
    redoStack = [];
}

function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(shoppingItems);
    shoppingItems = undoStack.pop();
    renderList();
}

function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(shoppingItems);
    shoppingItems = redoStack.pop();
    renderList();
}


function toggleItem(id) {
    shoppingItems = shoppingItems.map((item) => item.id === id ? { ...item, checked: !item.checked } : item
    );
    renderList();
}

function deleteItem(id) {
    saveHistory();
    shoppingItems = shoppingItems.filter((item) => item.id != id);
    renderList();
}

function clearAll() {
    if (shoppingItems.length === 0) return;
    saveHistory();
    shoppingItems = [];
    renderList();
}

function createItem(item) {
    const li = document.createElement("li");
    li.classList.toggle("checked", item.checked);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.checked;
    checkbox.setAttribute("aria-label", `Got ${item.name}`);
    checkbox.addEventListener("change", () => toggleItem(item.id));

    const itemBtn = document.createElement("button");
    itemBtn.className = "item-button";
    itemBtn.setAttribute("aria-label", `Delete ${item.name}`);
    itemBtn.addEventListener("click", () => deleteItem(item.id));

    const name = document.createElement("span");
    name.className = "item-name";
    name.textContent = item.name;

    const qty = document.createElement("span");
    qty.className = "quantity text-sm";
    qty.textContent = item.quantity;

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
    list.replaceChildren(...shoppingItems.map(createItem));
}

clearBtn.addEventListener("click", clearAll);
undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

renderList();
