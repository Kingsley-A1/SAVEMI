import bcrypt from "bcryptjs";

export const ADMIN_ACCESS_CODE_LENGTH = 6;

function readConfiguredCode(): string {
  return (
    process.env.ADMIN_ACCESS_CODE?.trim() ??
    process.env.ADMIN_PASSWORD?.trim() ??
    ""
  );
}

export function getConfiguredAdminAccessCode(): string | null {
  const code = readConfiguredCode();

  if (code.length !== ADMIN_ACCESS_CODE_LENGTH) {
    return null;
  }

  return code;
}

export function getAdminAccessCodeConfigError(): string {
  const code = readConfiguredCode();

  if (!code) {
    return `Set ADMIN_ACCESS_CODE or ADMIN_PASSWORD to a ${ADMIN_ACCESS_CODE_LENGTH}-character value.`;
  }

  return `The shared admin password must be exactly ${ADMIN_ACCESS_CODE_LENGTH} characters long.`;
}

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidAdminAccessCode(input: string): boolean {
  const code = getConfiguredAdminAccessCode();
  return Boolean(code && input === code);
}

export async function hashAdminAccessCode(): Promise<string> {
  const code = getConfiguredAdminAccessCode();

  if (!code) {
    throw new Error(getAdminAccessCodeConfigError());
  }

  return bcrypt.hash(code, 12);
}

export function formatAdminNameFromEmail(email: string): string {
  const localPart = normalizeAdminEmail(email).split("@")[0]?.trim();

  if (!localPart) {
    return "SAVEMI Admin";
  }

  const words = localPart
    .replace(/[._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

  return words.length > 0 ? words.join(" ") : "SAVEMI Admin";
}