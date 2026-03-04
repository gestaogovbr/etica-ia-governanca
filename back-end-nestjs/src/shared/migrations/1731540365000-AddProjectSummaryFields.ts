import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectSummaryFields1731540365000
  implements MigrationInterface
{
  name = 'AddProjectSummaryFields1731540365000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN "last_pretriagem_level" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN "last_pretriagem_score" numeric(10,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" DROP COLUMN "last_pretriagem_score"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP COLUMN "last_pretriagem_level"`,
    );
  }
}
