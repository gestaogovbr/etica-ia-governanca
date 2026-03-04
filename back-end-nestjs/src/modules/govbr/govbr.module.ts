import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GovbrController } from './govbr.controller';
import { GovbrService } from './govbr.service';
import { Administrador } from '../auth/entities/administrador.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Administrador]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: 86400 },
    }),
  ],
  controllers: [GovbrController],
  providers: [GovbrService],
})
export class GovbrModule {}
