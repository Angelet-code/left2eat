import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

globalThis.window = globalThis;

const store = new Map();
globalThis.localStorage = {
  getItem(key) {
    return store.has(key) ? store.get(key) : null;
  },
  setItem(key, value) {
    store.set(key, String(value));
  },
  removeItem(key) {
    store.delete(key);
  },
  clear() {
    store.clear();
  }
};

async function loadScript(path) {
  vm.runInThisContext(await readFile(path, "utf8"), { filename: path });
}

function hasForbiddenPersistedKey(value) {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => (
    key === "pendingUndo"
    || key === "undo"
    || key === "uiState"
    || key === "collapsedMealIds"
    || key === "addFoodMealIds"
    || key === "editingFoodId"
    || key === "foodSearch"
    || key === "view"
    || key === "activeNav"
    || key === "diagnosis"
    || key === "suggestions"
    || key === "createdMeal"
    || hasForbiddenPersistedKey(child)
  ));
}

await loadScript("src/data.js");
await loadScript("src/storage.js");
await loadScript("src/nutrition.js");
await loadScript("src/diagnosis-actions.js");

const Data = globalThis.LeftEatData;
const Storage = globalThis.LeftEatStorage;
const DiagnosisActions = globalThis.LeftEatDiagnosisActions;
const key = "left-eat-state-v1";
const savedDate = "2026-05-28";

function createMeal(name) {
  return {
    id: `meal-${name.toLowerCase().replaceAll(" ", "-")}`,
    name,
    items: []
  };
}

const state = {
  profile: { ...Data.DEFAULT_PROFILE, profileName: "Contrato" },
  foods: Data.BASE_FOODS.map((food) => ({ ...food })),
  mealTemplates: [{
    id: "template-1",
    name: "Comida guardada",
    items: [{ foodId: "chicken", grams: 160 }],
    itemSnapshots: [{
      foodId: "chicken",
      foodNameSnapshot: "Pechuga de pollo",
      grams: 160,
      per100: { kcal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
      macros: { kcal: 264, protein: 49.6, carbs: 0, fat: 5.76, fiber: 0 }
    }],
    createdAt: "2026-05-28T10:00:00.000Z",
    updatedAt: "2026-05-28T10:00:00.000Z"
  }],
  lastClosedDayRecovery: {
    sourceDate: savedDate,
    savedAt: "2026-05-28T20:00:00.000Z",
    createdAt: "2026-05-28T20:00:01.000Z",
    meals: [{
      name: "Cena",
      items: [{
        foodId: "turkey",
        grams: 150,
        foodSnapshot: {
          foodId: "turkey",
          name: "Pavo",
          per100: { kcal: 135, protein: 29, carbs: 0, fat: 1.5, fiber: 0 }
        }
      }]
    }]
  },
  days: {
    [savedDate]: {
      date: savedDate,
      context: { training: "strength", intensity: "normal", steps: 9000 },
      meals: [{
        id: "meal-1",
        name: "Comida 1",
        items: [{ id: "item-1", foodId: "chicken", grams: 160 }]
      }],
      note: "",
      savedAt: "2026-05-28T20:00:00.000Z",
      nutritionSnapshot: {
        version: 1,
        createdAt: "2026-05-28T20:00:00.000Z",
        total: { kcal: 264, protein: 49.6, carbs: 0, fat: 5.76, fiber: 0 },
        targets: { kcal: 2400, protein: 140, carbs: 280, fat: 70, fiber: 30 },
        kcalRange: { min: 2280, max: 2520 },
        meals: [{
          id: "meal-1",
          name: "Comida 1",
          total: { kcal: 264, protein: 49.6, carbs: 0, fat: 5.76, fiber: 0 },
          items: [{
            id: "item-1",
            foodId: "chicken",
            foodName: "Pechuga de pollo",
            grams: 160,
            macros: { kcal: 264, protein: 49.6, carbs: 0, fat: 5.76, fiber: 0 }
          }]
        }]
      }
    }
  },
  selectedDate: savedDate
};

Storage.save(state);

assert.deepEqual([...store.keys()], [key], "Storage debe usar solo left-eat-state-v1.");
const persisted = JSON.parse(store.get(key));
assert.equal(hasForbiddenPersistedKey(persisted), false, "No deben persistirse campos UI ni diagnostico derivado.");
assert.ok(Array.isArray(persisted.days[savedDate].meals[0].items), "Las comidas deben persistir meal.items.");
assert.equal("foods" in persisted.days[savedDate].meals[0], false, "No se debe persistir meal.foods.");
assert.equal(persisted.days[savedDate].nutritionSnapshot.total.kcal, 264);
assert.equal(persisted.days[savedDate].nutritionSnapshot.meals[0].items[0].foodName, "Pechuga de pollo");
assert.equal("diagnosis" in persisted.days[savedDate].nutritionSnapshot, false);
assert.equal("suggestions" in persisted.days[savedDate].nutritionSnapshot, false);
assert.equal("equivalences" in persisted.days[savedDate].nutritionSnapshot, false);

const loaded = Storage.load();
assert.equal(loaded.selectedDate, savedDate);
assert.equal(loaded.days[savedDate].savedAt, "2026-05-28T20:00:00.000Z");
assert.equal(loaded.days[savedDate].nutritionSnapshot.total.protein, 49.6);
assert.equal(loaded.mealTemplates[0].items[0].foodId, "chicken");
assert.equal(loaded.lastClosedDayRecovery.meals[0].items[0].foodSnapshot.name, "Pavo");
assert.equal(hasForbiddenPersistedKey(loaded), false);

const legacyMealDay = {
  date: savedDate,
  meals: [{
    id: "meal-foods-alias",
    name: "Alias legacy",
    foods: [{ id: "legacy-alias-item", foodId: "chicken", grams: 100 }]
  }]
};
const aliasTarget = DiagnosisActions.targetMealForSuggestion(legacyMealDay, createMeal);
DiagnosisActions.addFoodToMeal(
  aliasTarget.meal,
  Data.BASE_FOODS.find((food) => food.id === "turkey"),
  150,
  () => "suggested-alias-item"
);
assert.equal("foods" in legacyMealDay.meals[0], false, "Al mutar una comida legacy, el formato objetivo debe ser meal.items.");
assert.deepEqual(
  legacyMealDay.meals[0].items.map((item) => item.id),
  ["legacy-alias-item", "suggested-alias-item"]
);

const legacyState = {
  profile: { profileName: "Legacy", weight: 80 },
  foods: [{ id: "legacy-food", name: "Legacy Food", kcal: 100, protein: 10, carbs: 5, fat: 3 }],
  mealTemplates: [
    null,
    { id: "bad-template", name: "Sin items", items: [] },
    {
      id: "legacy-template",
      name: "Plantilla legacy",
      items: [{ foodId: "legacy-food", grams: "125,5" }],
      itemSnapshots: [{ foodId: "legacy-food", foodName: "Legacy Food", grams: "125,5" }]
    }
  ],
  lastClosedDayRecovery: {
    sourceDate: savedDate,
    savedAt: "2026-05-28T20:00:00.000Z",
    meals: [{
      name: "",
      items: [{
        foodId: "legacy-food",
        grams: "80",
        foodSnapshot: { name: "Legacy Food", per100: { kcal: "100", protein: "10" } }
      }]
    }]
  },
  days: {
    [savedDate]: {
      date: savedDate,
      meals: [{
        id: "legacy-meal",
        name: "Comida legacy",
        items: [{ id: "legacy-item", foodId: "legacy-food", grams: "80" }]
      }],
      savedAt: ""
    }
  },
  selectedDate: savedDate
};

localStorage.setItem(key, JSON.stringify(legacyState));
const legacyLoaded = Storage.load();
assert.equal(legacyLoaded.profile.profileName, "Legacy");
assert.equal(legacyLoaded.foods.some((food) => food.id === "legacy-food"), true);
assert.equal(legacyLoaded.mealTemplates.length, 1);
assert.equal(legacyLoaded.mealTemplates[0].items[0].grams, 125.5);
assert.equal(legacyLoaded.mealTemplates[0].itemSnapshots[0].macros.kcal, 0);
assert.equal(legacyLoaded.lastClosedDayRecovery.meals[0].name, "Comida recuperada");
assert.equal(legacyLoaded.lastClosedDayRecovery.meals[0].items[0].foodSnapshot.name, "Legacy Food");
assert.equal(legacyLoaded.lastClosedDayRecovery.meals[0].items[0].foodSnapshot.per100.fat, 0);
assert.deepEqual(legacyLoaded.days[savedDate].meals[0].items, [{ id: "legacy-item", foodId: "legacy-food", grams: "80" }]);
assert.equal(hasForbiddenPersistedKey(legacyLoaded), false);

localStorage.setItem(key, "{not-json");
const originalWarn = console.warn;
console.warn = () => {};
const fallback = Storage.load();
console.warn = originalWarn;
assert.equal(Object.keys(fallback.days).length, 1, "JSON invalido debe caer a estado por defecto.");
assert.equal(fallback.foods.some((food) => food.id === "chicken"), true);

localStorage.clear();
const defaultState = Storage.load();
assert.equal(store.has(key), false, "load sin estado no debe escribir localStorage.");
assert.equal(Object.keys(defaultState.days).length, 1);
assert.equal(defaultState.days[defaultState.selectedDate].meals[0].items.length, 0);

console.log("validate-storage-history-snapshots: ok");
