(function () {
  const KEY = "left-eat-state-v1";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function todayIso() {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
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
    const today = todayIso();
    return {
      profile: clone(window.LeftEatData.DEFAULT_PROFILE),
      foods: clone(window.LeftEatData.BASE_FOODS),
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

  function load() {
    const fallback = defaultState();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fallback;

      const saved = JSON.parse(raw);
      const state = {
        profile: { ...fallback.profile, ...(saved.profile || {}) },
        foods: mergeFoods(saved.foods),
        days: saved.days || fallback.days,
        selectedDate: saved.selectedDate || fallback.selectedDate
      };

      if (!state.days[state.selectedDate]) {
        state.days[state.selectedDate] = createDay(state.selectedDate, window.LeftEatData.DEFAULT_MEALS);
      }

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
    createDay,
    load,
    save,
    todayIso,
    uid
  };
})();
