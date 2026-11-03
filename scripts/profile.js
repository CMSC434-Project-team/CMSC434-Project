// Run check: node --check scripts/profile.js

console.log("profile.js loaded");

// CONSTANTS used for the profile page
const json = new JsonData("people");
const container = document.querySelector(".container");
const peopleList = document.getElementById("people-list");

// VARIABLES to hold the current state of the profile page
let editPersonKey = null;

// ELEMENTS for Add Person Form Elements
const addPersonButton = document.getElementById("add-person-button");
const personForm = document.getElementById("add-person-form"); // No save-person-button cuz form submission
const closePersonFormButton = document.getElementById("close-add-person-form");
const deletePersonButton = document.getElementById("delete-person-button");
const personFormTitle = document.getElementById("person-form-title");
const personNameInput = document.getElementById("person-name");

function openPersonForm(index = null) {
    editPersonKey = index;
    personForm.reset();

    const isEdit = index !== null;
    personFormTitle.textContent = isEdit ? "Edit person" : "Add person";
    deletePersonButton.classList.toggle("hidden", !isEdit);

    if (isEdit) {
        const person = json.getData()[index];
        personNameInput.value = person.name;
        personForm.querySelectorAll('input[name="restricted_tags"]').forEach(checkbox => {
            checkbox.checked = person.restricted_tags.includes(checkbox.value);
        });
    }

    container.setAttribute("data-mode", "add");
    addPersonButton.setAttribute("aria-expanded", "true");
}

function closePersonForm() {
    editPersonKey = null;
    container.setAttribute("data-mode", "normal");
    addPersonButton.setAttribute("aria-expanded", "false");
    personForm.reset();
}

addPersonButton.addEventListener("click", () => {
    console.log("[Add] Add person form opened");
    openPersonForm();
});

closePersonFormButton.addEventListener("click", () => {
    console.log("[Add] Add person form closed");
    closePersonForm();
});

deletePersonButton.addEventListener("click", () => {
    if (editPersonKey === null) return;

    const person = json.getData()[editPersonKey];
    if (!confirm(`Delete ${person.name}'s profile?`)) return;

    json.getData().splice(editPersonKey, 1);
    json.saveData();
    console.log(`[Edit] Deleted ${person.name}`);
    renderPeopleList();
    closePersonForm();
});

personForm.addEventListener("submit", event => {
    event.preventDefault();

    const formData = new FormData(personForm);
    const name = String(formData.get("person-name")).trim();

    if (!name) {
        alert("Enter a name.");
        return;
    }

    const person = {
        name: name,
        restricted_tags: formData.getAll("restricted_tags")
    };

    if (editPersonKey === null) {
        json.getData().push(person);
        console.log("[Add] Save person form", person);
    } else {
        Object.assign(json.getData()[editPersonKey], person);
        console.log(`[Edit] Updated ${person.name}`, person);
    }
    json.saveData();
    renderPeopleList();
    closePersonForm();
});

// people
function renderPeopleList() {
    const people = json.getData() || [];
    peopleList.innerHTML = "";

    people.forEach((person, index) => {
        const rowDiv = document.createElement("li");
        rowDiv.className = "glass";
        rowDiv.setAttribute("role", "button");
        rowDiv.setAttribute("tabindex", "0");
        rowDiv.setAttribute("aria-label", `Edit ${person.name}`);

        const personName = document.createElement("h3");
        personName.textContent = person.name;

        const personTags = document.createElement("p");
        personTags.className = "text-sm";
        personTags.textContent = person.restricted_tags.join(", ") || "No dietary restrictions";

        rowDiv.appendChild(personName);
        rowDiv.appendChild(personTags);

        rowDiv.addEventListener("click", () => {
            if (container.getAttribute("data-mode") !== "normal") return;
            console.log(`[Normal] Editing ${person.name}`);
            openPersonForm(index);
        });
        rowDiv.addEventListener("keydown", event => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            rowDiv.click();
        });

        peopleList.appendChild(rowDiv);
    });
}

renderPeopleList();
