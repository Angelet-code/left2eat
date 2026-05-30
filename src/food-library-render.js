(function () {
  const Nutrition = window.LeftEatNutrition;
  const Utils = window.LeftEatRenderUtils;

  const {
    activeFoodList,
    donutStyle,
    escapeHtml,
    formatMacro,
    icon,
    renderFoodSprite,
    sortFoods
  } = Utils;

  function filterFoods({ foods = [], query = "" }) {
    const normalizedQuery = Nutrition.normalize(query);
    const active = sortFoods(activeFoodList(foods));
    if (!normalizedQuery) return active;

    return active.filter((food) => {
      const names = [food.name, ...(food.aliases || [])].map(Nutrition.normalize);
      return names.some((name) => name.includes(normalizedQuery));
    });
  }

  function renderManager({ foods = [], activeCount = 0, favoriteCount = 0, query = "", editingFoodId = "" }) {
    return `
      <div class="food-manager-head">
        <div>
          <p>Biblioteca</p>
          <h2>Alimentos</h2>
        </div>
        <div class="food-manager-stats">
          <span>${activeCount} activos</span>
          <span>${favoriteCount} favoritos</span>
        </div>
      </div>
      <div class="food-toolbar">
        <label class="field">
          <span>Buscar</span>
          <input name="foodSearch" type="search" placeholder="Salmón, arroz, queso..." value="${escapeHtml(query)}">
        </label>
      </div>
      <details class="food-create">
        <summary>+ Añadir alimento</summary>
        ${renderFoodForm(null, "create-food")}
      </details>
      <div class="food-card-list">
        ${renderList({ foods, editingFoodId })}
      </div>
    `;
  }

  function renderList({ foods = [], editingFoodId = "" } = {}) {
    if (!foods.length) return `<p class="empty-copy">No hay alimentos con ese filtro.</p>`;
    return foods.map((food) => renderFoodCard(food, editingFoodId)).join("");
  }

  function renderFoodCard(food, editingFoodId) {
    if (editingFoodId === food.id) {
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
    const sprite = renderFoodSprite(food);

    return `
      <article class="food-card" data-food-id="${escapeHtml(food.id)}">
        <div class="food-card-main ${sprite ? "has-sprite" : ""}">
          ${sprite}
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

  window.LeftEatFoodLibraryRenderers = {
    filterFoods,
    renderList,
    renderManager
  };
})();
