import { describe, expect, it } from "vitest";
import { decideCommentStatus, normalizeCommentBody, COMMENT_MAX_LENGTH } from "./comment-rules";

describe("decideCommentStatus", () => {
  it("publishes a trusted member's plain comment at once", () => {
    expect(decideCommentStatus({ body: "Amen, thank you.", hasApprovedBefore: true }))
      .toEqual({ status: "VISIBLE", reason: null });
  });

  it("holds a first comment", () => {
    expect(decideCommentStatus({ body: "Blessed.", hasApprovedBefore: false }).reason)
      .toBe("first comment");
  });

  it("holds links, even from trusted members", () => {
    for (const body of ["see https://x.io", "visit www.spam.biz", "go to cheap-deals.com now"]) {
      expect(decideCommentStatus({ body, hasApprovedBefore: true }))
        .toEqual({ status: "HELD", reason: "link" });
    }
  });

  it("does not mistake scripture references for links", () => {
    expect(decideCommentStatus({ body: "Psalm 23.1 and Isa. 40.31", hasApprovedBefore: true }).status)
      .toBe("VISIBLE");
  });
});

describe("normalizeCommentBody", () => {
  it("trims, collapses blank runs and caps length", () => {
    expect(normalizeCommentBody("  a\r\n\r\n\r\n\r\nb  ")).toBe("a\n\nb");
    expect(normalizeCommentBody("x".repeat(5000))).toHaveLength(COMMENT_MAX_LENGTH);
    expect(normalizeCommentBody(42)).toBe("");
  });
});
