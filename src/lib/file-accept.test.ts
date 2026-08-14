import { describe, expect, it } from "vitest";
import { matchesFileAccept } from "./file-accept";

const AUDIO_ACCEPT =
  "audio/*,.mp3,.m4a,.aac,.wav,.wave,.ogg,.oga,.opus";

describe("matchesFileAccept", () => {
  it("allows an M4A file when a browser reports no MIME type", () => {
    expect(
      matchesFileAccept(
        { name: "reflection.m4a", type: "" },
        AUDIO_ACCEPT,
      ),
    ).toBe(true);
  });

  it("rejects a file outside the accepted audio extensions", () => {
    expect(
      matchesFileAccept(
        { name: "reflection.pdf", type: "application/pdf" },
        AUDIO_ACCEPT,
      ),
    ).toBe(false);
  });
});
