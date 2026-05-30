(function () {
  const Data = window.LeftEatData;
  const Nutrition = window.LeftEatNutrition;
  const MealItems = window.LeftEatMealItems;
  const Utils = window.LeftEatRenderUtils;

  const {
    dayToneClass,
    escapeHtml,
    formatDate,
    formatDateTime,
    formatMacro,
    icon,
    macroToneClass,
    macroToneLabel,
    renderFoodSprite,
    selected,
    sortFoods
  } = Utils;

  function collectionHas(collection, value) {
    if (collection?.has) return collection.has(value);
    if (Array.isArray(collection)) return collection.includes(value);
    return false;
  }

  function mapValue(map, key) {
    if (map?.get) return map.get(key);
    return map && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : "";
  }

  function hasTrainingType(value, type) {
    return value === type || value === "mixed";
  }

  function isDayContextOptionActive(name, value, optionId) {
    if (name !== "training") return value === optionId;
    if (optionId === "none") return !value || value === "none";
    return hasTrainingType(value, optionId);
  }

  function renderDayContextChoiceButtons(name, options, value, disabled = false) {
    return options.map((item) => {
      const isActive = isDayContextOptionActive(name, value, item.id);
      return `
        <button
          class="day-context-choice ${isActive ? "is-active" : ""}"
          type="button"
          data-action="set-day-context"
          data-field="${escapeHtml(name)}"
          data-value="${escapeHtml(item.id)}"
          aria-pressed="${isActive ? "true" : "false"}"
          ${disabled ? "disabled" : ""}
        >${escapeHtml(item.label)}</button>
      `;
    }).join("");
  }

  function renderDayTrainingCard(context) {
    const intensityDisabled = context.training === "none";
    return `
      <div class="field context-choice-field day-training-card">
        <span>Entreno de hoy</span>
        <div class="day-training-card-grid">
          <div class="context-choice-block">
            <small>Tipo</small>
            <div class="context-choice-group" role="group" aria-label="Tipo de entreno">
              ${renderDayContextChoiceButtons("training", Data.TRAINING_TYPES, context.training)}
            </div>
          </div>
          <div class="context-choice-block ${intensityDisabled ? "is-disabled" : ""}">
            <small>Intensidad</small>
            <div class="context-choice-group" role="group" aria-label="Intensidad" ${intensityDisabled ? 'aria-disabled="true"' : ""}>
              ${renderDayContextChoiceButtons("intensity", Data.INTENSITY_LEVELS, context.intensity, intensityDisabled)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function isIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }

  function renderHistoricalDayBanner(day) {
    if (!day.savedAt) return "";
    const totalMode = day.nutritionSnapshot ? "Totales protegidos" : "Totales recalculados";
    return `
      <div class="history-state-banner" role="status">
        <strong>Día guardado</strong>
        <span>Solo lectura</span>
        <span>Guardado ${escapeHtml(formatDateTime(day.savedAt))}</span>
        <span>${totalMode}</span>
      </div>
    `;
  }

  function renderRecoveryHint(day, { hasRecoverableClosedDay = false, recoverySourceDate = "" } = {}) {
    if (day.savedAt || !hasRecoverableClosedDay) return "";
    const sourceLabel = isIsoDate(recoverySourceDate) ? formatDate(recoverySourceDate) : "el último día";

    return `
      <div class="late-day-hint recovery-hint">
        <div>
          <strong>Día guardado y limpiado</strong>
          <span>Puedes recuperar una copia editable de ${sourceLabel}.</span>
        </div>
        <button class="secondary-action" type="button" data-action="recover-last-closed-day">Recuperar</button>
      </div>
    `;
  }

  function renderPreviousDayHint(suggestion) {
    if (!suggestion) return "";

    if (suggestion.registered) {
      return `
        <div class="late-day-hint">
          <div>
            <strong>¿Este registro era de ayer?</strong>
            <span>Ayer está libre. Puedes moverlo a ${formatDate(suggestion.previousDate)} y dejar hoy limpio.</span>
          </div>
          <button class="secondary-action" type="button" data-action="move-to-previous-day">Mover a ayer</button>
        </div>
      `;
    }

    return `
      <div class="late-day-hint">
        <div>
          <strong>¿Sigues cerrando ayer?</strong>
          <span>Ayer está libre. Mueve este registro a ${formatDate(suggestion.previousDate)} antes de seguir.</span>
        </div>
        <div class="late-day-actions">
          <button class="secondary-action" type="button" data-action="use-previous-day">Usar ayer</button>
          <button class="quiet-action" type="button" data-action="register-previous-day">Registrar como ayer</button>
        </div>
      </div>
    `;
  }

  function renderDayContext({
    day,
    profile,
    summary,
    hasRecoverableClosedDay = false,
    recoverySourceDate = "",
    previousDaySuggestion = null
  }) {
    const context = day.context;
    const totals = summary.total;
    const targets = summary.targets;
    const kcalRange = summary.kcalRange;
    const energy = summary.energy;
    const toneClass = dayToneClass(totals, kcalRange);
    const energyScaleMax = Math.max(kcalRange.max * 1.12, targets.maintenance, totals.kcal, targets.kcal, 1);
    const toEnergyPct = (value) => Math.min(100, Math.max(0, (value / energyScaleMax) * 100));
    const pct = toEnergyPct(totals.kcal);
    const rangeStartPct = toEnergyPct(kcalRange.min);
    const rangeEndPct = toEnergyPct(kcalRange.max);
    const rangeWidthPct = Math.min(100 - rangeStartPct, Math.max(1.5, rangeEndPct - rangeStartPct));
    const overWidthPct = Math.max(0, 100 - rangeEndPct);
    const energyScaleLabel = `${formatMacro(totals.kcal)} kcal registradas. Objetivo ${formatMacro(kcalRange.min)}-${formatMacro(kcalRange.max)} kcal. Gasto ${formatMacro(targets.maintenance)} kcal.`;
    const isSavedHistory = Boolean(day.savedAt);

    return `
      <section class="day-editor ${toneClass}" aria-labelledby="day-context-title">
        ${renderHistoricalDayBanner(day)}
        <div class="day-hero-main">
          <div class="day-status-copy">
            <h2 id="day-context-title">${escapeHtml(energy.headline)}</h2>
            <strong class="day-energy-metric">${energy.metric}</strong>
          </div>
          <div class="day-balance ${toneClass}">
            <div class="hero-progress" aria-label="${escapeHtml(energyScaleLabel)}">
              <i class="hero-target-band" aria-hidden="true" style="left:${rangeStartPct}%; width:${rangeWidthPct}%"></i>
              <i class="hero-over-band" aria-hidden="true" style="left:${rangeEndPct}%; width:${overWidthPct}%"></i>
              <span class="hero-progress-fill" style="width:${pct}%"></span>
            </div>
            <div class="hero-scale-meta" aria-hidden="true">
              <span class="hero-scale-target"><strong>Objetivo</strong> ${formatMacro(kcalRange.min)}-${formatMacro(kcalRange.max)} kcal</span>
              <span class="hero-scale-spend"><strong>Gasto</strong> ${formatMacro(targets.maintenance)} kcal</span>
            </div>
          </div>
        </div>
        ${isSavedHistory ? "" : `<div class="day-context-grid context-controls">
          ${renderDayTrainingCard(context)}
          <label class="field">
            <span>Pasos hoy</span>
            <input name="steps" type="number" min="0" max="50000" step="500" placeholder="${escapeHtml(profile.steps)}" value="${escapeHtml(context.steps)}">
          </label>
        </div>`}
        ${renderRecoveryHint(day, { hasRecoverableClosedDay, recoverySourceDate })}
        ${isSavedHistory ? "" : renderPreviousDayHint(previousDaySuggestion)}
      </section>
    `;
  }

  function renderFoodOptions(activeFoods, selectedFoodId = "") {
    return sortFoods(activeFoods)
      .map((food) => `<option value="${escapeHtml(food.id)}" ${selected(selectedFoodId, food.id)}>${escapeHtml(food.name)}</option>`)
      .join("");
  }

  function combinationReason(recommendation) {
    if (recommendation.source !== "habitual") return "Encaja bien";
    const uses = Math.max(1, Math.round(recommendation.count));
    return uses === 1 ? "Ya lo combinaste" : `${uses} veces contigo`;
  }

  function renderContextualFoodSuggestions(suggestion) {
    if (!suggestion?.recommendations?.length) return "";

    return `
      <section class="frequent-food-panel is-contextual-combo" data-meal-id="${escapeHtml(suggestion.mealId)}" aria-labelledby="frequent-food-title">
        <div class="frequent-food-head">
          <div>
            <strong id="frequent-food-title">${escapeHtml(suggestion.title)}</strong>
          </div>
        </div>
        <div class="frequent-food-list">
          ${suggestion.recommendations.map((recommendation) => {
            const toneClass = macroToneClass(recommendation.food);
            const toneLabel = recommendation.source === "habitual" ? "Lo sueles combinar" : macroToneLabel(recommendation.food);
            const sprite = renderFoodSprite(recommendation.food);
            return `
              <button
                class="frequent-food-card ${toneClass} ${sprite ? "has-sprite" : ""}"
                type="button"
                data-action="add-food-combo"
                data-food-id="${escapeHtml(recommendation.food.id)}"
                data-grams="${escapeHtml(recommendation.grams)}"
                data-source-food-id="${escapeHtml(suggestion.sourceFoodId)}"
                data-source-item-id="${escapeHtml(suggestion.sourceItemId || "")}"
                data-source-context="${escapeHtml(suggestion.sourceContext)}"
                aria-label="${escapeHtml(`Añadir ${formatMacro(recommendation.grams)} g de ${recommendation.food.name} a ${suggestion.targetName}`)}"
              >
                ${sprite}
                <strong>${escapeHtml(recommendation.food.name)}</strong>
                <span>${formatMacro(recommendation.grams)} g · ${escapeHtml(combinationReason(recommendation))}</span>
                <small>${escapeHtml(toneLabel)}</small>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderFrequentFoodSuggestions(suggestion) {
    if (!suggestion?.suggestions?.length) return "";

    return `
      <section class="frequent-food-panel" aria-labelledby="frequent-food-title">
        <div class="frequent-food-head">
          <div>
            <strong id="frequent-food-title">Comes a menudo</strong>
          </div>
        </div>
        <div class="frequent-food-list">
          ${suggestion.suggestions.map((item) => {
            const timesLabel = item.count === 1
              ? "1 vez"
              : item.count > 1 ? `${item.count} veces` : "favorito";
            const toneClass = macroToneClass(item.food);
            const toneLabel = macroToneLabel(item.food);
            const sprite = renderFoodSprite(item.food);
            return `
              <button
                class="frequent-food-card ${toneClass} ${sprite ? "has-sprite" : ""}"
                type="button"
                data-action="add-frequent-food"
                data-food-id="${escapeHtml(item.food.id)}"
                data-grams="${escapeHtml(item.grams)}"
                aria-label="${escapeHtml(`Añadir ${formatMacro(item.grams)} g de ${item.food.name} a ${suggestion.targetName}`)}"
              >
                ${sprite}
                <strong>${escapeHtml(item.food.name)}</strong>
                <span>${formatMacro(item.grams)} g habitual · ${timesLabel}</span>
                <small>${toneLabel}</small>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderSmartFoodSuggestions(suggestion) {
    if (!suggestion) return "";
    if (suggestion.type === "contextual") return renderContextualFoodSuggestions(suggestion);
    if (suggestion.type === "frequent") return renderFrequentFoodSuggestions(suggestion);
    return "";
  }

  function isFoodComboOpen(meal, item, comboContext) {
    return comboContext
      && comboContext.mealId === meal.id
      && comboContext.itemId === item.id
      && comboContext.foodId === item.foodId;
  }

  function renderFoodComboPanel(sourceFood, item, recommendations = [], options = {}) {
    if (!recommendations.length) return "";

    return `
      <section class="food-combo-panel ${escapeHtml(options.className || "")}" aria-label="${escapeHtml(`Alimentos que combinan con ${sourceFood.name}`)}">
        <div class="food-combo-head">
          <span>Combina con</span>
          <strong>${escapeHtml(sourceFood.name)}</strong>
        </div>
        <div class="food-combo-list">
          ${recommendations.map((recommendation) => {
            const sprite = renderFoodSprite(recommendation.food);
            return `
              <button
                class="food-combo-card ${macroToneClass(recommendation.food)} ${sprite ? "has-sprite" : ""}"
                type="button"
                data-action="add-food-combo"
                data-food-id="${escapeHtml(recommendation.food.id)}"
                data-grams="${escapeHtml(recommendation.grams)}"
                data-source-food-id="${escapeHtml(sourceFood.id)}"
                data-source-item-id="${escapeHtml(item.id || "")}"
                data-source-context="${escapeHtml(options.sourceContext || "meal-item")}"
              >
                ${sprite}
                <span>
                  <strong>${escapeHtml(recommendation.food.name)}</strong>
                  <small>${formatMacro(recommendation.grams)} g · ${escapeHtml(combinationReason(recommendation))}</small>
                </span>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderSnapshotMealItem(item) {
    const macros = item.macros || Nutrition.zeroMacros();
    const sprite = renderFoodSprite(item.foodId || item.foodName);
    return `
      <div class="food-row ${macroToneClass(macros)}" data-item-id="${escapeHtml(item.id)}">
        <div class="food-main ${sprite ? "has-sprite" : ""}">
          ${sprite}
          <span class="food-copy">
            <strong>${escapeHtml(item.foodName || "Alimento guardado")}</strong>
            <span class="food-amount">${formatMacro(item.grams)} g</span>
          </span>
        </div>
      </div>
    `;
  }

  function renderReadOnlyMealItem(item, { foods }) {
    const food = Nutrition.findFoodById(foods, item.foodId);
    if (!food && item.foodSnapshot) return renderSnapshotMealItem({
      id: item.id,
      foodName: item.foodSnapshot.name,
      grams: item.grams,
      macros: Nutrition.foodMacros(item.foodSnapshot.per100 || {}, item.grams)
    });

    const foodName = food ? food.name : "Alimento guardado";
    const macros = food ? Nutrition.foodMacros(food, item.grams) : Nutrition.zeroMacros();
    return renderSnapshotMealItem({
      id: item.id,
      foodName,
      grams: item.grams,
      macros
    });
  }

  function renderMealItem(item, meal, options) {
    const { foods, comboContext, comboRecommendations = [] } = options;
    const food = Nutrition.findFoodById(foods, item.foodId);
    if (!food && item.foodSnapshot) return renderSnapshotMealItem({
      id: item.id,
      foodName: item.foodSnapshot.name,
      grams: item.grams,
      macros: Nutrition.foodMacros(item.foodSnapshot.per100 || {}, item.grams)
    });
    if (!food) return "";
    const macros = Nutrition.foodMacros(food, item.grams);
    const sprite = renderFoodSprite(food);
    const isComboOpen = isFoodComboOpen(meal, item, comboContext);

    return `
      <div class="food-row ${macroToneClass(macros)}" data-item-id="${item.id}">
        <button
          class="food-main food-combo-trigger ${sprite ? "has-sprite" : ""} ${isComboOpen ? "is-active" : ""}"
          type="button"
          data-action="show-food-combos"
          data-food-id="${escapeHtml(food.id)}"
          data-item-id="${escapeHtml(item.id)}"
          aria-expanded="${isComboOpen ? "true" : "false"}"
          aria-label="${escapeHtml(`Ver alimentos que combinan con ${food.name}`)}"
        >
          ${sprite}
          <span class="food-copy">
            <strong>${escapeHtml(food.name)}</strong>
            <span class="food-amount">${formatMacro(item.grams)} g</span>
          </span>
        </button>
        <button class="icon-button soft danger-action" type="button" data-action="remove-item" title="Quitar alimento" aria-label="Quitar alimento">${icon("trash")}</button>
      </div>
      ${isComboOpen ? renderFoodComboPanel(food, item, comboRecommendations) : ""}
    `;
  }

  function renderMealTemplate(template) {
    const total = template.total || Nutrition.zeroMacros();
    const itemCount = template.itemCount ?? (template.items || []).length;
    const itemLabel = itemCount === 1 ? "1 alimento" : `${itemCount} alimentos`;
    const hasSnapshot = Boolean(template.hasSnapshot);

    return `
      <article class="meal-template-card ${macroToneClass(total)}" data-template-id="${escapeHtml(template.id)}">
        <div class="meal-template-copy">
          <strong>${escapeHtml(template.name)}</strong>
          <span>${itemLabel}${hasSnapshot ? " · estable" : ""}</span>
        </div>
        <div class="meal-template-actions">
          <button class="secondary-action template-use-action" type="button" data-action="insert-meal-template">${icon("plus")} Usar</button>
          <button class="icon-button soft danger-action" type="button" data-action="remove-meal-template" title="Eliminar comida guardada" aria-label="Eliminar comida guardada">${icon("trash")}</button>
        </div>
      </article>
    `;
  }

  function renderMealTemplates(templates = []) {
    if (!templates.length) return "";

    return `
      <section class="meal-template-panel" aria-labelledby="meal-template-title">
        <div class="meal-template-head">
          <div>
            <span>Favoritas</span>
            <strong id="meal-template-title">Comidas guardadas</strong>
          </div>
          <span>${templates.length}</span>
        </div>
        <div class="meal-template-list">
          ${templates.map((template) => renderMealTemplate(template)).join("")}
        </div>
      </section>
    `;
  }

  function renderMeals({
    day,
    summary,
    foods = [],
    activeFoods = [],
    mealTemplates = [],
    selectedFoodByMealId,
    collapsedMealIds,
    addFoodMealIds,
    comboContext = null,
    comboRecommendations = [],
    savedTemplateMealIds,
    smartSuggestion = null
  }) {
    const aggregated = summary.aggregate;
    const snapshotMeals = day.savedAt && day.nutritionSnapshot
      ? day.nutritionSnapshot.meals || []
      : null;
    const isReadOnlyHistory = Boolean(day.savedAt);

    return `
      ${isReadOnlyHistory ? "" : renderSmartFoodSuggestions(smartSuggestion)}
      ${isReadOnlyHistory ? "" : renderMealTemplates(mealTemplates)}
      ${aggregated.meals.map((meal, index) => {
        const snapshotMeal = snapshotMeals ? snapshotMeals.find((item) => item.id === meal.id) : null;
        const collapsed = collectionHas(collapsedMealIds, meal.id);
        const items = snapshotMeal ? snapshotMeal.items || [] : MealItems.list(meal);
        const mealTotal = snapshotMeal?.total || meal.total;
        const foodCount = items.length;
        const foodCountLabel = foodCount === 1 ? "1 alimento" : `${foodCount} alimentos`;
        const savedAsTemplate = collectionHas(savedTemplateMealIds, meal.id);
        const toneClass = macroToneClass(mealTotal);
        const toneLabel = macroToneLabel(mealTotal);
        const isAddOpen = collectionHas(addFoodMealIds, meal.id);
        const selectedFoodId = mapValue(selectedFoodByMealId, meal.id);
        return `
      <article class="meal-card meal-list ${toneClass} ${collapsed ? "is-collapsed" : ""}" data-meal-id="${meal.id}">
        <div class="meal-top">
          <button class="meal-number" type="button" data-action="toggle-meal" aria-label="${collapsed ? "Abrir comida" : "Cerrar comida"}">${index + 1}</button>
          ${isReadOnlyHistory ? `
          <div class="meal-name is-read-only">
            <span class="sr-only">Nombre de la comida</span>
            <strong>${escapeHtml(meal.name)}</strong>
          </div>
          ` : `<label class="meal-name">
            <span class="sr-only">Nombre de la comida</span>
            <input class="meal-name-input" data-action="rename-meal" value="${escapeHtml(meal.name)}">
          </label>`}
          <div class="meal-total">
            <strong>${formatMacro(mealTotal.kcal)} kcal</strong>
            <span class="meal-share">${foodCountLabel} · ${toneLabel}</span>
          </div>
          ${isReadOnlyHistory ? "" : `<button class="icon-button soft save-template-action ${savedAsTemplate ? "is-active" : ""}" type="button" data-action="save-meal-template" title="${savedAsTemplate ? "Comida guardada" : "Guardar comida"}" aria-label="${savedAsTemplate ? "Comida guardada" : "Guardar comida"}">${icon(savedAsTemplate ? "starFilled" : "star")}</button>`}
          <button class="icon-button meal-collapse" type="button" data-action="toggle-meal" title="${collapsed ? "Abrir comida" : "Cerrar comida"}" aria-label="${collapsed ? "Abrir comida" : "Cerrar comida"}">${icon("chevron")}</button>
          ${isReadOnlyHistory ? "" : `<button class="icon-button soft danger-action" type="button" data-action="remove-meal" title="Eliminar comida" aria-label="Eliminar comida">${icon("trash")}</button>`}
        </div>
        <div class="meal-body">
          <div class="meal-items">
            ${items.length ? items.map((item) => snapshotMeal ? renderSnapshotMealItem(item) : isReadOnlyHistory ? renderReadOnlyMealItem(item, { foods }) : renderMealItem(item, meal, { foods, comboContext, comboRecommendations })).join("") : `
              <p class="empty-copy">Sin alimentos todavía.</p>
            `}
          </div>
          ${isReadOnlyHistory ? "" : `<form class="meal-form add-food-row ${isAddOpen ? "" : "is-hidden"}" data-action="add-item" data-meal-id="${meal.id}" novalidate>
            <label class="meal-field food-select-field">
              <span>Alimento</span>
              <select name="foodId" aria-label="Alimento">
                <option value="">Selecciona alimento</option>
                ${renderFoodOptions(activeFoods, selectedFoodId)}
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
          `}
          ${isReadOnlyHistory ? "" : `<button class="inline-add ${isAddOpen ? "is-hidden" : ""}" type="button" data-action="toggle-add-food">${icon("plus")} Añadir alimento</button>`}
        </div>
      </article>
      `;
      }).join("")}
      ${isReadOnlyHistory ? "" : `<button class="ghost-action add-meal-row" type="button" data-action="add-meal">+ Comida</button>`}
    `;
  }

  function renderDiagnosisSuggestions(suggestions = [], targetMealName = "Comida") {
    if (!suggestions.length) return "";

    return `
      <ul class="diagnosis-suggestions" aria-label="Sugerencias concretas">
        ${suggestions.slice(0, 3).map((suggestion) => {
          const grams = Nutrition.formatNumber(suggestion.grams || 0);
          return `
          <li>
            <span class="diagnosis-dot" aria-hidden="true"></span>
            <span>
              <strong>${escapeHtml(suggestion.label)}</strong>
              <small>${escapeHtml(suggestion.detail)}</small>
            </span>
            <button
              type="button"
              data-action="add-diagnosis-suggestion"
              data-food-id="${escapeHtml(suggestion.foodId || "")}"
              data-grams="${escapeHtml(suggestion.grams || "")}"
              aria-label="${escapeHtml(`Añadir ${grams} g de ${suggestion.label} a ${targetMealName}`)}"
            >Añadir</button>
          </li>
        `;
        }).join("")}
      </ul>
    `;
  }

  function renderNutritionFocus(rows = []) {
    return rows.map((row) => `
      <div class="summary-focus-row ${row.className}">
        <span>${escapeHtml(row.label)}</span>
        <strong>${escapeHtml(row.value)}</strong>
        <small>${escapeHtml(row.detail)}</small>
      </div>
    `).join("");
  }

  function renderSummary({
    day,
    summary,
    showDiagnosisSuggestions = true,
    targetMealName = "Comida"
  }) {
    const targets = summary.targets;
    const energy = summary.energy;
    const kcalRange = summary.kcalRange;
    const diagnosis = summary.diagnosis;

    return `
      <section class="summary-hero ${diagnosis.className}">
        <h2>${escapeHtml(diagnosis.action)}</h2>
        <p>${energy.metric}</p>
        <small>${escapeHtml(diagnosis.body)}</small>
      </section>
      <section class="diagnosis-card ${diagnosis.className}" aria-labelledby="diagnosis-title">
        <div class="diagnosis-head">
          <span>Guía del día</span>
          <strong>${escapeHtml(diagnosis.priority)}</strong>
        </div>
        <h3 id="diagnosis-title">${escapeHtml(diagnosis.title)}</h3>
        ${renderDiagnosisSuggestions(
          showDiagnosisSuggestions && !day.savedAt ? diagnosis.suggestions : [],
          targetMealName
        )}
      </section>
      <details class="summary-more">
        <summary>Ver números del día</summary>
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
        <div class="summary-focus-list">
          ${renderNutritionFocus(summary.focus)}
        </div>
      </details>
    `;
  }

  function renderMacroCards(_options = {}) {
    return "";
  }

  function servingText(item) {
    if (!item.food.servingLabel || !item.servings) return "";
    const servings = Nutrition.round(item.servings, 1);
    const plural = servings > 1.05 ? "s" : "";
    return ` / ${Nutrition.formatNumber(servings, 1)} ${item.food.servingLabel}${plural}`;
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

  function renderEquivalences({ summary }) {
    const { equivalences, rangeLeft } = summary;

    return `
      <section class="equivalence-block">
        <h3>Equivalencias útiles</h3>
        ${renderEquivalenceGroup("Proteína", "protein", equivalences.protein, rangeLeft.protein)}
        ${renderEquivalenceGroup("Carbohidratos", "carbs", equivalences.carbs, rangeLeft.carbs)}
        ${renderEquivalenceGroup("Grasas", "fat", equivalences.fat, rangeLeft.fat)}
      </section>
    `;
  }

  window.LeftEatDiaryRenderers = {
    renderDayContext,
    renderEquivalences,
    renderMacroCards,
    renderMeals,
    renderSummary
  };
})();
