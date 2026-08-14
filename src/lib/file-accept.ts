interface AcceptedFile {
  name: string;
  type: string;
}

/**
 * Check a browser File against an input's accept rules.
 *
 * Browsers sometimes provide an empty or generic MIME type for audio files,
 * so explicit extension rules remain valid alongside an `audio/*` rule.
 */
export function matchesFileAccept(file: AcceptedFile, accept: string): boolean {
  const fileName = file.name.toLowerCase();
  const contentType = file.type.toLowerCase();

  return accept
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.endsWith("/*")) {
        return contentType.startsWith(rule.slice(0, -1));
      }

      if (rule.startsWith(".")) {
        return fileName.endsWith(rule);
      }

      return contentType === rule;
    });
}
