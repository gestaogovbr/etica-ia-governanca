import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActiveFlagToProjects1731543000000
  implements MigrationInterface
{
  name = 'AddActiveFlagToProjects1731543000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "projects" SET "active" = true WHERE "active" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "active"`);
  }
}
