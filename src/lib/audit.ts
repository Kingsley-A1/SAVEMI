/**
 * Audit logging helper.
 *
 * Writes a structured record to the AuditLog table after every admin write
 * operation (create / update / delete / publish / archive).
 *
 * All calls are fire-and-forget with silent catch — audit failures must never
 * block the primary operation.
 *
 * Usage:
 *   await audit({
 *     session,
 *     request,
 *     action:     "message.create",
 *     entityType: "Message",
 *     entityId:   message.id,
 *     detail:     { title: message.title, status: message.status },
 *   });
 */

import { prisma } from "./db";
import { getClientIp } from "./rate-limit";

export type AuditAction =
  | "message.create"
  | "message.update"
  | "message.delete"
  | "book.create"
  | "book.update"
  | "book.delete"
  | "quote.create"
  | "quote.update"
  | "quote.delete"
  | "admin.register";

export type AuditEntityType = "Message" | "Book" | "Quote" | "AdminUser";

export interface AuditParams {
  /** The NextAuth session object from `await auth()`. */
  session: { user?: { id?: string | null; email?: string | null } } | null;
  /** The incoming Request — used to extract the client IP. */
  request: Request;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  /** Arbitrary key/value context. Will be JSON-stringified. */
  detail?: Record<string, unknown>;
}

/**
 * Write an audit event. Silently ignores errors so auditing never blocks
 * the primary admin operation.
 */
export async function audit(params: AuditParams): Promise<void> {
  const { session, request, action, entityType, entityId, detail } = params;

  const adminId = session?.user?.id;
  const adminEmail = session?.user?.email;

  // Only log if we have a valid admin identity.
  if (!adminId || !adminEmail) return;

  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        adminEmail,
        action,
        entityType,
        entityId: entityId ?? null,
        detail: detail ? JSON.stringify(detail) : null,
        ip: getClientIp(request),
      },
    });
  } catch {
    // Intentionally swallowed — audit failures are non-fatal.
  }
}
