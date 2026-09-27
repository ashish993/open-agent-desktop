# Open Agent Desktop Fork Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the recorded Open Agent Desktop OSS baseline into a safe downstream development fork that cannot publish upstream, excludes the separately licensed enterprise tree, owns its runtime identity, and passes isolated OSS build and smoke gates.

**Architecture:** Preserve the upstream provider, harness, approval, chat, and desktop foundations. Add a narrow downstream boundary around provenance, licensing, release ownership, and runtime identity before implementing Blueprints or orchestration.

**Tech Stack:** Node.js 24+, TypeScript 5.8, Electron 43, React 19, Vite 7, Vitest 4, pnpm 10.33, electron-builder 26, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-26-open-agent-desktop-design.md`

## Global Constraints

- Baseline is commit `7850a1acef3b2bdd056be6946550498470cd9db0` from `https://github.com/your-org/open-agent-desktop.git`.
- Exclude `enterprise/` from source and every artifact; preserve Apache-2.0 `LICENSE`, applicable `NOTICE`, and `third_party/` attributions.
- Working identity is name `Open Agent Desktop`, package `open-agent-desktop`, bundle `dev.openagent.desktop`, protocol `openagentdesktop`, data directory `.open-agent-desktop`, artifact prefix `Open-Agent-Desktop`.
- Do not publish packages, installers, update metadata, containers, or releases in this slice.
- Local packaging stays `--publish never`; no placeholder repository or owner may be invented.
- Keep provider SPI, canonical runtime events, approvals, and fail-closed desktop capability rules intact.
- Verify only against disposable homes and fake providers, never live user data.
- Retain internal `omb` and `OMB_*` compatibility names for this slice; do not start a repository-wide rename.
- Every task finishes with focused tests and a separate commit.

## Review Focus

- Tags or manual workflows must not upload to `open-agent-desktop`, upstream release repositories, npm, or upstream GHCR; Task 2 pins this.
- Removing `enterprise/` must preserve build, boot, and `edition: "oss"`; Tasks 3 and 5 pin this.
- New installs must use `.open-agent-desktop` without reading or overwriting `.openagentdesktop`; Task 4 pins this.
- Bundle ID, protocol, product name, artifacts, and publisher configuration must agree; Tasks 2 and 4 pin this.
- Upstream sync must not erase provenance or silently reintroduce excluded/release files; Tasks 1 and 6 pin this.

---

## File Map

- `DOWNSTREAM.md`: provenance, exclusions, synchronization, and release ownership.
- `config/product.json`: canonical working identity.
- `scripts/check-downstream-boundary.mjs`: read-only repository audit.
- `scripts/check-downstream-boundary.test.mjs`: audit fixtures.
- `scripts/check-runtime-identity.test.mjs`: runtime/package identity checks.
- `scripts/verify-downstream-foundation.mjs`: isolated end-to-end foundation proof.
- `docs/fork-development.md`: contributor bootstrap and upstream sync procedure.
- Existing package, Electron, workflow, bundling, and smoke files: minimum changes required by the boundary.

### Task 1: Downstream Provenance and Boundary Audit

**Files:**
- Create: `DOWNSTREAM.md`
- Create: `config/product.json`
- Create: `scripts/check-downstream-boundary.mjs`
- Create: `scripts/check-downstream-boundary.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `auditDownstreamBoundary(root: string): BoundaryFinding[]`, with `BoundaryFinding = { code: string; path: string; message: string }`.
- Produces: CLI exit `0` for no findings and exit `1` with JSON-line findings.

- [ ] **Step 1: Write failing audit tests**

Add tests named `accepts recorded baseline and notices`, `rejects changed baseline`, `rejects enterprise directory`, `rejects upstream release destination`, and `rejects inconsistent identity`. Assert codes `baseline_missing`, `notice_missing`, `enterprise_present`, `upstream_publish_target`, and `identity_mismatch`.

- [ ] **Step 2: Run the tests and observe module-not-found**

Run: `node --test scripts/check-downstream-boundary.test.mjs`
Expected: FAIL because `check-downstream-boundary.mjs` does not exist.

- [ ] **Step 3: Add canonical identity and provenance**

`config/product.json` must contain the six exact identity values in Global Constraints. `DOWNSTREAM.md` must record baseline hash, upstream URL, Apache/enterprise boundary, notices, `upstream` remote convention, sync-branch workflow, and rule separating downstream changes from upstream PRs.

- [ ] **Step 4: Implement audit functions and CLI**

Ignore `.git`, `node_modules`, `release`, and `dist-server`. Do not follow symlinks outside the root. Check the exact invariants exercised by Step 1 without changing files.

- [ ] **Step 5: Add package script and run focused checks**

Add `check:downstream` as `node scripts/check-downstream-boundary.mjs`. Run `node --test scripts/check-downstream-boundary.test.mjs && pnpm check:downstream`. Unit tests must pass; repository audit must still identify current enterprise and release-target findings.

- [ ] **Step 6: Commit**

Run: `git add DOWNSTREAM.md config/product.json scripts/check-downstream-boundary.mjs scripts/check-downstream-boundary.test.mjs package.json && git commit -m "chore: define downstream fork boundary"`.

### Task 2: Quarantine Upstream Publishing

**Files:**
- Delete: `.github/workflows/release.yml`
- Delete: `.github/workflows/prepare-release.yml`
- Delete: `.github/workflows/sync-published-release.yml`
- Delete: `.github/workflows/npm-package.yml`
- Delete: `.github/workflows/contributors.yml`
- Modify: `.github/workflows/docker.yml`
- Modify: `.github/workflows/package-win.yml`
- Modify: `.github/workflows/package-linux.yml`
- Modify: `electron-builder.yml`
- Test: `scripts/check-downstream-boundary.test.mjs`

**Interfaces:**
- Consumes: Task 1 audit.
- Produces: build-and-smoke workflows and electron-builder config with no publishing provider.

- [ ] **Step 1: Extend release-hazard fixtures**

Assert `upstream_publish_target` for `owner: open-agent-desktop`, `repo: Open Agent Desktop`, upstream GHCR, `--repo open-agent-desktop/openagentdesktop-releases`, and `npm publish`. Accept `${{ github.repository }}` only where the job has no publishing action.

- [ ] **Step 2: Prove present configuration fails the audit**

Run: `node --test scripts/check-downstream-boundary.test.mjs && pnpm check:downstream`. Expected: tests pass and the repository audit lists upstream targets.

- [ ] **Step 3: Delete upstream release and CLA workflows**

Do not adapt them: signing identities, registry provenance, release repositories, and public publishing are outside this slice.

- [ ] **Step 4: Make retained workflows build-and-smoke only**

Keep manual and pull-request validation. Remove tag triggers, uploads, publish jobs, upstream image tags, enterprise smoke, and canonical-release wording. Use local Docker tag `open-agent-desktop:ci`.

- [ ] **Step 5: Remove electron-builder publisher**

Delete its `publish` block; retain `--publish never` package commands.

- [ ] **Step 6: Run the audit**

Run: `pnpm check:downstream`. Expected: no upstream publish finding; `enterprise_present` remains until Task 3.

- [ ] **Step 7: Commit**

Run: `git add .github/workflows electron-builder.yml scripts/check-downstream-boundary.test.mjs && git commit -m "chore: quarantine upstream release channels"`.

### Task 3: Remove the Separately Licensed Enterprise Tree

**Files:**
- Delete: `enterprise/**`
- Modify: `scripts/build-npm-package.mjs`
- Modify: `scripts/bundle-server.mjs`
- Modify: `scripts/smoke-packaged-server.mjs`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/docker.yml`
- Modify: `scripts/testing/verification-docs.test.ts`
- Test: `server/enterprise.test.ts`

**Interfaces:**
- Consumes: neutral OSS hook `server/enterprise.ts`.
- Produces: source and artifacts with no enterprise tree; `/api/edition` remains OSS.

- [ ] **Step 1: Add packaged-tree absence assertions**

Assert `existsSync(join(staging, "server", "enterprise")) === false` and `edition.edition === "oss"`. With a synthetic `OMB_LICENSE_KEY`, assert no external layer loads and startup remains OSS with a notice.

- [ ] **Step 2: Prove the new assertion fails before deletion**

Run: `pnpm exec vitest run server/enterprise.test.ts && pnpm test:packaged-server`. Expected: absence assertion fails.

- [ ] **Step 3: Delete only the separately licensed tree and packaging branches**

Keep `server/enterprise.ts` temporarily because OSS core imports its fail-closed edition API. Remove code that copies or advertises the separate layer.

- [ ] **Step 4: Tighten verification-document scanning**

Scan only existing OSS roots. Fail when an OSS verification recipe references a missing enterprise executable path; do not blanket-skip other missing files.

- [ ] **Step 5: Make CI prove the checked-out tree is OSS**

Replace the job-time enterprise deletion with direct build, `server/enterprise.test.ts`, and packaged-server smoke. Remove enterprise triggers/checks from Docker workflow.

- [ ] **Step 6: Run focused checks**

Run: `pnpm check:downstream && pnpm exec vitest run server/enterprise.test.ts scripts/testing/verification-docs.test.ts && pnpm test:packaged-server`. Expected: PASS and no enterprise artifact.

- [ ] **Step 7: Commit**

Run: `git add -A enterprise scripts .github/workflows/ci.yml .github/workflows/docker.yml && git commit -m "chore: make downstream tree fully Apache licensed"`.

### Task 4: Independent Runtime Identity

**Files:**
- Create: `scripts/check-runtime-identity.test.mjs`
- Modify: `package.json`
- Modify: `electron-builder.yml`
- Modify: `index.html`
- Modify: `server/config.ts`
- Modify: `server/brand.ts`
- Modify: `electron/main.mjs`
- Modify: focused Linux/CUA smoke files and adjacent tests referencing release-critical identity.

**Interfaces:**
- Consumes: `config/product.json`.
- Produces: default data directory `<home>/.open-agent-desktop` and canonical package/Desktop metadata.

- [ ] **Step 1: Write failing identity tests**

Parse product, package, and builder config, and import `server/config.ts` in a child process with isolated `HOME`. Assert package `open-agent-desktop`, app ID `dev.openagent.desktop`, name `Open Agent Desktop`, scheme `openagentdesktop`, artifact prefix `Open-Agent-Desktop-`, and default data directory `.open-agent-desktop`. Assert explicit `OMB_DATA_DIR` still overrides it.

- [ ] **Step 2: Run and observe old identity failures**

Run: `node --test scripts/check-runtime-identity.test.mjs`. Expected: FAIL showing current upstream values.

- [ ] **Step 3: Update package and builder metadata**

Apply canonical values. Remove upstream homepage, repository, and author rather than inventing ownership. Preserve current version and Apache licence.

- [ ] **Step 4: Update minimum runtime identity**

Change server/Electron default data directory, bundle ID, protocol registration, default brand, HTML title, startup errors, and packaging smoke expectations. Keep internal `OMB_*` and fixture names.

- [ ] **Step 5: Run identity and focused platform tests**

Run: `node --test scripts/check-runtime-identity.test.mjs electron/*.node-test.mjs && pnpm exec vitest run server/brand.test.ts`. Expected: PASS.

- [ ] **Step 6: Run audit and Electron syntax check**

Run: `pnpm check:downstream && pnpm check:electron`. Expected: PASS.

- [ ] **Step 7: Commit**

Run: `git add config/product.json package.json electron-builder.yml index.html server/config.ts server/brand.ts electron/main.mjs scripts && git commit -m "feat: establish independent desktop identity"`.

### Task 5: Isolated OSS Foundation Verification

**Files:**
- Create: `scripts/verify-downstream-foundation.mjs`
- Create: `scripts/verify-downstream-foundation.test.mjs`
- Modify: `docs/verification/README.md`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `validateFoundationEvidence(report): FoundationFinding[]` and JSON evidence `{ baseline, identity, edition, health, dataDir, checks }`.

- [ ] **Step 1: Write verifier tests**

Add tests `accepts isolated OSS evidence`, `rejects enterprise or live default data`, and `rejects upstream health identity`. Assert stable finding codes.

- [ ] **Step 2: Run and observe module-not-found**

Run: `node --test scripts/verify-downstream-foundation.test.mjs`. Expected: FAIL.

- [ ] **Step 3: Implement isolated verifier**

Launch the existing fake-engine fixture with a generated temporary home and explicit URL. Query health and edition, confirm the data directory belongs to the fixture, stop only its exact child, and emit JSON. Never discover a default port.

- [ ] **Step 4: Document and add CI gate**

Document commands and evidence limits. CI runs boundary, identity, server build, packaged smoke, and foundation verifier.

- [ ] **Step 5: Run static and packaged checks**

Run: `pnpm check:downstream && node --test scripts/check-runtime-identity.test.mjs scripts/verify-downstream-foundation.test.mjs && pnpm typecheck && pnpm build:server && pnpm test:packaged-server`. Expected: PASS.

- [ ] **Step 6: Run real isolated verification**

Run: `node scripts/verify-downstream-foundation.mjs`. Expected: exit 0 and evidence reporting baseline, Open Agent Desktop, OSS edition, disposable directory, and all checks true.

- [ ] **Step 7: Commit**

Run: `git add scripts/verify-downstream-foundation.mjs scripts/verify-downstream-foundation.test.mjs docs/verification/README.md .github/workflows/ci.yml && git commit -m "test: verify downstream OSS foundation"`.

### Task 6: Fork Guide and Full Foundation Gate

**Files:**
- Create: `docs/fork-development.md`
- Modify: `README.md`
- Modify: `DOWNSTREAM.md`
- Modify: `scripts/check-downstream-boundary.mjs`

**Interfaces:**
- Produces: reproducible contributor bootstrap, verification, and upstream sync instructions.

- [ ] **Step 1: Require fork documentation in the audit**

Require exact baseline, upstream remote command, `pnpm check:downstream`, isolated verifier, and statement that release publishing is absent. Missing text reports `documentation_missing`.

- [ ] **Step 2: Run audit and observe missing-guide failure**

Run: `pnpm check:downstream`. Expected: FAIL with `documentation_missing`.

- [ ] **Step 3: Write guide and update README**

Document prerequisites, install/dev commands, full gate, disposable fixtures, upstream fetch/sync branch, conflict review, enterprise exclusion, attribution, and no-publish boundary. README links to provenance, design, and guide.

- [ ] **Step 4: Run complete repository gate**

Run: `pnpm check:downstream && pnpm lint && pnpm typecheck && pnpm i18n:check && pnpm check:electron && pnpm test`. Expected: PASS. Replace only tests that explicitly require removed licensed source; record each replacement in `DOWNSTREAM.md`.

- [ ] **Step 5: Run production builds**

Run: `pnpm build && pnpm build:server && pnpm test:packaged-server`. Expected: PASS with no enterprise or upstream publisher metadata.

- [ ] **Step 6: Inspect final history and diff**

Run: `git diff 7850a1acef3b2bdd056be6946550498470cd9db0 --check && git status --short && git log --oneline --decorate -8`. Expected: no whitespace errors and task-separated commits.

- [ ] **Step 7: Commit**

Run: `git add README.md DOWNSTREAM.md docs/fork-development.md scripts/check-downstream-boundary.mjs && git commit -m "docs: explain downstream fork development"`.

## Completion Criteria

- No `enterprise/` source or artifact exists.
- No active configuration can publish to an upstream-owned destination.
- Static checks, tests, server build, packaged smoke, and isolated foundation verification pass.
- Runtime and packaging use the canonical independent identity.
- Licences, notices, and exact upstream provenance remain intact.
- The branch is ready for the separate Blueprint-kernel implementation plan.
