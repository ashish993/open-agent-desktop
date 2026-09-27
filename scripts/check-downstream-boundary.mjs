import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BASELINE = "7850a1acef3b2bdd056be6946550498470cd9db0";
const REQUIRED_IDENTITY = {
  name: "Open Agent Desktop",
  packageName: "open-agent-desktop",
  bundleId: "dev.openagent.desktop",
  protocol: "openagentdesktop",
  dataDirectory: ".open-agent-desktop",
  artifactPrefix: "Open-Agent-Desktop",
};
const PUBLISH_PATTERNS = [
  /open-agent-desktop\/openagentdesktop-releases/i,
  /ghcr\.io\/open-agent-desktop\/openagentdesktop/i,
  /owner:\s*open-agent-desktop/i,
  /repo:\s*Open Agent Desktop/i,
  /npm\s+publish/i,
];

function finding(code, path, message) {
  return { code, path, message };
}

function text(root, path) {
  try { return readFileSync(join(root, path), "utf8"); } catch { return null; }
}

function workflowFiles(root) {
  const start = join(root, ".github", "workflows");
  if (!existsSync(start)) return [];
  return readdirSync(start, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
    .map((entry) => join(start, entry.name));
}

export function auditDownstreamBoundary(root) {
  root = resolve(root);
  const findings = [];
  const downstream = text(root, "DOWNSTREAM.md");
  if (!downstream?.includes(BASELINE)) findings.push(finding("baseline_missing", "DOWNSTREAM.md", `record upstream baseline ${BASELINE}`));
  if (!text(root, "LICENSE")?.includes("Apache License") || !text(root, "NOTICE")) {
    findings.push(finding("notice_missing", "LICENSE/NOTICE", "retain Apache licence and upstream notices"));
  }
  const enterprise = join(root, "enterprise");
  if (existsSync(enterprise) && lstatSync(enterprise).isDirectory()) {
    findings.push(finding("enterprise_present", "enterprise", "separately licensed enterprise tree must be absent"));
  }
  for (const file of workflowFiles(root)) {
    if (lstatSync(file).isSymbolicLink()) continue;
    const body = readFileSync(file, "utf8");
    if (PUBLISH_PATTERNS.some((pattern) => pattern.test(body))) {
      findings.push(finding("upstream_publish_target", relative(root, file), "upstream-owned publishing destination is active"));
    }
    if (/^package-(linux|win)\.ya?ml$/i.test(file.split("/").at(-1) ?? "") && /actions\/upload-artifact/i.test(body)) {
      findings.push(finding("installer_artifact", relative(root, file), "installer artifacts are not retained in the foundation fork"));
    }
  }
  for (const path of ["Dockerfile", "deploy/docker-compose.yml"]) {
    const body = text(root, path) ?? "";
    if (/ghcr\.io\/open-agent-desktop\/openagentdesktop|\.openagentdesktop|grep -q openagentdesktop/i.test(body)) {
      findings.push(finding("container_identity_mismatch", path, "container defaults and probes must use the downstream identity"));
    }
  }
  let product;
  let pkg;
  try { product = JSON.parse(text(root, "config/product.json") ?? "null"); } catch { product = null; }
  try { pkg = JSON.parse(text(root, "package.json") ?? "null"); } catch { pkg = null; }
  const builder = text(root, "electron-builder.yml") ?? "";
  const identityOk = product && Object.entries(REQUIRED_IDENTITY).every(([key, value]) => product[key] === value)
    && pkg?.name === REQUIRED_IDENTITY.packageName
    && builder.includes(`appId: ${REQUIRED_IDENTITY.bundleId}`)
    && builder.includes(`productName: ${REQUIRED_IDENTITY.name}`)
    && builder.includes(REQUIRED_IDENTITY.protocol)
    && builder.includes(REQUIRED_IDENTITY.artifactPrefix);
  if (!identityOk) findings.push(finding("identity_mismatch", "config/product.json", "runtime and package identity must match the downstream contract"));
  const guide = text(root, "docs/fork-development.md") ?? "";
  const documentationOk = guide.includes(BASELINE)
    && guide.includes("canonical public repository and any synchronization remote will be")
    && guide.includes("pnpm check:downstream")
    && guide.includes("node scripts/verify-downstream-foundation.mjs")
    && guide.includes("Release publishing is intentionally absent");
  if (!documentationOk) findings.push(finding("documentation_missing", "docs/fork-development.md", "document bootstrap, verification, upstream sync, and the no-publish boundary"));
  return findings;
}

export function formatFinding(value) {
  return JSON.stringify(value);
}

const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const findings = auditDownstreamBoundary(root);
  for (const item of findings) process.stderr.write(`${formatFinding(item)}\n`);
  process.exitCode = findings.length ? 1 : 0;
}
