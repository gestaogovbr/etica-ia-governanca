import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCriticalTriggerToLevels1731542400000
  implements MigrationInterface
{
  name = 'AddCriticalTriggerToLevels1731542400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "classification_levels" ADD COLUMN "critical_trigger_threshold" integer`,
    );

    await queryRunner.query(`
      UPDATE "classification_levels"
      SET critical_trigger_threshold = CASE level_key
        WHEN 'LEVEL_1' THEN 3
        WHEN 'LEVEL_2' THEN 1
        ELSE NULL
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "classification_levels" DROP COLUMN "critical_trigger_threshold"`,
    );
  }
}
