import { prisma, isDatabaseConfigured } from "./db";

export interface ContactSubmissionInput {
  name: string;
  email: string;
  message: string;
  website?: string;
}

export interface ValidatedContactSubmission {
  name: string;
  email: string;
  message: string;
}

function normalizeSingleLine(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeParagraphs(value: string): string {
  return value.trim().replace(/\r\n/g, "\n");
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateContactSubmission(
  payload: unknown,
):
  | { success: true; data: ValidatedContactSubmission }
  | { success: false; error: string } {
  if (!payload || typeof payload !== "object") {
    return { success: false, error: "Submission payload must be an object." };
  }

  const candidate = payload as Partial<ContactSubmissionInput>;
  const website = candidate.website?.trim();

  if (website) {
    return { success: false, error: "Spam submission rejected." };
  }

  const name = normalizeSingleLine(candidate.name ?? "");
  const email = normalizeSingleLine(candidate.email ?? "").toLowerCase();
  const message = normalizeParagraphs(candidate.message ?? "");

  if (name.length < 2 || name.length > 80) {
    return {
      success: false,
      error: "Name must be between 2 and 80 characters.",
    };
  }

  if (!isValidEmail(email)) {
    return { success: false, error: "A valid email address is required." };
  }

  if (message.length < 10 || message.length > 2000) {
    return {
      success: false,
      error: "Message must be between 10 and 2000 characters.",
    };
  }

  return {
    success: true,
    data: {
      name,
      email,
      message,
    },
  };
}

export async function createContactSubmission(
  input: ValidatedContactSubmission,
) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured.");
  }

  return prisma.contactSubmission.create({
    data: input,
  });
}
