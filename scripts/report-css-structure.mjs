import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const stylesPath = path.join(root, "src", "styles.css");
const styles = readFileSync(stylesPath, "utf8");
const lines = styles.split(/\r?\n/);

const sectionStarts = [];

for (let index = 0; index < lines.length; index += 1) {
  const trimmed = lines[index].trim();
  const match = trimmed.match(/^\/\*\s*(.*?)\s*\*\/$/);
  if (match) {
    sectionStarts.push({
      line: index + 1,
      title: match[1]
    });
  }
}

const sections = sectionStarts.map((section, index) => {
  const next = sectionStarts[index + 1]?.line ?? lines.length + 1;
  const body = lines.slice(section.line, next - 1);
  const ruleCount = body.filter((line) => {
    const trimmed = line.trim();
    return trimmed.endsWith("{") && !trimmed.startsWith("@");
  }).length;

  return {
    ...section,
    lines: next - section.line,
    rules: ruleCount
  };
});

const historicalPattern = /\b(v\d+|Registro rapido|Redisenyo|Simplificacion|Jerarquia|RPG|Limpieza visual|Pixel art|Visual polish|Compact numeric|Recomendaciones)/i;
const historicalLayers = sections.filter((section) => historicalPattern.test(section.title));

const repeatedSelectors = new Map();
let selectorBuffer = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("/*") || trimmed.startsWith("@") || trimmed.startsWith("}")) {
    selectorBuffer = [];
    continue;
  }

  selectorBuffer.push(trimmed);

  if (trimmed.endsWith("{")) {
    const selector = selectorBuffer.join(" ").replace(/\s*\{\s*$/, "");
    if (!selector.includes("@")) {
      repeatedSelectors.set(selector, (repeatedSelectors.get(selector) ?? 0) + 1);
    }
    selectorBuffer = [];
  }
}

const repeated = Array.from(repeatedSelectors.entries())
  .filter(([, count]) => count > 1)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 12);

console.log("CSS structure report");
console.log(`- total lines: ${lines.length}`);
console.log(`- sections: ${sections.length}`);
console.log(`- historical layers: ${historicalLayers.length}`);

console.log("\nHistorical / additive layers:");
for (const section of historicalLayers) {
  console.log(`- L${section.line}: ${section.title} (${section.lines} lines, ${section.rules} rules)`);
}

console.log("\nMost repeated selectors:");
for (const [selector, count] of repeated) {
  console.log(`- ${count}x ${selector}`);
}
