(function () {
  const KEY = "left-eat-state-v1";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function localIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dateFromIso(iso) {
    const match = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return new Date();
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  function todayIso() {
    return localIso(new Date());
  }

  function activeDayIso(now = new Date(), cutoffHour = 5) {
    const date = now instanceof Date ? new Date(now.getTime()) : new Date(now);
    const cutoff = Number.isFinite(Number(cutoffHour)) ? Number(cutoffHour) : 5;
    date.setHours(date.getHours() - cutoff);
    return localIso(date);
  }

  function addDaysIso(isoDate, amount) {
    const date = dateFromIso(isoDate);
    date.setDate(date.getDate() + Number(amount || 0));
    return localIso(date);
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function createDay(date, mealNames) {
    return {
      date,
      context: {
        training: "none",
        intensity: "normal",
        steps: ""
      },
      meals: mealNames.map((name) => ({
        id: uid("meal"),
        name,
        items: []
      })),
      note: "",
      savedAt: ""
    };
  }

  function defaultState() {
    const today = activeDayIso();
    return {
      profile: clone(window.LeftEatData.DEFAULT_PROFILE),
      foods: clone(window.LeftEatData.BASE_FOODS),
      mealTemplates: [],
      lastClosedDayRecovery: null,
      days: {
        [today]: createDay(today, window.LeftEatData.DEFAULT_MEALS)
      },
      selectedDate: today
    };
  }

  function mergeFoods(savedFoods) {
    const savedById = new Map((savedFoods || []).map((food) => [food.id, food]));
    const foods = clone(window.LeftEatData.BASE_FOODS).map((food) => {
      const saved = savedById.get(food.id);
      return normalizeFood(saved ? { ...food, ...saved } : food);
    });
    const baseIds = new Set(foods.map((food) => food.id));

    (savedFoods || []).forEach((food) => {
      if (!baseIds.has(food.id)) foods.push(normalizeFood(food));
    });
    return foods;
  }

  function normalizeFood(food) {
    return {
      ...food,
      favorite: Boolean(food.favorite),
      deletedAt: food.deletedAt || ""
    };
  }

  function normalizeTemplateItem(item) {
    if (!item || !item.foodId) return null;

    const grams = Number(String(item.grams || "").replace(",", "."));
    if (!Number.isFinite(grams) || grams <= 0) return null;

    return {
      foodId: String(item.foodId),
      grams
    };
  }

  function normalizeMacros(source) {
    const macros = source || {};
    return {
      kcal: Number(macros.kcal) || 0,
      protein: Number(macros.protein) || 0,
      carbs: Number(macros.carbs) || 0,
      fat: Number(macros.fat) || 0,
      fiber: Number(macros.fiber) || 0
    };
  }

  function normalizeFoodSnapshot(snapshot, fallbackFoodId = "") {
    if (!snapshot) return null;
    const per100 = snapshot.per100 || snapshot.macrosPer100 || {};
    return {
      foodId: String(snapshot.foodId || fallbackFoodId || ""),
      name: String(snapshot.name || snapshot.foodName || snapshot.foodNameSnapshot || "Alimento guardado"),
      per100: normalizeMacros(per100)
    };
  }

  function normalizeTemplateItemSnapshot(snapshot) {
    if (!snapshot || !snapshot.foodId) return null;

    const grams = Number(String(snapshot.grams || "").replace(",", "."));
    const per100 = snapshot.per100 || snapshot.macrosPer100 || {};
    const macros = snapshot.macros || {};

    return {
      foodId: String(snapshot.foodId),
      foodNameSnapshot: String(snapshot.foodNameSnapshot || snapshot.foodName || snapshot.name || "Alimento guardado"),
      grams: Number.isFinite(grams) && grams > 0 ? grams : 0,
      per100: {
        kcal: Number(per100.kcal) || 0,
        protein: Number(per100.protein) || 0,
        carbs: Number(per100.carbs) || 0,
        fat: Number(per100.fat) || 0,
        fiber: Number(per100.fiber) || 0
      },
      macros: {
        kcal: Number(macros.kcal) || 0,
        protein: Number(macros.protein) || 0,
        carbs: Number(macros.carbs) || 0,
        fat: Number(macros.fat) || 0,
        fiber: Number(macros.fiber) || 0
      }
    };
  }

  function normalizeMealTemplate(template) {
    if (!template) return null;

    const items = (Array.isArray(template.items) ? template.items : [])
      .map(normalizeTemplateItem)
      .filter(Boolean);

    if (!items.length) return null;

    const createdAt = template.createdAt || new Date().toISOString();
    return {
      id: template.id || uid("meal-template"),
      name: String(template.name || "Comida guardada").trim() || "Comida guardada",
      items,
      itemSnapshots: (Array.isArray(template.itemSnapshots) ? template.itemSnapshots : [])
        .map(normalizeTemplateItemSnapshot)
        .filter(Boolean),
      createdAt,
      updatedAt: template.updatedAt || createdAt
    };
  }

  function normalizeMealTemplates(savedTemplates) {
    const seen = new Set();
    return (savedTemplates || [])
      .map(normalizeMealTemplate)
      .filter((template) => {
        if (!template || seen.has(template.id)) return false;
        seen.add(template.id);
        return true;
      });
  }

  function normalizeRecoveryItem(item) {
    if (!item || !item.foodId) return null;

    const grams = Number(String(item.grams || "").replace(",", "."));
    if (!Number.isFinite(grams) || grams <= 0) return null;

    const recoveryItem = {
      foodId: String(item.foodId),
      grams
    };
    const snapshot = normalizeFoodSnapshot(item.foodSnapshot, recoveryItem.foodId);
    if (snapshot) recoveryItem.foodSnapshot = snapshot;
    return recoveryItem;
  }

  function normalizeRecoveryMeal(meal) {
    if (!meal) return null;
    const items = (Array.isArray(meal.items) ? meal.items : [])
      .map(normalizeRecoveryItem)
      .filter(Boolean);
    if (!items.length) return null;

    return {
      name: String(meal.name || "Comida recuperada").trim() || "Comida recuperada",
      items
    };
  }

  function normalizeLastClosedDayRecovery(recovery) {
    if (!recovery) return null;
    const meals = (Array.isArray(recovery.meals) ? recovery.meals : [])
      .map(normalizeRecoveryMeal)
      .filter(Boolean);
    if (!meals.length) return null;

    return {
      sourceDate: String(recovery.sourceDate || ""),
      savedAt: String(recovery.savedAt || ""),
      createdAt: String(recovery.createdAt || ""),
      meals
    };
  }

  function load() {
    const fallback = defaultState();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fallback;

      const saved = JSON.parse(raw);
      const state = {
        profile: { ...fallback.profile, ...(saved.profile || {}) },
        foods: mergeFoods(saved.foods),
        mealTemplates: normalizeMealTemplates(saved.mealTemplates),
        lastClosedDayRecovery: normalizeLastClosedDayRecovery(saved.lastClosedDayRecovery),
        days: saved.days || fallback.days,
        selectedDate: saved.selectedDate || fallback.selectedDate
      };

      return state;
    } catch (error) {
      console.warn("No se pudo cargar el estado guardado.", error);
      return fallback;
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  window.LeftEatStorage = {
    activeDayIso,
    addDaysIso,
    createDay,
    load,
    save,
    todayIso,
    uid
  };
})();
