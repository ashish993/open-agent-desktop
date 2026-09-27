# Open Agent Desktop: Two-Mode Agent Team Platform Design

**Status:** Proposed for human review
**Date:** 2026-09-26
**Internal project name:** Open Agent Desktop
**Research baseline:** Open Agent Desktop commit `7850a1acef3b2bdd056be6946550498470cd9db0`
**Upstream base:** Open Agent Desktop OSS edition, excluding `enterprise/`

## 1. Intent

Open Agent Desktop is a fully open-source, local-first desktop application that lets technical and non-technical users create and run specialised teams of AI agents using AI access they already control, initially Codex and Claude.

The application has two presentations over one domain model:

- **Everyday Mode:** a user describes an outcome, answers a short intake, reviews a generated team and its permissions, and runs it.
- **Builder Mode:** a user directly edits agents, workflow dependencies, capabilities, evaluations, limits, and local bindings.

Success for the first usable release means a user can describe an outcome, receive a transparent proposed team, approve its roles and authority, execute it locally, and receive a checked deliverable with a recoverable activity record.

## 2. Scope

### Goals

- Reuse the upstream provider drivers, harness, canonical runtime events, permission broker, desktop shell, chat UI, routines, and isolated verification system.
- Introduce a provider-neutral Team Blueprint as the portable source definition for a specialised agent team.
- Compile each Blueprint plus local bindings into an immutable Execution Plan.
- Execute bounded dependency graphs with parallel work, human approvals, typed artifacts, retry limits, and explicit completion evaluations.
- Keep credentials, local paths, model selections, transcripts, and run history outside portable Blueprint files.
- Preserve a clean upstream synchronization path.
- Remain useful without any hosted service.

### Non-goals for the first release

- Unrestricted autonomous swarms or self-expanding permissions.
- Multi-tenant SaaS, hosted identity, billing, or a proprietary control plane.
- A public template marketplace.
- Distributed execution across multiple machines.
- Arbitrary workflow cycles or unbounded recursive delegation.
- Replacement of upstream chat, provider, approval, routine, or computer-use subsystems.
- Automatic external communication without an explicit applicable policy and approval decision.

## 3. Licensing and fork boundary

The fork uses only the Apache-2.0 portion of Open Agent Desktop. The upstream `enterprise/` directory is excluded from the derived open-source distribution. Apache notices, the upstream NOTICE file, and third-party attributions remain intact.

The fork uses its own name, iconography, application bundle identifiers, release repositories, signing identities, update metadata, package names, and data directory. It does not publish artifacts to upstream release channels.

The Git configuration retains an `upstream` remote. Upstream changes enter through dedicated synchronization branches and must pass the fork's complete test suite before merge. Product-specific work is kept in focused modules so upstream synchronization does not repeatedly collide with the provider and desktop foundations.

## 4. Architectural principles

1. **One domain, two modes.** Everyday and Builder modes read and write the same Blueprint representation.
2. **Portable intent, local authority.** Shareable definitions describe needs; installations decide concrete models, folders, tools, credentials, and permissions.
3. **Compile before execution.** Every run uses a frozen, validated Execution Plan.
4. **Fail closed.** Missing capabilities, invalid bindings, stale approvals, unknown schema versions, or unavailable providers block affected work rather than silently degrading authority.
5. **Bound autonomy.** Delegation, parallelism, attempts, duration, and permissions have explicit ceilings.
6. **Evidence over self-report.** Runs finish only when required artifacts and evaluations pass.
7. **Keep provider drivers thin.** Orchestration consumes canonical runtime events and must not introduce workflow logic into provider adapters.
8. **Local-first and recoverable.** A crash or restart must not lose an accepted approval, duplicate an external action, or silently rerun completed work.

## 5. Domain artifacts

### 5.1 Team Blueprint

A Blueprint is a portable, versioned YAML or JSON document validated by a strict schema. Its top-level fields are:

- `format` and `version`
- `metadata`: stable ID, semantic release, name, description, licence, and authorship
- `objective`: outcome, required inputs, and declared deliverables
- `agents`: stable IDs, roles, instructions, and required capabilities
- `workflow`: tasks, dependencies, artifact contracts, optional conditions, and bounded delegation rules
- `policies`: requested capabilities and resource limits
- `evaluations`: deterministic and agent-reviewed completion gates
- `examples`: optional safe sample inputs and expected result descriptions

Blueprints never contain credentials, provider session IDs, absolute paths, selected computers, chat history, or live approval grants. Unknown fields are rejected for authoring and preserved only through an explicit future-version compatibility envelope; they are never executed.

### 5.2 Installation Bindings

Bindings are private, machine-local records that resolve Blueprint requirements:

- agent to provider/model selection
- capability to local implementation or MCP server
- portable workspace name to an approved local folder
- connector slots to locally stored credentials
- approval policy overrides that may only tighten a Blueprint request by default
- runtime availability and compatibility results

Bindings are identified by Blueprint ID and release. They do not modify the Blueprint.

### 5.3 Execution Plan

The compiler combines one exact Blueprint release, validated input values, and one binding set into a canonical immutable plan. The plan records hashes of all source inputs and resolved agent instructions. It expands defaults, calculates the dependency graph, detects cycles, verifies artifact producer/consumer relationships, resolves capability scopes, and rejects unsatisfied requirements before a run starts.

A plan receives a unique ID and content hash. Resume always uses the original plan; editing a Blueprint creates a future plan, never mutates an active run.

### 5.4 Run and artifacts

A Run references exactly one Execution Plan and owns task attempts, approval requests, evaluation results, and produced artifacts. Artifacts are stored outside the event journal and referenced by relative path, media type, byte length, and digest. Artifact paths must remain inside the run workspace after canonical path resolution.

## 6. Workflow and orchestration

### 6.1 Graph model

The first release supports a directed acyclic task graph. Each task declares:

- stable task ID
- assigned agent
- `dependsOn` relationships
- required and produced artifact IDs
- task-specific instructions
- optional execution condition over validated structured values
- timeout and attempt limit bounded by global limits
- delegation policy
- completion checks

Tasks become runnable only when all dependencies have terminal successful outcomes and required inputs exist. Independent runnable tasks may execute concurrently up to the plan limit. Downstream tasks are blocked if an upstream required task fails or is cancelled.

### 6.2 Bounded delegation

A task may create child tasks only when delegation is enabled in the compiled plan. Delegation specifies allowed target agents, maximum depth, maximum child count, and permitted output types. A child inherits the intersection of its parent authority and target-agent authority and cannot expand time, attempt, tool, path, or communication scopes.

Child proposals are validated before dispatch. Invalid or excessive proposals become normal task errors visible to the originating agent; they do not mutate the plan's security boundary.

### 6.3 Coordinator

The coordinator is a deterministic service, not an LLM persona. It selects ready tasks, enforces limits, opens provider turns, observes canonical runtime events, records state transitions, and dispatches evaluation work. A Blueprint may name a lead agent for synthesis and adaptive planning, but that agent operates through the same bounded task APIs as every other agent.

### 6.4 State machines

Blueprint lifecycle:

`draft -> validated -> published -> deprecated`

Run lifecycle:

`created -> compiling -> ready -> running -> completed | failed | cancelled`

While running, a derived attention state may be `working`, `waiting_for_input`, `waiting_for_approval`, `blocked`, or `retrying`. Attention is not a terminal run state and is calculated from active tasks and approvals.

Task attempt lifecycle:

`pending -> ready -> dispatched -> active -> succeeded | failed | cancelled | timed_out`

Each transition has a constrained source state and idempotency key.

## 7. Capability and approval model

Capabilities are stable semantic names rather than provider tool names. Initial families are:

- `filesystem.read` and `filesystem.write`
- `process.execute`
- `web.read` and `browser.control`
- `connector.read` and `connector.write`
- `external.communicate`
- `agent.delegate`

Each applicable capability resolves to `deny`, `ask`, or `allow`, plus a scope. Scopes include approved workspace roots, command rules, connector/account identifiers, destination classes, and operation names.

The effective authority is the intersection of:

1. Blueprint request
2. installation policy
3. agent policy
4. task policy
5. runtime/provider capability
6. any one-time human approval

An inner layer can reduce authority but cannot expand an outer layer. Imported Blueprints begin with sensitive capabilities at `ask` or `deny`; a file cannot silently enable automatic external side effects.

Approval records bind to the exact run, task attempt, normalized operation, arguments digest, scope, and expiration. A stale or altered operation requires a new approval. Cancellation, timeout, or process restart settles orphaned approvals as denied unless the operation has a durable verified completion receipt.

## 8. Component boundaries

### Existing upstream components retained

- `server/contracts.ts` and canonical provider/runtime events
- `server/drivers/` and provider registration
- `server/harness/` registry and event bus
- existing approval broker and approval UI
- routines and scheduling
- team/chat storage and rendering
- Electron desktop capabilities
- existing isolated fake-provider and control-surface verification

### New modules

- `shared/blueprints/`: schemas, parsing, normalization, migrations, canonical serialization, and hashes
- `server/blueprints/`: CRUD, import/export, validation reports, and installation bindings
- `server/plans/`: compiler and static graph/capability analysis
- `server/orchestration/`: coordinator, task scheduler, run recovery, delegation validation, and evaluation dispatch
- `server/run-store/`: journal, checkpoints, artifact metadata, and query projections
- `server/evaluations/`: deterministic evaluators and bounded agent-review evaluator
- `server/routes/blueprints.ts`, `plans.ts`, and `runs.ts`: focused HTTP route factories
- `src/features/everyday/`: guided intake, generated proposal, permission review, and run summary
- `src/features/builder/`: Blueprint editor, graph view, validation diagnostics, and local binding editor
- `src/features/runs/`: task graph progress, approvals, artifacts, errors, and evaluation evidence

The existing Open Agent Desktop package format receives an adapter. Import maps compatible agents, skills, rooms, and routines into a draft Blueprint; unsupported fields are reported. Export to the legacy package format is intentionally lossy and previewed before writing.

## 9. APIs and data flow

New APIs follow the upstream route-module pattern and reuse the existing authenticated HTTP and SSE surfaces.

Minimum operations:

- validate, save, list, read, version, import, and export Blueprints
- inspect requirements and configure local bindings
- compile a dry-run plan and return diagnostics
- start, inspect, wait for, cancel, and resume runs
- submit required user input
- answer approval requests through the existing approval path
- list and read bounded run artifacts

Every mutating request accepts an idempotency key. Update operations include an expected revision. Conflicts return a structured `409` with the current revision and a safe next action.

Execution flow:

1. Everyday Mode generates a draft or Builder Mode authors one.
2. The shared parser normalizes and validates it.
3. The user binds local providers, tools, and workspace scopes.
4. A compile dry run returns permissions, resource limits, graph order, and unresolved requirements.
5. Starting a run persists its immutable plan before dispatching any task.
6. The coordinator dispatches ready tasks through existing provider adapters.
7. Canonical events are correlated to run/task attempts and folded into projections.
8. Produced artifacts are hashed and registered.
9. Required evaluations execute after their dependencies.
10. The run reaches `completed` only after all required deliverables and evaluations pass.

## 10. Persistence and recovery

The first release preserves upstream NDJSON conventions and uses a dedicated per-run append-only journal managed by one in-process writer. Each event contains schema version, sequence number, timestamp, run ID, task/attempt ID where applicable, correlation ID, causation ID, event type, payload, and idempotency key.

Materialized run snapshots are disposable projections written with atomic replacement. On startup, recovery loads the latest valid snapshot and replays subsequent journal entries. A truncated final NDJSON line is quarantined and reported; earlier valid events remain readable.

Before an external side effect, the run records an intent with an idempotency key. After completion it records a receipt. Recovery never automatically repeats an intent with an unknown outcome; it marks the task `blocked` and asks for reconciliation. This provides at-most-once behaviour where an integration supports idempotency and safe ambiguity otherwise.

Run workspaces use generated directories beneath the application data directory. All paths are canonicalized and checked against the workspace root. Temporary files are written privately and atomically promoted. Secrets are redacted before journal persistence using the upstream redaction boundary.

## 11. Error handling

Errors use stable machine codes, safe user messages, and optional redacted technical details. The principal classes are:

- Blueprint parse/schema failure
- static graph or artifact-contract failure
- unresolved installation requirement
- unavailable provider or capability
- permission denied or approval expired
- task timeout, interruption, or provider failure
- evaluation failure
- ambiguous external side effect
- persistence corruption or insufficient disk space

Failures are scoped. A failed independent task does not stop unrelated active work unless the plan declares fail-fast. Required downstream tasks become blocked with causal references. Retries create new attempt IDs and never erase prior evidence.

The UI always states what failed, what remains safe, and the valid next action: retry, change bindings, provide input, request approval, reconcile an external operation, or cancel.

## 12. Evaluations

Deterministic evaluators ship first:

- artifact exists and is within size/type bounds
- required structured fields validate
- expected files are non-empty
- cited-source structure is present where required
- command or test exits successfully in an approved sandbox
- all required tasks and approvals have acceptable outcomes

An agent-review evaluator is optional and explicitly identifies its reviewing agent, rubric, input artifacts, structured output schema, and fail threshold. It cannot be the only check for mechanical properties. Evaluation output and supporting evidence are stored as run artifacts.

## 13. Everyday and Builder experiences

Everyday Mode asks only questions required to form a safe Blueprint: desired outcome, inputs, deliverable form, permitted data sources, and whether external actions are expected. The generator produces a proposal, not an active team. The review screen explains each role, requested tool, approval boundary, estimated parallelism, and missing local binding in plain language.

Generated content is treated as untrusted input and passes through the same parser, policy checks, and compiler as hand-authored content. The generator cannot write installation bindings, activate connections, approve capabilities, or start a run.

Builder Mode exposes the normalized representation through structured forms and a graph view, with source YAML as an advanced view. Changes continuously run static validation. Builder Mode never offers a control that the installed provider cannot honour.

Both modes converge on the same compile preview and run screen. Switching modes loses no information.

## 14. Testing and verification

Testing extends upstream conventions and never touches live user data.

### Unit tests

- schema accept/reject and migration fixtures
- canonical serialization and stable hashing
- graph validation, cycle detection, readiness, conditions, and artifact contracts
- policy intersection and path/command scope checks
- delegation depth/count/authority limits
- state-transition and idempotency rules
- journal replay, truncated-tail recovery, and projection rebuilding

### Contract and integration tests

- fake Codex and Claude drivers emitting canonical events
- concurrent task completion in different orders
- approval request, denial, expiry, cancellation, and stale-operation rejection
- restart during active tasks and pending approvals
- ambiguous external-effect recovery
- provider unavailable before and during a run
- retry without duplicate artifact or external action
- legacy Open Agent Desktop package import with a precise loss report

### API and UI workflow tests

- Everyday requirement to generated draft
- Builder edits reflected in Everyday summary
- compile preview and unresolved-binding remediation
- run progress, waiting states, approvals, artifacts, and evaluation evidence
- cancellation of one run without interrupting another
- isolated fixture using the repository's existing `control:omb` surface

### Release gates

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm i18n:check`
- `pnpm check:electron` for desktop-shell changes
- packaged-server smoke on supported operating systems
- signed desktop package smoke before public release
- SBOM, NOTICE, licence, bundle ID, update-channel, and branding audit

Passing automated tests proves the tested contracts. Claims about real provider subscriptions, host computer control, platform packaging, or full user journeys require the corresponding isolated or real-platform verification evidence.

## 15. Delivery slices

1. **Fork foundation:** establish new identity and release ownership, exclude `enterprise/`, preserve notices, record upstream commit, and prove the OSS build in isolation.
2. **Blueprint kernel:** schemas, canonicalization, validation, local storage, import adapter, and test fixtures.
3. **Compiler:** bindings, graph analysis, capability calculation, immutable plans, and dry-run diagnostics.
4. **Sequential run engine:** execute a linear graph through fake drivers with journal recovery and deterministic artifact checks.
5. **Bounded graph execution:** parallel tasks, dependency blocking, retries, cancellation, and resource limits.
6. **Approvals and delegation:** exact-operation approvals, bounded child tasks, external-effect receipts, and recovery.
7. **Everyday Mode:** guided intake, generated proposal, plain-language authority review, and first-run experience.
8. **Builder Mode:** structured editor, graph view, validation, binding configuration, and versioning.
9. **Release hardening:** cross-platform packages, migration tests, documentation, accessibility, security review, and starter templates.

Each slice must be independently usable and verified before the next changes its surface.

## 16. Security invariants

- A portable file cannot carry credentials or enable sensitive automatic authority.
- A child task cannot gain more authority than its parent or assigned agent.
- A plan cannot change after its first task is dispatched.
- An approval applies only to the exact normalized operation shown to the user.
- A crash cannot convert an unanswered approval into permission.
- Recovery cannot silently repeat an external action with an unknown outcome.
- Artifact paths cannot escape the run workspace.
- Provider-specific events cannot be attributed to another driver instance or run.
- Renderer code cannot directly execute agent actions or access secrets.
- Tests and verification fixtures never target the user's live application data.

## 17. Open decisions deferred from implementation

The public project name and visual identity are intentionally separate from this architecture and can be chosen before the first packaged release. The internal module and document terminology remains stable regardless of branding.

The first release stores journals in NDJSON to align with upstream. A later storage change requires measured evidence that NDJSON recovery, query, or concurrency limits are materially blocking the product, plus an explicit migration design.

## 18. Research basis

This design was checked against the following upstream boundaries at the recorded baseline commit:

- `LICENSING.md`: Apache-2.0 core, separately licensed `enterprise/`, and trademark boundary.
- `CONTRIBUTING.md` and `AGENTS.md`: repository map, provider SPI, testing expectations, downstream release ownership, and isolated verification requirement.
- `server/contracts.ts` and `shared/runtime-events.ts`: provider adapter and canonical runtime event seams.
- `shared/package-format.ts` and `docs/team-sharing.md`: portable team-package fields, excluded sensitive state, validation limits, version handling, and import safety.
- `server/routes/README.md`: modular route convention and authenticated routing boundary.
- `docs/verification/README.md`: fixture-based control surface and evidence requirements.

The review confirmed that Blueprint compilation and run orchestration should be new layers consuming existing contracts. Provider drivers, permission brokering, chat, routines, package import/export, and native computer safety remain upstream-derived foundations.
