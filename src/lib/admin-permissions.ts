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
