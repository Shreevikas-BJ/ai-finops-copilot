import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const forbidden = String.fromCodePoint(0x2014);
const excluded = new Set([".git", ".next", "node_modules", "outputs", "work"]);
const textExtensions = new Set([
  ".css",
  ".csv",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (excluded.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

const root = process.cwd();
const files = await collectFiles(root);
const violations = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  content.split(/\r?\n/).forEach((line, index) => {
    if (line.includes(forbidden)) {
      violations.push(`${path.relative(root, file)}:${index + 1}`);
    }
  });
}

if (violations.length > 0) {
  console.error(`Forbidden punctuation found in:\n${violations.join("\n")}`);
  process.exit(1);
}

console.log("No em dash characters found.");
