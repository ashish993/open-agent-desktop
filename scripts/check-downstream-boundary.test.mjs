import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { auditDownstreamBoundary } from "./check-downstream-boundary.mjs";

const roots = [];
const identity = {
  name: "Open Agent Desktop",
  packageName: "open-agent-desktop",
  bundleId: "dev.openagent.desktop",
  protocol: "openagentdesktop",
  dataDirectory: ".open-agent-desktop",
  artifactPrefix: "Open-Agent-Desktop",
};

function write(root, path, value) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, value);
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "oad-boundary-"));
  roots.push(root);
  write(root, "LICENSE", "Apache License\nVersion 2.0");
  write(root, "NOTICE", "Open Agent Desktop upstream notices retained");
  write(root, "config/product.json", JSON.stringify(identity));
  write(root, "package.json", JSON.stringify({ name: identity.packageName, license: "Apache-2.0" }));
  write(root, "electron-builder.yml", `appId: ${identity.bundleId}\nproductName: ${identity.name}\nartifactName: ${identity.artifactPrefix}-\${version}.dmg\nprotocols:\n  - schemes: [${identity.protocol}]\n`);
  write(root, "DOWNSTREAM.md", "7850a1acef3b2bdd056be6946550498470cd9db0\nhttps://github.com/your-org/open-agent-desktop.git\n");
  write(root, "docs/fork-development.md", [
    "7850a1acef3b2bdd056be6946550498470cd9db0",
    "canonical public repository and any synchronization remote will be",
    "pnpm check:downstream",
    "node scripts/verify-downstream-foundation.mjs",
    "Release publishing is intentionally absent",
  ].join("\n"));
  return root;
}

test.afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

test("accepts recorded baseline and notices", () => {
  assert.deepEqual(auditDownstreamBoundary(fixture()), []);
});

test("rejects changed baseline", () => {
  const root = fixture();
  write(root, "DOWNSTREAM.md", "wrong baseline");
  assert(auditDownstreamBoundary(root).some(({ code }) => code === "baseline_missing"));
  rmSync(join(root, "NOTICE"));
  assert(auditDownstreamBoundary(root).some(({ code }) => code === "notice_missing"));
});

test("rejects enterprise directory", () => {
  const root = fixture();
  write(root, "enterprise/LICENSE", "source available");
  assert(auditDownstreamBoundary(root).some(({ code }) => code === "enterprise_present"));
});

test("rejects upstream release destination", () => {
  for (const hazard of [
    "owner: open-agent-desktop",
    "repo: Open Agent Desktop",
    "image: ghcr.io/open-agent-desktop/openagentdesktop:latest",
    "run: gh release upload --repo open-agent-desktop/openagentdesktop-releases",
    "run: npm publish package.tgz",
  ]) {
    const root = fixture();
    write(root, ".github/workflows/release.yml", hazard);
    assert(auditDownstreamBoundary(root).some(({ code }) => code === "upstream_publish_target"), hazard);
  }
  const safe = fixture();
  write(safe, ".github/workflows/build.yml", "run: docker build -t ${{ github.repository }}:ci .");
  assert.equal(auditDownstreamBoundary(safe).some(({ code }) => code === "upstream_publish_target"), false);
});

test("rejects inconsistent identity", () => {
  const root = fixture();
  write(root, "package.json", JSON.stringify({ name: "openagentdesktop", license: "Apache-2.0" }));
  assert(auditDownstreamBoundary(root).some(({ code }) => code === "identity_mismatch"));
});

test("requires reproducible fork documentation", () => {
  const root = fixture();
  rmSync(join(root, "docs/fork-development.md"));
  assert(auditDownstreamBoundary(root).some(({ code }) => code === "documentation_missing"));
});
