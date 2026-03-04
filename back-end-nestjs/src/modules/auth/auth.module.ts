import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Administrador } from './entities/administrador.entity';
import { JwtStrategy } from './jwt.strategy';
import { LogsModule } from '../logs/logs.module'; // << aqui

@Module({
  imports: [
    TypeOrmModule.forFeature([Administrador]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: 86400 },
      }),
      inject: [ConfigService],
    }),
    LogsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
