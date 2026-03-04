import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GovbrLoginDto } from './dto/govbr-login.dto';

@Injectable()
export class GovbrTstService {
  constructor(private readonly jwt: JwtService) {}

  async login(dto: GovbrLoginDto) {
    const fakeUser = {
      id: 2,
      name: 'Login GOVBR Educação',
      email: 'hudson.m.3110@gmail.com',
      social_number: '701.694.781-57',
      admin: false,
      menu: [
        {
          icon: 'fas fa-chart-bar',
          id: 'home',
          name: 'sidebar.home',
          order: 0,
          path: '',
        },
        {
          icon: 'fas fa-folder',
          id: 'projects',
          name: 'sidebar.projects',
          order: 1,
          path: 'projects',
        },
      ],
      gov_token_received: dto?.token ?? null,
    };

    const token = await this.jwt.signAsync(fakeUser);
    return { user: fakeUser, token };
  }
}
