(() => {
    const $ = id => document.getElementById(id);
    const recipeStore = new JsonData("recipes");
    const inventoryStore = new JsonData("inventory");
    const normalize = value => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
    const unit = value => ({
        units: "each", unit: "each", pcs: "each",
        pieces: "each", piece: "each", cups: "cup", cans: "can"
    }[normalize(value)] || normalize(value));
    const matches = (a, b) => a && b &&
        normalize(a.name) === normalize(b.name) &&
        unit(a.unit) === unit(b.unit);
    const round = value => Math.round(value * 1000000) / 1000000;
    let selectedRecipe = null;
    let ingredients = [];
    let draft = null;
    let currentView = "recipe-home";
    let editingInventory = false;
    let inventoryDraft = new Map();
    let inventoryOriginal = new Map();

    function message(text) {
        $("recipe-status").textContent = text;
    }
    function show(view) {
        currentView = view;
        for (const id of ["recipe-home", "recipe-details", "create-recipe", "recipe-review"]) {
            $(id).hidden = id !== view;
        }
        message("");
        document.querySelector(".container").scrollTop = 0;
    }
    function daysLeft(date) {
        if (!date) return Infinity;
        const expiry = new Date(`${date}T00:00:00`);
        if (Number.isNaN(expiry.getTime())) return Infinity;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.round((expiry - today) / 86400000);
    }
    function availability(recipe, inventory) {
        const rows = [];
        for (const item of recipe.ingredients) {
            const existing = rows.find(row => matches(row.ingredient, item.ingredient));
            if (existing) existing.need = round(existing.need + item.quantity);
            else rows.push({ ingredient: item.ingredient, need: item.quantity });
        }
        for (const row of rows) {
            const stock = inventory.filter(item =>
                matches(item.ingredient, row.ingredient) && item.stock > 0);
            const usable = stock.filter(item => daysLeft(item.expiration_date) >= 0);
            row.have = round(usable.reduce((sum, item) => sum + item.stock, 0));
            row.missing = round(Math.max(0, row.need - row.have));
            row.expired = stock.some(item => daysLeft(item.expiration_date) < 0);
            row.soonest = Math.min(...usable.map(item => daysLeft(item.expiration_date)));
            row.unitMismatch = inventory.some(item =>
                normalize(item.ingredient?.name || item.name) === normalize(row.ingredient.name) &&
                !matches(item.ingredient, row.ingredient));
        }
        return {
            rows,
            missing: rows.filter(row => row.missing > 0),
            soonest: Math.min(...rows.map(row => row.soonest))
        };
    }
    function fillList(id, texts) {
        $(id).replaceChildren(...texts.map(text => {
            const li = document.createElement("li");
            li.textContent = text;
            return li;
        }));
    }
    function save(store, data) {
        store.data = data;
        store.saveData();
    }
    function renderRecipes() {
        const recipes = recipeStore.getData();
        const inventory = inventoryStore.getData();
        const query = normalize($("recipe-search").value);
        const filter = $("recipe-filter").value;
        const results = recipes.map(recipe => ({
            recipe, status: availability(recipe, inventory)
        })).filter(({ recipe, status }) => {
            const text = [recipe.name, ...recipe.ingredients.map(item => item.ingredient.name)].join(" ");
            const searchMatches = normalize(text).includes(query);
            const filterMatches = filter === "all" ||
                filter === "ready" && !status.missing.length ||
                filter === "missing" && status.missing.length ||
                filter === "soon" && status.soonest <= 3;
            return searchMatches && filterMatches;
        }).sort((a, b) =>
            Number(!!a.status.missing.length) - Number(!!b.status.missing.length) ||
            a.status.soonest - b.status.soonest ||
            a.recipe.name.localeCompare(b.recipe.name));
        $("recipe-list").replaceChildren();
        for (const { recipe, status } of results) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "recipe-card";
            const title = document.createElement("strong");
            title.textContent = recipe.name;
            const info = document.createElement("span");
            info.textContent = `${recipe.time} min · ${status.missing.length ? `Need ${status.missing.length} ingredients` : "Can make now"
                }`;
            if (status.soonest <= 3) {
                info.textContent += status.soonest === 0 ?
                    " · expires today" : ` · expires in ${status.soonest}d`;
            }
            button.append(title, info);
            button.addEventListener("click", () => openRecipe(recipe));
            $("recipe-list").append(button);
        }
        if (!results.length) $("recipe-list").textContent = "No matches. Try All recipes or change the search.";
    }
    function openRecipe(recipe) {
        selectedRecipe = recipe;
        editingInventory = false;
        inventoryDraft.clear();
        inventoryOriginal.clear();
        $("view-shopping").hidden = false;
        $("edit-ingredients").hidden = false;
        $("discard-ingredient-edits").hidden = true;
        $("save-ingredient-edits").hidden = true;
        const status = availability(recipe, inventoryStore.getData());
        $("recipe-name").textContent = recipe.name;
        $("recipe-time").textContent = `${recipe.time} minutes`;
        $("recipe-stock-status").textContent = status.missing.length ?
            `Missing ${status.missing.length} ingredient(s)` : "You have enough usable ingredients.";
        renderRecipeIngredients(status);
        fillList("recipe-steps", recipe.steps);
        $("add-missing").hidden = !status.missing.length;
        show("recipe-details");
    }
    function recipeIngredientKey(ingredient) {
        return `${normalize(ingredient.name)}|${unit(ingredient.unit)}`;
    }
    function renderRecipeIngredients(status) {
        $("recipe-ingredients").replaceChildren(...status.rows.map(row => {
            const li = document.createElement("li");
            const text = `${row.ingredient.name}: ${row.need} ${row.ingredient.unit} needed`;
            if (!editingInventory) {
                li.textContent = text +
                    (row.have ? ` (${row.have})` : "") +
                    (row.missing ? ` · buy ${row.missing}` : "") +
                    (row.expired ? " · expired stock excluded" : "") +
                    (row.unitMismatch ? " · check other units in Inventory" : "");
                return li;
            }
            const label = document.createElement("label");
            label.textContent = `${text}`;
            label.setAttribute("for", `inventory-${recipeIngredientKey(row.ingredient)}`);

            const div = document.createElement("div");
            div.classList.add("inventory-edit");

            const input = document.createElement("input");
            input.id = `inventory-${recipeIngredientKey(row.ingredient)}`;
            input.type = "number";
            input.min = "0";
            input.step = "any";
            input.value = String(inventoryDraft.get(recipeIngredientKey(row.ingredient)) ?? row.have);
            input.addEventListener("input", () => {
                inventoryDraft.set(recipeIngredientKey(row.ingredient), Number(input.value));
            });
            div.append(document.createTextNode(`(`), input, document.createTextNode(` ${row.ingredient.unit})`));
            li.append(label, div);
            return li;
        }));
    }
    $("edit-ingredients").addEventListener("click", () => {
        const status = availability(selectedRecipe, inventoryStore.getData());
        inventoryDraft = new Map(status.rows.map(row => [
            recipeIngredientKey(row.ingredient), row.have
        ]));
        inventoryOriginal = new Map(inventoryDraft);
        editingInventory = true;
        $("view-shopping").hidden = true;
        $("edit-ingredients").hidden = true;
        $("discard-ingredient-edits").hidden = false;
        $("save-ingredient-edits").hidden = false;
        renderRecipeIngredients(status);
    });
    $("discard-ingredient-edits").addEventListener("click", () => {
        editingInventory = false;
        inventoryDraft = new Map(inventoryOriginal);
        $("view-shopping").hidden = false;
        $("edit-ingredients").hidden = false;
        $("discard-ingredient-edits").hidden = true;
        $("save-ingredient-edits").hidden = true;
        renderRecipeIngredients(availability(selectedRecipe, inventoryStore.getData()));
    });
    $("save-ingredient-edits").addEventListener("click", () => {
        try {
            const inventory = inventoryStore.getData();
            for (const row of availability(selectedRecipe, inventory).rows) {
                const key = recipeIngredientKey(row.ingredient);
                const amount = inventoryDraft.get(key);
                if (!Number.isFinite(amount) || amount < 0) {
                    message("Inventory amounts must be zero or greater.");
                    return;
                }
                const matchesInInventory = inventory.filter(item =>
                    matches(item.ingredient, row.ingredient));
                if (matchesInInventory.length) {
                    matchesInInventory[0].stock = amount;
                    matchesInInventory[0].last_updated = new Date().toISOString();
                    matchesInInventory.slice(1).forEach(item => {
                        item.stock = 0;
                        item.last_updated = new Date().toISOString();
                    });
                } else {
                    inventory.push({
                        name: row.ingredient.name,
                        ingredient: { ...row.ingredient },
                        stock: amount,
                        low_stock_threshold: 0,
                        tags: [],
                        location: "",
                        notes: "",
                        expiration_date: "",
                        last_updated: new Date().toISOString()
                    });
                }
            }
            inventoryStore.data = inventory;
            inventoryStore.saveData();
            editingInventory = false;
            $("view-shopping").hidden = false;
            $("edit-ingredients").hidden = false;
            $("discard-ingredient-edits").hidden = true;
            $("save-ingredient-edits").hidden = true;
            openRecipe(selectedRecipe);
        } catch (error) {
            message(`Could not update Inventory: ${error.message}`);
        }
    });
    $("add-missing").addEventListener("click", () => {
        try {
            const inventory = inventoryStore.getData();
            const missing = availability(selectedRecipe, inventory).missing;
            const store = new JsonData("shopping");
            const shopping = JSON.parse(JSON.stringify(store.getData()));
            for (const row of missing) {
                const item = shopping.find(item =>
                    matches(item.ingredient, row.ingredient));
                if (item) {
                    if (confirm(`"${row.ingredient.name}" already has ${item.quantity} ${item.ingredient.unit} in Shopping. Add ${row.missing} more?`)) {
                        item.quantity = (Number(item.quantity) || 0) + row.missing;
                        item.checked = false;
                    } else {
                        // Cancel adding this item, but continue with the rest of the missing items
                        continue;
                    }
                }
                else shopping.push({ ingredient: { ...row.ingredient }, quantity: row.missing, checked: false });
            }
            save(store, shopping);
            openRecipe(selectedRecipe);
        } catch (error) { message(`Could not update Shopping: ${error.message}`); }
    });
    $("recipe-search").addEventListener("input", renderRecipes);
    $("recipe-filter").addEventListener("change", renderRecipes);
    $("back-button").addEventListener("click", () => { renderRecipes(); show("recipe-home"); });
    $("create-button").addEventListener("click", () => show("create-recipe"));

    function renderIngredients() {
        $("added-ingredients").replaceChildren();
        ingredients.forEach((item, index) => {
            const li = document.createElement("li");
            li.textContent = `${item.quantity} ${item.ingredient.unit} ${item.ingredient.name} `;
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = "Remove";
            button.addEventListener("click", () => {
                ingredients.splice(index, 1); renderIngredients();
            });
            li.append(button);
            $("added-ingredients").append(li);
        });
    }
    $("ingredient-name").addEventListener("change", () => {
        const item = findInventoryItem(inventoryStore.getData(), $("ingredient-name").value);
        if (item?.ingredient) {
            $("ingredient-unit").value = item.ingredient.unit || "";
        }
    });
    $("add-ingredient").addEventListener("click", () => {
        const ingredient = {
            name: $("ingredient-name").value.trim(),
            unit: $("ingredient-unit").value.trim()
        };
        const quantity = $("ingredient-quantity").valueAsNumber;
        if (!ingredient.name || !ingredient.unit ||
            !Number.isFinite(quantity) || quantity <= 0) {
            message("Complete the ingredient fields with a positive quantity."); return;
        }
        ingredients.push({ ingredient, quantity });
        renderIngredients();
        for (const id of ["ingredient-name", "ingredient-unit", "ingredient-quantity"]) $(id).value = "";
        message("");
        $("ingredient-name").focus();
    });
    $("review-recipe").addEventListener("click", () => {
        const name = $("new-name").value.trim();
        const time = $("new-time").valueAsNumber;
        const steps = $("new-steps").value.split("\n").map(step => step.trim()).filter(Boolean);
        if (!name || !Number.isInteger(time) || time < 1 || !steps.length || !ingredients.length) {
            message("Enter a name, whole minutes, ingredients and instructions."); return;
        }
        if (["ingredient-name", "ingredient-unit", "ingredient-quantity"].some(id => $(id).value.trim())) {
            message("Add or clear the ingredient still in the fields."); return;
        }
        draft = { name, time, ingredients: JSON.parse(JSON.stringify(ingredients)), steps };
        $("review-name").textContent = `${name} · ${time} min`;
        fillList("review-ingredients", ingredients.map(item =>
            `${item.quantity} ${item.ingredient.unit} ${item.ingredient.name}`));
        fillList("review-steps", steps);
        show("recipe-review");
    });
    $("edit-recipe").addEventListener("click", () => show("create-recipe"));
    function resetForm() {
        ingredients = [];
        draft = null;
        for (const id of ["new-name", "new-time", "new-steps", "ingredient-name",
            "ingredient-unit", "ingredient-quantity"]) $(id).value = "";
        renderIngredients();
    }
    $("cancel-create").addEventListener("click", () => {
        const changed = ingredients.length ||
            ["new-name", "new-time", "new-steps", "ingredient-name",
                "ingredient-unit", "ingredient-quantity"]
                .some(id => $(id).value.trim());
        if (changed && !confirm("Discard this unsaved recipe?")) return;
        resetForm(); renderRecipes(); show("recipe-home");
    });
    $("save-recipe").addEventListener("click", () => {
        if (!draft || currentView !== "recipe-review") return;
        try {
            const recipe = draft;
            save(recipeStore, [...recipeStore.getData(), recipe]);
            resetForm(); renderRecipes(); openRecipe(recipe); message("Recipe saved.");
        } catch (error) { message(`Could not save: ${error.message}`); }
    });
    function refresh() {
        try {
            renderRecipes();
            if (currentView === "recipe-details" && selectedRecipe) openRecipe(selectedRecipe);
        } catch (error) { message(error.message); }
    }
    window.addEventListener("pageshow", refresh);
    window.addEventListener("storage", refresh);
    show("recipe-home");
    refresh();
})();