import { describe, it, expect } from "vitest";
import { validateContactSubmission } from "./contact";

// ---------------------------------------------------------------------------
// P0-3 tests: contact form validation
// ---------------------------------------------------------------------------

describe("validateContactSubmission", () => {
  const valid = {
    name: "Kingsley",
    email: "kingsley@savemi.org",
    message: "This is a valid ministry inquiry message.",
  };

  it("accepts a valid submission", () => {
    expect(validateContactSubmission(valid).success).toBe(true);
  });

  it("rejects spam honeypot field filled", () => {
    const result = validateContactSubmission({ ...valid, website: "http://spam.com" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/spam/i);
  });

  it("rejects null payload", () => {
    expect(validateContactSubmission(null).success).toBe(false);
  });

  it("rejects name that is too short", () => {
    const result = validateContactSubmission({ ...valid, name: "A" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/name/i);
  });

  it("rejects name that is too long (> 80 chars)", () => {
    const result = validateContactSubmission({ ...valid, name: "A".repeat(81) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = validateContactSubmission({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/email/i);
  });

  it("rejects message that is too short (< 10 chars)", () => {
    const result = validateContactSubmission({ ...valid, message: "Hi" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/message/i);
  });

  it("rejects message that is too long (> 2000 chars)", () => {
    const result = validateContactSubmission({ ...valid, message: "A".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("normalizes whitespace in name", () => {
    const result = validateContactSubmission({ ...valid, name: "  King  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("King");
  });

  it("normalizes email to lowercase", () => {
    const result = validateContactSubmission({ ...valid, email: "King@SAVEMI.ORG" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("king@savemi.org");
  });
});
