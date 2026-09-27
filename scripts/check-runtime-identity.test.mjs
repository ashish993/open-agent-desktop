import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import YAML from "yaml";

const root = join(import.meta.dirname, "..");
const product = JSON.parse(readFileSync(join(root, "config/product.json"), "utf8"));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const builder = YAML.parse(readFileSync(join(root, "electron-builder.yml"), "utf8"));

function configDataDir(env = {}) {
  return execFileSync(process.execPath, [
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    'import { DATA_DIR } from "./server/config.ts"; process.stdout.write(DATA_DIR);',
  ], { cwd: root, env: { PATH: process.env.PATH, ...env }, encoding: "utf8" });
}

test("package and desktop metadata use the canonical downstream identity", () => {
  assert.equal(pkg.name, product.packageName);
  assert.equal(pkg.productName, product.name);
  assert.equal(pkg.author, undefined);
  assert.equal(pkg.homepage, undefined);
  assert.equal(pkg.repository, undefined);
  assert.equal(builder.appId, product.bundleId);
  assert.equal(builder.productName, product.name);
  assert.equal(builder.artifactName, `${product.artifactPrefix}-${"${version}"}-${"${arch}"}.${"${ext}"}`);
  assert.equal(builder.protocols[0].schemes[0], product.protocol);
  assert.equal(builder.protocols[0].name, `${product.name} package install`);
});

test("runtime defaults are isolated while OMB_DATA_DIR remains compatible", () => {
  const home = join(root, ".identity-test-home");
  assert.equal(configDataDir({ HOME: home }), join(home, product.dataDirectory));
  assert.equal(configDataDir({ HOME: home, OMB_DATA_DIR: "/tmp/omb-explicit-fixture" }), "/tmp/omb-explicit-fixture");

  const brand = readFileSync(join(root, "server/brand.ts"), "utf8");
  const html = readFileSync(join(root, "index.html"), "utf8");
  const electron = readFileSync(join(root, "electron/main.mjs"), "utf8");
  assert.match(brand, /DEFAULT_BRAND: Brand = \{ name: "Open Agent Desktop" \}/);
  assert.match(html, /<title>Open Agent Desktop<\/title>/);
  assert.match(electron, /setAsDefaultProtocolClient\("openagentdesktop"\)/);
  assert.match(electron, /\.open-agent-desktop/);
});
