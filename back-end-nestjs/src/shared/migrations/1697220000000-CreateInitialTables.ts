import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1697220000000 implements MigrationInterface {
  name = 'CreateInitialTables1697220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela user
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nome" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "confirmationCode" character varying(6),
        "codeExpirationDate" TIMESTAMP,
        "refreshToken" text,
        "refreshTokenExpirationDate" TIMESTAMP,
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {

  }
}
