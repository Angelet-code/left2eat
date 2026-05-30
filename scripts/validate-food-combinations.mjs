import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

globalThis.window = globalThis;

async function loadScript(path) {
  vm.runInThisContext(await readFile(path, "utf8"), { filename: path });
}

await loadScript("src/data.js");
await loadScript("src/meal-items.js");
await loadScript("src/nutrition.js");
await loadScript("src/food-combinations.js");

const combinationApi = globalThis.LeftEatFoodCombinations;

assert.ok(combinationApi, "El modulo de combinaciones debe exponer una API publica.");

const meatIds = new Set([
  "chicken",
  "air-fryer-chicken-leg-bone-skin",
  "air-fryer-chicken-wing-bone-skin",
  "turkey"
]);
const fishIds = new Set(["salmon", "natural-tuna-drained"]);
const foodById = new Map(globalThis.LeftEatData.BASE_FOODS.map((food) => [food.id, food]));
const foods = globalThis.LeftEatData.BASE_FOODS;

function recommendationIds(sourceFoodId, mealItems = [], options = {}) {
  const sourceFood = foodById.get(sourceFoodId);
  if (!sourceFood) return [];

  return combinationApi.recommend({
    sourceFood,
    meal: {
      id: "test-meal",
      name: "Comida test",
      items: mealItems
    },
    foods,
    days: options.days || {},
    mealTemplates: options.mealTemplates || [],
    limit: 4
  }).map((item) => item.food.id);
}

assert.equal(combinationApi.foodCategory(foodById.get("chicken")), "meat");
assert.equal(combinationApi.foodCategory(foodById.get("salmon")), "fish");

const yogurtIds = recommendationIds("greek-yogurt");
assert.equal(yogurtIds.length, 4, "El kefir debe ofrecer cuatro combinaciones.");
assert.ok(
  yogurtIds.some((id) => ["banana", "blueberries", "watermelon", "melon"].includes(id)),
  "El kefir debe sugerir fruta."
);
assert.ok(yogurtIds.includes("peanut-butter"), "El kefir debe poder combinar con crema de cacahuete.");

const salmonIds = recommendationIds("salmon");
assert.equal(salmonIds.length, 4, "El salmon debe ofrecer cuatro combinaciones.");
assert.deepEqual(salmonIds, ["cherry-tomato", "potato", "gnocchi", "bread"]);
assert.ok(!salmonIds.some((id) => meatIds.has(id)), "El salmon no debe sugerir carne.");

const chickenIds = recommendationIds("chicken");
assert.equal(chickenIds.length, 4, "El pollo debe ofrecer cuatro combinaciones.");
assert.deepEqual(chickenIds, ["rice", "potato", "green-garlic", "cherry-tomato"]);
assert.ok(!chickenIds.includes("chicken"), "El pollo no debe sugerirse a si mismo como combinacion.");

const potatoWithChickenIds = recommendationIds("potato", [
  { id: "existing-chicken", foodId: "chicken", grams: 160 }
]);
assert.equal(potatoWithChickenIds.length, 4, "Una comida con pollo debe seguir teniendo cuatro sugerencias.");
assert.ok(
  !potatoWithChickenIds.some((id) => fishIds.has(id)),
  "Una comida con carne no debe sugerir pescado."
);
assert.ok(
  !potatoWithChickenIds.some((id) => meatIds.has(id)),
  "Una comida con carne no debe sugerir otra carne como combinacion."
);

const habitualRecommendations = combinationApi.recommend({
  sourceFood: foodById.get("greek-yogurt"),
  meal: { id: "test-meal", name: "Comida test", items: [] },
  foods,
  days: {
    today: {
      date: "2026-05-30",
      meals: [{
        id: "habitual-day",
        items: [
          { id: "day-yogurt", foodId: "greek-yogurt", grams: 250 },
          { id: "day-peanut", foodId: "peanut-butter", grams: 30 }
        ]
      }]
    }
  },
  mealTemplates: [{
    id: "habitual-template",
    name: "Kefir con fruta",
    updatedAt: "2026-05-29",
    items: [
      { id: "template-yogurt", foodId: "greek-yogurt", grams: 250 },
      { id: "template-banana", foodId: "banana", grams: 150 }
    ]
  }],
  limit: 4
});
const habitualPeanut = habitualRecommendations.find((item) => item.food.id === "peanut-butter");
const habitualBanana = habitualRecommendations.find((item) => item.food.id === "banana");

assert.equal(habitualPeanut?.source, "habitual", "El historial debe marcar combinaciones habituales.");
assert.equal(habitualPeanut?.grams, 30, "El historial debe conservar la cantidad preferida.");
assert.equal(habitualBanana?.source, "habitual", "Las plantillas deben aportar combinaciones habituales.");
assert.equal(habitualBanana?.grams, 150, "Las plantillas deben conservar la cantidad preferida.");

console.log("validate-food-combinations: ok");
