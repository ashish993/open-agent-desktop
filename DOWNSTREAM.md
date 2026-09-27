# Project provenance

This project began from an Apache-licensed source snapshot. Baseline commit
`7850a1acef3b2bdd056be6946550498470cd9db0` is recorded for reproducibility; no external release,
update, or package feed is assumed by this repository.

`LICENSE`, `NOTICE`, and applicable third-party attributions are retained. The
project name, package identifiers, visual identity, documentation, and release
configuration are maintained independently.

Contributor bootstrap, verification gates, and the reviewed synchronization
procedure are documented in [`docs/fork-development.md`](docs/fork-development.md).

The runtime uses the `OPEN_AGENT_DESKTOP_*` and `OMB_*` environment variables
only where they are part of the documented local interface. New installs use
the `.open-agent-desktop` data directory.

Licensed-source test replacement: `server/hosted-access.test.ts` and
`server/hosted-models-api.test.ts` depended on the removed upstream hosted
workspace implementation. They are replaced by `server/oss-hosted-access.test.ts`,
which verifies the retained OSS hook fails closed when hosted configuration or
an obsolete key is present. Other stand-in-layer tests remain because they test
the Apache core hook contract without importing the removed source.
