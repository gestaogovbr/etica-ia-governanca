import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClassificationLevels1731542100000
  implements MigrationInterface
{
  name = 'CreateClassificationLevels1731542100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "classification_levels" (
        "id" SERIAL NOT NULL,
        "level_key" character varying(60) NOT NULL,
        "display_order" integer NOT NULL DEFAULT 0,
        "title" character varying(120) NOT NULL,
        "subtitle" character varying(120) NOT NULL,
        "description" text NOT NULL,
        "advice" text NOT NULL,
        "max_score" numeric(10,2),
        "max_percentage" numeric(10,2),
        "date_created" TIMESTAMP NOT NULL DEFAULT now(),
        "date_updated" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_classification_levels_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_classification_levels_key" UNIQUE ("level_key")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "classification_levels" 
        (level_key, display_order, title, subtitle, description, advice, max_score, max_percentage)
      VALUES
        ('LEVEL_1', 1, 'Nível 1', 'Reavalie os Fundamentos', 'Pontuação crítica que exige revisão completa.', 'Reforce a base antes de avançar.', -20, NULL),
        ('LEVEL_2', 2, 'Nível 2', 'Correções Estruturais', 'Percentual abaixo do ideal indica ajustes estruturais.', 'Implemente planos focados em governança e mitigação.', NULL, 30),
        ('LEVEL_3', 3, 'Nível 3', 'Intermediário', 'Há aderência consistente, porém com oportunidades.', 'Mantenha a disciplina e fortaleça o monitoramento.', NULL, 60),
        ('LEVEL_4', 4, 'Nível 4', 'Aprimoramentos', 'Governança avançada com espaço para excelência.', 'Escalone auditorias, revisões independentes e métricas.', NULL, 90),
        ('LEVEL_5', 5, 'Nível 5', 'Aderente', 'Alto grau de maturidade ética.', 'Compartilhe aprendizados e mantenha cadências de revisão.', NULL, NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "classification_levels"');
  }
}
