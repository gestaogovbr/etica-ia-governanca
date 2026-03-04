import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectOwnerAndShares1731540600000
  implements MigrationInterface
{
  name = 'AddProjectOwnerAndShares1731540600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN "owner_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_projects_owner" FOREIGN KEY ("owner_id") REFERENCES "administradores"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
      CREATE TABLE "project_shared_users" (
        "id" SERIAL PRIMARY KEY,
        "project_id" integer NOT NULL,
        "social_number" character varying(14) NOT NULL,
        "date_created" TIMESTAMP NOT NULL DEFAULT now(),
        "date_updated" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_project_shared_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_project_shared_social" UNIQUE ("project_id", "social_number")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "project_shared_users"');
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "FK_projects_owner"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP COLUMN IF EXISTS "owner_id"`,
    );
  }
}
