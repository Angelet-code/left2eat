import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

globalThis.window = globalThis;
globalThis.document = {
  getElementById() {
    return null;
  },
  querySelector() {
    return null;
  }
};
globalThis.localStorage = {
  getItem() {
    return null;
  },
  setItem() {}
};

let combinationApi = null;
globalThis.__LEFT_EAT_COMBINATION_TEST__ = (api) => {
  combinationApi = api;
};

async function loadScript(path) {
  vm.runInThisContext(await readFile(path, "utf8"), { filename: path });
}

await loadScript("src/data.js");
await loadScript("src/storage.js");
await loadScript("src/nutrition.js");
await loadScript("src/icons.js");
await loadScript("src/diagnosis-actions.js");
await loadScript("src/app.js");

assert.ok(combinationApi, "La app debe exponer el hook interno de combinaciones en modo test.");

const meatIds = new Set([
  "chicken",
  "air-fryer-chicken-leg-bone-skin",
  "air-fryer-chicken-wing-bone-skin",
  "turkey"
]);
const fishIds = new Set(["salmon", "natural-tuna-drained"]);
const foodById = new Map(globalThis.LeftEatData.BASE_FOODS.map((food) => [food.id, food]));

assert.equal(combinationApi.foodCategory(foodById.get("chicken")), "meat");
assert.equal(combinationApi.foodCategory(foodById.get("salmon")), "fish");

const yogurtIds = combinationApi.recommendationIds("greek-yogurt");
assert.equal(yogurtIds.length, 4, "El kefir debe ofrecer cuatro combinaciones.");
assert.ok(
  yogurtIds.some((id) => ["banana", "blueberries", "watermelon", "melon"].includes(id)),
  "El kefir debe sugerir fruta."
);
assert.ok(yogurtIds.includes("peanut-butter"), "El kefir debe poder combinar con crema de cacahuete.");

const salmonIds = combinationApi.recommendationIds("salmon");
assert.equal(salmonIds.length, 4, "El salmon debe ofrecer cuatro combinaciones.");
assert.deepEqual(salmonIds, ["cherry-tomato", "potato", "gnocchi", "bread"]);
assert.ok(!salmonIds.some((id) => meatIds.has(id)), "El salmon no debe sugerir carne.");

const chickenIds = combinationApi.recommendationIds("chicken");
assert.equal(chickenIds.length, 4, "El pollo debe ofrecer cuatro combinaciones.");
assert.deepEqual(chickenIds, ["rice", "potato", "green-garlic", "cherry-tomato"]);
assert.ok(!chickenIds.includes("chicken"), "El pollo no debe sugerirse a si mismo como combinacion.");

const selectedChickenPanel = combinationApi.contextualPanelHtml("chicken", [], { mode: "selected" });
assert.ok(selectedChickenPanel.includes("Combina con Pechuga de pollo"), "El panel contextual debe titularse con el alimento seleccionado.");
assert.ok(!selectedChickenPanel.includes("Recordados"), "Con alimento seleccionado no debe aparecer el panel generico de recordados.");
assert.ok(selectedChickenPanel.includes("Arroz (crudo)"), "El panel contextual del pollo debe sugerir arroz.");
assert.ok(selectedChickenPanel.includes("Patata cocida"), "El panel contextual del pollo debe sugerir patata.");

const addedChickenPanel = combinationApi.contextualPanelHtml("chicken", [
  { id: "existing-chicken", foodId: "chicken", grams: 160 }
]);
assert.ok(addedChickenPanel.includes("Combina con Pechuga de pollo"), "El ultimo alimento anadido debe mantener recomendaciones contextuales.");
assert.ok(!addedChickenPanel.includes("data-food-id=\"chicken\""), "Las tarjetas contextuales no deben recomendar repetir el alimento fuente.");

const potatoWithChickenIds = combinationApi.recommendationIds("potato", [
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

console.log("validate-food-combinations: ok");
