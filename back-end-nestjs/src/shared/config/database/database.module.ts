import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { Administrador } from 'src/modules/auth/entities/administrador.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        username: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        database: process.env.POSTGRES_DB || 'database_dev',
        entities: [Administrador],
        migrations: [join(__dirname, '../migrations/*.{ts,js}')],
        migrationsTableName: 'migrations',
        synchronize: process.env.NODE_ENV === 'development' ? true : false,
        migrationsRun: true, // Executar migrations automaticamente ao iniciar
        logging: process.env.NODE_ENV === 'development',
        autoLoadEntities: true,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
