// Keeping a test's children honest about Open Agent Desktop configuration.
//
// A shell that already exports OMB_* or OPEN_AGENT_DESKTOP_* — an Open Agent Desktop-hosted
// terminal, or a server running in another window — leaks those values into
// every child a suite spawns and into modules that snapshot process.env at
// import time. The suite then asserts against a "configured" runtime the test
// itself never set up (#1676). Strip the ambient values here; each test sets
// exactly the keys it means to set, on top of a base that carries no
// Open Agent Desktop configuration at all.

const AMBIENT_PREFIXES = ["OMB_", "OPEN_AGENT_DESKTOP_"] as const;

/** True for keys owned by the Open Agent Desktop runtime (`OMB_*`, `OPEN_AGENT_DESKTOP_*`). */
export function isAmbientOmbKey(key: string): boolean {
  return AMBIENT_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** Copy `env` without any `OMB_*` / `OPEN_AGENT_DESKTOP_*` keys. */
export function stripOmbEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const clean: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (!isAmbientOmbKey(key)) clean[key] = value;
  }
  return clean;
}

/**
 * Environment for a child process spawned by a test: the current environment
 * with ambient Open Agent Desktop keys stripped, then `overrides` applied on top.
 *
 * The spread sits where `...process.env` used to, so a suite's own keys —
 * harness URL, tokens the stub validates, feature flags under test — are the
 * only Open Agent Desktop configuration the child ever sees.
 */
export function childEnv(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  return { ...stripOmbEnv(process.env), ...overrides };
}
