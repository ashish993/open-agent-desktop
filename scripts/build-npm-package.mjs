// Assemble the `openagentdesktop` npm package: the self-contained server bundle,
// the built UI, the bundled skills and the CLI, with a package.json of its
// own. `npx openagentdesktop serve` then needs Node 24+ and nothing else.
//
//   pnpm build:server && pnpm exec vite build && node scripts/build-npm-package.mjs
//   cd release/npm && npm pack        # or npm publish --access public
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "release", "npm");
const app = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

for (const required of ["dist-server/index.js", "dist-server/openagentdesktop.js", "dist/index.html"]) {
  if (!existsSync(join(root, required))) {
    console.error(`missing ${required}: run \`pnpm build:server && pnpm exec vite build\` first`);
    process.exit(1);
  }
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, "dist-server"), join(out, "dist-server"), { recursive: true });
cpSync(join(root, "dist"), join(out, "dist"), { recursive: true });
if (existsSync(join(root, "skills"))) cpSync(join(root, "skills"), join(out, "skills"), { recursive: true });
cpSync(join(root, "LICENSE"), join(out, "LICENSE"));

// The bin lives next to the bundle so serverEntry() finds index.js by path.
writeFileSync(join(out, "cli.js"), `#!/usr/bin/env node\nimport "./dist-server/openagentdesktop.js";\n`);

writeFileSync(
  join(out, "package.json"),
  JSON.stringify(
    {
      name: "openagentdesktop",
      version: app.version,
      description: "Run the Open Agent Desktop server anywhere and pair your devices to it",
      license: "Apache-2.0",
      type: "module",
      bin: { openagentdesktop: "cli.js" },
      files: ["cli.js", "dist-server", "dist", "skills", "LICENSE", "README.md"],
      engines: { node: ">=24" },
      repository: { type: "git", url: "https://github.com/your-org/open-agent-desktop.git" },
      homepage: "https://github.com/your-org/open-agent-desktop#readme",
      keywords: ["openagentdesktop", "agents", "self-hosted", "server"],
    },
    null,
    2,
  ) + "\n",
);

writeFileSync(
  join(out, "README.md"),
  `# openagentdesktop

Your own team of AI bots, with guided terminal setup. Requires Node 24+.

\`\`\`sh
npm install -g openagentdesktop
openagentdesktop
\`\`\`

Or run \`npx openagentdesktop\` without a global install. Use the same command next
time; \`openagentdesktop start\` is an alias for the bare command.

First launch: use arrow keys and Enter (numbered choices in plain terminals) to choose
ChatGPT/Codex, Claude Code, or an API service; sign in or paste a hidden API
key; choose a model and save. Setup asks before installing a missing Codex
or Claude CLI. The saved model applies only to new bots; existing bots and
conversations keep their settings.

One optional step connects your phone, defaulting to Skip for now. Choose
an explicitly approved managed public HTTPS endpoint protected by pairing,
existing Tailscale, or an HTTPS reverse proxy you already configured.
Managed access uses a separate Open Agent Desktop account and asks permission for
the public endpoint and possible connector download. The pairing page and
basic server identity are public; chat and settings require pairing.
Tailscale must already be installed and signed in on both devices.

After the HTTPS connection is checked, scan the QR with your phone. When
you pair an Android phone the QR is an app link, so scan it inside the
Open Agent Desktop app; the web address is printed beside it if you would rather
use a browser. On iPhone or iPad, scan with Camera for Safari, or use the
app's own scanner. Choose Connect on the phone; scanning alone is not a
completed pairing. Codes
are private, single-use, and expire after five minutes. Guided phone
access permits chat and approvals, not settings or pairing administration.
Localhost and a bare LAN address cannot connect your phone to this server.

Later launches reuse your saved choices and open Open Agent Desktop on this computer.
Keep the terminal open: this is a foreground server, not a background
service. Ctrl-C stops the server without deleting saved work. Automatic
browser opening uses only the local address; it is skipped for SSH and
headless sessions, and can be disabled with \`--no-open\`.

\`\`\`sh
openagentdesktop setup          # reconfigure AI and optional phone access; not a reset
openagentdesktop --no-open      # do not open a browser
openagentdesktop --local        # ignore saved remote access for this launch
openagentdesktop --no-pair      # suppress phone prompts and invitations
openagentdesktop pair           # another phone while the HTTPS server is running
openagentdesktop sessions       # list devices; sessions revoke ID signs one out
openagentdesktop serve          # no onboarding prompts; explicit remote flags for services
\`\`\`

Stop an existing server before reconfiguring or changing access mode.
\`--local\` preserves your saved choice for next time. \`--no-pair\` does not
turn off saved remote access; use \`--local\` for that on a new launch.
With a custom \`--data-dir\` or \`--port\`, keep using those options when
starting and pairing.

API services include OpenAI, OpenRouter, Groq, Requesty, and compatible
endpoints.
API connections currently support chat only. Setup asks before a short,
potentially billable API test; native setup confirms sign-in, with model
access checked when you send a message. API billing is separate from
ChatGPT/Claude subscriptions. New API keys in config.json and managed
account credentials in tunnel-account.json are plaintext, not encrypted,
with owner-only permissions (0600 on Unix). Keep these files private.

Ctrl-C before saving AI setup leaves its pending OMB changes unapplied.
During the later phone step, it keeps the AI setup already saved and exits
without starting a server. Completed installs and sign-ins remain; run
\`openagentdesktop setup\` to continue without deleting your data.

For a service, use \`serve --tunnel\` after \`login\` for managed HTTPS,
\`serve --tailscale\` for your tailnet, or your own reverse proxy. The
\`login\` command signs in to an Open Agent Desktop account, not an AI provider;
it does not start the tunnel itself.

[Setup guide](https://github.com/your-org/open-agent-desktop/blob/main/docs/cli-onboarding.md)
· [Hosting guide](https://github.com/your-org/open-agent-desktop/blob/main/docs/self-hosting.md)
`,
);
console.log(`npm package assembled at ${out} (openagentdesktop@${app.version})`);
