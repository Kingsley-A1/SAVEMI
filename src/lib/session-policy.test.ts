import { describe, expect, it } from "vitest";
import { ADMIN_SESSION_SECONDS, applyIdlePolicy, MEMBER_SESSION_SECONDS, type SessionToken } from "./session-policy";

const NOW = 1_800_000_000;

describe("applyIdlePolicy", () => {
  it("keeps an active admin signed in and renews the window", () => {
    const token = applyIdlePolicy({ role: "admin" as const, lastSeen: NOW - 3600 }, NOW);
    expect(token?.lastSeen).toBe(NOW);
  });

  it("signs an admin out after 8 idle hours", () => {
    expect(applyIdlePolicy({ role: "admin" as const, lastSeen: NOW - ADMIN_SESSION_SECONDS - 1 }, NOW)).toBeNull();
  });

  it("lets a member stay idle far longer than 8 hours", () => {
    const token = applyIdlePolicy({ role: "user" as const, lastSeen: NOW - 20 * 86_400 }, NOW);
    expect(token?.lastSeen).toBe(NOW);
    expect(MEMBER_SESSION_SECONDS).toBe(30 * 86_400);
  });

  it("starts the clock for tokens issued before this policy", () => {
    expect(applyIdlePolicy<SessionToken>({ role: "admin" }, NOW)?.lastSeen).toBe(NOW);
  });
});
