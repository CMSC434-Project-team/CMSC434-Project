import * as shared from "./_global.js";
// Run check: node --check scripts/index.js

console.log("index.js loaded");

// CONSTANTS used for the index page
const json = await shared.JsonData.create("data/inventory.json");
const addItemButton = document.getElementById("add-item-button");

// Example usage 1:
// function modifyInventory(itemName, stockChange) {
//     const inventoryData = json.getData(); // Use getData() to retrieve the data from the JsonData instance
//     // If using function, MUST add check for null since typechecker doesn't know if the data is loaded yet.
//     // Technically, it is always safe if you called after create() and awaited the ready promise, but the typechecker doesn't know that.
//
//     if (!inventoryData) {
//         console.error("Inventory data not loaded.");
//         return;
//     }
// 
//     // Code START: Modify the inventory data =============================
//     const item = inventoryData.find(i => i.name === itemName);
//     if (item) {
//         const oldStock = item.stock;
//         item.stock += stockChange;
//         console.log(`Updated ${itemName} stock from ${oldStock} to ${item.stock}.`);
//     } else {
//         console.warn(`Item "${itemName}" not found in inventory.`);
//     }
//     // Code END: Modify the inventory data ===============================

//     json.saveData(); // Always add this line to save changes to localStorage
// }
// addItemButton.addEventListener("click", () => {
//     modifyInventory("Tomato", 1);
// });

// Example usage 2: use json.ready.then() to skip the null check
addItemButton.addEventListener("click", () => {
    const itemName = "Tomato"; // Replace with the actual item name you want to modify
    const stockChange = 1; // Change in stock (positive to add, negative to remove)

    json.ready.then((inventoryData) => {
        const item = inventoryData.find(i => i.name === itemName);
        if (item) {
            const oldStock = item.stock;
            item.stock += stockChange;
            console.log(`Updated ${itemName} stock from ${oldStock} to ${item.stock}.`);
        } else {
            console.warn(`Item "${itemName}" not found in inventory.`);
        }
        json.saveData(); // Always add this line to save changes to localStorage
    });
});
