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

assert.equal(
  countSections(/perfil compacto y estable/i),
  1,
  "profile panel CSS must stay in one compact stable section"
);

assert.equal(
  countSections(/editor de perfil como vista principal/i),
  1,
  "profile editor CSS must stay in one main-view section"
);

assert.doesNotMatch(
  styles,
  /Pixel art propio v1[678]\b|Profile editor stability/i,
  "obsolete profile CSS cleanup layers must not come back"
);

assert.doesNotMatch(
  styles,
  /\.summary-panel\s*(?:>\s*)?\.section-heading/,
  "right summary panel no longer renders a section heading, so obsolete heading CSS must not come back"
);

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
