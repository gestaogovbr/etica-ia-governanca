import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSessionScoresToResponses1731540200000
  implements MigrationInterface
{
  name = 'AddSessionScoresToResponses1731540200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "responses" ADD COLUMN "session_scores" jsonb DEFAULT '[]'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "responses" DROP COLUMN "session_scores"`,
    );
  }
}
