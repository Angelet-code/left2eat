(function () {
  const Nutrition = window.LeftEatNutrition;
  const MealItems = window.LeftEatMealItems;

  const FOOD_PAIRING_RULES = {
    salmon: ["cherry-tomato", "potato", "gnocchi", "bread", "green-garlic", "rice", "avocado", "olive-oil"],
    chicken: ["rice", "potato", "green-garlic", "cherry-tomato", "avocado", "olive-oil"],
    "air-fryer-chicken-leg-bone-skin": ["potato", "rice", "green-garlic", "cherry-tomato", "olive-oil", "avocado"],
    "air-fryer-chicken-wing-bone-skin": ["potato", "rice", "cherry-tomato", "green-garlic", "olive-oil", "avocado"],
    turkey: ["rice", "potato", "bread", "cherry-tomato", "avocado", "green-garlic"],
    "natural-tuna-drained": ["bread", "cherry-tomato", "avocado", "olive-oil", "pasta", "rice"],
    egg: ["bread", "avocado", "cherry-tomato", "green-garlic", "potato", "mahon-cheese"],
    "green-garlic": ["egg", "salmon", "chicken", "potato", "cherry-tomato", "olive-oil"],
    gnocchi: ["roquefort-cheese", "cherry-tomato", "olive-oil", "chicken", "mahon-cheese", "green-garlic"],
    potato: ["salmon", "chicken", "egg", "green-garlic", "cherry-tomato", "olive-oil"],
    rice: ["chicken", "turkey", "salmon", "lentils", "natural-tuna-drained", "avocado"],
    pasta: ["natural-tuna-drained", "cherry-tomato", "olive-oil", "roquefort-cheese", "chicken", "mahon-cheese"],
    bread: ["egg", "avocado", "natural-tuna-drained", "fresh-cheese", "peanut-butter", "mahon-cheese"],
    oats: ["greek-yogurt", "banana", "blueberries", "peanut-butter", "whey-protein-scoop", "muesli-crunchy-zero"],
    "muesli-crunchy-zero": ["greek-yogurt", "banana", "blueberries", "peanut-butter", "whey-protein-scoop", "oats"],
    "oat-crunchy-rings": ["greek-yogurt", "banana", "blueberries", "peanut-butter", "whey-protein-scoop", "oats"],
    banana: ["greek-yogurt", "oats", "peanut-butter", "blueberries", "muesli-crunchy-zero", "whey-protein-scoop"],
    blueberries: ["greek-yogurt", "banana", "oats", "muesli-crunchy-zero", "whey-protein-scoop", "fresh-cheese"],
    watermelon: ["melon", "greek-yogurt", "fresh-cheese", "blueberries", "banana", "oats"],
    melon: ["watermelon", "greek-yogurt", "fresh-cheese", "blueberries", "banana", "oats"],
    "greek-yogurt": ["blueberries", "banana", "peanut-butter", "oats", "muesli-crunchy-zero", "oat-crunchy-rings"],
    lentils: ["rice", "cherry-tomato", "olive-oil", "green-garlic", "chicken", "potato"],
    "cherry-tomato": ["natural-tuna-drained", "avocado", "olive-oil", "egg", "salmon", "green-garlic"],
    "olive-oil": ["cherry-tomato", "green-garlic", "salmon", "natural-tuna-drained", "pasta", "avocado"],
    "peanut-butter": ["banana", "bread", "oats", "greek-yogurt", "blueberries", "muesli-crunchy-zero"],
    avocado: ["egg", "bread", "cherry-tomato", "natural-tuna-drained", "salmon", "olive-oil"],
    "fresh-cheese": ["blueberries", "banana", "bread", "oats", "muesli-crunchy-zero", "peanut-butter"],
    "whey-protein-scoop": ["greek-yogurt", "banana", "blueberries", "oats", "muesli-crunchy-zero", "peanut-butter"],
    "mahon-cheese": ["bread", "cherry-tomato", "egg", "pasta", "potato", "green-garlic"],
    "roquefort-cheese": ["gnocchi", "pasta", "bread", "cherry-tomato", "potato", "mahon-cheese"],
    "entrepinares-matured-mixed-cheese": ["bread", "cherry-tomato", "egg", "pasta", "potato", "green-garlic"]
  };

  const MEAT_FOOD_IDS = new Set([
    "chicken",
    "air-fryer-chicken-leg-bone-skin",
    "air-fryer-chicken-wing-bone-skin",
    "turkey"
  ]);
  const FISH_FOOD_IDS = new Set(["salmon", "natural-tuna-drained"]);

  function listMealItems(meal) {
    if (MealItems?.list) return MealItems.list(meal);
    return Array.isArray(meal?.foods)
      ? meal.foods
      : Array.isArray(meal?.items) ? meal.items : [];
  }

  function activeFoodList(foods) {
    return (Array.isArray(foods) ? foods : []).filter((food) => food && !food.deletedAt);
  }

  function dayList(days) {
    return Array.isArray(days) ? days : Object.values(days || {});
  }

  function foodCategory(food = {}) {
    const id = String(food.id || "");
    const name = Nutrition.normalize(food.name || "");

    if (MEAT_FOOD_IDS.has(id)) return "meat";
    if (FISH_FOOD_IDS.has(id)) return "fish";
    if (/\b(pollo|pavo|ternera|cerdo|jamon|carne)\b/.test(name)) return "meat";
    if (/\b(salmon|atun|bonito|merluza|pescado|bacalao|sardina)\b/.test(name)) return "fish";
    if (["greek-yogurt", "fresh-cheese", "whey-protein-scoop"].includes(id)) return "dairy";
    if (["banana", "blueberries", "watermelon", "melon"].includes(id)) return "fruit";
    if (["oats", "muesli-crunchy-zero", "oat-crunchy-rings"].includes(id)) return "breakfast-grain";
    if (["rice", "pasta", "gnocchi", "potato", "bread"].includes(id)) return "carb";
    if (id === "egg") return "egg";
    if (["green-garlic", "cherry-tomato"].includes(id)) return "vegetable";
    if (id === "lentils") return "legume";
    if (["olive-oil", "peanut-butter", "avocado"].includes(id)) return "fat";
    if (id.includes("cheese") || name.includes("queso") || name.includes("roquefort") || name.includes("mahon")) return "cheese";

    const protein = Nutrition.number(food.protein);
    const carbs = Nutrition.number(food.carbs);
    const fat = Nutrition.number(food.fat);
    if (fat > 8 && fat >= protein && fat >= carbs) return "fat";
    if (protein > 10 && protein >= carbs && protein >= fat) return "protein";
    if (carbs > 12 && carbs >= protein && carbs >= fat) return "carb";
    return "other";
  }

  function categoryPairingScore(sourceFood, candidateFood) {
    const source = foodCategory(sourceFood);
    const candidate = foodCategory(candidateFood);
    const matrix = {
      dairy: { fruit: 92, "breakfast-grain": 86, fat: 62, dairy: 40, carb: 18, meat: -45, fish: -35, protein: -35, vegetable: -24 },
      fruit: { dairy: 92, "breakfast-grain": 84, fat: 68, fruit: 38, meat: -45, fish: -35, protein: -35, vegetable: -22 },
      "breakfast-grain": { dairy: 88, fruit: 84, fat: 68, "breakfast-grain": 35, meat: -35, fish: -28, protein: -25 },
      meat: { carb: 88, vegetable: 82, fat: 64, legume: 44, cheese: 34, egg: 18, fruit: -42, dairy: -34, fish: -100 },
      fish: { carb: 88, vegetable: 84, fat: 68, legume: 38, cheese: 24, egg: 10, fruit: -42, dairy: -28, meat: -100 },
      protein: { carb: 84, vegetable: 76, fat: 58, legume: 38, cheese: 30, fruit: -38, dairy: -30 },
      egg: { carb: 84, vegetable: 80, fat: 74, cheese: 58, meat: 18, fish: 10, protein: 20, fruit: -38 },
      vegetable: { meat: 84, fish: 84, egg: 80, carb: 72, fat: 68, cheese: 46, protein: 42, fruit: -28 },
      carb: { meat: 86, fish: 86, vegetable: 76, cheese: 70, fat: 62, legume: 52, protein: 38, fruit: 22 },
      legume: { carb: 84, vegetable: 78, fat: 62, meat: 36, fish: 30, protein: 30, cheese: 12 },
      fat: { carb: 72, vegetable: 70, fish: 68, meat: 62, egg: 62, fruit: 58, dairy: 42, protein: 34 },
      cheese: { carb: 80, vegetable: 64, egg: 58, meat: 46, fish: 32, protein: 36, fat: 28, fruit: -24 },
      other: { carb: 30, vegetable: 28, meat: 24, fish: 24, protein: 24, fruit: 20, dairy: 18 }
    };

    return matrix[source]?.[candidate] ?? 0;
  }

  function semanticPairingIds(sourceFood, active, activeById) {
    const explicit = FOOD_PAIRING_RULES[sourceFood.id] || [];
    if (explicit.length) return explicit.filter((id) => activeById.has(id));

    return active
      .filter((food) => food.id !== sourceFood.id)
      .map((food) => ({ id: food.id, score: categoryPairingScore(sourceFood, food) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .map((item) => item.id);
  }

  function preferredGramsForFood(food, gramsCounts) {
    if (gramsCounts && gramsCounts.size) {
      return [...gramsCounts.entries()]
        .sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
    }
    return Nutrition.number(food.servingGrams) || 100;
  }

  function combinationStatsForFood(sourceFoodId, activeById, days, mealTemplates) {
    const stats = new Map();

    function addPair(candidateId, grams, date, weight) {
      const food = activeById.get(candidateId);
      if (!food || candidateId === sourceFoodId) return;

      const roundedGrams = Math.max(5, Math.round(Nutrition.number(grams || food.servingGrams || 100) / 5) * 5);
      const stat = stats.get(candidateId) || {
        food,
        count: 0,
        gramsCounts: new Map(),
        lastDate: ""
      };

      stat.count += weight;
      stat.gramsCounts.set(roundedGrams, (stat.gramsCounts.get(roundedGrams) || 0) + weight);
      stat.lastDate = String(date || "") > stat.lastDate ? String(date || "") : stat.lastDate;
      stats.set(candidateId, stat);
    }

    dayList(days).forEach((day) => {
      if (!day) return;
      (day.meals || []).forEach((meal) => {
        const items = listMealItems(meal).filter((item) => activeById.has(item.foodId));
        if (!items.some((item) => item.foodId === sourceFoodId)) return;
        items.forEach((item) => addPair(item.foodId, item.grams, day.date, 1));
      });
    });

    (mealTemplates || []).forEach((template) => {
      const items = (template.items || []).filter((item) => activeById.has(item.foodId));
      if (!items.some((item) => item.foodId === sourceFoodId)) return;
      items.forEach((item) => addPair(item.foodId, item.grams, template.updatedAt || template.createdAt, 0.75));
    });

    return stats;
  }

  function mealFoodIdSet(meal) {
    return new Set(listMealItems(meal).map((item) => item.foodId).filter(Boolean));
  }

  function mealFoodCategories(meal, activeById) {
    return new Set(listMealItems(meal)
      .map((item) => activeById.get(item.foodId))
      .filter(Boolean)
      .map(foodCategory));
  }

  function violatesMeatFishRule(sourceFood, candidateFood, meal, activeById) {
    const mealCategories = mealFoodCategories(meal, activeById);
    const sourceCategory = foodCategory(sourceFood);
    const candidateCategory = foodCategory(candidateFood);
    const mealHasMeat = mealCategories.has("meat");
    const mealHasFish = mealCategories.has("fish");
    const hasMeat = sourceCategory === "meat" || mealHasMeat;
    const hasFish = sourceCategory === "fish" || mealHasFish;

    return (candidateCategory === "meat" && hasFish)
      || (candidateCategory === "fish" && hasMeat)
      || (candidateCategory === "meat" && mealHasMeat)
      || (candidateCategory === "fish" && mealHasFish);
  }

  function recommend(options = {}) {
    const {
      sourceFood,
      meal = { items: [] },
      foods = [],
      days = {},
      mealTemplates = [],
      limit = 4
    } = options;

    if (!sourceFood) return [];

    const active = activeFoodList(foods);
    const activeById = new Map(active.map((food) => [food.id, food]));
    const blockedIds = mealFoodIdSet(meal);
    blockedIds.add(sourceFood.id);

    const stats = combinationStatsForFood(sourceFood.id, activeById, days, mealTemplates);
    const semanticIds = semanticPairingIds(sourceFood, active, activeById);
    const semanticRank = new Map(semanticIds.map((id, index) => [id, index]));
    const byId = new Map();

    active.forEach((food) => {
      if (blockedIds.has(food.id)) return;
      if (violatesMeatFishRule(sourceFood, food, meal, activeById)) return;

      const stat = stats.get(food.id);
      const semanticIndex = semanticRank.has(food.id) ? semanticRank.get(food.id) : null;
      const categoryScore = categoryPairingScore(sourceFood, food);
      const semanticScore = semanticIndex === null ? 0 : Math.max(25, 110 - semanticIndex * 12);
      const historicalScore = stat ? stat.count * 140 : 0;
      const score = historicalScore + semanticScore + Math.max(0, categoryScore);

      if (score <= 0) return;
      byId.set(food.id, {
        food,
        grams: preferredGramsForFood(food, stat?.gramsCounts),
        count: stat ? stat.count : 0,
        source: stat ? "habitual" : "encaja",
        score
      });
    });

    const fallback = active
      .filter((food) => !blockedIds.has(food.id)
        && !byId.has(food.id)
        && !violatesMeatFishRule(sourceFood, food, meal, activeById))
      .map((food) => ({
        food,
        grams: preferredGramsForFood(food),
        count: 0,
        source: "encaja",
        score: categoryPairingScore(sourceFood, food)
      }))
      .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name, "es", { sensitivity: "base" }));

    fallback.forEach((item) => {
      if (byId.size >= active.length) return;
      byId.set(item.food.id, item);
    });

    return [...byId.values()]
      .sort((a, b) => b.score - a.score
        || b.count - a.count
        || a.food.name.localeCompare(b.food.name, "es", { sensitivity: "base" }))
      .slice(0, limit);
  }

  window.LeftEatFoodCombinations = {
    foodCategory,
    recommend
  };
})();
