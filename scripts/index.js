import * as shared from "./_global.js";
// Run check: node --check scripts/index.js

console.log("index.js loaded");

// CONSTANTS used for the index page
const json = await shared.JsonData.create("data/inventory.json");
const container = document.querySelector(".container");
const inventoryList = document.getElementById("inventory-list");

// VARIABLES to hold the current state of the inventory list
let draftItem = null;
let draftEdit = null;
let itemBeingEdited = null;
let sortType = "name";   /** @type {"name" | "expiration" | "stock"} */

// ELEMENTS for Search & Sort
const searchInput = document.getElementById('inventory-search');
const categoriesButton = document.getElementById('inventory-grouped-categories');
const sortDirectionButton = document.getElementById('inventory-sort-direction');
const sortTypeSelect = document.getElementById('inventory-sort-type');

// ELEMENTS for Add Item Form Elements
const addItemButton = document.getElementById('add-item-button');
const itemForm = document.getElementById('add-item-form'); // No save-item-button cuz form submission
const discardItemButton = document.getElementById('discard-item-button');
const closeItemFormButton = document.getElementById('close-add-item-form');

// ELEMENTS for Quick Edit Mode
const editButton = document.getElementById('edit-button');
const saveEditButton = document.getElementById('save-edit-button');
const discardEditButton = document.getElementById('discard-edit-button');

// Search & Sort Logic ================================================================
searchInput.addEventListener("input", event => {
	console.log(`Search: ${event.target.value}`);
});

categoriesButton.addEventListener("change", () => {
	console.log(`[Filter] Categories: ${categoriesButton.checked ? "ungroup" : "group"}`);
});

sortDirectionButton.addEventListener("change", () => {
	console.log(`[Filter] Direction: ${sortDirectionButton.checked ? "descending" : "ascending"}`);
});

sortTypeSelect.addEventListener("change", () => {
	const selectedSort = sortTypeSelect.querySelector('input[type="radio"]:checked');
	if (!(selectedSort instanceof HTMLInputElement)) return;

	console.log(`[Filter] Type: ${selectedSort.value}`);
});

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
editButton.addEventListener("click", () => {
	// temporarily save add and minus data
	/** @type {[string, number][]} */
	draftEdit = []
	container.setAttribute("data-mode", "edit");
	console.log("[Edit] Edit mode enabled");
});

discardEditButton.addEventListener("click", () => {
	draftEdit = null;
	container.setAttribute("data-mode", "normal");
	console.log("[Edit] Discard edits");
});

saveEditButton.addEventListener("click", () => {
	container.setAttribute("data-mode", "normal");
	console.log("[Edit] Save edits");
});

// Render Inventory List ==============================================================
function renderInventoryList() {
	const items = json.getData() || [];
	inventoryList.innerHTML = ""; // Clear existing list

	items.forEach(item => {
		// Main container row
		const rowDiv = document.createElement("li");
		rowDiv.className = "inventory-item-row";

		// Name
		const itemName = document.createElement("h3");
		itemName.className = "item-name";
		itemName.textContent = item.name;

		// Details
		const itemDetails = document.createElement("div");
		itemDetails.className = "item-details";
		if (sortType === "expiration" && item.expiration) {
			const expirationDate = new Date(item.expiration);
			itemDetails.textContent = `Expires: ${expirationDate.toLocaleDateString()}`;
		} else {
			for (const tag of item.tags) {
				const tagSpan = document.createElement("span");
				tagSpan.textContent = tag;
				itemDetails.appendChild(tagSpan);
			}
		}

		// Controls container
		const controlsDiv = document.createElement("div");
		controlsDiv.className = "item-controls";

		// Minus button
		const minusBtn = document.createElement("button");
		minusBtn.textContent = "-";
		minusBtn.className = "btn-minus";
		minusBtn.onclick = () => {
			console.log(`Decrease stock for ${item.name}`);
		};

		// Stock display text
		const stockDisplay = document.createElement("span");
		const unit = item.ingredient ? item.ingredient.unit : "";
		stockDisplay.textContent = `${item.stock} ${unit}`.trim();
		stockDisplay.className = "item-stock";

		// Plus button
		const plusBtn = document.createElement("button");
		plusBtn.textContent = "+";
		plusBtn.className = "btn-plus";
		plusBtn.onclick = () => {
			console.log(`Increase stock for ${item.name}`);
		};

		// Assembly
		controlsDiv.appendChild(minusBtn);
		controlsDiv.appendChild(stockDisplay);
		controlsDiv.appendChild(plusBtn);

		rowDiv.appendChild(itemName);
		rowDiv.appendChild(itemDetails);
		rowDiv.appendChild(controlsDiv);

		inventoryList.appendChild(rowDiv);
	});
}

// Initial render of the inventory list
renderInventoryList();
