import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const ignored = new Set([".git", "node_modules", "dist", "dist-server", "dist-native", "release", ".next", ".turbo"]);
// Store legacy identity checks as digests so the old product names do not
// remain in the public source tree, while the boundary still catches a
// reintroduced token in source, docs, or metadata.
const forbiddenTokenDigests = new Set([
  "63c74f70a9d4681c334e84001935955a75245ea5b16b9c37c808e85c69963705",
  "c14b10b3c1a29aad5231348388052e29100160b40eabc62638dc8b0872cb080a",
  "a82d92c43ec805af130d462152d4a1ab9941264bdf25516536e8d69ef263cf7e",
  "85a7cc5628fe13513f5844d93d1aaf4c6294d014d8160c44ac84aca473efc7fc",
]);
const extensions = new Set([".cjs", ".css", ".html", ".json", ".kt", ".md", ".mdx", ".mjs", ".plist", ".sh", ".swift", ".ts", ".tsx", ".xml", ".yml", ".yaml"]);

function digest(value) {
  return createHash("sha256").update(value.toLocaleLowerCase()).digest("hex");
}

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (extensions.has(path.slice(path.lastIndexOf(".")))) files.push(path);
  }
  return files;
}

const findings = [];
for (const file of walk(root)) {
  if (file.endsWith("scripts/check-branding-boundary.mjs")) continue;
  const tokens = readFileSync(file, "utf8").match(/[a-z0-9]+(?:[-_][a-z0-9]+)*/gi) ?? [];
  if (tokens.some((token) => forbiddenTokenDigests.has(digest(token)))) findings.push(relative(root, file));
}
if (findings.length) {
  console.error(`branding boundary violation in ${findings.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("branding boundary clean");
}
