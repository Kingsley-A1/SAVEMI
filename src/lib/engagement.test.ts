import { describe, expect, it } from "vitest";
import {
  contentFromPath,
  deviceFromUserAgent,
  isBotUserAgent,
  parseContentKind,
  parseLikeKind,
} from "./engagement";

describe("contentFromPath", () => {
  it("maps detail pages to their content", () => {
    expect(contentFromPath("/messages/the-rest")).toEqual({ kind: "MESSAGE", idOrSlug: "the-rest" });
    expect(contentFromPath("/resources/sabbath-rest/")).toEqual({ kind: "RESOURCE", idOrSlug: "sabbath-rest" });
    expect(contentFromPath("/quotes/be-still")).toEqual({ kind: "QUOTE", idOrSlug: "be-still" });
  });

  it("ignores listing and other pages", () => {
    for (const path of ["/", "/videos", "/resources", "/messages/a/b", "/team"]) {
      expect(contentFromPath(path)).toBeNull();
    }
  });
});

describe("device and bot detection", () => {
  it("classifies common devices", () => {
    expect(deviceFromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148")).toBe("mobile");
    expect(deviceFromUserAgent("Mozilla/5.0 (Linux; Android 14; SM-S911B) Mobile Safari")).toBe("mobile");
    expect(deviceFromUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0)")).toBe("tablet");
    expect(deviceFromUserAgent("Mozilla/5.0 (Linux; Android 13; SM-X200) Safari")).toBe("tablet");
    expect(deviceFromUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130")).toBe("desktop");
  });

  it("drops crawlers and link previews", () => {
    expect(isBotUserAgent("Googlebot/2.1")).toBe(true);
    expect(isBotUserAgent("WhatsApp/2.23")).toBe(true);
    expect(isBotUserAgent("facebookexternalhit/1.1")).toBe(true);
    expect(isBotUserAgent("")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (iPhone) Mobile")).toBe(false);
  });
});

describe("target kinds", () => {
  it("only accepts real kinds", () => {
    expect(parseContentKind("MESSAGE")).toBe("MESSAGE");
    expect(parseContentKind("COMMENT")).toBeNull();
    expect(parseLikeKind("COMMENT")).toBe("COMMENT");
    expect(parseLikeKind("USER")).toBeNull();
  });
});
