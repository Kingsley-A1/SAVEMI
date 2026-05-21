-- Add AuditLog table for admin action tracking (Phase 2: Security & Admin Operations)

CREATE TABLE "AuditLog" (
    "id"         STRING NOT NULL DEFAULT gen_random_id(),
    "adminId"    STRING NOT NULL,
    "adminEmail" STRING NOT NULL,
    "action"     STRING NOT NULL,
    "entityType" STRING NOT NULL,
    "entityId"   STRING,
    "detail"     STRING,
    "ip"         STRING,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Foreign key from AuditLog → AdminUser (cascade deletes)
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes for common query patterns
CREATE INDEX "AuditLog_adminId_createdAt_idx"  ON "AuditLog" ("adminId", "createdAt");
CREATE INDEX "AuditLog_entityType_createdAt_idx" ON "AuditLog" ("entityType", "createdAt");
CREATE INDEX "AuditLog_createdAt_idx"           ON "AuditLog" ("createdAt");
