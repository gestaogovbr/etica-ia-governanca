import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GovbrTstController } from './govbr.controller';
import { GovbrTstService } from './govbr.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: 86400 },
    }),
  ],
  controllers: [GovbrTstController],
  providers: [GovbrTstService],
})
export class GovbrTstModule {}
