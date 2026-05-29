import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const gitignore = readFileSync(path.join(root, ".gitignore"), "utf8");

assert.match(gitignore, /(^|\n)\*\.log(\n|$)/, ".gitignore must ignore runtime logs");
assert.match(gitignore, /(^|\n)reports\/(\n|$)/, ".gitignore must ignore generated reports");

const generatedRootArtifacts = [
  "dev-server.err.log",
  "dev-server.out.log",
  "server.err.log",
  "server.out.log"
];

const leftoverLogs = generatedRootArtifacts.filter((file) => existsSync(path.join(root, file)));
assert.deepEqual(leftoverLogs, [], `generated root logs must be removed: ${leftoverLogs.join(", ")}`);

const reportsPath = path.join(root, "reports");
const reportEntries = existsSync(reportsPath) ? readdirSync(reportsPath) : [];
assert.deepEqual(reportEntries, [], "generated reports directory must be empty or absent before finishing a cycle");

console.log("validate-project-structure: ok");
