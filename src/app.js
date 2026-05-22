(function () {
  const Storage = window.LeftEatStorage;
  const Nutrition = window.LeftEatNutrition;
  const Data = window.LeftEatData;
  const Icons = window.LeftEatIcons;

  let state = Storage.load();
  const uiState = {
    profileOpen: false,
    addFoodMealIds: new Set(),
    collapsedMealIds: new Set(),
    view: "diary",
    activeNav: "diary",
    editingFoodId: "",
    foodSearch: ""
  };

  const refs = {
    date: document.getElementById("day-date"),
    saveDay: document.getElementById("save-day"),
    dayEyebrow: document.getElementById("day-eyebrow"),
    dayTitle: document.getElementById("day-title"),
    profileTitle: document.getElementById("profile-title"),
    profileForm: document.getElementById("profile-form"),
    sideNav: document.getElementById("side-nav"),
    quickSearch: document.getElementById("quick-food-search"),
    quickFoodList: document.getElementById("quick-food-list"),
    dayContext: document.getElementById("day-context"),
    macroCards: document.getElementById("macro-cards"),
    meals: document.getElementById("meals"),
    libraryPanel: document.getElementById("food-library"),
    historyPanel: document.querySelector(".history-panel"),
    macroSummary: document.getElementById("macro-summary"),
    equivalences: document.getElementById("equivalences"),
    history: document.getElementById("history"),
    analysis: document.getElementById("analysis"),
    toast: document.getElementById("toast")
  };

  function currentDay() {
    if (!state.days[state.selectedDate]) {
      state.days[state.selectedDate] = Storage.createDay(state.selectedDate, Data.DEFAULT_MEALS);
    }
    normalizeDay(state.days[state.selectedDate]);
    return state.days[state.selectedDate];
  }

  function normalizeDay(day) {
    day.context = {
      training: "none",
      intensity: "normal",
      steps: "",
      ...(day.context || {})
    };
    day.meals = Array.isArray(day.meals) ? day.meals : [];
    day.meals.forEach((meal) => {
      ensureMealItems(meal);
    });

    const mealsWithFoods = day.meals.filter((meal) => mealFoods(meal).length);
    if (mealsWithFoods.length) {
      day.meals = day.meals.filter((meal) => mealFoods(meal).length || meal.manuallyAdded);
      return;
    }

    day.meals = [
      day.meals[0] || createMeal("Comida 1"),
      ...day.meals.slice(1).filter((meal) => meal.manuallyAdded)
    ];
  }

  function createMeal(name, manuallyAdded = false) {
    return {
      id: Storage.uid("meal"),
      name,
      items: [],
      manuallyAdded
    };
  }

  function mealFoods(meal) {
    return Array.isArray(meal.foods)
      ? meal.foods
      : Array.isArray(meal.items) ? meal.items : [];
  }

  function ensureMealItems(meal) {
    meal.items = Array.isArray(meal.foods)
      ? meal.foods
      : Array.isArray(meal.items) ? meal.items : [];
    return meal.items;
  }

  function setMealFoods(meal, foods) {
    meal.items = foods;
    if (Array.isArray(meal.foods)) meal.foods = foods;
  }

  function persist() {
    Storage.save(state);
  }

  function saveAndRender(message) {
    persist();
    render();
    if (message) showToast(message);
  }

  function showToast(message) {
    refs.toast.textContent = message;
    refs.toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      refs.toast.classList.remove("is-visible");
    }, 2400);
  }

  function confirmDanger(message) {
    return window.confirm(message);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function selected(value, target) {
    return value === target ? "selected" : "";
  }

  function optionLabel(options, value) {
    return (options.find((item) => item.id === value) || options[0]).label;
  }

  function formatWithUnit(value, meta) {
    return `${formatMacro(value, meta.precision)} ${meta.unit}`;
  }

  function formatDate(iso) {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  }

  function formatMacro(value, precision = 0) {
    return Nutrition.formatNumber(value, precision);
  }

  function icon(name) {
    return Icons.icon(name);
  }

  function getRenderContext() {
    const day = currentDay();
    return {
      day,
      profile: state.profile,
      foods: state.foods,
      activeFoods: activeFoods(),
      summary: Nutrition.summarizeDay(day, state.profile, state.foods)
    };
  }

  function render() {
    const isFoodView = uiState.view === "foods";
    const context = getRenderContext();
    refs.date.value = state.selectedDate;
    renderProfile();
    renderNavigation();
    renderQuickFoodList();
    renderSummary(context);
    renderEquivalences(context);
    renderAnalysis(context);
    refs.dayEyebrow.textContent = isFoodView ? "Biblioteca" : "Hoy";
    refs.dayTitle.textContent = isFoodView ? "Gestionar alimentos" : "Diario de comidas";
    refs.dayContext.hidden = isFoodView;
    refs.macroCards.hidden = isFoodView;
    refs.meals.hidden = isFoodView;
    refs.historyPanel.hidden = isFoodView;
    refs.libraryPanel.hidden = !isFoodView;
    refs.quickSearch.disabled = isFoodView;

    if (isFoodView) {
      renderFoodManager();
      return;
    }

    renderDayContext(context);
    renderMacroCards(context);
    renderMeals(context);
    renderHistory();
  }

  function renderNavigation() {
    const activeNav = uiState.view === "foods"
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

  function renderProfile() {
    const profile = state.profile;
    const goal = optionLabel(Data.GOALS, profile.goal);
    const activity = optionLabel(Data.ACTIVITY_LEVELS, profile.activity);
    const profileName = String(profile.profileName || "").trim() || "Mi perfil";
    refs.profileTitle.textContent = profileName;
    refs.profileForm.innerHTML = `
      <div class="profile-summary">
        <div class="profile-identity">
          <span class="profile-avatar" aria-hidden="true">${icon("user")}</span>
          <div>
            <strong>${escapeHtml(profileName)}</strong>
            <span>${profile.sex === "female" ? "Mujer" : "Hombre"} · ${escapeHtml(profile.age)} años</span>
          </div>
        </div>
        <div class="profile-quick-stats">
          <span><strong>${escapeHtml(profile.weight)} kg</strong>Peso</span>
          <span><strong>${escapeHtml(profile.height)} cm</strong>Altura</span>
          <span><strong>${escapeHtml(profile.trainingDays)}/sem</strong>Entreno</span>
        </div>
        <p class="profile-context">${escapeHtml(goal)} · ${escapeHtml(activity)} · ${escapeHtml(profile.steps)} pasos</p>
      </div>
      <div class="profile-actions">
        <button class="quiet-action" type="button" data-action="toggle-profile">${uiState.profileOpen ? "Cerrar perfil" : "Editar perfil"}</button>
      </div>
      <div class="profile-edit ${uiState.profileOpen ? "" : "is-hidden"}">
        <div class="form-grid">
          <label class="field full">
            <span>Nombre</span>
            <input name="profileName" type="text" maxlength="40" value="${escapeHtml(profileName)}">
          </label>
          <label class="field">
            <span>Sexo</span>
            <select name="sex">
              <option value="male" ${selected(profile.sex, "male")}>Hombre</option>
              <option value="female" ${selected(profile.sex, "female")}>Mujer</option>
            </select>
          </label>
          <label class="field">
            <span>Edad</span>
            <input name="age" type="number" min="12" max="100" value="${escapeHtml(profile.age)}">
          </label>
          <label class="field">
            <span>Altura</span>
            <input name="height" type="number" min="120" max="230" value="${escapeHtml(profile.height)}">
          </label>
          <label class="field">
            <span>Peso</span>
            <input name="weight" type="number" min="35" max="220" step="0.1" value="${escapeHtml(profile.weight)}">
          </label>
          <label class="field full">
            <span>Actividad</span>
            <select name="activity">
              ${Data.ACTIVITY_LEVELS.map((level) => `
                <option value="${level.id}" ${selected(profile.activity, level.id)}>${escapeHtml(level.label)}</option>
              `).join("")}
            </select>
          </label>
          <label class="field full">
            <span>Objetivo</span>
            <select name="goal">
              ${Data.GOALS.map((goalOption) => `
                <option value="${goalOption.id}" ${selected(profile.goal, goalOption.id)}>${escapeHtml(goalOption.label)}</option>
              `).join("")}
            </select>
          </label>
          <label class="field">
            <span>Entrenos/sem</span>
            <input name="trainingDays" type="number" min="0" max="14" value="${escapeHtml(profile.trainingDays)}">
          </label>
          <label class="field">
            <span>Pasos/día</span>
            <input name="steps" type="number" min="0" max="40000" step="500" value="${escapeHtml(profile.steps)}">
          </label>
        </div>
      </div>
    `;
  }

  function renderDayContext(renderContext) {
    const { day, summary } = renderContext;
    const context = day.context;
    const totals = summary.total;
    const targets = summary.targets;
    const kcalMeta = Nutrition.MACRO_META[0];
    const kcalRange = summary.kcalRange;
    const energy = summary.energy;
    const balanceClass = totals.kcal > kcalRange.max ? "is-over" : totals.kcal >= kcalRange.min ? "is-good" : "";
    const pct = Math.min(100, Math.round((totals.kcal / Math.max(kcalRange.max, 1)) * 100));

    refs.dayContext.innerHTML = `
      <section class="day-editor" aria-labelledby="day-context-title">
        <div class="day-hero-main">
          <div>
            <span class="hero-pill">${icon("sparkles")} Estado de hoy</span>
            <div class="hero-kcal">
              <h2 id="day-context-title">${formatMacro(totals.kcal)}</h2>
              <strong>kcal</strong>
            </div>
            <span class="day-range">${rangeLabel(kcalMeta, kcalRange, targets.kcal)}</span>
          </div>
          <div class="day-balance ${balanceClass}">
            <div>
              <span>Balance</span>
              <strong>${energy.metric}</strong>
            </div>
            <div class="hero-progress" aria-hidden="true">
              <span style="width:${pct}%"></span>
            </div>
            <p>${dayMessage(totals, targets)}</p>
          </div>
        </div>
        <div class="day-context-grid context-controls">
          <label class="field">
            <span>Entreno</span>
            <select name="training">
              ${Data.TRAINING_TYPES.map((item) => `
                <option value="${item.id}" ${selected(context.training, item.id)}>${escapeHtml(item.label)}</option>
              `).join("")}
            </select>
          </label>
          <label class="field">
            <span>Intensidad</span>
            <select name="intensity" ${context.training === "none" ? "disabled" : ""}>
              ${Data.INTENSITY_LEVELS.map((item) => `
                <option value="${item.id}" ${selected(context.intensity, item.id)}>${escapeHtml(item.label)}</option>
              `).join("")}
            </select>
          </label>
          <label class="field">
            <span>Pasos hoy</span>
            <input name="steps" type="number" min="0" max="50000" step="500" placeholder="${escapeHtml(state.profile.steps)}" value="${escapeHtml(context.steps)}">
          </label>
          <div class="hero-stat">
            ${icon("flame")}
            <span>Mantenimiento</span>
            <strong>${formatMacro(targets.maintenance)} kcal</strong>
          </div>
        </div>
      </section>
    `;
  }

  function dayMessage(totals, targets) {
    const range = Nutrition.targetRange("kcal", targets.kcal);
    if (totals.kcal > range.max) return "Calorías por encima del rango";
    if (totals.kcal >= range.min) return "Dentro del rango de hoy";
    if (totals.kcal === 0) return "Empieza registrando la primera comida";
    return "Aún queda margen hasta el rango";
  }

  function renderMeals(renderContext) {
    const aggregated = renderContext.summary.aggregate;
    const dayKcal = Math.max(renderContext.summary.total.kcal, 1);

    refs.meals.innerHTML = `
      ${aggregated.meals.map((meal, index) => {
        const collapsed = isMealCollapsed(meal);
        const foods = mealFoods(meal);
        const dayShare = Math.round((meal.total.kcal / dayKcal) * 100);
        return `
      <article class="meal-card meal-list ${collapsed ? "is-collapsed" : ""}" data-meal-id="${meal.id}">
        <div class="meal-top">
          <button class="meal-number" type="button" data-action="toggle-meal" aria-label="${collapsed ? "Abrir comida" : "Cerrar comida"}">${index + 1}</button>
          <label class="meal-name">
            <span class="sr-only">Nombre de la comida</span>
            <input class="meal-name-input" data-action="rename-meal" value="${escapeHtml(meal.name)}">
          </label>
          <div class="meal-total">
            <strong>${formatMacro(meal.total.kcal)} kcal</strong>
            <span class="meal-share">${dayShare}% del día</span>
            ${renderMealMacros(meal.total)}
          </div>
          <button class="icon-button meal-collapse" type="button" data-action="toggle-meal" title="${collapsed ? "Abrir comida" : "Cerrar comida"}" aria-label="${collapsed ? "Abrir comida" : "Cerrar comida"}">${icon("chevron")}</button>
          <button class="icon-button soft danger-action" type="button" data-action="remove-meal" title="Eliminar comida" aria-label="Eliminar comida">${icon("trash")}</button>
        </div>
        <div class="meal-body">
          <div class="meal-items">
            ${foods.length ? foods.map((item) => renderMealItem(item)).join("") : `
              <p class="empty-copy">Sin alimentos todavía.</p>
            `}
          </div>
          <form class="meal-form add-food-row ${isMealAddOpen(meal) ? "" : "is-hidden"}" data-action="add-item" data-meal-id="${meal.id}" novalidate>
            <label class="meal-field food-select-field">
              <span>Alimento</span>
              <select name="foodId" aria-label="Alimento">
                <option value="">Selecciona alimento</option>
                ${renderFoodOptions()}
              </select>
            </label>
            <label class="meal-field grams-field">
              <span>Peso</span>
              <span class="weight-control">
                <input name="grams" type="text" inputmode="decimal" autocomplete="off" placeholder="300" aria-label="Peso en gramos">
                <span aria-hidden="true">g</span>
              </span>
            </label>
            <button class="icon-button add-button" type="button" data-action="add-food" title="Añadir alimento" aria-label="Añadir alimento">${icon("plus")}</button>
          </form>
          <button class="inline-add ${isMealAddOpen(meal) ? "is-hidden" : ""}" type="button" data-action="toggle-add-food">${icon("plus")} Añadir alimento</button>
        </div>
      </article>
      `;
      }).join("")}
      <button class="ghost-action add-meal-row" type="button" data-action="add-meal">+ Comida</button>
    `;
  }

  function isMealCollapsed(meal) {
    return uiState.collapsedMealIds.has(meal.id);
  }

  function isMealAddOpen(meal) {
    return uiState.addFoodMealIds.has(meal.id);
  }

  function activeFoods() {
    return state.foods.filter((food) => !food.deletedAt);
  }

  function sortFoods(foods) {
    return [...foods].sort((a, b) => {
      if (Boolean(a.favorite) !== Boolean(b.favorite)) return a.favorite ? -1 : 1;
      return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    });
  }

  function renderFoodOptions() {
    return sortFoods(activeFoods())
      .map((food) => `<option value="${escapeHtml(food.id)}">${escapeHtml(food.name)}</option>`)
      .join("");
  }

  function renderMealMacros(macros) {
    return `
      <span class="meal-macros" aria-label="${escapeHtml(`Proteína ${formatMacro(macros.protein)}g, carbohidratos ${formatMacro(macros.carbs)}g, grasas ${formatMacro(macros.fat)}g`)}">
        <span class="meal-macro is-protein">P ${formatMacro(macros.protein)}g</span>
        <span class="meal-macro-separator" aria-hidden="true">/</span>
        <span class="meal-macro is-carbs">C ${formatMacro(macros.carbs)}g</span>
        <span class="meal-macro-separator" aria-hidden="true">/</span>
        <span class="meal-macro is-fat">G ${formatMacro(macros.fat)}g</span>
      </span>
    `;
  }

  function renderMealItem(item) {
    const food = Nutrition.findFoodById(state.foods, item.foodId);
    if (!food) return "";
    const macros = Nutrition.foodMacros(food, item.grams);

    return `
      <div class="food-row" data-item-id="${item.id}">
        <div class="food-main">
          <strong>${formatMacro(item.grams)}g ${escapeHtml(food.name)}</strong>
          ${renderMealMacros(macros)}
        </div>
        <span class="food-kcal">${formatMacro(macros.kcal)} kcal</span>
        <button class="icon-button soft danger-action" type="button" data-action="remove-item" title="Quitar alimento" aria-label="Quitar alimento">${icon("trash")}</button>
      </div>
    `;
  }

  function renderSummary(renderContext) {
    const { summary } = renderContext;
    const totals = summary.total;
    const targets = summary.targets;
    const energy = summary.energy;
    const kcalRange = summary.kcalRange;
    const advice = summary.advice;

    refs.macroSummary.innerHTML = `
      <section class="summary-hero">
        <span>Resumen</span>
        <h2>${energy.headline}</h2>
        <p>${energy.metric}</p>
        <small>${energy.detail}</small>
      </section>
      <div class="target-strip">
        <div>
          <span>Óptimo</span>
          <strong>${formatMacro(targets.kcal)} kcal</strong>
        </div>
        <div>
          <span>Mant.</span>
          <strong>${formatMacro(targets.maintenance)} kcal</strong>
        </div>
        <div>
          <span>Act.</span>
          <strong>x${Nutrition.formatNumber(targets.activityMultiplier, 2)}</strong>
        </div>
      </div>
      <div class="kcal-range-note">
        Rango ${formatMacro(kcalRange.min)}-${formatMacro(kcalRange.max)} kcal
      </div>
      <section class="quick-advice ${advice.className}">
        <span>${escapeHtml(advice.eyebrow)}</span>
        <h3>${escapeHtml(advice.title)}</h3>
        <p>${escapeHtml(advice.body)}</p>
      </section>
      <div class="summary-focus-list">
        ${renderNutritionFocus(summary.focus)}
      </div>
    `;
  }

  function renderNutritionFocus(rows) {
    return rows.map((row) => `
      <div class="summary-focus-row ${row.className}">
        <span>${escapeHtml(row.label)}</span>
        <strong>${escapeHtml(row.value)}</strong>
        <small>${escapeHtml(row.detail)}</small>
      </div>
    `).join("");
  }

  function renderMacroCards(renderContext) {
    const totals = renderContext.summary.total;
    const targets = renderContext.summary.targets;
    const cards = Nutrition.MACRO_META.filter((meta) => meta.key !== "kcal");

    refs.macroCards.innerHTML = cards.map((meta) => {
      const consumed = totals[meta.key];
      const target = targets[meta.key] || 0;
      const pct = Math.min(100, Math.round((consumed / Math.max(target, 1)) * 100));
      return `
        <article class="macro-card macro-${escapeHtml(meta.key)}">
          <span class="macro-card-icon">${icon(meta.key === "protein" ? "protein" : meta.key === "carbs" ? "carbs" : meta.key === "fat" ? "fat" : "fiber")}</span>
          <div>
            <p>${escapeHtml(meta.label)}</p>
            <strong>${formatMacro(consumed, meta.precision)}<span>${escapeHtml(meta.unit)}</span></strong>
          </div>
          <div class="macro-card-progress" aria-label="${escapeHtml(`${meta.label}: ${formatMacro(consumed, meta.precision)} de ${formatMacro(target, meta.precision)} ${meta.unit}`)}">
            <span style="width:${pct}%"></span>
          </div>
        </article>
      `;
    }).join("");
  }

  function rangeLabel(meta, range, target) {
    if (range.minimum) {
      return `Mínimo ${formatWithUnit(range.min, meta)} · óptimo ${formatWithUnit(target, meta)}`;
    }

    return `Rango ${formatMacro(range.min, meta.precision)}-${formatWithUnit(range.max, meta)} · óptimo ${formatWithUnit(target, meta)}`;
  }

  function renderEquivalences(renderContext) {
    const { equivalences, rangeLeft } = renderContext.summary;

    refs.equivalences.innerHTML = `
      <section class="equivalence-block">
        <h3>Equivalencias útiles</h3>
        ${renderEquivalenceGroup("Proteína", "protein", equivalences.protein, rangeLeft.protein)}
        ${renderEquivalenceGroup("Carbohidratos", "carbs", equivalences.carbs, rangeLeft.carbs)}
        ${renderEquivalenceGroup("Grasas", "fat", equivalences.fat, rangeLeft.fat)}
      </section>
    `;
  }

  function renderEquivalenceGroup(label, macro, items, remainingValue) {
    if (remainingValue <= 0) {
      return `
        <details class="equivalence-details is-done">
          <summary>
            <span>${label}</span>
            <strong>Cubierto</strong>
          </summary>
        </details>
      `;
    }

    return `
      <details class="equivalence-details" ${macro === "carbs" || macro === "fat" ? "open" : ""}>
        <summary>
          <span>${label}</span>
          <strong>${formatMacro(remainingValue)}g por cubrir</strong>
        </summary>
        <ul>
          ${items.map((item) => `
            <li>
              <span>${escapeHtml(item.food.name)}</span>
              <strong>${formatMacro(item.grams)}g${servingText(item)}</strong>
            </li>
          `).join("")}
        </ul>
      </details>
    `;
  }

  function servingText(item) {
    if (!item.food.servingLabel || !item.servings) return "";
    const servings = Nutrition.round(item.servings, 1);
    const plural = servings > 1.05 ? "s" : "";
    return ` / ${Nutrition.formatNumber(servings, 1)} ${item.food.servingLabel}${plural}`;
  }

  function renderFoodManager() {
    const foods = filterManagedFoods();
    const favorites = activeFoods().filter((food) => food.favorite).length;

    refs.libraryPanel.innerHTML = `
      <div class="food-manager-head">
        <div>
          <p>Biblioteca</p>
          <h2>Alimentos</h2>
        </div>
        <div class="food-manager-stats">
          <span>${activeFoods().length} activos</span>
          <span>${favorites} favoritos</span>
        </div>
      </div>
      <div class="food-toolbar">
        <label class="field">
          <span>Buscar</span>
          <input name="foodSearch" type="search" placeholder="Salmón, arroz, queso..." value="${escapeHtml(uiState.foodSearch)}">
        </label>
      </div>
      <details class="food-create" open>
        <summary>+ Añadir alimento</summary>
        ${renderFoodForm(null, "create-food")}
      </details>
      <div class="food-card-list">
        ${renderManagedFoodList(foods)}
      </div>
    `;
  }

  function renderManagedFoodList(foods = filterManagedFoods()) {
    if (!foods.length) return `<p class="empty-copy">No hay alimentos con ese filtro.</p>`;
    return foods.map((food) => renderFoodCard(food)).join("");
  }

  function filterManagedFoods() {
    const query = Nutrition.normalize(uiState.foodSearch);
    const foods = sortFoods(activeFoods());
    if (!query) return foods;

    return foods.filter((food) => {
      const names = [food.name, ...(food.aliases || [])].map(Nutrition.normalize);
      return names.some((name) => name.includes(query));
    });
  }

  function renderFoodCard(food) {
    if (uiState.editingFoodId === food.id) {
      return `
        <article class="food-card is-editing" data-food-id="${escapeHtml(food.id)}">
          <div class="food-card-top">
            <strong>Editar alimento</strong>
            <button class="icon-button soft" type="button" data-action="cancel-edit-food" aria-label="Cancelar edición">x</button>
          </div>
          ${renderFoodForm(food, "update-food")}
        </article>
      `;
    }

    const macroLabel = `Macros por 100g: proteína ${formatMacro(food.protein)}g, carbohidratos ${formatMacro(food.carbs)}g, grasas ${formatMacro(food.fat)}g`;

    return `
      <article class="food-card" data-food-id="${escapeHtml(food.id)}">
        <div class="food-card-main">
          <div class="food-card-copy">
            <div class="food-card-title">
              <strong>${escapeHtml(food.name)}</strong>
              <span>${formatMacro(food.kcal)} kcal/100g</span>
            </div>
            <div class="food-macro-tags">
              <span>P ${formatMacro(food.protein)}g</span>
              <span>C ${formatMacro(food.carbs)}g</span>
              <span>G ${formatMacro(food.fat)}g</span>
              <span>F ${formatMacro(food.fiber || 0)}g</span>
            </div>
          </div>
          <div class="macro-donut-wrap" role="img" aria-label="${escapeHtml(macroLabel)}">
            <div class="macro-donut" style="${donutStyle(food)}" aria-hidden="true"></div>
          </div>
        </div>
        <div class="food-card-actions">
          <button class="star-button ${food.favorite ? "is-active" : ""}" type="button" data-action="toggle-favorite" title="Favorito" aria-label="${food.favorite ? "Quitar de favoritos" : "Añadir a favoritos"}">${icon(food.favorite ? "starFilled" : "star")}</button>
          <button class="ghost-action icon-action compact-action" type="button" data-action="edit-food" title="Editar alimento" aria-label="Editar alimento">${icon("pencil")}</button>
          <button class="ghost-action icon-action compact-action danger-action" type="button" data-action="delete-food" title="Eliminar alimento" aria-label="Eliminar alimento">${icon("trash")}</button>
        </div>
      </article>
    `;
  }

  function renderFoodForm(food, action) {
    const values = food || {
      name: "",
      kcal: "",
      protein: "",
      carbs: "",
      fat: "",
      fiber: 0,
      servingLabel: "ración",
      servingGrams: 100
    };

    return `
      <form class="library-form" data-action="${action}" ${food ? `data-food-id="${escapeHtml(food.id)}"` : ""} novalidate>
        <div class="custom-grid">
          <label class="field">
            <span>Nombre</span>
            <input name="name" value="${escapeHtml(values.name)}" placeholder="Merluza" required>
          </label>
          <label class="field">
            <span>kcal/100g</span>
            <input name="kcal" type="number" min="0" step="1" value="${escapeHtml(values.kcal)}" required>
          </label>
          <label class="field">
            <span>Proteína</span>
            <input name="protein" type="number" min="0" step="0.1" value="${escapeHtml(values.protein)}" required>
          </label>
          <label class="field">
            <span>Carbohidratos</span>
            <input name="carbs" type="number" min="0" step="0.1" value="${escapeHtml(values.carbs)}" required>
          </label>
          <label class="field">
            <span>Grasas</span>
            <input name="fat" type="number" min="0" step="0.1" value="${escapeHtml(values.fat)}" required>
          </label>
          <label class="field">
            <span>Fibra</span>
            <input name="fiber" type="number" min="0" step="0.1" value="${escapeHtml(values.fiber || 0)}">
          </label>
          <label class="field">
            <span>Etiqueta ración</span>
            <input name="servingLabel" value="${escapeHtml(values.servingLabel || "ración")}" placeholder="ración">
          </label>
          <label class="field">
            <span>Gramos/ración</span>
            <input name="servingGrams" type="number" min="1" step="1" value="${escapeHtml(values.servingGrams || 100)}">
          </label>
        </div>
        <div class="library-form-actions">
          <button class="secondary-action" type="submit">${food ? "Guardar cambios" : "Guardar alimento"}</button>
          ${food ? `<button class="ghost-action" type="button" data-action="cancel-edit-food">Cancelar</button>` : ""}
        </div>
      </form>
    `;
  }

  function donutStyle(food) {
    const protein = Math.max(Nutrition.number(food.protein) * 4, 0);
    const carbs = Math.max(Nutrition.number(food.carbs) * 4, 0);
    const fat = Math.max(Nutrition.number(food.fat) * 9, 0);
    const total = protein + carbs + fat;
    if (!total) return "background: var(--macro-empty)";

    const proteinEnd = (protein / total) * 100;
    const carbsEnd = proteinEnd + (carbs / total) * 100;
    return `background: conic-gradient(var(--macro-protein) 0 ${proteinEnd}%, var(--macro-carbs) ${proteinEnd}% ${carbsEnd}%, var(--macro-fat) ${carbsEnd}% 100%)`;
  }

  function renderHistory() {
    const savedDays = Object.values(state.days)
      .filter((day) => day.savedAt)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (!savedDays.length) {
      refs.history.innerHTML = `<p class="empty-copy">Cuando registres un día aparecerá aquí.</p>`;
      return;
    }

    refs.history.innerHTML = `
      <div class="history-list">
        ${savedDays.map((day) => renderHistoryDay(day)).join("")}
      </div>
    `;
  }

  function renderHistoryDay(day) {
    const total = Nutrition.aggregateDay(day, state.foods).total;
    return `
      <div class="history-row">
        <button type="button" data-action="load-day" data-date="${day.date}">
          <strong>${formatDate(day.date)}</strong>
          <span>${formatMacro(total.kcal)} kcal</span>
        </button>
        <div class="history-macros">
          <span class="macro-text is-protein">P ${formatMacro(total.protein)}g</span>
          <span class="macro-text is-carbs">C ${formatMacro(total.carbs)}g</span>
          <span class="macro-text is-fat">G ${formatMacro(total.fat)}g</span>
        </div>
      </div>
    `;
  }

  function renderAnalysis(renderContext) {
    const savedDays = Object.values(state.days)
      .filter((day) => day.savedAt)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    if (!savedDays.length) {
      refs.analysis.innerHTML = "";
      return;
    }

    const totals = savedDays.reduce((acc, day) => {
      addTotals(acc, Nutrition.aggregateDay(day, state.foods).total);
      return acc;
    }, Nutrition.zeroMacros());

    const days = savedDays.length;
    const avg = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / days]));
    const targets = renderContext.summary.targets;

    refs.analysis.innerHTML = `
      <section class="analysis-block">
        <h3>Media últimos ${days}</h3>
        <div class="analysis-grid">
          <span class="analysis-metric macro-kcal">kcal <strong>${formatMacro(avg.kcal)}</strong></span>
          <span class="analysis-metric macro-protein">Prot <strong>${formatMacro(avg.protein)}g</strong></span>
          <span class="analysis-metric macro-carbs">Carb <strong>${formatMacro(avg.carbs)}g</strong></span>
          <span class="analysis-metric macro-fat">Grasa <strong>${formatMacro(avg.fat)}g</strong></span>
        </div>
        <p>${formatMacro((avg.protein / Math.max(targets.protein, 1)) * 100)}% de la proteína objetivo.</p>
      </section>
    `;
  }

  function addTotals(total, macros) {
    Object.keys(total).forEach((key) => {
      total[key] += Nutrition.number(macros[key]);
    });
    return total;
  }

  function handleProfileChange(event) {
    const field = event.target;
    if (!field.name) return;

    const numericFields = new Set(["age", "height", "weight", "trainingDays", "steps"]);
    state.profile[field.name] = numericFields.has(field.name)
      ? Nutrition.number(field.value)
      : field.value;
    saveAndRender();
  }

  function handleProfileClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    event.preventDefault();

    if (button.dataset.action === "toggle-profile") {
      uiState.profileOpen = !uiState.profileOpen;
      renderProfile();
      return;
    }

    if (button.dataset.action === "toggle-library") {
      uiState.view = uiState.view === "foods" ? "diary" : "foods";
      uiState.editingFoodId = "";
      render();
    }
  }

  function handleSideNavClick(event) {
    const button = event.target.closest("button[data-nav]");
    if (!button) return;

    const target = button.dataset.nav;
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

  function handleQuickSearch(event) {
    if (event.type === "keydown" && event.key !== "Enter") return;
    if (event.type === "keydown") event.preventDefault();
    applyQuickFoodSearch();
  }

  function applyQuickFoodSearch() {
    const query = String(refs.quickSearch.value || "").trim();
    if (!query) return;

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
    addItemFromForm(form);
  }

  function handleMealKeydown(event) {
    if (event.key !== "Enter") return;
    const field = event.target.closest("input[name='grams'], select[name='foodId']");
    if (!field) return;

    const form = field.closest("form[data-action='add-item']");
    if (!form) return;

    event.preventDefault();
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

    ensureMealItems(meal).push({
      id: Storage.uid("item"),
      foodId: food.id,
      grams
    });
    uiState.addFoodMealIds.add(meal.id);
    uiState.collapsedMealIds.delete(meal.id);

    gramsInput.value = "";
    if (foodSelect) foodSelect.focus();
    saveAndRender(`${formatMacro(grams)}g ${food.name} añadido.`);
  }

  function handleMealsClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

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

    if (button.dataset.action === "toggle-meal" && meal) {
      if (uiState.collapsedMealIds.has(mealId)) {
        uiState.collapsedMealIds.delete(mealId);
      } else {
        uiState.collapsedMealIds.add(mealId);
      }
      renderMeals(getRenderContext());
      return;
    }

    if (button.dataset.action === "toggle-add-food" && meal) {
      uiState.addFoodMealIds.add(mealId);
      renderMeals(getRenderContext());
      return;
    }

    if (button.dataset.action === "remove-item" && meal) {
      const itemId = event.target.closest("[data-item-id]").dataset.itemId;
      setMealFoods(meal, mealFoods(meal).filter((item) => item.id !== itemId));
      saveAndRender("Alimento quitado.");
    }

    if (button.dataset.action === "remove-meal" && meal) {
      if (day.meals.length <= 1) {
        showToast("Debe quedar al menos una comida.");
        return;
      }
      if (mealFoods(meal).length && !confirmDanger(`Eliminar ${meal.name}?`)) return;
      day.meals = day.meals.filter((item) => item.id !== mealId);
      uiState.addFoodMealIds.delete(mealId);
      uiState.collapsedMealIds.delete(mealId);
      saveAndRender("Comida eliminada.");
    }
  }

  function handleMealChange(event) {
    const input = event.target.closest("[data-action='rename-meal']");
    if (!input) return;

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

  function handleLibraryClick(event) {
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
      if (!confirmDanger(`Eliminar ${food.name} de la biblioteca?`)) return;
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

  function handleHistoryClick(event) {
    const button = event.target.closest("button[data-action='load-day']");
    if (!button) return;

    state.selectedDate = button.dataset.date;
    saveAndRender();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function registerDay() {
    currentDay().savedAt = new Date().toISOString();
    saveAndRender("Día registrado.");
  }

  function addMeal() {
    const day = currentDay();
    const meal = createMeal(`Comida ${day.meals.length + 1}`, true);
    day.meals.push(meal);
    uiState.addFoodMealIds.add(meal.id);
    saveAndRender("Comida añadida.");
  }

  function changeDate(event) {
    state.selectedDate = event.target.value || Storage.todayIso();
    currentDay();
    saveAndRender();
  }

  refs.profileForm.addEventListener("click", handleProfileClick);
  refs.profileForm.addEventListener("change", handleProfileChange);
  refs.sideNav.addEventListener("click", handleSideNavClick);
  refs.quickSearch.addEventListener("change", handleQuickSearch);
  refs.quickSearch.addEventListener("keydown", handleQuickSearch);
  refs.dayContext.addEventListener("change", handleDayContextChange);
  refs.meals.addEventListener("submit", handleMealSubmit);
  refs.meals.addEventListener("keydown", handleMealKeydown);
  refs.meals.addEventListener("click", handleMealsClick);
  refs.meals.addEventListener("change", handleMealChange);
  refs.libraryPanel.addEventListener("click", handleLibraryClick);
  refs.libraryPanel.addEventListener("input", handleLibraryInput);
  refs.libraryPanel.addEventListener("submit", handleLibrarySubmit);
  refs.history.addEventListener("click", handleHistoryClick);
  refs.saveDay.addEventListener("click", registerDay);
  refs.date.addEventListener("change", changeDate);

  render();
})();
