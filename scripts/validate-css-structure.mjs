import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const stylesPath = path.join(root, "src", "styles.css");
const reportPath = path.join(root, "scripts", "report-css-structure.mjs");
const readmePath = path.join(root, "README.md");
const teamLoopPath = path.join(root, "TEAM_LOOP.md");

assert.equal(existsSync(stylesPath), true, "src/styles.css must exist");
assert.equal(existsSync(reportPath), true, "CSS structure report script must exist");

const styles = readFileSync(stylesPath, "utf8");
const readme = readFileSync(readmePath, "utf8");
const teamLoop = readFileSync(teamLoopPath, "utf8");

const sectionTitles = Array.from(styles.matchAll(/^\/\*\s*(.*?)\s*\*\/$/gm), (match) => match[1]);
const countSections = (pattern) => sectionTitles.filter((title) => pattern.test(title)).length;
const selectorCounts = new Map();
let selectorBuffer = [];

for (const line of styles.split(/\r?\n/)) {
  const trimmed = line.trim();

  if (
    !trimmed ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("@") ||
    trimmed.startsWith("}")
  ) {
    selectorBuffer = [];
    continue;
  }

  selectorBuffer.push(trimmed);

  if (trimmed.endsWith("{")) {
    const selector = selectorBuffer.join(" ").replace(/\s*\{\s*$/, "");
    selectorCounts.set(selector, (selectorCounts.get(selector) ?? 0) + 1);
    selectorBuffer = [];
  }
}

const selectorCount = (selector) => selectorCounts.get(selector) ?? 0;
const stableSectionPrefixes = new Set(["Tokens", "Base", "Layout", "Componentes", "Vistas"]);

assert.equal(sectionTitles[0], "Tokens", "CSS must start with the consolidated token section");
assert.equal(selectorCount(":root"), 1, "CSS tokens must stay consolidated in a single :root block");

for (const title of sectionTitles) {
  const prefix = title.split(":")[0];
  if (title === "Balance principal bajo el estado del dia.") continue;

  assert.equal(
    stableSectionPrefixes.has(prefix),
    true,
    `CSS section "${title}" must use a stable phase-5 prefix`
  );
}

assert.equal(
  countSections(/^Componentes: perfil compacto estable$/i),
  1,
  "profile panel CSS must stay in one compact stable section"
);

assert.equal(
  countSections(/^Vistas: editor principal de perfil$/i),
  1,
  "profile editor CSS must stay in one main-view section"
);

assert.doesNotMatch(
  sectionTitles.join("\n"),
  /\b(v\d+|Registro rapido|Redisenyo|Simplificacion|Jerarquia|Pokedex|RPG|Limpieza visual|Pixel art|Visual polish|Compact numeric|Recomendaciones|Profile editor stability)\b/i,
  "obsolete historical CSS layers must not come back"
);

assert.doesNotMatch(
  styles,
  /\.summary-panel\s*(?:>\s*)?\.section-heading/,
  "right summary panel no longer renders a section heading, so obsolete heading CSS must not come back"
);

const selectorBudgets = new Map([
  [".workspace", 15],
  [".sidebar", 13],
  [".topbar", 14],
  [".summary-panel", 14],
  [".side-nav button", 9],
  [".profile-panel", 7]
]);

for (const [selector, budget] of selectorBudgets) {
  assert.ok(
    selectorCount(selector) <= budget,
    `${selector} should stay consolidated at ${budget} blocks or fewer`
  );
}

assert.match(
  readme,
  /scripts\/report-css-structure\.mjs/,
  "README must document the CSS structure report"
);

assert.match(
  teamLoop,
  /scripts\/report-css-structure\.mjs/,
  "TEAM_LOOP must tell future cycles to use the CSS structure report"
);

console.log("validate-css-structure: ok");
