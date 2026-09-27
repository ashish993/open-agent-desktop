import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import {
  createWorkspaceAccess,
  hostedWorkspaceConfigured,
  loadEnterpriseLayer,
  sharedWorkspaceFullAccessConfigured,
  workspaceMembership,
} from "./enterprise.ts";
import { SessionRegistry } from "./sessions.ts";

describe("OSS hosted-access boundary", () => {
  const hosted = {
    OMB_ADMIN_URL: "https://admin.example.test",
    OMB_ADMIN_WORKSPACE: "acme",
    OMB_ADMIN_MEMBERSHIP: "portal",
    OMB_PUBLIC_URL: "https://acme.example.test",
  };

  it("recognizes hosted configuration but exposes no bridge without a shipped layer", async () => {
    await loadEnterpriseLayer({ dir: join(tmpdir(), "open-agent-desktop-no-enterprise-layer"), licenseKey: undefined });
    const sessions = new SessionRegistry({ file: join(tmpdir(), `oad-oss-sessions-${process.pid}.json`) });
    expect(hostedWorkspaceConfigured(hosted)).toBe(true);
    expect(createWorkspaceAccess({ sessions, cookieName: "session", closeSessionStreams() {}, env: hosted })).toBeNull();
  });

  it("fails closed when an obsolete enterprise key is configured", async () => {
    const status = await loadEnterpriseLayer({
      dir: join(tmpdir(), "open-agent-desktop-no-enterprise-layer"),
      licenseKey: "obsolete-fixture-key",
    });
    expect(status).toMatchObject({ edition: "oss", features: [] });
    expect(status.notice).toContain("no enterprise layer exists");
  });

  it("never grants portal Full access without the removed implementation", () => {
    expect(workspaceMembership(hosted)).toEqual({
      authority: "portal",
      pairingCodes: false,
      peopleUrl: "https://admin.example.test/people?workspace=acme",
    });
    expect(sharedWorkspaceFullAccessConfigured({ ...hosted, OMB_SHARED_WORKSPACE_FULL_ACCESS: "1" })).toBe(true);
    expect(createWorkspaceAccess({
      sessions: new SessionRegistry({ file: join(tmpdir(), `oad-oss-full-${process.pid}.json`) }),
      cookieName: "session",
      closeSessionStreams() {},
      env: { ...hosted, OMB_SHARED_WORKSPACE_FULL_ACCESS: "1" },
    })).toBeNull();
  });
});
