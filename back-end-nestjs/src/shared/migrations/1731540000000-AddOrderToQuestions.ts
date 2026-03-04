import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderToQuestions1731540000000 implements MigrationInterface {
  name = 'AddOrderToQuestions1731540000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" ADD COLUMN "order" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "order"`);
  }
}
