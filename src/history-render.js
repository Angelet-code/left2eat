(function () {
  const Nutrition = window.LeftEatNutrition;
  const Utils = window.LeftEatRenderUtils;

  const {
    escapeHtml,
    formatDate,
    formatMacro
  } = Utils;

  function savedDays(days = []) {
    return (Array.isArray(days) ? days : Object.values(days || {}))
      .filter((day) => day && day.savedAt)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function dayTotal(day) {
    return day.total || day.nutritionSnapshot?.total || Nutrition.zeroMacros();
  }

  function renderHistory({ days = [] }) {
    const visibleDays = savedDays(days);
    if (!visibleDays.length) {
      return `<p class="empty-copy">Cuando registres un día aparecerá aquí.</p>`;
    }

    return `
      <div class="history-list">
        ${visibleDays.map((day) => renderHistoryDay(day)).join("")}
      </div>
    `;
  }

  function renderHistoryDay(day) {
    const total = dayTotal(day);
    const repeatLabel = "Repetir este día en el día actual";
    return `
      <div class="history-row">
        <button class="history-open-button" type="button" data-action="load-day" data-date="${escapeHtml(day.date)}">
          <strong>${formatDate(day.date)}</strong>
          <span>${formatMacro(total.kcal)} kcal</span>
        </button>
        <div class="history-side">
          <div class="history-macros">
            <span class="macro-text is-protein">P ${formatMacro(total.protein)}g</span>
            <span class="macro-text is-carbs">C ${formatMacro(total.carbs)}g</span>
            <span class="macro-text is-fat">G ${formatMacro(total.fat)}g</span>
          </div>
          <button class="secondary-action history-repeat-action" type="button" data-action="repeat-day" data-date="${escapeHtml(day.date)}" title="${repeatLabel}" aria-label="${repeatLabel}">Repetir hoy</button>
        </div>
      </div>
    `;
  }

  function renderAnalysis({ days = [], targets }) {
    const recentDays = savedDays(days).slice(0, 7);
    if (!recentDays.length) return "";

    const totals = recentDays.reduce((acc, day) => {
      addTotals(acc, dayTotal(day));
      return acc;
    }, Nutrition.zeroMacros());

    const dayCount = recentDays.length;
    const avg = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / dayCount]));

    return `
      <section class="analysis-block">
        <h3>Media últimos ${dayCount}</h3>
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

  window.LeftEatHistoryRenderers = {
    renderAnalysis,
    renderHistory
  };
})();
