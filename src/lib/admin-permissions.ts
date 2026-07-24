import { normalizeAdminEmail } from "./admin-access";

export function getConfiguredSuperAdminEmail(): string | null {
  const email = process.env.ADMIN_EMAIL?.trim();
  return email ? normalizeAdminEmail(email) : null;
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  const superAdminEmail = getConfiguredSuperAdminEmail();
  return Boolean(
    superAdminEmail && email && normalizeAdminEmail(email) === superAdminEmail,
  );
}

/**
 * The list of email addresses permitted to self-register as an admin.
 *
 * Configured via ADMIN_ALLOWED_EMAILS (comma-separated). The super-admin
 * email (ADMIN_EMAIL) is always allowed even if omitted from the list.
 *
 * Any person whose email is on this list may register at /admin/register
 * using the shared 6-character access code and choose their own display name.
 */
export function getAllowedAdminEmails(): string[] {
  const raw = process.env.ADMIN_ALLOWED_EMAILS?.trim();
  const list = raw
    ? raw
        .split(",")
        .map((entry) => normalizeAdminEmail(entry))
        .filter(Boolean)
    : [];

  const superAdmin = getConfiguredSuperAdminEmail();
  if (superAdmin && !list.includes(superAdmin)) {
    list.push(superAdmin);
  }

  return list;
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  const normalized = email ? normalizeAdminEmail(email) : "";
  return Boolean(normalized && getAllowedAdminEmails().includes(normalized));
}
