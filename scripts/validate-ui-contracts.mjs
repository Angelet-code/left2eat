import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appPath = path.join(root, "src", "app.js");
const indexPath = path.join(root, "index.html");

const app = fs.readFileSync(appPath, "utf8");
const index = fs.readFileSync(indexPath, "utf8");
const renderUtils = fs.readFileSync(path.join(root, "src", "render-utils.js"), "utf8");
const profileRender = fs.readFileSync(path.join(root, "src", "profile-render.js"), "utf8");
const foodLibraryRender = fs.readFileSync(path.join(root, "src", "food-library-render.js"), "utf8");
const historyRender = fs.readFileSync(path.join(root, "src", "history-render.js"), "utf8");
const diaryRender = fs.readFileSync(path.join(root, "src", "diary-render.js"), "utf8");
const nutrition = fs.readFileSync(path.join(root, "src", "nutrition.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "src", "styles.css"), "utf8");
const pixelFontPath = path.join(root, "src", "fonts", "left2eat-pixel.ttf");
const renderSurface = `${renderUtils}\n${profileRender}\n${foodLibraryRender}\n${historyRender}\n${diaryRender}`;
const appAndRenderSurface = `${app}\n${renderSurface}`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function countOccurrences(text, fragment) {
  return text.split(fragment).length - 1;
}

function assertScriptBefore(first, second) {
  const firstNeedle = `src="${first}"`;
  const secondNeedle = `src="${second}"`;
  assert(
    index.includes(firstNeedle) && index.includes(secondNeedle) && index.indexOf(firstNeedle) < index.indexOf(secondNeedle),
    `${first} must be loaded before ${second}`
  );
}

assertScriptBefore("src/render-utils.js", "src/profile-render.js");
assertScriptBefore("src/render-utils.js", "src/food-library-render.js");
assertScriptBefore("src/render-utils.js", "src/history-render.js");
assertScriptBefore("src/render-utils.js", "src/diary-render.js");
assertScriptBefore("src/nutrition.js", "src/render-utils.js");
assertScriptBefore("src/icons.js", "src/render-utils.js");
assertScriptBefore("src/profile-render.js", "src/app.js");
assertScriptBefore("src/food-library-render.js", "src/app.js");
assertScriptBefore("src/history-render.js", "src/app.js");
assertScriptBefore("src/history-render.js", "src/diary-render.js");
assertScriptBefore("src/diary-render.js", "src/app.js");

assert(
  renderUtils.includes("window.LeftEatRenderUtils") &&
    profileRender.includes("window.LeftEatProfileRenderers") &&
    foodLibraryRender.includes("window.LeftEatFoodLibraryRenderers") &&
    historyRender.includes("window.LeftEatHistoryRenderers") &&
    diaryRender.includes("window.LeftEatDiaryRenderers"),
  "phase 4A/4B render modules must expose stable window APIs"
);

assert(
  !app.includes("function renderFoodCard") &&
    !app.includes("function renderFoodForm") &&
    !app.includes("function donutStyle") &&
    !app.includes("PROFILE_PIXEL_SPRITES") &&
    !app.includes("FOOD_PIXEL_SPRITES"),
  "profile, library and shared render helpers must stay extracted from app.js"
);

assert(
  !app.includes("function renderDayContext") &&
    !app.includes("function renderMeals") &&
    !app.includes("function renderSummary") &&
    !app.includes("function renderEquivalences") &&
    !app.includes("function renderFoodComboPanel") &&
    !app.includes("function renderMealItem"),
  "diary HTML renderers must stay extracted from app.js"
);

assert(
  app.includes("async function confirmDanger(message)") &&
    app.includes("confirm-danger-dialog") &&
    app.includes("await confirmDanger") &&
    !app.includes("window.confirm") &&
    !/!\s*confirmDanger\(/.test(app),
  "danger confirmations must use the app-owned async dialog, not window.confirm"
);

assert(
  index.includes('id="profile-editor"'),
  "profile editor main view is missing from index.html"
);

assert(
  index.includes('id="profile-panel-content"') && !index.includes('id="profile-form"'),
  "sidebar profile summary must be a non-form content slot"
);

assert(
  profileRender.includes('data-action="profile-editor"'),
  "profile editor form is missing"
);

assert(
  /const TRAINING_TYPES = \[[\s\S]*id: "none"[\s\S]*id: "strength"[\s\S]*id: "cardio"[\s\S]*\];/.test(fs.readFileSync(path.join(root, "src", "data.js"), "utf8")) &&
    !fs.readFileSync(path.join(root, "src", "data.js"), "utf8").includes('{ id: "mixed", label: "Mixto" }') &&
    app.includes("function nextTrainingSelection") &&
    app.includes('return "mixed";') &&
    !app.includes("function normalizeDayContext") &&
    app.includes("Nutrition.normalizeDayContext(day.context)") &&
    nutrition.includes("function normalizeDayContext") &&
    nutrition.includes('validTraining = new Set([...(window.LeftEatData.TRAINING_TYPES || []).map((item) => item.id), "mixed"])') &&
    nutrition.includes('normalized.training === "none"') &&
    nutrition.includes('normalized.intensity = "normal"') &&
    diaryRender.includes("isDayContextOptionActive(name, value, item.id)") &&
    diaryRender.includes("function renderDayTrainingCard") &&
    diaryRender.includes('class="field context-choice-field day-training-card"') &&
    diaryRender.includes("<span>Entreno de hoy</span>") &&
    diaryRender.includes('aria-label="Tipo de entreno"') &&
    diaryRender.includes('aria-label="Intensidad"') &&
    !app.includes("function renderDayContextOptionGroup") &&
    !diaryRender.includes("function renderDayContextOptionGroup") &&
    app.includes('field === "training"') &&
    app.includes('day.context.training = nextValue'),
  "training selector must be a single card, expose only none/strength/cardio, and preserve mixed internally"
);

assert(
  styles.includes(".day-training-card-grid") &&
    styles.includes("grid-template-columns: minmax(0, 2fr) minmax(220px, 0.75fr);") &&
    styles.includes(".day-training-card .context-choice-block:nth-child(2) .day-context-choice.is-active"),
  "training and intensity controls must share one responsive visual card"
);

assert(
  profileRender.includes('data-action="discard-profile"') && profileRender.includes("Guardar perfil"),
  "profile editor must keep explicit discard and save actions"
);

assert(
  app.includes('uiState.view = "profile"'),
  "edit profile action must open the main profile view"
);

assert(
  app.includes('uiState.view = "diary"') && app.includes('saveAndRender("Perfil guardado.")'),
  "profile editor must return to diary after discard/save"
);

assert(
  !app.includes("profileOpen") && !app.includes("handleProfileChange"),
  "sidebar profile editor state/listeners must not come back"
);

assert(
  !app.includes("profileForm") && app.includes("profilePanelContent"),
  "sidebar profile summary must not use the old profile form ref"
);

assert(
  !/class="[^"]*\bprofile-edit\b/.test(appAndRenderSurface),
  "profile edit form must not render inside the sidebar"
);

assert(
  !/\.profile-edit(?![\w-])/.test(styles) && !/\.profile-panel\s+\.profile-edit(?![\w-])/.test(styles),
  "dead profile-edit sidebar CSS must not come back"
);

assert(
  !/\.profile-form(?![\w-])/.test(styles) && !/profile-panel\s+\.(field|form-grid|avatar-picker|avatar-options|avatar-option)/.test(styles),
  "dead sidebar profile form CSS must not come back"
);

assert(
  foodLibraryRender.includes('<details class="food-create">'),
  "food create disclosure is missing"
);

assert(
  !foodLibraryRender.includes('<details class="food-create" open'),
  "food create disclosure must not be open by default"
);

assert(
  diaryRender.includes("<span>Guía del día</span>") && !app.includes("<span>Diagnóstico</span>") && !diaryRender.includes("<span>Diagnóstico</span>"),
  "right summary panel must be framed as day guidance, not visible diagnosis"
);

assert(
  !app.includes("Estado de hoy") &&
    !diaryRender.includes("Estado de hoy") &&
    !app.includes("Sin comidas registradas") &&
    !diaryRender.includes("Sin comidas registradas") &&
    !app.includes("<span>Siguiente paso</span>") &&
    !diaryRender.includes("<span>Siguiente paso</span>") &&
    !app.includes("<span>Recordados</span>") &&
    !diaryRender.includes("<span>Recordados</span>") &&
    !index.includes('id="summary-title"'),
  "redundant hero, suggestion and summary subtitles must stay removed"
);

assert(
  /id="day-title"[\s\S]*id="day-eyebrow"/.test(index),
  "topbar day status must stay below the page title"
);

assert(
  styles.includes("--right-panel-width: 318px;") &&
    /@media \(min-width: 1181px\)[\s\S]*\.summary-panel\s*{[\s\S]*position: fixed;[\s\S]*overflow-y: auto;/.test(styles) &&
    styles.includes("--app-chrome-radius: 8px;"),
  "desktop right guide panel must stay fixed and chrome containers must stay harmonized"
);

assert(
  styles.includes("/* Balance principal bajo el estado del dia. */") &&
    /\.day-hero-main\s*{[\s\S]*grid-template-columns: minmax\(0, 1fr\);[\s\S]*align-items: stretch;/.test(styles) &&
    /\.day-status-copy\s*{[\s\S]*display: grid;[\s\S]*grid-template-columns: minmax\(0, 1fr\) auto;[\s\S]*align-items: baseline;/.test(styles) &&
    /\.day-status-copy h2\s*{[\s\S]*margin: 0;[\s\S]*line-height: 0\.9;/.test(styles) &&
    /\.day-energy-metric\s*{[\s\S]*align-self: baseline;[\s\S]*justify-self: end;[\s\S]*line-height: 1;/.test(styles) &&
    /\.day-balance\s*{[\s\S]*display: block;[\s\S]*width: 100%;/.test(styles) &&
    /\.day-balance\s*{[\s\S]*border: 0;[\s\S]*background: transparent;[\s\S]*padding: 0;/.test(styles) &&
    !styles.includes(".day-balance strong::before") &&
    /\.hero-progress\s*{[\s\S]*position: relative;[\s\S]*width: 100%;[\s\S]*height: 16px;/.test(styles) &&
    /\.hero-target-band\s*{[\s\S]*background: rgba\(74, 190, 124, 0\.2\);/.test(styles) &&
    /\.hero-over-band\s*{[\s\S]*background: rgba\(240, 90, 95, 0\.14\);/.test(styles) &&
    /\.hero-progress \.hero-progress-fill\s*{[\s\S]*background: rgba\(47, 111, 214, 0\.1\);/.test(styles) &&
    /\.hero-scale-meta\s*{[\s\S]*display: flex;[\s\S]*justify-content: space-between;/.test(styles) &&
    /<div class="day-status-copy">[\s\S]*id="day-context-title"[\s\S]*class="day-energy-metric"[\s\S]*<div class="day-balance/.test(diaryRender) &&
    diaryRender.includes('class="hero-scale-meta"') &&
    diaryRender.includes('class="hero-scale-target"') &&
    diaryRender.includes('class="hero-scale-spend"') &&
    diaryRender.includes("kcalRange.max * 1.12") &&
    diaryRender.includes('class="hero-target-band"') &&
    diaryRender.includes('class="hero-over-band"') &&
    !app.includes('class="hero-bar-label') &&
    !diaryRender.includes('class="hero-bar-label') &&
    !app.includes('class="day-number-details"') &&
    !diaryRender.includes('class="day-number-details"') &&
    !app.includes("Ver objetivos y gasto") &&
    !diaryRender.includes("Ver objetivos y gasto") &&
    !app.includes("<span>Ahora</span>") &&
    !diaryRender.includes("<span>Ahora</span>") &&
    !app.includes("Empieza registrando la primera comida") &&
    !diaryRender.includes("Empieza registrando la primera comida") &&
    !app.includes("dayMessage(") &&
    !diaryRender.includes("dayMessage("),
  "day kcal balance and progress must sit below the state headline at full width"
);

assert(
  app.includes('type: "clear-meal"') &&
    app.includes("Comida vaciada.") &&
    !app.includes("Debe quedar al menos una comida."),
  "deleting the only meal must clear it with undo instead of blocking the action"
);

assert(
  fs.existsSync(pixelFontPath) &&
    index.includes("fonts.googleapis.com/css2?family=Jersey+10") &&
    index.includes("family=Pixelify+Sans") &&
    !index.includes("Jersey+15") &&
    styles.includes('--font-pixel-title: "Jersey 10", "Pixelify Sans", "Left2Eat Pixel", monospace;') &&
    styles.includes("--type-display: 6rem;") &&
    styles.includes("--type-page: 3rem;") &&
    styles.includes("--type-section: 1.5rem;") &&
    styles.includes("--type-card: 1.3rem;") &&
    styles.includes(".meal-name-input,\n.meal-name.is-read-only strong,\n.meal-template-head strong,\n.frequent-food-head strong,\n.food-card-title strong") &&
    styles.includes('font-family: "Left2Eat Pixel"') &&
    styles.includes('url("./fonts/left2eat-pixel.ttf")') &&
    !styles.includes('"Terminal", "Fixedsys"'),
  "title hierarchy must use Jersey 10 with corrected display/page/section/card scale"
);

assert(
  styles.includes("body.is-profile-view .workspace") && styles.includes(".profile-editor-view[hidden]"),
  "profile view visibility CSS contract is missing"
);

assert(
  styles.includes(".profile-editor-actions"),
  "profile editor action layout CSS is missing"
);

assert(
  styles.includes("repeat(auto-fit, minmax(108px, 1fr))"),
  "profile avatar grid must stay fluid"
);

assert(
  styles.includes(".profile-editor-card") && styles.includes("width: min(100%, 820px)"),
  "profile editor card must keep a bounded fluid width"
);

const topbarIconStates = ["diary", "foods", "goals", "history", "profile"];

assert(
  app.includes("document.body.dataset.topbarIcon") &&
    app.includes('["goals", "history"].includes(uiState.activeNav)'),
  "topbar icon state must be derived from the active app section"
);

topbarIconStates.forEach((name) => {
  assert(
    countOccurrences(styles, `body[data-topbar-icon="${name}"] .topbar::before`) === 1,
    `topbar icon CSS state must exist exactly once: ${name}`
  );

  assert(
    new RegExp(`--section-icon-${name}\\s*:`).test(styles),
    `section icon token is missing: ${name}`
  );

  assert(
    new RegExp(`body\\[data-topbar-icon="${name}"\\] \\.topbar::before\\s*{\\s*background: var\\(--section-icon-${name}\\);\\s*}`).test(styles),
    `topbar icon state must use shared section token: ${name}`
  );
});

["diary", "foods", "goals", "history"].forEach((name) => {
  assert(
    new RegExp(`\\.side-nav button\\[data-nav="${name}"\\]::before\\s*{\\s*background: var\\(--section-icon-${name}\\);\\s*}`).test(styles),
    `side nav icon must use shared section token: ${name}`
  );
});

assert(
  !styles.includes("Profile editor stability"),
  "profile editor stability rules must stay consolidated in the main profile editor block"
);

assert(
  !styles.includes("Pixel art propio v17: perfil sin modal ni overflow"),
  "profile panel CSS must stay consolidated, not split across v15/v17 blocks"
);

console.log("validate-ui-contracts: ok");
