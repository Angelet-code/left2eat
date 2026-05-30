(function () {
  const Storage = window.LeftEatStorage;
  const Nutrition = window.LeftEatNutrition;
  const Data = window.LeftEatData;
  const MealItems = window.LeftEatMealItems;
  const DiagnosisActions = window.LeftEatDiagnosisActions;
  const FoodCombinations = window.LeftEatFoodCombinations;
  const RenderUtils = window.LeftEatRenderUtils;
  const ProfileRenderers = window.LeftEatProfileRenderers;
  const FoodLibraryRenderers = window.LeftEatFoodLibraryRenderers;
  const HistoryRenderers = window.LeftEatHistoryRenderers;
  const DiaryRenderers = window.LeftEatDiaryRenderers;
  const {
    escapeHtml,
    formatDate,
    formatMacro,
    hasProfileAvatar,
    profileAvatarId,
    sortFoods
  } = RenderUtils;

  let state = Storage.load();
  const uiState = {
    addFoodMealIds: new Set(),
    collapsedMealIds: new Set(),
    view: "diary",
    activeNav: "diary",
    editingFoodId: "",
    foodSearch: "",
    selectedFoodByMealId: new Map(),
    comboContext: null,
    recommendationFocus: null,
    pendingUndo: null
  };

  const refs = {
    date: document.getElementById("day-date"),
    saveDay: document.getElementById("save-day"),
    dayEyebrow: document.getElementById("day-eyebrow"),
    dayTitle: document.getElementById("day-title"),
    profileTitle: document.getElementById("profile-title"),
    profilePanelContent: document.getElementById("profile-panel-content"),
    sideNav: document.getElementById("side-nav"),
    quickSearch: document.getElementById("quick-food-search"),
    quickFoodList: document.getElementById("quick-food-list"),
    dayContext: document.getElementById("day-context"),
    macroCards: document.getElementById("macro-cards"),
    mealWorkbench: document.querySelector(".meal-workbench"),
    meals: document.getElementById("meals"),
    profileEditor: document.getElementById("profile-editor"),
    libraryPanel: document.getElementById("food-library"),
    dayInsights: document.querySelector(".day-insights"),
    historyPanel: document.querySelector(".history-panel"),
    summaryPanel: document.querySelector(".summary-panel"),
    dateActions: document.querySelector(".date-actions"),
    macroSummary: document.getElementById("macro-summary"),
    equivalences: document.getElementById("equivalences"),
    history: document.getElementById("history"),
    analysis: document.getElementById("analysis"),
    toast: document.getElementById("toast")
  };

  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function currentDay() {
    if (!state.days[state.selectedDate]) {
      state.days[state.selectedDate] = Storage.createDay(state.selectedDate, Data.DEFAULT_MEALS);
    }
    normalizeDay(state.days[state.selectedDate]);
    return state.days[state.selectedDate];
  }

  function normalizeDay(day) {
    day.context = Nutrition.normalizeDayContext(day.context);
    day.meals = Array.isArray(day.meals) ? day.meals : [];
    day.meals.forEach((meal) => {
      MealItems.ensure(meal);
    });

    const mealsWithFoods = day.meals.filter((meal) => MealItems.list(meal).length);
    if (mealsWithFoods.length) {
      day.meals = day.meals.filter((meal) => MealItems.list(meal).length || meal.manuallyAdded);
      return;
    }

    day.meals = [
      day.meals[0] || createMeal("Comida 1"),
      ...day.meals.slice(1).filter((meal) => meal.manuallyAdded)
    ];
  }

  function isIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }

  function dayContextHasChanges(context) {
    const defaults = Nutrition.normalizeDayContext();
    return (context.training || defaults.training) !== defaults.training
      || (context.intensity || defaults.intensity) !== defaults.intensity
      || String(context.steps ?? defaults.steps) !== defaults.steps;
  }

  function dayHasContent(day) {
    const meals = Array.isArray(day.meals) ? day.meals : [];
    const context = Nutrition.normalizeDayContext(day.context);
    return meals.some((meal) => MealItems.list(meal).length || meal.manuallyAdded)
      || dayContextHasChanges(context)
      || String(day.note || "").trim().length > 0;
  }

  function dayHasLoggedFood(day) {
    const meals = Array.isArray(day.meals) ? day.meals : [];
    return meals.some((meal) => MealItems.list(meal).length);
  }

  function dayCanBeReplaced(date) {
    const day = state.days[date];
    return !day || (!day.savedAt && !dayHasContent(day));
  }

  function nextCleanDateAfter(date) {
    let candidate = Storage.addDaysIso(date, 1);
    let guard = 0;

    while (!dayCanBeReplaced(candidate) && guard < 370) {
      candidate = Storage.addDaysIso(candidate, 1);
      guard += 1;
    }

    return candidate;
  }

  function previousDaySuggestion(day) {
    const sourceDate = day.date || state.selectedDate;
    if (sourceDate !== Storage.todayIso() || !dayHasContent(day)) return null;

    const previousDate = Storage.addDaysIso(sourceDate, -1);
    if (!dayCanBeReplaced(previousDate)) return null;

    return {
      previousDate,
      registered: Boolean(day.savedAt)
    };
  }

  function latestPendingDateBefore(date) {
    return Object.entries(state.days || {})
      .map(([key, day]) => {
        if (!day) return null;
        return {
          date: day.date || key,
          day
        };
      })
      .filter((item) => item
        && isIsoDate(item.date)
        && item.date < date
        && !item.day.savedAt
        && dayHasContent(item.day))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((item) => item.date)[0] || "";
  }

  function initializeSelectedDate() {
    const activeDate = Storage.activeDayIso();
    const selectedDate = isIsoDate(state.selectedDate) ? state.selectedDate : "";
    const selectedDay = selectedDate ? state.days[selectedDate] : null;

    if (selectedDay) {
      selectedDay.date = selectedDay.date || selectedDate;
      normalizeDay(selectedDay);
    }

    if (selectedDay && !selectedDay.savedAt && dayHasContent(selectedDay)) {
      state.selectedDate = selectedDate;
      currentDay();
      return;
    }

    const pendingDate = latestPendingDateBefore(activeDate);
    if (pendingDate) {
      state.selectedDate = pendingDate;
      currentDay();
      return;
    }

    if (!selectedDate
      || !selectedDay
      || selectedDay.savedAt
      || (selectedDate < activeDate && !dayHasContent(selectedDay))) {
      state.selectedDate = activeDate;
    } else {
      state.selectedDate = selectedDate;
    }

    currentDay();
  }

  function createMeal(name, manuallyAdded = false) {
    return {
      id: Storage.uid("meal"),
      name,
      items: [],
      manuallyAdded
    };
  }

  function mealTemplateItemsFromMeal(meal) {
    return MealItems.list(meal)
      .map((item) => ({
        foodId: item.foodId,
        grams: Nutrition.number(item.grams)
      }))
      .filter((item) => item.foodId && item.grams > 0);
  }

  function mealTemplateSignature(items) {
    return items
      .map((item) => `${item.foodId}:${Nutrition.round(item.grams, 1)}`)
      .sort()
      .join("|");
  }

  function findMealTemplateBySignature(items) {
    const signature = mealTemplateSignature(items);
    if (!signature) return null;
    return (state.mealTemplates || []).find((template) => mealTemplateSignature(template.items || []) === signature);
  }

  function mealTemplateTotal(template) {
    if (Array.isArray(template.itemSnapshots) && template.itemSnapshots.length) {
      return template.itemSnapshots.reduce((total, snapshot) => {
        addTotals(total, snapshot.macros || Nutrition.foodMacros(snapshot.per100 || {}, snapshot.grams));
        return total;
      }, Nutrition.zeroMacros());
    }

    const aggregate = Nutrition.aggregateDay({ meals: [{ ...template, items: template.items || [] }] }, state.foods);
    return aggregate.meals[0]?.total || Nutrition.zeroMacros();
  }

  function cloneTemplateItems(template) {
    return (template.items || []).map((item, index) => {
      const food = Nutrition.findFoodById(state.foods, item.foodId);
      const snapshot = (template.itemSnapshots || [])[index];
      const clonedItem = {
        id: Storage.uid("item"),
        foodId: item.foodId,
        grams: Nutrition.number(item.grams)
      };

      if (!food && snapshot) {
        clonedItem.foodSnapshot = templateFoodSnapshot(snapshot);
      }

      return clonedItem;
    });
  }

  function templateFoodSnapshot(snapshot) {
    if (!snapshot) return null;

    return {
      foodId: snapshot.foodId,
      name: snapshot.foodNameSnapshot || "Alimento guardado",
      per100: cloneMacros(snapshot.per100 || {})
    };
  }

  function cloneExistingFoodSnapshot(snapshot, fallbackFoodId = "") {
    if (!snapshot) return null;
    const per100 = snapshot.per100 || snapshot.macrosPer100 || {};

    return {
      foodId: snapshot.foodId || fallbackFoodId,
      name: snapshot.name || snapshot.foodName || snapshot.foodNameSnapshot || "Alimento guardado",
      per100: cloneMacros(per100)
    };
  }

  function historySnapshotForItem(snapshotMeal, item) {
    const snapshots = snapshotMeal?.items || [];
    return snapshots.find((snapshot) => snapshot.id === item.id)
      || snapshots.find((snapshot) => snapshot.foodId === item.foodId
        && Nutrition.round(snapshot.grams, 1) === Nutrition.round(item.grams, 1));
  }

  function foodSnapshotFromHistoryItem(snapshotItem, item) {
    const grams = Math.max(Nutrition.number(snapshotItem?.grams, item?.grams), 0);
    const macros = snapshotItem?.macros || {};
    const per100 = Nutrition.MACRO_META.reduce((acc, meta) => {
      acc[meta.key] = grams > 0
        ? Nutrition.round((Nutrition.number(macros[meta.key]) * 100) / grams, meta.precision + 1)
        : 0;
      return acc;
    }, {});

    return {
      foodId: snapshotItem?.foodId || item?.foodId || "",
      name: snapshotItem?.foodName || snapshotItem?.foodNameSnapshot || "Alimento guardado",
      per100
    };
  }

  function cloneHistoryItem(item, snapshotMeal) {
    const grams = Nutrition.number(item.grams);
    if (!item.foodId || grams <= 0) return null;

    const clonedItem = {
      id: Storage.uid("item"),
      foodId: item.foodId,
      grams
    };

    if (!Nutrition.findFoodById(state.foods, item.foodId)) {
      const snapshotItem = historySnapshotForItem(snapshotMeal, item);
      clonedItem.foodSnapshot = cloneExistingFoodSnapshot(item.foodSnapshot, item.foodId)
        || foodSnapshotFromHistoryItem(snapshotItem, item);
    }

    return clonedItem;
  }

  function cloneSavedDayMealsForActiveDay(sourceDay) {
    const snapshotMeals = sourceDay.nutritionSnapshot?.meals || [];
    const liveMeals = (sourceDay.meals || [])
      .map((meal) => ({
        name: meal.name || "Comida repetida",
        items: MealItems.list(meal),
        snapshotMeal: snapshotMeals.find((snapshotMeal) => snapshotMeal.id === meal.id)
      }))
      .filter((meal) => meal.items.length);

    const sourceMeals = liveMeals.length
      ? liveMeals
      : snapshotMeals
        .map((meal) => ({
          name: meal.name || "Comida repetida",
          items: meal.items || [],
          snapshotMeal: meal
        }))
        .filter((meal) => meal.items.length);

    let fallbackCount = 0;
    const meals = sourceMeals.map((meal) => {
      const items = meal.items
        .map((item) => cloneHistoryItem(item, meal.snapshotMeal))
        .filter(Boolean);

      fallbackCount += items.filter((item) => item.foodSnapshot).length;

      return {
        id: Storage.uid("meal"),
        name: meal.name,
        items,
        manuallyAdded: true
      };
    }).filter((meal) => meal.items.length);

    return { meals, fallbackCount };
  }

  function recoveryItemFromDayItem(item, snapshotMeal) {
    const grams = Nutrition.number(item.grams);
    if (!item.foodId || grams <= 0) return null;

    const food = Nutrition.findFoodById(state.foods, item.foodId);
    const snapshotItem = historySnapshotForItem(snapshotMeal, item);
    const foodSnapshot = food
      ? {
        foodId: item.foodId,
        name: food.name,
        per100: cloneMacros(food)
      }
      : cloneExistingFoodSnapshot(item.foodSnapshot, item.foodId)
        || foodSnapshotFromHistoryItem(snapshotItem, item);

    return {
      foodId: item.foodId,
      grams,
      ...(foodSnapshot ? { foodSnapshot } : {})
    };
  }

  function buildLastClosedDayRecovery(day) {
    const snapshotMeals = day.nutritionSnapshot?.meals || [];
    const meals = (day.meals || [])
      .map((meal) => {
        const snapshotMeal = snapshotMeals.find((item) => item.id === meal.id);
        const items = MealItems.list(meal)
          .map((item) => recoveryItemFromDayItem(item, snapshotMeal))
          .filter(Boolean);
        return {
          name: meal.name || "Comida recuperada",
          items
        };
      })
      .filter((meal) => meal.items.length);

    if (!meals.length) return null;

    return {
      sourceDate: day.date,
      savedAt: day.savedAt,
      createdAt: new Date().toISOString(),
      meals
    };
  }

  function cloneRecoveryMeals(recovery) {
    const recoveryMeals = Array.isArray(recovery?.meals) ? recovery.meals : [];
    return recoveryMeals.map((meal) => {
      const items = (meal.items || [])
        .map((item) => {
          const grams = Nutrition.number(item.grams);
          if (!item.foodId || grams <= 0) return null;
          return {
            id: Storage.uid("item"),
            foodId: item.foodId,
            grams,
            ...(item.foodSnapshot ? {
              foodSnapshot: cloneExistingFoodSnapshot(item.foodSnapshot, item.foodId)
            } : {})
          };
        })
        .filter(Boolean);

      return {
        id: Storage.uid("meal"),
        name: meal.name || "Comida recuperada",
        items,
        manuallyAdded: true
      };
    }).filter((meal) => meal.items.length);
  }

  function hasRecoverableClosedDay() {
    return Boolean(state.lastClosedDayRecovery?.meals?.length);
  }

  function cloneMacros(macros) {
    const source = macros || {};
    return Nutrition.MACRO_META.reduce((acc, meta) => {
      acc[meta.key] = Nutrition.round(source[meta.key], meta.precision + 1);
      return acc;
    }, {});
  }

  function buildNutritionSnapshot(day) {
    const summary = Nutrition.summarizeDay(day, state.profile, state.foods);
    const createdAt = new Date().toISOString();

    return {
      version: 1,
      createdAt,
      total: cloneMacros(summary.total),
      targets: cloneMacros(summary.targets),
      kcalRange: {
        min: Nutrition.round(summary.kcalRange.min),
        max: Nutrition.round(summary.kcalRange.max)
      },
      meals: summary.aggregate.meals.map((meal) => ({
        id: meal.id,
        name: meal.name,
        total: cloneMacros(meal.total),
        items: MealItems.list(meal).map((item) => {
          const food = Nutrition.findFoodById(state.foods, item.foodId);
          const itemMacros = food ? Nutrition.foodMacros(food, item.grams) : Nutrition.zeroMacros();
          return {
            id: item.id,
            foodId: item.foodId,
            foodName: food ? food.name : "Alimento no encontrado",
            grams: Nutrition.number(item.grams),
            macros: cloneMacros(itemMacros)
          };
        })
      }))
    };
  }

  function buildMealTemplateSnapshots(items) {
    return items.map((item) => {
      const food = Nutrition.findFoodById(state.foods, item.foodId);
      const per100 = food ? cloneMacros(food) : Nutrition.zeroMacros();
      const macros = food ? cloneMacros(Nutrition.foodMacros(food, item.grams)) : Nutrition.zeroMacros();

      return {
        foodId: item.foodId,
        foodNameSnapshot: food ? food.name : "Alimento guardado",
        grams: Nutrition.number(item.grams),
        per100,
        macros
      };
    });
  }

  function dayTotalForHistory(day) {
    return day.nutritionSnapshot?.total || Nutrition.aggregateDay(day, state.foods).total;
  }

  function persist() {
    Storage.save(state);
  }

  function saveAndRender(message) {
    persist();
    render();
    if (message) showToast(message);
  }

  function hideToast() {
    window.clearTimeout(showToast.timer);
    refs.toast.classList.remove("is-visible", "has-action");
    refs.toast.innerHTML = "";
  }

  function showToast(message, options = {}) {
    const hasAction = Boolean(options.actionLabel && options.onAction);
    if (!hasAction) uiState.pendingUndo = null;

    refs.toast.innerHTML = "";
    refs.toast.classList.toggle("has-action", hasAction);

    const copy = document.createElement("span");
    copy.textContent = message;
    refs.toast.appendChild(copy);

    if (hasAction) {
      const action = document.createElement("button");
      action.type = "button";
      action.textContent = options.actionLabel;
      action.addEventListener("click", options.onAction);
      refs.toast.appendChild(action);
    }

    refs.toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    const duration = Number.isFinite(options.duration) ? options.duration : 2400;
    showToast.timer = window.setTimeout(() => {
      hideToast();
      if (options.onExpire) options.onExpire();
    }, duration);
  }

  function clearPendingUndo(options = {}) {
    uiState.pendingUndo = null;
    if (options.hideToast) hideToast();
  }

  function itemIdExists(day, itemId) {
    return (day.meals || []).some((meal) => MealItems.list(meal).some((item) => item.id === itemId));
  }

  function restoreItemClone(item, day) {
    const clone = cloneValue(item);
    if (itemIdExists(day, clone.id)) clone.id = Storage.uid("item");
    return clone;
  }

  function restoreMealClone(meal, day) {
    const clone = cloneValue(meal);
    if ((day.meals || []).some((item) => item.id === clone.id)) clone.id = Storage.uid("meal");
    const items = MealItems.list(clone).map((item) => restoreItemClone(item, day));
    clone.items = items;
    delete clone.foods;
    return clone;
  }

  function setPendingUndo(undo, message) {
    uiState.pendingUndo = undo;
    showToast(message, {
      actionLabel: "Deshacer",
      duration: 8000,
      onAction: () => runPendingUndo(undo.id),
      onExpire: () => {
        if (uiState.pendingUndo?.id === undo.id) uiState.pendingUndo = null;
      }
    });
  }

  function runPendingUndo(undoId) {
    const undo = uiState.pendingUndo;
    const failureMessage = undo?.failureMessage || "No se pudo deshacer esa acción.";
    if (!undo || undo.id !== undoId || undo.date !== state.selectedDate || currentDay().savedAt) {
      clearPendingUndo();
      showToast(failureMessage);
      return;
    }

    const restored = undo.type === "remove-item"
      ? restoreRemovedItem(undo)
      : undo.type === "remove-meal"
        ? restoreRemovedMeal(undo)
        : undo.type === "clear-meal"
          ? restoreClearedMeal(undo)
          : undo.type === "diagnostic-add-item" ? removeAddedItem(undo) : false;

    clearPendingUndo();
    saveAndRender(restored
      ? undo.successMessage || "Acción deshecha."
      : failureMessage);
  }

  function restoreRemovedItem(undo) {
    const day = currentDay();
    const meal = day.meals.find((item) => item.id === undo.payload.mealId);
    if (!meal) return false;

    const items = MealItems.ensure(meal);
    const item = restoreItemClone(undo.payload.item, day);
    const index = Math.max(0, Math.min(undo.payload.itemIndex, items.length));
    items.splice(index, 0, item);
    MealItems.set(meal, items);
    uiState.collapsedMealIds.delete(meal.id);
    return true;
  }

  function restoreRemovedMeal(undo) {
    const day = currentDay();
    const meal = restoreMealClone(undo.payload.meal, day);
    const index = Math.max(0, Math.min(undo.payload.mealIndex, day.meals.length));
    day.meals.splice(index, 0, meal);
    uiState.collapsedMealIds.delete(meal.id);
    uiState.addFoodMealIds.delete(meal.id);
    return true;
  }

  function restoreClearedMeal(undo) {
    const day = currentDay();
    const meal = day.meals.find((item) => item.id === undo.payload.mealId);
    if (!meal) return false;

    const currentItems = MealItems.list(meal);
    const restoredItems = (undo.payload.items || []).map((item) => restoreItemClone(item, day));
    const restoredIds = new Set(restoredItems.map((item) => item.id));
    MealItems.set(meal, [
      ...restoredItems,
      ...currentItems.filter((item) => !restoredIds.has(item.id))
    ]);
    uiState.collapsedMealIds.delete(meal.id);
    return true;
  }

  function removeAddedItem(undo) {
    const day = currentDay();
    const result = DiagnosisActions.removeItemFromMeal(day, undo.payload.mealId, undo.payload.itemId, {
      removeCreatedMeal: undo.payload.createdMeal
    });
    const meal = day.meals.find((item) => item.id === undo.payload.mealId);
    if (!result.removed) return false;
    if (!meal) return true;

    uiState.collapsedMealIds.delete(meal.id);
    return true;
  }

  let activeDangerDialog = null;

  async function confirmDanger(message) {
    if (activeDangerDialog) return activeDangerDialog.promise;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const backdrop = document.createElement("div");
    const dialog = document.createElement("section");
    const title = document.createElement("h2");
    const copy = document.createElement("p");
    const actions = document.createElement("div");
    const cancelButton = document.createElement("button");
    const confirmButton = document.createElement("button");

    backdrop.className = "confirm-danger-backdrop modal-backdrop";
    dialog.className = "confirm-danger-dialog modal-content";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "confirm-danger-title");
    dialog.setAttribute("aria-describedby", "confirm-danger-message");

    title.id = "confirm-danger-title";
    title.textContent = "Confirmar acción";
    copy.id = "confirm-danger-message";
    copy.textContent = message;

    actions.className = "confirm-danger-actions";
    cancelButton.type = "button";
    cancelButton.className = "ghost-action";
    cancelButton.textContent = "Cancelar";
    confirmButton.type = "button";
    confirmButton.className = "secondary-action confirm-danger-confirm";
    confirmButton.textContent = "Confirmar";

    actions.append(cancelButton, confirmButton);
    dialog.append(title, copy, actions);
    backdrop.appendChild(dialog);

    let resolveDialog = () => {};
    let settled = false;
    const promise = new Promise((resolve) => {
      resolveDialog = resolve;
    });

    function focusableDialogControls() {
      return [...dialog.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
        .filter((item) => !item.disabled && item.offsetParent !== null);
    }

    function closeDialog(confirmed) {
      if (settled) return;
      settled = true;
      document.removeEventListener("keydown", handleConfirmKeydown);
      backdrop.remove();
      activeDangerDialog = null;
      if (previousFocus && document.contains(previousFocus)) {
        previousFocus.focus({ preventScroll: true });
      }
      resolveDialog(confirmed);
    }

    function handleConfirmKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog(false);
        return;
      }

      if (event.key !== "Tab") return;
      const controls = focusableDialogControls();
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    cancelButton.addEventListener("click", () => closeDialog(false));
    confirmButton.addEventListener("click", () => closeDialog(true));
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closeDialog(false);
    });
    document.addEventListener("keydown", handleConfirmKeydown);
    document.body.appendChild(backdrop);
    activeDangerDialog = { promise, close: closeDialog };
    window.setTimeout(() => cancelButton.focus({ preventScroll: true }), 0);

    return promise;
  }

  function hasTrainingType(value, type) {
    return value === type || value === "mixed";
  }

  function trainingValueFromFlags(hasStrength, hasCardio) {
    if (hasStrength && hasCardio) return "mixed";
    if (hasStrength) return "strength";
    if (hasCardio) return "cardio";
    return "none";
  }

  function nextTrainingSelection(currentValue, selectedValue) {
    if (selectedValue === "none") return "none";

    const current = currentValue || "none";
    const hasStrength = hasTrainingType(current, "strength");
    const hasCardio = hasTrainingType(current, "cardio");
    const nextStrength = selectedValue === "strength" ? !hasStrength : hasStrength;
    const nextCardio = selectedValue === "cardio" ? !hasCardio : hasCardio;
    return trainingValueFromFlags(nextStrength, nextCardio);
  }

  function dayStatusLabel(day) {
    const activeDate = Storage.activeDayIso();
    if (day.savedAt) return `Histórico registrado - ${formatDate(day.date)}`;
    if (day.date === activeDate) return `Día activo - ${formatDate(day.date)}`;
    if (day.date < activeDate) return `Pendiente anterior - ${formatDate(day.date)}`;
    return `Siguiente día - ${formatDate(day.date)}`;
  }

  function getRenderContext() {
    const day = currentDay();
    const summary = Nutrition.summarizeDay(day, state.profile, state.foods);
    if (day.savedAt && day.nutritionSnapshot) {
      summary.total = day.nutritionSnapshot.total;
      summary.targets = day.nutritionSnapshot.targets || summary.targets;
      Object.assign(summary, Nutrition.buildSummaryInsights(summary.total, summary.targets, state.foods));
      if (day.nutritionSnapshot.kcalRange) summary.kcalRange = day.nutritionSnapshot.kcalRange;
      summary.aggregate.total = day.nutritionSnapshot.total;
      summary.aggregate.meals = summary.aggregate.meals.map((meal) => {
        const snapshotMeal = (day.nutritionSnapshot.meals || []).find((item) => item.id === meal.id);
        return snapshotMeal ? { ...meal, total: snapshotMeal.total } : meal;
      });
      summary.meals = summary.aggregate.meals;
    }

    return {
      day,
      profile: state.profile,
      foods: state.foods,
      activeFoods: activeFoods(),
      summary
    };
  }

  function render() {
    const isFoodView = uiState.view === "foods";
    const isProfileView = uiState.view === "profile";
    const context = getRenderContext();
    const isSavedHistory = Boolean(context.day.savedAt);
    const quickSearchWrap = refs.quickSearch.closest(".quick-search");
    const topbarIcon = isProfileView
      ? "profile"
      : isFoodView
      ? "foods"
      : ["goals", "history"].includes(uiState.activeNav)
      ? uiState.activeNav
      : "diary";
    document.body.classList.toggle("is-profile-view", isProfileView);
    document.body.dataset.topbarIcon = topbarIcon;
    refs.date.value = state.selectedDate;
    renderProfile();
    renderNavigation();
    renderQuickFoodList();
    syncSummaryView(context);
    syncEquivalencesView(context);
    renderAnalysis(context);
    refs.dayEyebrow.textContent = isProfileView ? "Perfil" : isFoodView ? "Biblioteca" : dayStatusLabel(context.day);
    refs.dayTitle.textContent = isProfileView ? "Editar perfil" : isFoodView ? "Gestionar alimentos" : "DIARIO DE COMIDAS";
    refs.dayContext.hidden = isFoodView || isProfileView;
    refs.macroCards.hidden = isFoodView || isProfileView;
    refs.mealWorkbench.hidden = isFoodView || isProfileView;
    refs.meals.hidden = isFoodView || isProfileView;
    refs.historyPanel.hidden = isFoodView || isProfileView;
    refs.dayInsights.hidden = isFoodView || isProfileView;
    refs.profileEditor.hidden = !isProfileView;
    refs.libraryPanel.hidden = !isFoodView;
    refs.summaryPanel.hidden = isProfileView;
    refs.saveDay.hidden = isFoodView || isProfileView || isSavedHistory;
    refs.quickSearch.disabled = isFoodView || isProfileView || isSavedHistory;
    if (quickSearchWrap) quickSearchWrap.hidden = isFoodView || isProfileView || isSavedHistory;
    if (refs.dateActions) refs.dateActions.hidden = isProfileView;

    if (isProfileView) {
      renderProfileEditor();
      return;
    }

    if (isFoodView) {
      renderFoodManager();
      return;
    }

    syncDayContextView(context);
    syncMacroCardsView(context);
    syncMealsView(context);
    renderHistory();
  }


  function renderProfile() {
    const rendered = ProfileRenderers.renderSidebarProfile({
      profile: state.profile,
      isEditing: uiState.view === "profile"
    });
    refs.profileTitle.textContent = rendered.title;
    refs.profilePanelContent.innerHTML = rendered.html;
  }

  function renderProfileEditor() {
    refs.profileEditor.innerHTML = ProfileRenderers.renderProfileEditor({ profile: state.profile });
  }

  function renderNavigation() {
    const activeNav = uiState.view === "profile"
      ? ""
      : uiState.view === "foods"
      ? "foods"
      : uiState.activeNav === "foods" ? "diary" : uiState.activeNav;

    refs.sideNav.querySelectorAll("button[data-nav]").forEach((button) => {
      const isActive = button.dataset.nav === activeNav;
      button.classList.toggle("is-active", isActive);
    });
  }

  function renderQuickFoodList() {
    refs.quickFoodList.innerHTML = sortFoods(activeFoods())
      .map((food) => `<option value="${escapeHtml(food.name)}"></option>`)
      .join("");
  }

  function activeFoods() {
    return state.foods.filter((food) => !food.deletedAt);
  }

  function selectedFoodIdForMeal(meal) {
    const foodId = uiState.selectedFoodByMealId.get(meal.id) || "";
    return activeFoods().some((food) => food.id === foodId) ? foodId : "";
  }

  function selectedFoodForMeal(meal) {
    const foodId = selectedFoodIdForMeal(meal);
    return foodId ? activeFoods().find((food) => food.id === foodId) : null;
  }

  function foodCombinationRecommendations(sourceFood, meal, limit = 4) {
    return FoodCombinations.recommend({
      sourceFood,
      meal,
      foods: activeFoods(),
      days: state.days,
      mealTemplates: state.mealTemplates,
      limit
    });
  }

  function frequentFoodSuggestions(limit = 5) {
    const activeById = new Map(activeFoods().map((food) => [food.id, food]));
    const stats = new Map();

    Object.values(state.days || {}).forEach((day) => {
      if (!day) return;
      (day.meals || []).forEach((meal) => {
        MealItems.list(meal).forEach((item) => {
          const food = activeById.get(item.foodId);
          const grams = Nutrition.number(item.grams);
          if (!food || grams <= 0) return;

          const roundedGrams = Math.max(5, Math.round(grams / 5) * 5);
          const stat = stats.get(food.id) || {
            food,
            count: 0,
            gramsCounts: new Map(),
            lastDate: ""
          };

          stat.count += 1;
          stat.gramsCounts.set(roundedGrams, (stat.gramsCounts.get(roundedGrams) || 0) + 1);
          stat.lastDate = String(day.date || "") > stat.lastDate ? String(day.date || "") : stat.lastDate;
          stats.set(food.id, stat);
        });
      });
    });

    const suggestions = [...stats.values()]
      .map((stat) => {
        const [grams] = [...stat.gramsCounts.entries()]
          .sort((a, b) => b[1] - a[1] || b[0] - a[0])[0] || [100];
        return {
          food: stat.food,
          grams,
          count: stat.count,
          lastDate: stat.lastDate
        };
      })
      .sort((a, b) => b.count - a.count
        || String(b.lastDate).localeCompare(String(a.lastDate))
        || a.food.name.localeCompare(b.food.name, "es", { sensitivity: "base" }))
      .slice(0, limit);

    if (suggestions.length >= limit) return suggestions;

    sortFoods(activeFoods().filter((food) => food.favorite))
      .forEach((food) => {
        if (suggestions.some((item) => item.food.id === food.id)) return;
        suggestions.push({
          food,
          grams: 100,
          count: 0,
          lastDate: ""
        });
      });

    return suggestions.slice(0, limit);
  }

  function selectedFoodByMealIdForRender(active = activeFoods()) {
    const activeIds = new Set(active.map((food) => food.id));
    const selected = new Map();
    uiState.selectedFoodByMealId.forEach((foodId, mealId) => {
      if (activeIds.has(foodId)) selected.set(mealId, foodId);
    });
    return selected;
  }

  function mealTemplatesForRender() {
    return (state.mealTemplates || []).map((template) => ({
      ...template,
      total: mealTemplateTotal(template),
      itemCount: (template.items || []).length,
      hasSnapshot: Array.isArray(template.itemSnapshots) && template.itemSnapshots.length
    }));
  }

  function savedTemplateMealIdsForRender(day) {
    const ids = new Set();
    (day.meals || []).forEach((meal) => {
      const items = mealTemplateItemsFromMeal(meal);
      if (findMealTemplateBySignature(items)) ids.add(meal.id);
    });
    return ids;
  }

  function targetMealForFrequentFood(day) {
    let meal = day.meals.find((item) => !MealItems.list(item).length)
      || [...day.meals].reverse().find((item) => MealItems.list(item).length)
      || day.meals[0];

    if (!meal) {
      meal = createMeal("Comida 1");
      day.meals.push(meal);
    }

    return meal;
  }

  function targetMealNameForFrequentFood(day) {
    const meals = Array.isArray(day.meals) ? day.meals : [];
    const meal = meals.find((item) => !MealItems.list(item).length)
      || [...meals].reverse().find((item) => MealItems.list(item).length)
      || meals[0];
    return meal?.name || "la comida";
  }

  function recommendationContextForRender(day) {
    const selectedMeal = (day.meals || []).find((meal) => uiState.addFoodMealIds.has(meal.id) && selectedFoodForMeal(meal));
    if (selectedMeal) {
      return {
        meal: selectedMeal,
        sourceFood: selectedFoodForMeal(selectedMeal),
        item: { id: "" },
        sourceContext: "selected-food",
        eyebrow: "Para esta comida",
        titlePrefix: "Combina con"
      };
    }

    const focus = uiState.recommendationFocus;
    if (focus) {
      const meal = (day.meals || []).find((item) => item.id === focus.mealId);
      const item = meal ? MealItems.list(meal).find((mealItem) => mealItem.id === focus.itemId && mealItem.foodId === focus.foodId) : null;
      const sourceFood = item ? activeFoods().find((food) => food.id === item.foodId) : null;
      if (meal && item && sourceFood) {
        return {
          meal,
          sourceFood,
          item,
          sourceContext: "meal-item",
          eyebrow: "Ahora",
          titlePrefix: "Combina con"
        };
      }
    }

    for (let index = (day.meals || []).length - 1; index >= 0; index -= 1) {
      const meal = day.meals[index];
      const items = MealItems.list(meal);
      for (let itemIndex = items.length - 1; itemIndex >= 0; itemIndex -= 1) {
        const item = items[itemIndex];
        const sourceFood = activeFoods().find((food) => food.id === item.foodId);
        if (sourceFood) {
          return {
            meal,
            sourceFood,
            item,
            sourceContext: "meal-item",
            eyebrow: "Ahora",
            titlePrefix: "Combina con"
          };
        }
      }
    }

    return null;
  }

  function smartFoodSuggestionForRender(day) {
    const context = recommendationContextForRender(day);
    if (context) {
      const recommendations = foodCombinationRecommendations(context.sourceFood, context.meal, 4);
      if (recommendations.length) {
        return {
          type: "contextual",
          mealId: context.meal.id,
          title: `${context.titlePrefix} ${context.sourceFood.name}`,
          targetName: context.meal?.name || "la comida",
          sourceFoodId: context.sourceFood.id,
          sourceItemId: context.item.id || "",
          sourceContext: context.sourceContext,
          recommendations
        };
      }
    }

    const suggestions = frequentFoodSuggestions(5);
    if (!suggestions.length) return null;

    return {
      type: "frequent",
      targetName: targetMealNameForFrequentFood(day),
      suggestions
    };
  }

  function comboRecommendationsForRender(day) {
    if (!uiState.comboContext) return [];
    const meal = (day.meals || []).find((item) => item.id === uiState.comboContext.mealId);
    const item = meal ? MealItems.list(meal).find((mealItem) => mealItem.id === uiState.comboContext.itemId && mealItem.foodId === uiState.comboContext.foodId) : null;
    const food = item ? activeFoods().find((activeFood) => activeFood.id === item.foodId) : null;
    return meal && item && food ? foodCombinationRecommendations(food, meal, 4) : [];
  }

  function suggestionTargetMealLabel(day) {
    if (!day.meals.length) return "Comida 1";
    const meal = day.meals.find((item) => !MealItems.list(item).length)
      || day.meals[day.meals.length - 1];
    return meal?.name || "Comida";
  }

  function syncDayContextView(renderContext) {
    refs.dayContext.innerHTML = DiaryRenderers.renderDayContext({
      day: renderContext.day,
      profile: state.profile,
      summary: renderContext.summary,
      hasRecoverableClosedDay: hasRecoverableClosedDay(),
      recoverySourceDate: state.lastClosedDayRecovery?.sourceDate || "",
      previousDaySuggestion: previousDaySuggestion(renderContext.day)
    });
  }

  function syncMealsView(renderContext) {
    const active = activeFoods();
    refs.meals.innerHTML = DiaryRenderers.renderMeals({
      day: renderContext.day,
      summary: renderContext.summary,
      foods: state.foods,
      activeFoods: active,
      mealTemplates: mealTemplatesForRender(),
      selectedFoodByMealId: selectedFoodByMealIdForRender(active),
      collapsedMealIds: new Set(uiState.collapsedMealIds),
      addFoodMealIds: new Set(uiState.addFoodMealIds),
      comboContext: uiState.comboContext ? { ...uiState.comboContext } : null,
      comboRecommendations: comboRecommendationsForRender(renderContext.day),
      savedTemplateMealIds: savedTemplateMealIdsForRender(renderContext.day),
      smartSuggestion: smartFoodSuggestionForRender(renderContext.day)
    });
  }

  function syncSummaryView(renderContext) {
    refs.macroSummary.innerHTML = DiaryRenderers.renderSummary({
      day: renderContext.day,
      summary: renderContext.summary,
      showDiagnosisSuggestions: uiState.view !== "foods",
      targetMealName: suggestionTargetMealLabel(renderContext.day)
    });
  }

  function syncMacroCardsView(renderContext) {
    refs.macroCards.innerHTML = DiaryRenderers.renderMacroCards({
      summary: renderContext.summary
    });
  }

  function syncEquivalencesView(renderContext) {
    refs.equivalences.innerHTML = DiaryRenderers.renderEquivalences({
      summary: renderContext.summary
    });
  }


  function savedHistoryDaysForRender() {
    return Object.values(state.days)
      .filter((day) => day.savedAt)
      .map((day) => ({
        ...day,
        total: dayTotalForHistory(day)
      }));
  }

  function renderHistory() {
    refs.history.innerHTML = HistoryRenderers.renderHistory({
      days: savedHistoryDaysForRender()
    });
  }

  function renderAnalysis(renderContext) {
    refs.analysis.innerHTML = HistoryRenderers.renderAnalysis({
      days: savedHistoryDaysForRender(),
      targets: renderContext.summary.targets
    });
  }


  function filteredLibraryFoods() {
    return FoodLibraryRenderers.filterFoods({
      foods: activeFoods(),
      query: uiState.foodSearch
    });
  }

  function renderFoodManager() {
    const active = activeFoods();
    const foods = FoodLibraryRenderers.filterFoods({
      foods: active,
      query: uiState.foodSearch
    });

    refs.libraryPanel.innerHTML = FoodLibraryRenderers.renderManager({
      foods,
      activeCount: active.length,
      favoriteCount: active.filter((food) => food.favorite).length,
      query: uiState.foodSearch,
      editingFoodId: uiState.editingFoodId
    });
  }

  function renderManagedFoodList(foods = filteredLibraryFoods()) {
    return FoodLibraryRenderers.renderList({
      foods,
      editingFoodId: uiState.editingFoodId
    });
  }

  function addTotals(total, macros) {
    Object.keys(total).forEach((key) => {
      total[key] += Nutrition.number(macros[key]);
    });
    return total;
  }

  function handleProfileClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    event.preventDefault();

    if (button.dataset.action === "edit-profile") {
      uiState.view = "profile";
      uiState.editingFoodId = "";
      clearPendingUndo({ hideToast: true });
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (button.dataset.action === "toggle-library") {
      uiState.view = uiState.view === "foods" ? "diary" : "foods";
      uiState.editingFoodId = "";
      render();
    }
  }

  function handleProfileEditorChange(event) {
    if (event.target.name !== "avatarId") return;

    refs.profileEditor.querySelectorAll(".avatar-option").forEach((option) => {
      const input = option.querySelector("input[name='avatarId']");
      option.classList.toggle("is-selected", Boolean(input?.checked));
    });
  }

  function handleProfileEditorClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "discard-profile") {
      event.preventDefault();
      uiState.view = "diary";
      render();
      showToast("Cambios descartados.");
    }
  }

  function handleProfileEditorSubmit(event) {
    const form = event.target.closest("form[data-action='profile-editor']");
    if (!form) return;

    event.preventDefault();

    const data = new FormData(form);
    const numericFields = new Set(["age", "height", "weight", "trainingDays", "steps"]);
    const nextProfile = { ...state.profile };

    ["profileName", "sex", "activity", "goal", "avatarId"].forEach((name) => {
      const value = String(data.get(name) || "").trim();
      if (value) nextProfile[name] = value;
    });

    numericFields.forEach((name) => {
      nextProfile[name] = Nutrition.number(data.get(name));
    });

    nextProfile.profileName = String(nextProfile.profileName || "").trim() || "Mi perfil";
    if (!hasProfileAvatar(nextProfile.avatarId)) nextProfile.avatarId = profileAvatarId(nextProfile);

    state.profile = nextProfile;
    uiState.view = "diary";
    saveAndRender("Perfil guardado.");
  }

  function handleSideNavClick(event) {
    const button = event.target.closest("button[data-nav]");
    if (!button) return;

    const target = button.dataset.nav;
    clearPendingUndo({ hideToast: true });
    uiState.activeNav = target;

    if (target === "foods") {
      uiState.view = "foods";
      uiState.editingFoodId = "";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    uiState.view = "diary";
    uiState.editingFoodId = "";
    render();

    if (target === "goals") {
      document.querySelector(".summary-panel").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (target === "history") {
      refs.historyPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDayContextChange(event) {
    const field = event.target;
    if (!field.name) return;

    const day = currentDay();
    if (day.savedAt) {
      showToast("Los días guardados son de solo lectura.");
      syncDayContextView(getRenderContext());
      return;
    }

    if (field.name === "steps") {
      day.context.steps = field.value ? Nutrition.number(field.value) : "";
    } else {
      day.context[field.name] = field.value;
      if (field.name === "training" && field.value === "none") {
        day.context.intensity = "normal";
      }
    }
    saveAndRender();
  }

  function setDayContextOption(field, value) {
    const optionMap = {
      intensity: Data.INTENSITY_LEVELS
    };
    if (field !== "training" && (!optionMap[field] || !optionMap[field].some((item) => item.id === value))) return;
    if (field === "training" && !Data.TRAINING_TYPES.some((item) => item.id === value)) return;

    const day = currentDay();
    if (day.savedAt) {
      showToast("Los días guardados son de solo lectura.");
      syncDayContextView(getRenderContext());
      return;
    }

    if (field === "training") {
      const nextValue = nextTrainingSelection(day.context.training, value);
      if (day.context.training === nextValue) return;
      day.context.training = nextValue;
      if (nextValue === "none") {
        day.context.intensity = "normal";
      }
      saveAndRender();
      return;
    }

    if (field === "intensity" && day.context.training === "none") return;
    if (day.context[field] === value) return;

    day.context[field] = value;
    if (field === "training" && value === "none") {
      day.context.intensity = "normal";
    }
    saveAndRender();
  }

  function handleQuickSearch(event) {
    if (event.type === "keydown" && event.key !== "Enter") return;
    if (event.type === "keydown") event.preventDefault();
    applyQuickFoodSearch();
  }

  function applyQuickFoodSearch() {
    const query = String(refs.quickSearch.value || "").trim();
    if (!query) return;

    if (currentDay().savedAt) {
      showToast("Los días guardados son de solo lectura.");
      refs.quickSearch.value = "";
      return;
    }

    const normalized = Nutrition.normalize(query);
    const food = sortFoods(activeFoods()).find((item) => {
      const names = [item.name, ...(item.aliases || [])].map(Nutrition.normalize);
      return names.some((name) => name === normalized || name.includes(normalized));
    });

    if (!food) {
      showToast("No encuentro ese alimento en la biblioteca.");
      return;
    }

    const day = currentDay();
    if (!day.meals.length) day.meals.push(createMeal("Comida 1"));
    const meal = day.meals[0];
    uiState.view = "diary";
    uiState.activeNav = "diary";
    uiState.addFoodMealIds.add(meal.id);
    uiState.collapsedMealIds.delete(meal.id);
    uiState.selectedFoodByMealId.set(meal.id, food.id);
    render();

    const mealElement = refs.meals.querySelector(`[data-meal-id="${CSS.escape(meal.id)}"]`);
    const selectElement = mealElement ? mealElement.querySelector("select[name='foodId']") : null;
    const gramsInput = mealElement ? mealElement.querySelector("input[name='grams']") : null;
    if (selectElement) selectElement.value = food.id;
    if (gramsInput) gramsInput.focus();
    if (mealElement) mealElement.scrollIntoView({ behavior: "smooth", block: "center" });
    refs.quickSearch.value = "";
  }

  function handleMealSubmit(event) {
    const form = event.target.closest("form[data-action='add-item']");
    if (!form) return;

    event.preventDefault();
    if (currentDay().savedAt) {
      showToast("Los días guardados son de solo lectura.");
      return;
    }
    addItemFromForm(form);
  }

  function handleMealKeydown(event) {
    if (event.key !== "Enter") return;
    const field = event.target.closest("input[name='grams'], select[name='foodId']");
    if (!field) return;

    const form = field.closest("form[data-action='add-item']");
    if (!form) return;

    event.preventDefault();
    if (currentDay().savedAt) {
      showToast("Los días guardados son de solo lectura.");
      return;
    }
    addItemFromForm(form);
  }

  function parseGramsValue(value) {
    const match = String(value || "")
      .replace(",", ".")
      .match(/\d+(?:\.\d+)?/);
    return match ? Nutrition.number(match[0]) : 0;
  }

  function addItemFromForm(form) {
    const mealId = form.dataset.mealId;
    const foodSelect = form.querySelector("select[name='foodId']");
    const gramsInput = form.querySelector("input[name='grams']");
    const foodId = foodSelect ? foodSelect.value : "";
    const grams = gramsInput ? parseGramsValue(gramsInput.value) : 0;
    const food = activeFoods().find((item) => item.id === foodId);

    if (!food || grams <= 0) {
      showToast("Selecciona una comida y añade el peso en gramos.");
      return;
    }

    const meal = currentDay().meals.find((item) => item.id === mealId);
    if (!meal) return;

    const item = addFoodToMeal(meal, food, grams);

    uiState.recommendationFocus = {
      mealId: meal.id,
      itemId: item.id,
      foodId: item.foodId
    };
    uiState.comboContext = null;
    uiState.selectedFoodByMealId.delete(meal.id);
    gramsInput.value = "";
    if (foodSelect) foodSelect.focus();
    saveAndRender(`${formatMacro(grams)}g ${food.name} añadido.`);
  }

  function addFoodToMeal(meal, food, grams) {
    const item = DiagnosisActions.addFoodToMeal(meal, food, grams, () => Storage.uid("item"));
    uiState.addFoodMealIds.add(meal.id);
    uiState.collapsedMealIds.delete(meal.id);
    return item;
  }

  function targetMealForSuggestion(day) {
    return DiagnosisActions.targetMealForSuggestion(day, createMeal);
  }

  function addDiagnosisSuggestion(foodId, gramsValue) {
    const day = currentDay();
    if (day.savedAt) {
      showToast("Los días guardados son de solo lectura.");
      return false;
    }

    const food = activeFoods().find((item) => item.id === foodId);
    const grams = parseGramsValue(gramsValue);
    if (!food || grams <= 0) {
      showToast("Esa sugerencia ya no está disponible.");
      return false;
    }

    const { meal, createdMeal } = targetMealForSuggestion(day);
    const item = addFoodToMeal(meal, food, grams);
    uiState.recommendationFocus = {
      mealId: meal.id,
      itemId: item.id,
      foodId: item.foodId
    };
    uiState.comboContext = null;
    saveAndRender();
    setPendingUndo({
      id: Storage.uid("undo"),
      type: "diagnostic-add-item",
      date: state.selectedDate,
      payload: {
        mealId: meal.id,
        itemId: item.id,
        createdMeal
      },
      successMessage: "Sugerencia retirada.",
      failureMessage: "No se pudo deshacer porque el alimento ya cambió."
    }, `Sugerencia añadida a ${meal.name}.`);
    return true;
  }

  function saveMealTemplate(meal) {
    const items = mealTemplateItemsFromMeal(meal);
    if (!items.length) {
      showToast("Añade alimentos antes de guardar la comida.");
      return;
    }

    const now = new Date().toISOString();
    const name = String(meal.name || "").trim() || "Comida guardada";
    const existing = findMealTemplateBySignature(items);
    const itemSnapshots = buildMealTemplateSnapshots(items);

    if (existing) {
      existing.name = name;
      existing.items = items;
      existing.itemSnapshots = itemSnapshots;
      existing.updatedAt = now;
      saveAndRender("Comida guardada actualizada.");
      return;
    }

    state.mealTemplates = [
      {
        id: Storage.uid("meal-template"),
        name,
        items,
        itemSnapshots,
        createdAt: now,
        updatedAt: now
      },
      ...(state.mealTemplates || [])
    ];
    saveAndRender("Comida guardada.");
  }

  function mealTemplateById(templateId) {
    return (state.mealTemplates || []).find((template) => template.id === templateId);
  }

  function insertMealTemplate(templateId) {
    const template = mealTemplateById(templateId);
    if (!template) return;

    const items = cloneTemplateItems(template);
    if (!items.length) {
      showToast("Esa comida guardada no tiene alimentos.");
      return;
    }

    const day = currentDay();
    const emptyMeal = day.meals.find((meal) => !MealItems.list(meal).length);
    const meal = emptyMeal || createMeal(template.name, true);
    meal.name = template.name;
    meal.manuallyAdded = true;
    MealItems.set(meal, items);

    if (!emptyMeal) day.meals.push(meal);

    uiState.view = "diary";
    uiState.activeNav = "diary";
    uiState.addFoodMealIds.delete(meal.id);
    uiState.collapsedMealIds.delete(meal.id);
    uiState.selectedFoodByMealId.delete(meal.id);
    saveAndRender(`${template.name} añadida.`);
  }

  async function removeMealTemplate(templateId) {
    const template = mealTemplateById(templateId);
    if (!template) return;
    if (!(await confirmDanger(`Eliminar ${template.name} de comidas guardadas?`))) return;

    state.mealTemplates = (state.mealTemplates || []).filter((item) => item.id !== templateId);
    saveAndRender("Comida guardada eliminada.");
  }

  async function handleMealsClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const readOnlyActions = new Set([
      "add-food",
      "add-food-combo",
      "add-meal",
      "add-frequent-food",
      "insert-meal-template",
      "remove-item",
      "remove-meal",
      "remove-meal-template",
      "save-meal-template",
      "toggle-add-food"
    ]);

    if (currentDay().savedAt && readOnlyActions.has(button.dataset.action)) {
      showToast("Los días guardados son de solo lectura.");
      return;
    }

    const templateElement = event.target.closest("[data-template-id]");
    const templateId = templateElement ? templateElement.dataset.templateId : "";

    if (button.dataset.action === "insert-meal-template") {
      insertMealTemplate(templateId);
      return;
    }

    if (button.dataset.action === "remove-meal-template") {
      await removeMealTemplate(templateId);
      return;
    }

    if (button.dataset.action === "add-frequent-food") {
      const day = currentDay();
      const food = activeFoods().find((item) => item.id === button.dataset.foodId);
      const grams = parseGramsValue(button.dataset.grams);
      if (!food || grams <= 0) return;

      const meal = targetMealForFrequentFood(day);
      const item = addFoodToMeal(meal, food, grams);
      uiState.recommendationFocus = {
        mealId: meal.id,
        itemId: item.id,
        foodId: item.foodId
      };
      uiState.comboContext = null;
      uiState.addFoodMealIds.delete(meal.id);
      saveAndRender(`${food.name} añadido a ${meal.name}.`);
      return;
    }

    if (button.dataset.action === "add-meal") {
      addMeal();
      return;
    }

    if (button.dataset.action === "add-food") {
      const form = button.closest("form[data-action='add-item']");
      if (!form) return;
      addItemFromForm(form);
      return;
    }

    const mealElement = event.target.closest("[data-meal-id]");
    const mealId = mealElement ? mealElement.dataset.mealId : "";
    const day = currentDay();
    const meal = day.meals.find((item) => item.id === mealId);

    if (button.dataset.action === "show-food-combos" && meal) {
      const itemId = button.dataset.itemId || event.target.closest("[data-item-id]")?.dataset.itemId || "";
      const item = MealItems.list(meal).find((mealItem) => mealItem.id === itemId);
      if (!item) return;

      const sameContext = uiState.comboContext
        && uiState.comboContext.mealId === meal.id
        && uiState.comboContext.itemId === item.id
        && uiState.comboContext.foodId === item.foodId;

      uiState.comboContext = sameContext ? null : {
        mealId: meal.id,
        itemId: item.id,
        foodId: item.foodId
      };
      uiState.recommendationFocus = sameContext ? null : {
        mealId: meal.id,
        itemId: item.id,
        foodId: item.foodId
      };
      syncMealsView(getRenderContext());
      return;
    }

    if (button.dataset.action === "add-food-combo" && meal) {
      const food = activeFoods().find((item) => item.id === button.dataset.foodId);
      const grams = parseGramsValue(button.dataset.grams);
      if (!food || grams <= 0) {
        showToast("Esa combinación ya no está disponible.");
        return;
      }

      const item = addFoodToMeal(meal, food, grams);
      if (button.dataset.sourceContext === "selected-food") {
        uiState.recommendationFocus = {
          mealId: meal.id,
          itemId: item.id,
          foodId: item.foodId
        };
        uiState.selectedFoodByMealId.set(meal.id, button.dataset.sourceFoodId || "");
        uiState.addFoodMealIds.add(meal.id);
        uiState.comboContext = null;
      } else {
        const sourceItem = MealItems.list(meal).find((mealItem) => mealItem.id === button.dataset.sourceItemId) || item;
        uiState.recommendationFocus = {
          mealId: meal.id,
          itemId: sourceItem.id,
          foodId: sourceItem.foodId
        };
        uiState.comboContext = {
          mealId: meal.id,
          itemId: sourceItem.id,
          foodId: sourceItem.foodId
        };
      }
      saveAndRender(`${food.name} añadido a ${meal.name}.`);
      return;
    }

    if (button.dataset.action === "save-meal-template" && meal) {
      saveMealTemplate(meal);
      return;
    }

    if (button.dataset.action === "toggle-meal" && meal) {
      if (uiState.collapsedMealIds.has(mealId)) {
        uiState.collapsedMealIds.delete(mealId);
      } else {
        uiState.collapsedMealIds.add(mealId);
      }
      syncMealsView(getRenderContext());
      return;
    }

    if (button.dataset.action === "toggle-add-food" && meal) {
      uiState.addFoodMealIds.add(mealId);
      syncMealsView(getRenderContext());
      return;
    }

    if (button.dataset.action === "remove-item" && meal) {
      const itemId = event.target.closest("[data-item-id]").dataset.itemId;
      const items = MealItems.list(meal);
      const itemIndex = items.findIndex((item) => item.id === itemId);
      if (itemIndex < 0) return;

      const removedItem = cloneValue(items[itemIndex]);
      MealItems.set(meal, items.filter((item) => item.id !== itemId));
      if (uiState.comboContext?.mealId === mealId && uiState.comboContext?.itemId === itemId) {
        uiState.comboContext = null;
      }
      if (uiState.recommendationFocus?.mealId === mealId && uiState.recommendationFocus?.itemId === itemId) {
        uiState.recommendationFocus = null;
      }
      saveAndRender();
      setPendingUndo({
        id: Storage.uid("undo"),
        type: "remove-item",
        date: state.selectedDate,
        payload: {
          mealId,
          itemIndex,
          item: removedItem
        }
      }, "Alimento retirado.");
    }

    if (button.dataset.action === "remove-meal" && meal) {
      if (day.meals.length <= 1) {
        const items = MealItems.list(meal);
        if (!items.length) {
          uiState.addFoodMealIds.delete(mealId);
          uiState.collapsedMealIds.delete(mealId);
          uiState.selectedFoodByMealId.delete(mealId);
          uiState.comboContext = null;
          uiState.recommendationFocus = null;
          saveAndRender("Comida vacía y lista.");
          return;
        }

        if (!(await confirmDanger(`Vaciar ${meal.name}?`))) return;

        const removedItems = cloneValue(items);
        MealItems.set(meal, []);
        uiState.addFoodMealIds.delete(mealId);
        uiState.collapsedMealIds.delete(mealId);
        uiState.selectedFoodByMealId.delete(mealId);
        if (uiState.comboContext?.mealId === mealId) {
          uiState.comboContext = null;
        }
        if (uiState.recommendationFocus?.mealId === mealId) {
          uiState.recommendationFocus = null;
        }
        saveAndRender();
        setPendingUndo({
          id: Storage.uid("undo"),
          type: "clear-meal",
          date: state.selectedDate,
          payload: {
            mealId,
            items: removedItems
          },
          successMessage: "Comida recuperada.",
          failureMessage: "No se pudo deshacer porque la comida ya cambió."
        }, "Comida vaciada.");
        return;
      }
      if (MealItems.list(meal).length && !(await confirmDanger(`Eliminar ${meal.name}?`))) return;
      const mealIndex = day.meals.findIndex((item) => item.id === mealId);
      if (mealIndex < 0) return;
      const removedMeal = cloneValue(meal);
      day.meals = day.meals.filter((item) => item.id !== mealId);
      uiState.addFoodMealIds.delete(mealId);
      uiState.collapsedMealIds.delete(mealId);
      uiState.selectedFoodByMealId.delete(mealId);
      if (uiState.recommendationFocus?.mealId === mealId) {
        uiState.recommendationFocus = null;
      }
      saveAndRender();
      setPendingUndo({
        id: Storage.uid("undo"),
        type: "remove-meal",
        date: state.selectedDate,
        payload: {
          mealIndex,
          meal: removedMeal
        }
      }, "Comida eliminada.");
    }
  }

  function handleSummaryClick(event) {
    const button = event.target.closest("button[data-action='add-diagnosis-suggestion']");
    if (!button) return;

    button.disabled = true;
    button.textContent = "Añadiendo...";
    if (!addDiagnosisSuggestion(button.dataset.foodId, button.dataset.grams)) {
      button.disabled = false;
      button.textContent = "Añadir";
    }
  }

  function handleMealChange(event) {
    const foodSelect = event.target.closest("select[name='foodId']");
    if (foodSelect) {
      const mealElement = event.target.closest("[data-meal-id]");
      const mealId = mealElement ? mealElement.dataset.mealId : "";
      if (!mealId) return;

      if (currentDay().savedAt) {
        showToast("Los días guardados son de solo lectura.");
        syncMealsView(getRenderContext());
        return;
      }

      if (foodSelect.value) {
        uiState.selectedFoodByMealId.set(mealId, foodSelect.value);
        uiState.recommendationFocus = null;
      } else {
        uiState.selectedFoodByMealId.delete(mealId);
        uiState.recommendationFocus = null;
      }
      syncMealsView(getRenderContext());
      return;
    }

    const input = event.target.closest("[data-action='rename-meal']");
    if (!input) return;

    if (currentDay().savedAt) {
      showToast("Los días guardados son de solo lectura.");
      syncMealsView(getRenderContext());
      return;
    }

    const mealId = event.target.closest("[data-meal-id]").dataset.mealId;
    const meal = currentDay().meals.find((item) => item.id === mealId);
    if (!meal) return;
    meal.name = input.value.trim() || "Comida";
    saveAndRender();
  }

  function handleLibraryInput(event) {
    if (event.target.name !== "foodSearch") return;
    uiState.foodSearch = event.target.value;
    const list = refs.libraryPanel.querySelector(".food-card-list");
    if (list) list.innerHTML = renderManagedFoodList();
  }

  async function handleLibraryClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const card = button.closest("[data-food-id]");
    const foodId = card ? card.dataset.foodId : "";
    const food = state.foods.find((item) => item.id === foodId);

    if (button.dataset.action === "toggle-favorite" && food) {
      food.favorite = !food.favorite;
      saveAndRender(food.favorite ? "Favorito añadido." : "Favorito quitado.");
      return;
    }

    if (button.dataset.action === "edit-food" && food) {
      uiState.editingFoodId = food.id;
      renderFoodManager();
      return;
    }

    if (button.dataset.action === "cancel-edit-food") {
      uiState.editingFoodId = "";
      renderFoodManager();
      return;
    }

    if (button.dataset.action === "delete-food" && food) {
      if (!(await confirmDanger(`Eliminar ${food.name} de la biblioteca?`))) return;
      food.deletedAt = new Date().toISOString();
      if (uiState.editingFoodId === food.id) uiState.editingFoodId = "";
      saveAndRender("Alimento ocultado de la biblioteca.");
    }
  }

  function handleLibrarySubmit(event) {
    const form = event.target.closest("form.library-form");
    if (!form) return;

    event.preventDefault();
    const foodData = readFoodForm(form);
    if (!foodData) return;

    if (form.dataset.action === "create-food") {
      createOrReactivateFood(foodData, form);
      return;
    }

    if (form.dataset.action === "update-food") {
      updateFood(form.dataset.foodId, foodData);
    }
  }

  function readFoodForm(form) {
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const requiredNumeric = ["kcal", "protein", "carbs", "fat"];

    if (!name) {
      showToast("Añade un nombre para el alimento.");
      return null;
    }

    if (requiredNumeric.some((key) => String(data.get(key) || "").trim() === "")) {
      showToast("Completa kcal, proteína, carbohidratos y grasas.");
      return null;
    }

    const food = {
      name,
      aliases: [name],
      kcal: Nutrition.number(data.get("kcal")),
      protein: Nutrition.number(data.get("protein")),
      carbs: Nutrition.number(data.get("carbs")),
      fat: Nutrition.number(data.get("fat")),
      fiber: Nutrition.number(data.get("fiber")),
      servingLabel: String(data.get("servingLabel") || "").trim() || "ración",
      servingGrams: Math.max(Nutrition.number(data.get("servingGrams"), 100), 1),
      deletedAt: ""
    };

    if ([food.kcal, food.protein, food.carbs, food.fat, food.fiber].some((value) => value < 0)) {
      showToast("Los valores nutricionales no pueden ser negativos.");
      return null;
    }

    return food;
  }

  function createOrReactivateFood(foodData, form) {
    const conflict = findFoodByNameValue(foodData.name, { onlyActive: true });
    if (conflict) {
      showToast("Ese alimento ya existe en la biblioteca.");
      return;
    }

    const deletedMatch = findFoodByNameValue(foodData.name, { onlyDeleted: true });
    if (deletedMatch) {
      Object.assign(deletedMatch, foodData, {
        favorite: Boolean(deletedMatch.favorite),
        deletedAt: ""
      });
      form.reset();
      saveAndRender("Alimento reactivado.");
      return;
    }

    state.foods.push({
      id: `custom-${Nutrition.normalize(foodData.name).replace(/[^a-z0-9]+/g, "-")}-${Storage.uid("food")}`,
      favorite: false,
      ...foodData
    });

    form.reset();
    saveAndRender("Alimento guardado.");
  }

  function updateFood(foodId, foodData) {
    const food = state.foods.find((item) => item.id === foodId);
    if (!food) return;

    const conflict = findFoodByNameValue(foodData.name, { onlyActive: true, excludeId: foodId });
    if (conflict) {
      showToast("Ese nombre ya lo usa otro alimento.");
      return;
    }

    Object.assign(food, foodData, {
      favorite: Boolean(food.favorite),
      deletedAt: ""
    });
    uiState.editingFoodId = "";
    saveAndRender("Alimento actualizado.");
  }

  function findFoodByNameValue(name, options = {}) {
    const normalized = Nutrition.normalize(name);
    return state.foods.find((food) => {
      if (options.excludeId && food.id === options.excludeId) return false;
      if (options.onlyActive && food.deletedAt) return false;
      if (options.onlyDeleted && !food.deletedAt) return false;
      return Nutrition.normalize(food.name) === normalized;
    });
  }

  function repeatTargetDate() {
    const selectedDay = state.days[state.selectedDate];
    if (selectedDay && !selectedDay.savedAt) return state.selectedDate;

    const activeDate = Storage.activeDayIso();
    const activeDay = state.days[activeDate];
    if (!activeDay || !activeDay.savedAt) return activeDate;

    return nextCleanDateAfter(activeDate);
  }

  function editableDayForDate(date) {
    if (!state.days[date]) {
      state.days[date] = Storage.createDay(date, Data.DEFAULT_MEALS);
    }
    state.days[date].date = state.days[date].date || date;
    normalizeDay(state.days[date]);
    return state.days[date];
  }

  function repeatSavedDay(date) {
    const sourceDay = state.days[date];
    if (!sourceDay || !sourceDay.savedAt) {
      showToast("Ese día no está guardado.");
      return;
    }

    const { meals, fallbackCount } = cloneSavedDayMealsForActiveDay(sourceDay);
    if (!meals.length) {
      showToast("Ese día no tiene comidas para repetir.");
      return;
    }

    const targetDate = repeatTargetDate();
    const targetDay = editableDayForDate(targetDate);
    if (targetDay.savedAt) {
      showToast("Abre un día editable para repetir comidas.");
      return;
    }

    const targetHadContent = dayHasContent(targetDay);
    targetDay.meals = targetHadContent
      ? [...targetDay.meals, ...meals]
      : meals;

    state.selectedDate = targetDate;
    uiState.view = "diary";
    uiState.activeNav = "diary";
    resetDayUiState();

    const message = fallbackCount
      ? "Día repetido con datos guardados disponibles."
      : targetHadContent ? "Comidas añadidas al día actual." : "Día repetido en el diario actual.";
    saveAndRender(message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleHistoryClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "load-day") {
      clearPendingUndo({ hideToast: true });
      state.selectedDate = button.dataset.date;
      saveAndRender();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (button.dataset.action === "repeat-day") {
      repeatSavedDay(button.dataset.date);
    }
  }

  function resetDayUiState() {
    uiState.addFoodMealIds.clear();
    uiState.collapsedMealIds.clear();
    uiState.selectedFoodByMealId.clear();
    uiState.comboContext = null;
    uiState.recommendationFocus = null;
    clearPendingUndo({ hideToast: true });
    refs.quickSearch.value = "";
  }

  function cloneDayForDate(day, date) {
    const clone = JSON.parse(JSON.stringify(day));
    clone.date = date;
    normalizeDay(clone);
    return clone;
  }

  function moveSelectedDayToDate(targetDate) {
    const sourceDate = state.selectedDate;
    if (sourceDate === targetDate) return true;

    if (!dayCanBeReplaced(targetDate)) {
      showToast(`${formatDate(targetDate)} ya tiene datos.`);
      return false;
    }

    const sourceDay = currentDay();
    state.days[targetDate] = cloneDayForDate(sourceDay, targetDate);
    state.days[sourceDate] = Storage.createDay(sourceDate, Data.DEFAULT_MEALS);
    resetDayUiState();
    return true;
  }

  function usePreviousDay() {
    const previousDate = Storage.addDaysIso(state.selectedDate, -1);
    if (!moveSelectedDayToDate(previousDate)) return;
    state.selectedDate = previousDate;
    saveAndRender(`Registro movido a ${formatDate(previousDate)}.`);
  }

  function moveRegisteredDayToPrevious() {
    const sourceDate = state.selectedDate;
    const previousDate = Storage.addDaysIso(sourceDate, -1);
    if (!moveSelectedDayToDate(previousDate)) return;
    state.selectedDate = sourceDate;
    saveAndRender(`Día movido a ${formatDate(previousDate)}. Hoy queda limpio.`);
  }

  function registerPreviousDay() {
    const previousDate = Storage.addDaysIso(state.selectedDate, -1);
    if (!moveSelectedDayToDate(previousDate)) return;
    state.selectedDate = previousDate;
    registerDay();
  }

  function recoverLastClosedDay() {
    if (!hasRecoverableClosedDay()) {
      showToast("No hay un día cerrado para recuperar.");
      return;
    }

    const day = currentDay();
    if (day.savedAt) {
      showToast("Abre un día editable para recuperar comidas.");
      return;
    }

    const meals = cloneRecoveryMeals(state.lastClosedDayRecovery);
    if (!meals.length) {
      state.lastClosedDayRecovery = null;
      saveAndRender("No hay comidas que recuperar.");
      return;
    }

    const targetHadContent = dayHasContent(day);
    day.savedAt = "";
    delete day.nutritionSnapshot;
    day.meals = targetHadContent
      ? [...day.meals, ...meals]
      : meals;

    state.lastClosedDayRecovery = null;
    uiState.view = "diary";
    uiState.activeNav = "diary";
    resetDayUiState();
    saveAndRender(targetHadContent
      ? "Último día cerrado añadido como copia editable."
      : "Último día cerrado recuperado como copia editable.");
  }

  function registerDay() {
    const day = currentDay();
    if (day.savedAt) {
      showToast("Este día ya está guardado en el historial.");
      return;
    }

    if (!dayHasLoggedFood(day)) {
      showToast("No hay comidas que guardar.");
      return;
    }

    day.savedAt = new Date().toISOString();
    day.nutritionSnapshot = buildNutritionSnapshot(day);
    state.lastClosedDayRecovery = buildLastClosedDayRecovery(day);

    const nextDate = nextCleanDateAfter(day.date);
    state.days[nextDate] = Storage.createDay(nextDate, Data.DEFAULT_MEALS);

    state.selectedDate = nextDate;
    uiState.view = "diary";
    uiState.activeNav = "diary";
    resetDayUiState();
    saveAndRender(`Día guardado: ${formatDate(day.date)}. ${formatDate(nextDate)} queda limpio.`);
  }

  function addMeal() {
    const day = currentDay();
    const meal = createMeal(`Comida ${day.meals.length + 1}`, true);
    day.meals.push(meal);
    uiState.addFoodMealIds.add(meal.id);
    saveAndRender("Comida añadida.");
  }

  function changeDate(event) {
    clearPendingUndo({ hideToast: true });
    state.selectedDate = event.target.value || Storage.activeDayIso();
    currentDay();
    saveAndRender();
  }

  function handleDayContextClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "set-day-context") {
      setDayContextOption(button.dataset.field, button.dataset.value);
      return;
    }

    if (button.dataset.action === "use-previous-day") {
      usePreviousDay();
      return;
    }

    if (button.dataset.action === "register-previous-day") {
      registerPreviousDay();
      return;
    }

    if (button.dataset.action === "move-to-previous-day") {
      moveRegisteredDayToPrevious();
      return;
    }

    if (button.dataset.action === "recover-last-closed-day") {
      recoverLastClosedDay();
    }
  }

  refs.profilePanelContent.addEventListener("click", handleProfileClick);
  refs.profileEditor.addEventListener("click", handleProfileEditorClick);
  refs.profileEditor.addEventListener("change", handleProfileEditorChange);
  refs.profileEditor.addEventListener("submit", handleProfileEditorSubmit);
  refs.sideNav.addEventListener("click", handleSideNavClick);
  refs.quickSearch.addEventListener("change", handleQuickSearch);
  refs.quickSearch.addEventListener("keydown", handleQuickSearch);
  refs.dayContext.addEventListener("click", handleDayContextClick);
  refs.dayContext.addEventListener("change", handleDayContextChange);
  refs.meals.addEventListener("submit", handleMealSubmit);
  refs.meals.addEventListener("keydown", handleMealKeydown);
  refs.meals.addEventListener("click", handleMealsClick);
  refs.meals.addEventListener("change", handleMealChange);
  refs.macroSummary.addEventListener("click", handleSummaryClick);
  refs.libraryPanel.addEventListener("click", handleLibraryClick);
  refs.libraryPanel.addEventListener("input", handleLibraryInput);
  refs.libraryPanel.addEventListener("submit", handleLibrarySubmit);
  refs.history.addEventListener("click", handleHistoryClick);
  refs.saveDay.addEventListener("click", registerDay);
  refs.date.addEventListener("change", changeDate);

  initializeSelectedDate();
  saveAndRender();
})();
