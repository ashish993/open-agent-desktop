# Developer guide: from download to first change

This guide assumes you are curious about the project but do not work on
JavaScript every day. You can follow it line by line; each step also explains
what it is doing.

## 1. Install the tools

You need:

- macOS, Windows, or Ubuntu 24.04
- Node.js 24 or newer
- `pnpm` (Corepack can install the matching package manager)
- Git
- One supported agent engine only if you want to run real AI turns

Check the tools in a terminal:

```sh
node --version
git --version
corepack --version
```

If Node is installed but `pnpm` is missing, run:

```sh
corepack enable
```

## 2. Download and install dependencies

```sh
git clone https://github.com/ashish993/open-agent-desktop.git
cd open-agent-desktop
pnpm install
```

`pnpm install` downloads the libraries used by the interface, local harness,
tests, and desktop shell. It does not sign in to an AI provider or upload your
files.

## 3. Start the workspace

Use two terminals from the project folder.

Terminal A:

```sh
pnpm dev:server
```

This starts the local harness at `http://127.0.0.1:8799`. It coordinates
providers and keeps the browser interface separate from engine-specific code.

Terminal B:

```sh
pnpm dev
```

This starts the browser workspace at `http://127.0.0.1:5199`. Keep both
terminals open while testing. Stop either process with `Ctrl+C`.

## 4. Understand the first screen

- **Bots** are specialists with a role and capabilities.
- **Teams** group bots for a shared outcome.
- **Tasks** are assignments with a visible lifecycle.
- **Approvals** pause sensitive actions until you decide.
- **History** keeps the activity and result together.

You can create fixture bots and teams without connecting a provider. To run a
real turn, install a provider CLI, sign in through that provider's own flow,
and choose it in the agent profile.

## 5. Make a small change

Start with a copy or branch:

```sh
git switch -c describe-your-change
```

Find the relevant area in the [project map](../README.md#project-map). Change
one thing, then run the narrowest useful test first:

```sh
pnpm exec vitest run src/lib/your-file.test.ts
```

If the change affects the full app, run the complete checks before opening a
pull request:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm check:branding
```

## 6. Common problems

### The browser says the server is unavailable

Check that Terminal A is still running and that port `8799` is listening. If
another process owns the port, stop it or choose a different local port using
the project configuration. Reload `http://127.0.0.1:5199/` after the harness is
ready.

### The page is blank after a CSS or UI change

Look at the terminal running Vite for a compile error. Fix the first error,
then reload. Browser console errors are useful evidence; do not ignore them.

### A provider is unavailable

The interface can run without a provider. Check the provider's own login,
binary path, and model availability first. Do not paste provider keys into an
issue or pull request.

### A package opens with a macOS warning

Local packages are for development. Public macOS distribution requires a
Developer ID signature and notarization; see [releasing.md](releasing.md).

## 7. Where to ask for help

When reporting a problem, include:

1. operating system and Node version;
2. the command that was running;
3. the first error message;
4. whether the issue reproduces with a fresh local data directory.

Never include API keys, access tokens, private transcripts, or personal files.
