# SAVEMI Brand and Audio Design

## Goal

Apply the approved SAVEMI design board across the shared interface and make
audio message publishing dependable and uncomplicated.

## Approved visual system

- Keep the existing semantic token names. Define their core values in
  `src/styles/globals.css` from the supplied board: deep green `#00291B`,
  cream `#F0E7C2`, white, and black.
- Use Manrope for the application interface. It is an OFL-licensed variable
  sans and is loaded by `next/font/google`, which self-hosts the selected
  subset in the Next.js build. It replaces the unavailable commercial
  Vástago Grotesk without impersonating it.
- Retain separate attention and success tokens because colours used to convey
  a real error or success must remain distinguishable from the brand palette.

## Audio experience

The existing browser audio control remains the playback mechanism. The player
becomes one responsive, deep-green listening card: artwork or a quiet branded
fallback at the leading edge, title and `Audio message` label, then the native
control. There is no waveform, simulated progress, autoplay, or custom media
state to desynchronise from the browser.

The admin upload picker accepts common browser representations and explicit
file extensions for MP3, M4A, AAC, WAV, OGG, and Opus. Server validation
canonicalises aliases and generic/blank browser MIME reports using the file
extension. The signer returns that canonical type, and a small direct upload
sends that same type to storage; this keeps the presigned signature and stored
metadata aligned for playback.

## Quality constraints

- Preserve the current message data model, direct R2 upload flow, multipart
  path, and native accessible controls.
- Test the input variants before changing validation or the client upload
  contract.
- Keep the change to global semantic tokens plus audio-specific markup and
  styling; do not rename tokens throughout the application.
- Verify with targeted Vitest tests, the complete test suite, strict lint, a
  production build, and a final diff review before pushing to `main`.
