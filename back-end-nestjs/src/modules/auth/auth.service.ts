/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Administrador } from './entities/administrador.entity';
import { LoginDto } from './dto/login.dto';
import { LogsService } from '../logs/logs.service';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Administrador)
    private readonly adminRepo: Repository<Administrador>,
    private readonly jwt: JwtService,
    private readonly logs: LogsService,
  ) {}

  async login(dto: LoginDto, req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req as any).ip ||
      null;
    const ua = req.headers['user-agent'] as string;

    try {
      const user = await this.adminRepo
        .createQueryBuilder('a')
        .addSelect('a.password')
        .where('a.email = :email', { email: dto.email })
        .getOne();

      if (!user) throw new UnauthorizedException('login.invalid');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const ok = await bcrypt.compare(dto.password, (user as any).password);
      if (!ok) throw new UnauthorizedException('login.invalid');
      if (!user.active) throw new UnauthorizedException('login.inative');

      await this.adminRepo.update(user.id, { last_access: new Date() });

      const menu_admin = [
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
          name: 'sidebar.projects_received',
          order: 1,
          path: 'projects-received',
        },
        {
          icon: 'fas fa-folder',
          id: 'my_projects',
          name: 'sidebar.projects',
          order: 2,
          path: 'projects',
        },
        {
          icon: 'fas fa-clipboard-check',
          id: 'questions',
          name: 'sidebar.questions',
          order: 3,
          path: 'questions',
        },
        {
          icon: 'fas fa-users',
          id: 'actors',
          name: 'sidebar.actors',
          order: 4,
          path: 'actors',
        },
        {
          icon: 'fas fa-clipboard-list',
          id: 'sessions',
          name: 'sidebar.sessions',
          order: 5,
          path: 'sessions',
        },
        {
          icon: 'fas fa-newspaper',
          id: 'logs',
          name: 'sidebar.logs',
          order: 6,
          path: 'logs',
        },
        {
          icon: 'fas fa-users',
          id: 'users',
          name: 'sidebar.users',
          order: 7,
          path: 'admins',
        },
        {
          icon: 'fas fa-cog',
          id: 'config',
          name: 'sidebar.config',
          order: 8,
          path: 'config-classifications',
        },
      ];

      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        social_number: user.social_number,
        admin: true,
        menu: menu_admin,
      };
      const token = await this.jwt.signAsync(payload);

      void this.logs.write({
        user_id: user.id,
        user_email: user.email,
        ip,
        action: 'login',
        module: 'auth',
        route: '/auth/login',
        method: 'POST',
        status: 'SUCCESS',
        detail: { email: dto.email },
        user_agent: ua ?? null,
      });

      const { password, ...safe } = user as any;
      return { user: safe, token };
    } catch (err) {
      // falha de login
      void this.logs.write({
        user_id: null,
        user_email: dto.email,
        ip,
        action: 'login',
        module: 'auth',
        route: '/auth/login',
        method: 'POST',
        status: 'ERROR',
        detail: { email: dto.email, error: err?.message },
        user_agent: ua ?? null,
      });
      throw err;
    }
  }
}
