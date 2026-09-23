ALTER TABLE "topics" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "words" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
CREATE TABLE "admin_operations" (
  "id" UUID NOT NULL, "actor_id" UUID NOT NULL, "action" TEXT NOT NULL,
  "request_id" UUID NOT NULL, "input_hash" TEXT NOT NULL, "result" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_operations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "admin_operations_actor_id_action_request_id_key" ON "admin_operations"("actor_id", "action", "request_id");
CREATE INDEX "admin_operations_created_at_idx" ON "admin_operations"("created_at");
CREATE TABLE "admin_audit_logs" (
  "id" UUID NOT NULL, "actor_id" UUID NOT NULL, "action" TEXT NOT NULL,
  "entity_id" UUID, "request_id" UUID NOT NULL, "before" JSONB, "after" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "admin_audit_logs_actor_id_created_at_idx" ON "admin_audit_logs"("actor_id", "created_at");
CREATE TABLE "admin_rate_limits" (
  "key" TEXT NOT NULL, "count" INTEGER NOT NULL, "reset_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "admin_rate_limits_pkey" PRIMARY KEY ("key")
);
