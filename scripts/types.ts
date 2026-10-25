type Tag =
    | "gluten-free"
    | "dairy-free"
    | "nut-free"
    | "vegan"
    | "vegetarian"
    | "pescatarian"
    | "kosher"
    | "halal"
    | "low-carb"
    | "low-fat"
    | "low-sodium"
    | "high-protein"
    | "high-fiber"
    | "sugar-free"
    | "organic";

interface Ingredient {
    name: string;
    category: string;
    unit: string;
}

interface InventoryItem {
    name: string;
    ingredient: Ingredient | null;
    stock: number;
    low_stock_threshold: number;
    tags: Tag[];
}

interface RecipeIngredient {
    ingredient: Ingredient;
    quantity: number;
}

interface RecipeItem {
    name: string;
    time: number;
    ingredients: RecipeIngredient[];
    steps: string[];
}

interface PeopleItem {
    name: string;
    restricted_tags: Tag[];
}

type DataSet = Ingredient[] | InventoryItem[] | RecipeItem[] | PeopleItem[];
type DataFile = "ingredients" | "inventory" | "recipes" | "people";
