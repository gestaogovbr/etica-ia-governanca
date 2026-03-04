import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResultsTable1731541800000 implements MigrationInterface {
  name = 'CreateResultsTable1731541800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "results" (
        "id" SERIAL NOT NULL,
        "response_id" integer NOT NULL,
        "project_id" integer,
        "summary" jsonb NOT NULL,
        "date_created" TIMESTAMP NOT NULL DEFAULT now(),
        "date_updated" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_results_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_results_response" UNIQUE ("response_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "results"
      ADD CONSTRAINT "FK_results_response"
      FOREIGN KEY ("response_id")
      REFERENCES "responses"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "results"
      ADD CONSTRAINT "FK_results_project"
      FOREIGN KEY ("project_id")
      REFERENCES "projects"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "results" DROP CONSTRAINT "FK_results_project"`,
    );
    await queryRunner.query(
      `ALTER TABLE "results" DROP CONSTRAINT "FK_results_response"`,
    );
    await queryRunner.query(`DROP TABLE "results"`);
  }
}
