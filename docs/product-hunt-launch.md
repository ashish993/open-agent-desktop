# Product Hunt release gate

Open Agent Desktop is launch-ready only when every item below is evidenced on a
clean machine. Local package creation is not the same as public distribution.

## Required before scheduling

- Publish this repository under the canonical Open Agent Desktop GitHub
  organization and replace the inherited upstream `origin` remote.
- Publish a public product page with a direct download link and the current
  README installation path.
- Build macOS arm64/x64, Windows, and Ubuntu artifacts from a tagged commit.
- Sign and notarize macOS artifacts with a valid Developer ID certificate;
  sign Windows installers with the release certificate. Unsigned local
  artifacts are for testing only.
- Generate checksums and attach them to the release.
- Verify a clean-user install, first launch, update check, rollback path, and
  uninstall on each advertised platform.
- Configure the update feed only after the canonical repository and release
  destination are fixed. Keep the feed disabled for local builds.
- Run the documented bot/team/task smoke test with at least one real provider,
  and rerun the goal-mode regression test after every orchestration change.

## Product Hunt assets

- Product name: Open Agent Desktop
- Tagline: Local-first teams of AI agents that use the subscriptions and tools you already have
- Provide a square thumbnail, product screenshots, a short product video, a
  direct product URL, pricing status, maker profile, and first comment.
- Describe provider requirements honestly: users bring their own supported CLI
  login or local engine; integrations that are not configured must remain
  visibly unavailable.

## Rollback

1. Disable the update feed or remove the affected release artifact.
2. Keep the previous signed release available.
3. Reproduce using the tagged smoke-test data directory.
4. Publish a corrected patch release only after the clean-install and
   bot/team/task checks pass again.
