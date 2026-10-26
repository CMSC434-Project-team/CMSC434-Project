import * as shared from "./_global.js";

const list = document.getElementById("recipe-list");

function showView(view) {
    const elements = {
        "recipe-list": view === "list",
        "create-button": view === "list",
        "recipe-details": view === "details",
        "create-recipe": view === "create"
    };

    for (const id in elements) {
        const element = document.getElementById(id);
        const visible = elements[id];

        element.hidden = !visible;
        element.style.setProperty(
            "display",
            visible ? "block" : "none",
            "important"
        );
    }

    document.querySelector(".container").scrollTop = 0;
}

function showRecipe(recipe) {
    document.getElementById("recipe-name").textContent = recipe.name;

    document.getElementById("recipe-time").textContent =
        `${recipe.time} minutes`;

    const ingredients = document.getElementById("recipe-ingredients");
    ingredients.textContent = "";

    for (const item of recipe.ingredients) {
        const li = document.createElement("li");

        li.textContent =
            `${item.quantity} ${item.ingredient.unit} ${item.ingredient.name}`;

        ingredients.appendChild(li);
    }

    const steps = document.getElementById("recipe-steps");
    steps.textContent = "";

    for (const step of recipe.steps) {
        const li = document.createElement("li");
        li.textContent = step;
        steps.appendChild(li);
    }

    showView("details");
}

document.getElementById("create-button").addEventListener("click", () => {
    showView("create");
});

document.getElementById("cancel-create").addEventListener("click", () => {
    showView("list");
});

document.getElementById("back-button").addEventListener("click", () => {
    showView("list");
});

showView("list");
list.textContent = "Loading recipes...";

fetch("data/recipes.json")
    .then(response => {
        if (!response.ok) {
            throw new Error(`Cannot load recipes: ${response.status}`);
        }

        return response.json();
    })
    .then(recipes => {
        let savedRecipes = [];

        try {
            const saved = JSON.parse(
                localStorage.getItem("created_recipes") || "[]"
            );

            if (Array.isArray(saved)) {
                savedRecipes = saved;
            }
        } catch (error) {
            console.error("Could not load saved recipes:", error);
        }

        const allRecipes = recipes.concat(savedRecipes);

        list.textContent = "";

        for (const recipe of allRecipes) {
            const button = document.createElement("button");

            button.type = "button";
            button.textContent = `${recipe.name} · ${recipe.time} min`;
            button.className = "btn";

            button.addEventListener("click", () => showRecipe(recipe));

            list.appendChild(button);
        }
    })
    .catch(error => {
        document.getElementById("recipe-list").textContent = error.message;
    });

let newIngredients = [];

document.getElementById("add-ingredient").addEventListener("click", () => {
    const name = document.getElementById("ingredient-name").value.trim();
    const category = document.getElementById("ingredient-category").value.trim();
    const unit = document.getElementById("ingredient-unit").value.trim();
    const quantity = document.getElementById("ingredient-quantity").valueAsNumber;

    if (!name || !category || !unit ||
        !Number.isFinite(quantity) || quantity < 0.01) {
        alert("Enter an ingredient name, food group, unit, and positive quantity.");
        return;
    }

    const item = {
        ingredient: {
            name: name,
            category: category,
            unit: unit
        },
        quantity: quantity
    };

    newIngredients.push(item);

    const li = document.createElement("li");
    li.textContent = `${quantity} ${unit} ${name}`;

    document.getElementById("added-ingredients").appendChild(li);

    document.getElementById("ingredient-name").value = "";
    document.getElementById("ingredient-category").value = "";
    document.getElementById("ingredient-unit").value = "";
    document.getElementById("ingredient-quantity").value = "";

    document.getElementById("ingredient-name").focus();
});

document.getElementById("save-recipe").addEventListener("click", () => {
    const name = document.getElementById("new-name").value.trim();
    const time = document.getElementById("new-time").valueAsNumber;

    const steps = document.getElementById("new-steps").value
        .split("\n")
        .map(step => step.trim())
        .filter(step => step !== "");

    if (!name || !Number.isInteger(time) || time < 1 ||
        newIngredients.length === 0 || steps.length === 0) {
        alert("Enter a recipe name, a positive whole number of minutes, at least one ingredient, and instructions.");
        return;
    }

    const recipe = {
        name: name,
        time: time,
        ingredients: newIngredients,
        steps: steps
    };

    try {
        const savedRecipes = JSON.parse(
            localStorage.getItem("created_recipes") || "[]"
        );

        savedRecipes.push(recipe);

        localStorage.setItem(
            "created_recipes",
            JSON.stringify(savedRecipes)
        );
    } catch (error) {
        alert("Could not save the recipe in this browser.");
        console.error(error);
        return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${recipe.name} · ${recipe.time} min`;
    button.className = "btn";

    button.addEventListener("click", () => showRecipe(recipe));

    document.getElementById("recipe-list").appendChild(button);

    newIngredients = [];
    document.getElementById("added-ingredients").textContent = "";
    document.getElementById("new-name").value = "";
    document.getElementById("new-time").value = "";
    document.getElementById("new-steps").value = "";

    showRecipe(recipe);
});