import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;

const commands = [
  ["node --check src/data.js", ["--check", "src/data.js"]],
  ["node --check src/storage.js", ["--check", "src/storage.js"]],
  ["node --check src/nutrition.js", ["--check", "src/nutrition.js"]],
  ["node --check src/meal-items.js", ["--check", "src/meal-items.js"]],
  ["node --check src/food-combinations.js", ["--check", "src/food-combinations.js"]],
  ["node --check src/icons.js", ["--check", "src/icons.js"]],
  ["node --check src/render-utils.js", ["--check", "src/render-utils.js"]],
  ["node --check src/profile-render.js", ["--check", "src/profile-render.js"]],
  ["node --check src/food-library-render.js", ["--check", "src/food-library-render.js"]],
  ["node --check src/history-render.js", ["--check", "src/history-render.js"]],
  ["node --check src/diary-render.js", ["--check", "src/diary-render.js"]],
  ["node --check src/diagnosis-actions.js", ["--check", "src/diagnosis-actions.js"]],
  ["node --check src/app.js", ["--check", "src/app.js"]],
  ["node scripts/validate-project-structure.mjs", ["scripts/validate-project-structure.mjs"]],
  ["node scripts/validate-css-structure.mjs", ["scripts/validate-css-structure.mjs"]],
  ["node scripts/validate-ui-contracts.mjs", ["scripts/validate-ui-contracts.mjs"]],
  ["node scripts/validate-food-combinations.mjs", ["scripts/validate-food-combinations.mjs"]],
  ["node scripts/validate-diagnosis-flow.mjs", ["scripts/validate-diagnosis-flow.mjs"]],
  ["node scripts/validate-storage-history-snapshots.mjs", ["scripts/validate-storage-history-snapshots.mjs"]]
];

const failures = [];

for (const [label, args] of commands) {
  console.log(`[validate-all] running: ${label}`);
  const result = spawnSync(node, args, {
    cwd: root,
    shell: false,
    stdio: "inherit"
  });

  if (result.error) {
    failures.push(`${label}: ${result.error.message}`);
    console.error(`[validate-all] failed: ${label}`);
    continue;
  }

  if (result.signal) {
    failures.push(`${label}: stopped by signal ${result.signal}`);
    console.error(`[validate-all] failed: ${label}`);
    continue;
  }

  if (result.status !== 0) {
    failures.push(`${label}: exited with code ${result.status}`);
    console.error(`[validate-all] failed: ${label}`);
    continue;
  }

  console.log(`[validate-all] ok: ${label}`);
}

if (failures.length > 0) {
  console.error("[validate-all] validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("[validate-all] all validations passed");
