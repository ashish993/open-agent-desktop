import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(import.meta.dirname, "..");

test("the downstream source and bundlers exclude the enterprise layer", () => {
  assert.equal(existsSync(join(root, "enterprise")), false);
  const bundler = readFileSync(join(root, "scripts/bundle-server.mjs"), "utf8");
  assert.match(bundler, /rmSync\(join\(root, "dist-server", "enterprise"\)/);
  assert.doesNotMatch(bundler, /entryPoints:\s*\[.*enterprise/s);
  assert.doesNotMatch(readFileSync(join(root, "scripts/build-npm-package.mjs"), "utf8"), /enterpriseBundle/);
});
