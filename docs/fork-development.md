# Fork development

Open Agent Desktop is an independent Apache-2.0 project created from the recorded
baseline `7850a1acef3b2bdd056be6946550498470cd9db0`. See
[`DOWNSTREAM.md`](../DOWNSTREAM.md) for the provenance and licence boundary.

## Prerequisites and bootstrap

Use Node.js 24 or later and pnpm 10.33.0. From a fresh clone:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev:server
pnpm dev
```

Run `pnpm dev:desktop` in another terminal when testing the native shell. New
installs use `~/.open-agent-desktop`; verification commands below instead own
temporary homes and never inspect a running app or discover its port.

## Foundation verification

```sh
pnpm check:downstream
node --test scripts/check-runtime-identity.test.mjs scripts/verify-downstream-foundation.test.mjs
node scripts/verify-downstream-foundation.mjs
pnpm lint
pnpm typecheck
pnpm i18n:check
pnpm check:electron
pnpm test
pnpm build
pnpm build:server
pnpm test:packaged-server
```

The isolated verifier launches only the repository fake engine, generated
loopback ports, a temporary home/data directory, and one exact child process.
Its output proves that local fixture only; it is not deployment, signing,
publishing, installer, or real-provider evidence.

## Source synchronization

The canonical public repository and any synchronization remote will be
configured by maintainers before the first public release. Until then, keep the
baseline hash and review every imported change for licence terms, product
identity, data-directory defaults, workflows, package publishing, update feeds,
signing, and release destinations.

## Distribution boundary

The upstream `enterprise/` tree and its artifacts are excluded. Apache licence,
NOTICE, third-party attribution, and exact provenance are retained.
Release publishing is intentionally absent from this foundation: local builds use
`--publish never`, and adding any destination requires a separate reviewed
change owned by this downstream project.
