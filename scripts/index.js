import * as shared from "./_global.js";
// Run check: node --check scripts/index.js

console.log("index.js loaded");

const saveEditButton = document.querySelector("#save-edit-button");
const editButton = document.querySelector("#edit-button");

const toggleEditMode = () => {
	saveEditButton.classList.toggle("active");
}

editButton.addEventListener("click", toggleEditMode);
saveEditButton.addEventListener("click", toggleEditMode);
