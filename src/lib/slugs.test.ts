import { describe, expect, it } from "vitest";
import { slugBelongsToRecord, slugifyTitle } from "./slugs";

describe("slugifyTitle", () => {
  it("creates a lowercase URL-safe slug from a title", () => {
    expect(slugifyTitle("Remember the Sabbath Day!")).toBe(
      "remember-the-sabbath-day",
    );
  });

  it("collapses whitespace and repeated separators", () => {
    expect(slugifyTitle("  Rest,  Reflect  -- Recover  ")).toBe(
      "rest-reflect-recover",
    );
  });

  it("falls back when the title has no slug-safe characters", () => {
    expect(slugifyTitle("!!!")).toBe("untitled");
  });
});

describe("slugBelongsToRecord", () => {
  it("allows an existing slug when it belongs to the record being updated", () => {
    expect(slugBelongsToRecord({ id: "admin-1" }, "admin-1")).toBe(true);
  });

  it("rejects an existing slug when it belongs to another record", () => {
    expect(slugBelongsToRecord({ id: "admin-2" }, "admin-1")).toBe(false);
  });
});
