import * as shared from "./_global.js";
// Run check: node --check scripts/index.js

console.log("index.js loaded");

// CONSTANTS used for the index page
const json = await shared.JsonData.create("data/inventory.json");
const container = document.querySelector(".container");
const inventoryList = document.getElementById("inventory-list");

// BUTTONS
const addItemButton = document.getElementById("add-item-button");
const editButton = document.getElementById("edit-button");

// Functions and event listeners for the buttons
addItemButton.addEventListener("click", () => {
    const isOpen = container.classList.toggle("form-open");
    addItemButton.setAttribute("aria-expanded", String(isOpen));
    addItemButton.setAttribute("aria-label", isOpen ? "Close add item form" : "Add item");
});

editButton.addEventListener("click", () => {
    // Logic to edit an existing item
    console.log("Edit button clicked");
    console.log("Current inventory data:\n", json.getData());
});

// Function to render the inventory list
function renderInventoryList() {
    const items = json.getData() || [];
    inventoryList.innerHTML = ""; // Clear existing list

    items.forEach(item => {
        const listItem = document.createElement("li");
        listItem.textContent = `${item.name} - ${item.stock} ${item.ingredient ? item.ingredient.unit : ""}`;
        inventoryList.appendChild(listItem);
    });
}

// Initial render of the inventory list
renderInventoryList();