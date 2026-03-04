import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActorsTable1731540900000 implements MigrationInterface {
  name = 'CreateActorsTable1731540900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "actors" (
        "id" SERIAL NOT NULL,
        "name" character varying(150) NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "date_created" TIMESTAMP NOT NULL DEFAULT now(),
        "date_updated" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_actors_id" PRIMARY KEY ("id")
      )
    `);

    const actors = [
      'Gestor de Negócio/Cliente',
      'Analista de Negócio',
      'Desenvolvedor/Cientista de Dados',
      'Especialista em Privacidade (PPD)',
      'Especialista em Ética/Risco de IA',
      'Especialista Jurídico',
      'Especialista em Segurança',
      'Especialista em Testes/QA',
      'Especialista em UX',
      'Responsável pela Sustentação',
      'Gestor do Órgão',
      'Especialista em Gestão de Dados'
    ];

    for (const name of actors) {
      await queryRunner.query(
        `INSERT INTO "actors" ("name", "active") VALUES ($1, true)`,
        [name],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "actors"');
  }
}
