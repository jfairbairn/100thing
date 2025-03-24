ALTER TABLE "action" DROP CONSTRAINT "action_project_id_project_id_fk";
ALTER TABLE "action" DROP COLUMN "project_id";
DROP TABLE "project"; 