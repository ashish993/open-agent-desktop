# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

- **Use GitHub's private vulnerability reporting**:
  <https://github.com/ashish993/open-agent-desktop/security/advisories/new>. The report stays visible
  only to you and the maintainers until a fix is published.

- If private reporting is unavailable, contact the maintainers through the repository owner profile:
  <https://github.com/ashish993>. Do not include vulnerability details in a public issue.

You'll get a response as soon as possible, normally within a few days.

## Scope notes for researchers

- The harness server binds **127.0.0.1 only**. Packaged builds allow anonymous loopback reads, but
  public mutations require either the desktop's private per-launch capability or a paired session;
  built-in agent integrations use narrower per-turn capabilities. Anything that makes it reachable
  from off-machine without a paired session, lets one bot reuse another turn's capability, or lets
  a local *unprivileged other user* drive it is a vulnerability. On a hosted or shared workspace
  (service loopback trust, see `docs/self-hosting.md`) a session-less loopback caller — which
  includes every bot's shell — may use only the routes in `SERVICE_ALLOW`
  (`server/request-auth.ts`); reaching an admin route or approving a card that way is a
  vulnerability. Known and documented, not yet closed: that caller keeps the Slack worker's
  guarded routes, so a bot's shell can post into an existing Full-access thread, or open one while
  shared Full access is on, and get Full-access work done without a card. A worker-only relay token
  is the planned fix.
- API keys live in `~/.open-agent-desktop/config.json` and are write-only through the API (`configured`
  booleans out, never values). Any path that echoes a stored secret back — API response, SSE event,
  log line, argv visible in `ps` — is a vulnerability.
- Agents run real CLIs (`claude`, `codex`) with the user's own privileges, and the permission broker
  is the consent layer for risky actions. Bypasses of the broker (approving without a user decision,
  spoofing the broker socket) are vulnerabilities unless that bot is explicitly set to **Full
  access**. Full access is a standing user decision to approve provider permission requests; it must
  never answer questions or silently broaden product-level confirmations such as credentials,
  routines, skills, or peer communication.
- Spawning must never route user-influenced strings through a shell. Report any `shell: true` /
  `cmd.exe` string-building you find.
