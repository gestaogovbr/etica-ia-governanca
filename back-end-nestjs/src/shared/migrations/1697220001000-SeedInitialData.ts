import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialData1697220001000 implements MigrationInterface {
  name = 'SeedInitialData1697220001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Inserir usuário administrador padrão (para desenvolvimento)
    await queryRunner.query(`
      INSERT INTO "user"
      ("id", "nome", "email", "isDeleted", "createdAt", "updatedAt")
      VALUES
      (
        uuid_generate_v4(),
        'Administrador',
        'admin@datablinds.com',
        false,
        now(),
        now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover usuário administrador inserido
    await queryRunner.query(`
      DELETE FROM "user"
      WHERE "email" = 'admin@datablinds.com'
    `);
  }
}
