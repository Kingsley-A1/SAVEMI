-- P0-4: Reconcile durationSeconds type drift.
-- The initial migration (20260409170000_phase2_init) created this column as INTEGER,
-- but the Prisma schema defines it as BigInt. This migration aligns the database
-- with the schema so Prisma's BigInt serialization works correctly.
--
-- CockroachDB supports ALTER COLUMN ... SET DATA TYPE with an implicit cast
-- from INTEGER to INT8 (BigInt). No data is lost in this conversion.

ALTER TABLE "Message" ALTER COLUMN "durationSeconds" SET DATA TYPE INT8;
