# SAVEMI Brand and Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved SAVEMI palette and Manrope typography while making common audio files upload and play through a simple responsive card.

**Architecture:** Semantic design values stay in `globals.css` and are consumed by existing classes, avoiding a repository-wide token rename. Upload validation is the single source of truth for the canonical storage MIME type; the direct uploader consumes that returned type, while multipart continues to set type only when its upload is created. `MediaPlayer` retains native `<audio>` controls and adds semantic wrapper markup styled by the global audio-player classes.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Vitest, AWS S3-compatible Cloudflare R2 uploads, `next/font/google`.

## Global Constraints

- Use Manrope, loaded through `next/font/google` with Latin subset, `display: "swap"`, and a CSS variable.
- Preserve the existing semantic token names and map the board palette to `#00291B`, `#F0E7C2`, white, and black.
- Preserve native audio controls and do not add a playback dependency.
- Audio must accept MP3, M4A, AAC, WAV, OGG, and Opus only when server validation can assign a known canonical MIME type.
- Run targeted tests before and after each behavioural change, then run full tests, `npm run lint:strict`, and `npm run build` before pushing.

---

### Task 1: Canonicalise common audio upload types

**Files:**
- Modify: `src/lib/media.ts`
- Modify: `src/lib/media.test.ts`
- Modify: `src/lib/admin-upload-client.ts`
- Modify: `src/lib/admin-upload-client.test.ts`

**Interfaces:**
- Consumes: `validateUploadRequest(payload)` with `{ fileName, contentType, contentLength }`.
- Produces: a successful validation result whose `data.contentType` is the canonical MIME type signed by the upload route.

- [ ] **Step 1: Write failing validation tests**

```ts
expect(validateUploadRequest({ fileName: "vespers.m4a", contentType: "audio/x-m4a" }))
  .toMatchObject({ success: true, data: { mediaKind: "audio", contentType: "audio/mp4" } });
expect(validateUploadRequest({ fileName: "vespers.ogg", contentType: "" }))
  .toMatchObject({ success: true, data: { mediaKind: "audio", contentType: "audio/ogg" } });
```

- [ ] **Step 2: Verify the validation tests fail**

Run: `npx vitest run src/lib/media.test.ts --maxWorkers=1`

Expected: failure because `audio/x-m4a` and blank `ogg` are not currently normalised.

- [ ] **Step 3: Write a failing direct-upload contract test**

```ts
await uploadAdminFile({ file: fakeFile(4 * MB, "audio/mp3"), fileName: "vespers.mp3" }, put);
expect(put).toHaveBeenCalledWith(expect.objectContaining({ contentType: "audio/mpeg" }));
```

- [ ] **Step 4: Verify the direct-upload contract test fails**

Run: `npx vitest run src/lib/admin-upload-client.test.ts --maxWorkers=1`

Expected: failure because the uploader currently sends raw `audio/mp3` rather than the signer's canonical `audio/mpeg`.

- [ ] **Step 5: Implement normalisation at the validation boundary**

```ts
const canonicalType = knownTypeFromBrowser || contentTypeForFileName(fileName);
const rule = canonicalType ? findRule(canonicalType) : undefined;
return { success: true, data: { fileName: sanitizeFileName(fileName), contentType: canonicalType, contentLength, mediaKind: rule.kind } };
```

Include audio aliases and extension mappings for the approved formats, then use `payload.data.contentType` as the direct PUT header.

- [ ] **Step 6: Verify targeted upload tests pass**

Run: `npx vitest run src/lib/media.test.ts src/lib/admin-upload-client.test.ts --maxWorkers=1`

Expected: all targeted tests pass.

### Task 2: Make the admin picker match the validated audio contract

**Files:**
- Modify: `src/app/admin/(protected)/messages/new/page.tsx`
- Modify: `src/app/admin/(protected)/messages/[id]/edit/EditMessageForm.tsx`
- Modify: `src/components/AdminUploadField.tsx`
- Create: `src/lib/file-accept.ts`
- Create: `src/lib/file-accept.test.ts`

**Interfaces:**
- Consumes: the audio extension list from the message forms and the existing `AdminUploadField` accept parser.
- Produces: a picker that admits accepted audio file extensions even if a browser supplies an empty or generic MIME type.

- [ ] **Step 1: Write a failing chooser test**

```ts
expect(matchesFileAccept({ name: "vespers.m4a", type: "" }, "audio/*,.mp3,.m4a,.aac,.wav,.wave,.ogg,.oga,.opus")).toBe(true);
```

- [ ] **Step 2: Verify the chooser test fails**

Run: `npx vitest run src/lib/file-accept.test.ts --maxWorkers=1`

Expected: failure because no pure accept matcher currently exists.

- [ ] **Step 3: Define the accepted audio chooser string in both message forms**

```ts
const AUDIO_ACCEPT = "audio/*,.mp3,.m4a,.aac,.wav,.wave,.ogg,.oga,.opus";
```

- [ ] **Step 4: Implement and use the pure accept matcher**

```ts
export function matchesFileAccept(file: { name: string; type: string }, accept: string): boolean {
  return accept.split(",").map((value) => value.trim()).some((rule) =>
    rule.endsWith("/*") ? file.type.startsWith(rule.slice(0, -1)) : rule.startsWith(".") ? file.name.toLowerCase().endsWith(rule.toLowerCase()) : file.type === rule,
  );
}
```

`AdminUploadField` imports this function instead of owning the validation
logic.

- [ ] **Step 5: Pass it to both primary Audio media fields and optional video audio-download fields**

```tsx
<AdminUploadField label="Audio media" mediaKind="audio" accept={AUDIO_ACCEPT} />
```

- [ ] **Step 6: Adjust picker helper copy for combined MIME and extension rules**

```ts
if (accept.includes("audio/*")) return "Audio files (MP3, M4A, AAC, WAV, OGG, or Opus)";
```

- [ ] **Step 7: Verify the relevant typecheck and tests remain green**

Run: `npx vitest run src/lib/file-accept.test.ts src/lib/media.test.ts src/lib/admin-upload-client.test.ts --maxWorkers=1`

Expected: all targeted tests pass.

### Task 3: Apply the shared brand system and simple audio player surface

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/styles/globals.css`
- Modify: `src/components/MediaPlayer.tsx`

**Interfaces:**
- Consumes: Manrope's `variable` class and existing `coverImageUrl`, `title`, and `src` player props.
- Produces: `--font-manrope` on the document body and an `audio-player` element with native accessible audio playback.

- [ ] **Step 1: Register Manrope at the document boundary**

```ts
const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-manrope" });
<body className={`${manrope.variable} min-h-screen antialiased`}>
```

- [ ] **Step 2: Map existing root tokens to the supplied palette**

```css
:root {
  --brand-primary: #00291b;
  --brand-primary-deep: #00291b;
  --brand-accent: #f0e7c2;
  --brand-surface: #ffffff;
  --brand-text: #00291b;
}
```

- [ ] **Step 3: Add responsive native-control audio-player classes**

```tsx
<section className="audio-player" aria-label={`Audio player for ${title}`}>
  <div className="audio-player__art">{coverImageUrl ? <Image src={coverImageUrl} alt="" fill sizes="(max-width: 639px) 100vw, 180px" className="object-cover" /> : <div className="audio-player__fallback" aria-hidden="true" />}</div>
  <div className="audio-player__content"><p className="audio-player__eyebrow">Audio message</p><h2 className="audio-player__title">{title}</h2><audio controls preload="metadata" src={src} aria-label={title} /></div>
</section>
```

The CSS stacks the artwork above content below the small breakpoint, uses the deep-green surface with cream hierarchy, respects the browser's native keyboard controls, and switches to a light static card under `prefers-reduced-motion` without adding animation.

- [ ] **Step 4: Verify lint and a production build**

Run: `npm run lint:strict; npm run build`

Expected: both commands exit with status 0.

### Task 4: Review and push the isolated work slice

**Files:**
- Review: all files modified by Tasks 1–3 and `Corrections-V1/official-design-tokens.webp`

- [ ] **Step 1: Run the complete suite**

Run: `npm test`

Expected: zero failed tests.

- [ ] **Step 2: Inspect the staged diff and whitespace**

Run: `git diff --check; git diff --cached --stat; git status --short --branch`

Expected: no whitespace errors, only the approved brand/audio files, documentation, and supplied design-token asset.

- [ ] **Step 3: Commit and push**

```bash
git add src/app/layout.tsx src/styles/globals.css src/lib/media.ts src/lib/media.test.ts src/lib/admin-upload-client.ts src/lib/admin-upload-client.test.ts src/components/AdminUploadField.tsx src/components/MediaPlayer.tsx "src/app/admin/(protected)/messages/new/page.tsx" "src/app/admin/(protected)/messages/[id]/edit/EditMessageForm.tsx" Corrections-V1/official-design-tokens.webp docs/superpowers
git commit -m "fix(audio): support common formats and apply SAVEMI design tokens"
git push origin main
```
