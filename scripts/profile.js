// Run check: node --check scripts/profile.js

console.log("profile.js loaded");

// CONSTANTS used for the profile page
const json = new JsonData("people");
const container = document.querySelector(".container");
const peopleList = document.getElementById("people-list");

// ELEMENTS for Add Person Form Elements
const addPersonButton = document.getElementById("add-person-button");
const personForm = document.getElementById("add-person-form"); // No save-person-button cuz form submission
const closePersonFormButton = document.getElementById("close-add-person-form");

// add person
addPersonButton.addEventListener("click", () => {
    console.log("[Add] Add person form opened");
    container.setAttribute("data-mode", "add");
});

closePersonFormButton.addEventListener("click", () => {
    console.log("[Add] Add person form closed");
    container.setAttribute("data-mode", "normal");
    addPersonButton.setAttribute("aria-expanded", "false");
    personForm.reset();
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

    json.getData().push(person);
    console.log("[Add] Save person form", person);
    renderPeopleList();

    container.setAttribute("data-mode", "normal");
    addPersonButton.setAttribute("aria-expanded", "false");
    personForm.reset();
});

// people
function renderPeopleList() {
    const people = json.getData() || [];
    peopleList.innerHTML = "";

    people.forEach(person => {
        const rowDiv = document.createElement("li");
        rowDiv.className = "glass";

        const personName = document.createElement("h3");
        personName.textContent = person.name;

        const personTags = document.createElement("p");
        personTags.className = "text-sm";
        personTags.textContent = person.restricted_tags.join(", ") || "No dietary restrictions";

        rowDiv.appendChild(personName);
        rowDiv.appendChild(personTags);

        peopleList.appendChild(rowDiv);
    });
}

renderPeopleList();
