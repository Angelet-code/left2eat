import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

globalThis.window = globalThis;

async function loadScript(path) {
  vm.runInThisContext(await readFile(path, "utf8"), { filename: path });
}

await loadScript("src/data.js");
await loadScript("src/nutrition.js");
await loadScript("src/diagnosis-actions.js");

const Data = globalThis.LeftEatData;
const Nutrition = globalThis.LeftEatNutrition;
const DiagnosisActions = globalThis.LeftEatDiagnosisActions;

function createMeal(name) {
  return {
    id: `meal-${name.toLowerCase().replaceAll(" ", "-")}`,
    name,
    items: []
  };
}

function summarize(items, foods = Data.BASE_FOODS) {
  return Nutrition.summarizeDay({
    context: { training: "none", intensity: "normal", steps: "" },
    meals: [{ id: "meal-1", name: "Comida 1", items }]
  }, Data.DEFAULT_PROFILE, foods);
}

function hasForbiddenPersistedKey(value) {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => (
    key === "pendingUndo"
    || key === "undo"
    || key === "uiState"
    || hasForbiddenPersistedKey(child)
  ));
}

const emptyDiagnosis = summarize([]).diagnosis;
assert.equal(emptyDiagnosis.suggestions.length, 0, "El dia vacio no debe sugerir alimentos concretos.");
assert.equal(summarize([]).energy.headline, "Empieza el día", "Un dia vacio no debe decir que esta casi en rango.");
assert.equal(Nutrition.energyRangeStatus(800, 2200).headline, "Queda bastante", "Un consumo muy bajo no debe sonar cercano al rango.");
assert.equal(Nutrition.energyRangeStatus(1500, 2200).headline, "En progreso", "Un consumo medio debe indicar progreso sin exagerar cercania.");
assert.equal(Nutrition.energyRangeStatus(1900, 2200).headline, "Cerca del rango", "Un consumo alto pero aun lejos del umbral de casi debe decir cerca.");
assert.equal(Nutrition.energyRangeStatus(2050, 2200).headline, "Casi en rango", "Casi en rango debe reservarse para poca distancia real.");

const proteinDiagnosis = summarize([{ id: "existing", foodId: "chicken", grams: 100 }]).diagnosis;
assert.equal(proteinDiagnosis.priority, "Proteína");
assert.equal(proteinDiagnosis.title, "Proteína empezada; falta completar.");
assert.equal(proteinDiagnosis.suggestions.length, 3, "Proteina baja debe ofrecer tres sugerencias.");
assert.deepEqual(
  proteinDiagnosis.suggestions.map((item) => item.foodId),
  ["turkey", "natural-tuna-drained", "fresh-cheese"]
);
assert.ok(!proteinDiagnosis.suggestions.some((item) => item.foodId === "chicken"), "No debe sugerir repetir el alimento ya usado.");

const hiddenTurkeyFoods = Data.BASE_FOODS.map((food) => (
  food.id === "turkey" ? { ...food, deletedAt: "2026-05-28T00:00:00.000Z" } : food
));
const hiddenDiagnosis = summarize([{ id: "existing", foodId: "chicken", grams: 100 }], hiddenTurkeyFoods).diagnosis;
assert.ok(!hiddenDiagnosis.suggestions.some((item) => item.foodId === "turkey"), "No se deben sugerir alimentos ocultos.");

const day = {
  date: "2026-05-28",
  meals: [{
    id: "meal-filled",
    name: "Comida llena",
    items: [{ id: "original", foodId: "chicken", grams: 100 }]
  }]
};
const suggestion = proteinDiagnosis.suggestions[0];
const food = Data.BASE_FOODS.find((item) => item.id === suggestion.foodId);
const target = DiagnosisActions.targetMealForSuggestion(day, createMeal);
assert.equal(target.createdMeal, false);
assert.equal(target.meal.id, "meal-filled");

const added = DiagnosisActions.addFoodToMeal(target.meal, food, suggestion.grams, () => "suggested-item");
assert.deepEqual(added, { id: "suggested-item", foodId: "turkey", grams: 150 });
assert.equal(day.meals[0].items.length, 2);
assert.equal(day.meals[0].items[0].id, "original", "El alimento previo debe permanecer intacto.");
assert.equal(hasForbiddenPersistedKey({ days: { [day.date]: day }, selectedDate: day.date }), false);

const undo = DiagnosisActions.removeItemFromMeal(day, target.meal.id, added.id, {
  removeCreatedMeal: target.createdMeal
});
assert.equal(undo.removed, true);
assert.equal(undo.removedMeal, false);
assert.deepEqual(day.meals[0].items, [{ id: "original", foodId: "chicken", grams: 100 }]);
assert.equal(hasForbiddenPersistedKey({ days: { [day.date]: day }, selectedDate: day.date }), false);

const missingUndo = DiagnosisActions.removeItemFromMeal(day, target.meal.id, added.id, {
  removeCreatedMeal: false
});
assert.equal(missingUndo.removed, false, "Deshacer dos veces no debe borrar otros alimentos.");

const emptyMealDay = { date: "2026-05-28", meals: [] };
const createdTarget = DiagnosisActions.targetMealForSuggestion(emptyMealDay, createMeal);
const createdItem = DiagnosisActions.addFoodToMeal(createdTarget.meal, food, suggestion.grams, () => "created-item");
const createdUndo = DiagnosisActions.removeItemFromMeal(emptyMealDay, createdTarget.meal.id, createdItem.id, {
  removeCreatedMeal: createdTarget.createdMeal
});
assert.equal(createdTarget.createdMeal, true);
assert.equal(createdUndo.removed, true);
assert.equal(createdUndo.removedMeal, true);
assert.equal(emptyMealDay.meals.length, 0, "Undo debe retirar la comida creada solo para la sugerencia.");

console.log("validate-diagnosis-flow: ok");
