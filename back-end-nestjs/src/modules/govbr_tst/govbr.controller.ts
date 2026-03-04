import { Body, Controller, Post } from '@nestjs/common';
import { GovbrTstService } from './govbr.service';
import { GovbrLoginDto } from './dto/govbr-login.dto';

@Controller('govbr-tst')
export class GovbrTstController {
  constructor(private readonly service: GovbrTstService) {}

  @Post('login')
  login(@Body() dto: GovbrLoginDto) {
    return this.service.login(dto);
  }
}
