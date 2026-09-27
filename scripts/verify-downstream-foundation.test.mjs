import assert from "node:assert/strict";
import test from "node:test";

import { validateFoundationEvidence } from "./verify-downstream-foundation.mjs";

const valid = () => ({
  baseline: "7850a1acef3b2bdd056be6946550498470cd9db0",
  identity: { name: "Open Agent Desktop", packageName: "open-agent-desktop" },
  edition: { edition: "oss", features: [] },
  health: { app: "open-agent-desktop", pid: 4242 },
  dataDir: "/tmp/open-agent-desktop-foundation-fixture",
  checks: { boundary: true, ownedProcess: true, disposableData: true },
});

test("accepts isolated OSS evidence", () => {
  assert.deepEqual(validateFoundationEvidence(valid()), []);
});

test("rejects enterprise or live default data", () => {
  const report = valid();
  report.edition = { edition: "enterprise", features: ["admin"] };
  report.dataDir = "/Users/example/.open-agent-desktop";
  report.checks.disposableData = false;
  assert.deepEqual(validateFoundationEvidence(report).map(({ code }) => code), [
    "enterprise_enabled",
    "unsafe_data_directory",
    "check_failed",
  ]);
});

test("rejects upstream health identity", () => {
  const report = valid();
  report.health.app = "openagentdesktop";
  assert.deepEqual(validateFoundationEvidence(report).map(({ code }) => code), ["health_identity_mismatch"]);
});
