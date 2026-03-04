import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestionVersioning1731543300000
  implements MigrationInterface
{
  name = 'AddQuestionVersioning1731543300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" ADD COLUMN "version" integer NOT NULL DEFAULT 1`,
    );

    await queryRunner.query(`
      CREATE TABLE "questions_versions" (
        "id" SERIAL NOT NULL,
        "question_id" integer NOT NULL,
        "version" integer NOT NULL DEFAULT 1,
        "code" character varying(120) NOT NULL,
        "session_id" integer,
        "text" text NOT NULL,
        "type" character varying(30) NOT NULL,
        "weights" numeric(10,2) NOT NULL DEFAULT 1,
        "options" jsonb,
        "is_critical" boolean NOT NULL DEFAULT false,
        "active" boolean NOT NULL DEFAULT true,
        "order" integer NOT NULL DEFAULT 0,
        "conditional_field" character varying(120),
        "conditional_value" character varying(250),
        "actors" jsonb,
        "date_created" TIMESTAMP,
        "date_updated" TIMESTAMP,
        CONSTRAINT "PK_questions_versions_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_questions_versions_question_id" ON "questions_versions" ("question_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_questions_versions_version" ON "questions_versions" ("version")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_questions_versions_code" ON "questions_versions" ("code")`,
    );

    await queryRunner.query(`
      ALTER TABLE "questions_versions"
      ADD CONSTRAINT "FK_questions_versions_question"
      FOREIGN KEY ("question_id")
      REFERENCES "questions"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "questions_versions"
      ADD CONSTRAINT "FK_questions_versions_session"
      FOREIGN KEY ("session_id")
      REFERENCES "sessions"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions_versions" DROP CONSTRAINT "FK_questions_versions_session"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions_versions" DROP CONSTRAINT "FK_questions_versions_question"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_questions_versions_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_questions_versions_version"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_questions_versions_question_id"`,
    );
    await queryRunner.query(`DROP TABLE "questions_versions"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "version"`);
  }
}
