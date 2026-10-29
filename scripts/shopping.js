// Run check: node --check scripts/shopping.js
let shoppingItems = [
    { id: 1, name: "Eggs", quantity: "1 dozen", checked: false },
    { id: 2, name: "Milk", quantity: "1 gallon", checked: false },
    { id: 3, name: "Flour", quantity: "5 lb", checked: false },
    { id: 4, name: "Butter", quantity: "2 sticks", checked: false },
];

let undo = [];
let redo = [];

const list = document.getElementById("shopping-list");
const clearBtn = document.getElementById("clear-checked");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");

function saveHistory() {
    undo.push(StructuredClone(shoppingItems));
    redoStack = [];
}




function toggleItem(id) {
    shoppingItems = shoppingItems.map((item) => item.id === id ? { ...item, checked: !item.checked } : item
    );
    renderList();
}

function clearCheck() {
    shoppingItems = shoppingItems.filter((item) => !item.checked);
    renderList();
}

function createItem(item) {
    const li = document.createElement("li");
    li.classList.toggle("checked", item.checked);

    const label = document.createElement("label");
    label.className = "item-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.checked;
    checkbox.addEventListener("change", () => toggleItem(item.id));

    const name = document.createElement("span");
    name.className = "item-name";
    name.textContent = item.name;

    const qty = document.createElement("span");
    qty.className = "quantity text-sm";
    qty.textContent = item.quantity;

    label.append(checkbox, name, qty);
    li.append(label);
    return li;
}

function renderList() {
    clearBtn.disabled = !shoppingItems.some((item) => item.checked);

    if (shoppingItems.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty-message";
        empty.textContent = "Your shopping list is empty";
        list.replaceChildren(empty);
        return;
    }
    list.replaceChildren(...shoppingItems.map(createItem));
}

clearBtn.addEventListener("click", clearCheck);
renderList();
