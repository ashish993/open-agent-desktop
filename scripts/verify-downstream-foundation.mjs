import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { auditDownstreamBoundary } from "./check-downstream-boundary.mjs";
import { launchVerificationServer } from "./control-omb.ts";
import product from "../config/product.json" with { type: "json" };

const BASELINE = "7850a1acef3b2bdd056be6946550498470cd9db0";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function finding(code, message) {
  return { code, message };
}

export function validateFoundationEvidence(report) {
  const findings = [];
  if (report?.baseline !== BASELINE) findings.push(finding("baseline_mismatch", "upstream baseline is not pinned"));
  if (report?.identity?.name !== product.name || report?.identity?.packageName !== product.packageName) {
    findings.push(finding("identity_mismatch", "product identity does not match config/product.json"));
  }
  if (report?.edition?.edition !== "oss" || !Array.isArray(report?.edition?.features) || report.edition.features.length) {
    findings.push(finding("enterprise_enabled", "foundation must report the OSS edition with no proprietary features"));
  }
  if (report?.health?.app !== product.packageName || !Number.isInteger(report?.health?.pid) || report.health.pid <= 0) {
    findings.push(finding("health_identity_mismatch", "health endpoint does not identify the downstream process"));
  }
  const liveDefault = join(homedir(), product.dataDirectory);
  if (typeof report?.dataDir !== "string" || report.dataDir === liveDefault || !basename(report.dataDir).startsWith("open-agent-desktop-foundation-")) {
    findings.push(finding("unsafe_data_directory", "verification data must be a disposable owned fixture"));
  }
  if (!report?.checks || Object.values(report.checks).some((value) => value !== true)) {
    findings.push(finding("check_failed", "one or more foundation checks failed"));
  }
  return findings;
}

export async function verifyDownstreamFoundation() {
  const boundaryFindings = auditDownstreamBoundary(ROOT);
  const fixture = await launchVerificationServer();
  try {
    const [healthResponse, editionResponse] = await Promise.all([
      fetch(`${fixture.info.url}/api/health`, { signal: AbortSignal.timeout(5_000) }),
      fetch(`${fixture.info.url}/api/edition`, { signal: AbortSignal.timeout(5_000) }),
    ]);
    const health = await healthResponse.json();
    const edition = await editionResponse.json();
    const report = {
      baseline: BASELINE,
      identity: { name: product.name, packageName: product.packageName },
      edition,
      health,
      dataDir: fixture.info.dataDir,
      checks: {
        boundary: boundaryFindings.length === 0,
        ownedProcess: healthResponse.ok && health.pid === fixture.info.pid,
        disposableData: basename(fixture.info.dataDir).startsWith("open-agent-desktop-foundation-")
          && fixture.info.dataDir !== join(homedir(), product.dataDirectory),
      },
    };
    return { report, findings: validateFoundationEvidence(report) };
  } finally {
    await fixture.close();
  }
}

const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const result = await verifyDownstreamFoundation();
  process.stdout.write(`${JSON.stringify(result.report, null, 2)}\n`);
  for (const item of result.findings) process.stderr.write(`${JSON.stringify(item)}\n`);
  process.exitCode = result.findings.length ? 1 : 0;
}
