/**
 * Resolve the public base URL of the site for building absolute links
 * (email verification, CTAs, etc.).
 *
 * Order of precedence:
 *   1. NEXT_PUBLIC_SITE_URL (explicit canonical URL)
 *   2. NEXTAUTH_URL
 *   3. The incoming request's origin
 *   4. http://localhost:3000
 */
export function getSiteUrl(request?: Request): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXTAUTH_URL?.trim();

  if (configured && /^https?:\/\//.test(configured)) {
    return configured.replace(/\/+$/, "");
  }

  if (request) {
    try {
      const url = new URL(request.url);
      return `${url.protocol}//${url.host}`;
    } catch {
      /* fall through */
    }
  }

  return "http://localhost:3000";
}
