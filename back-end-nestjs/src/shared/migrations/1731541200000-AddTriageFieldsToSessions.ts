import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTriageFieldsToSessions1731541200000
  implements MigrationInterface
{
  name = 'AddTriageFieldsToSessions1731541200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD COLUMN "is_triage" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD COLUMN "next_session_code" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD COLUMN "triage_config" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN "triage_config"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN "next_session_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN "is_triage"`,
    );
  }
}
