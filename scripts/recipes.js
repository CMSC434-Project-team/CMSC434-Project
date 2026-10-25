import * as shared from "./_global.js";
// Run check: node --check scripts/recipes.js

console.log("recipes.js loaded");

fetch("data/recipes.json")
    .then((response) => response.json())
    .then((recipes) => {
        const list = document.getElementById("recipes-list");

        for (const id in recipes) {
            const recipe = recipes[id];
            
            const button = document.createElement("button");
            button.textContent = recipe.name;
            button.className = "btn";
            list.appendChild(button);
        }
    });