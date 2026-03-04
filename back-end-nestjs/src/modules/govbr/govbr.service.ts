/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';
import { Administrador } from '../auth/entities/administrador.entity';

type GovbrTokenResponse = {
  access_token: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

type GovbrProfile = {
  name?: string;
  email?: string | null;
  social_number?: string | null;
  raw?: any;
};

type PopupPayload =
  | { status: 'success'; token: string; user: any }
  | { status: 'error'; message: string; error?: string };

@Injectable()
export class GovbrService {
  private readonly logger = new Logger(GovbrService.name);
  private readonly pkceStore = new Map<
    string,
    { codeVerifier: string; expiresAt: number }
  >();
  private readonly baseAuthUrl =
    process.env.GOVBR_AUTH_URL ||
    `${process.env.GOVBR_BASE_URL || 'https://sso.acesso.gov.br'}/authorize`;
  private readonly tokenUrl =
    process.env.GOVBR_TOKEN_URL ||
    `${process.env.GOVBR_BASE_URL || 'https://sso.acesso.gov.br'}/token`;
  private readonly userinfoUrl =
    process.env.GOVBR_USERINFO_URL ||
    `${process.env.GOVBR_API_BASE_URL || 'https://api.acesso.gov.br'}/userinfo`;
  private readonly redirectUri =
    process.env.GOVBR_REDIRECT_URI || 'http://localhost:8080/retornoWebHook';
  private readonly frontendOrigin =
    process.env.GOVBR_FRONTEND_ORIGIN || 'http://localhost:3000';
  private readonly scope =
    process.env.GOVBR_SCOPE || 'openid email profile';
  private readonly stateSecret =
    process.env.GOVBR_STATE_SECRET ||
    process.env.JWT_SECRET ||
    'govbr-state-secret';

  private readonly govbrMenu = [
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
  ];

  constructor(
    private readonly http: HttpService,
    @InjectRepository(Administrador)
    private readonly adminRepo: Repository<Administrador>,
    private readonly jwtService: JwtService,
  ) {}

  async buildAuthorizeUrl(origin?: string) {
    const clientId = process.env.GOVBR_CLIENT_ID;
    const clientSecret = process.env.GOVBR_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'Defina GOVBR_CLIENT_ID e GOVBR_CLIENT_SECRET para habilitar o login com gov.br',
      );
    }

    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.toCodeChallenge(codeVerifier);

    const state = await this.jwtService.signAsync(
      {
        origin: this.resolveOrigin(origin),
        ts: Date.now(),
      },
      {
        secret: this.stateSecret,
        expiresIn: '10m',
      },
    );
    this.storePkce(state, codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      state,
      nonce: crypto.randomBytes(16).toString('hex'),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${this.baseAuthUrl}?${params.toString()}`;
  }

  async handleCallback(code?: string, state?: string) {
    if (!code) {
      throw new BadRequestException(
        'Código de autorização ausente no retorno do gov.br',
      );
    }

    const statePayload = await this.verifyState(state);
    const codeVerifier = this.consumePkce(state);
    const tokenSet = await this.exchangeCodeForTokens(code, codeVerifier);
    const profile = await this.resolveProfile(tokenSet);
    const userEntity = await this.findOrCreateUser(profile);

    await this.adminRepo.update(userEntity.id, { last_access: new Date() });

    const userPayload = {
      id: userEntity.id,
      name: userEntity.name,
      email: userEntity.email,
      social_number: userEntity.social_number,
      admin: false,
      menu: this.govbrMenu,
    };

    const token = await this.jwtService.signAsync(userPayload);

    return {
      token,
      user: userPayload,
      origin: statePayload?.origin ?? this.frontendOrigin,
    };
  }

  renderPopupClosePage(origin: string, payload: PopupPayload) {
    const targetOrigin = origin || '*';
    const serialized = JSON.stringify({
      source: 'govbr-login',
      ...payload,
    });

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>gov.br</title>
</head>
<body>
  <script>
    (function() {
      const data = ${serialized};
      const targetOrigin = ${JSON.stringify(targetOrigin)};
      if (window.opener && !window.opener.closed) {
        try { window.opener.postMessage(data, targetOrigin === '*' ? '*' : targetOrigin); } catch (err) { console.error(err); }
      }
      window.close();
    })();
  </script>
  <p>Você pode fechar esta janela.</p>
</body>
</html>`;
  }

  extractOriginFromState(state?: string) {
    if (!state) return null;
    try {
      const decoded: any = jwt.decode(state);
      if (typeof decoded === 'object' && decoded?.origin)
        return decoded.origin as string;
    } catch (err) {
      this.logger.warn('Não foi possível ler o origin do state recebido.');
    }
    return null;
  }

  getOriginForResponse(
    originFromQuery?: string,
    originFromState?: string | null,
  ) {
    return this.resolveOrigin(originFromQuery || originFromState || undefined);
  }

  private resolveOrigin(origin?: string) {
    return origin || this.frontendOrigin;
  }

  private async verifyState(
    state?: string,
  ): Promise<{ origin?: string } | null> {
    if (!state) {
      throw new BadRequestException('State não recebido do gov.br');
    }
    try {
      return await this.jwtService.verifyAsync(state, {
        secret: this.stateSecret,
      });
    } catch (err) {
      this.logger.warn('State inválido ou expirado no retorno do gov.br');
      throw new BadRequestException('State inválido ou expirado');
    }
  }

  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
  ): Promise<GovbrTokenResponse> {
    const clientId = process.env.GOVBR_CLIENT_ID;
    const clientSecret = process.env.GOVBR_CLIENT_SECRET;
    const basicAuth = process.env.GOVBR_BASIC_AUTH;

    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'Credenciais do gov.br não configuradas (GOVBR_CLIENT_ID / GOVBR_CLIENT_SECRET).',
      );
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      code_verifier: codeVerifier,
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      headers.Authorization = this.resolveBasicAuthorization(
        clientId,
        clientSecret,
        basicAuth,
      );

      const response = await firstValueFrom(
        this.http.post<GovbrTokenResponse>(this.tokenUrl, body.toString(), {
          headers,
        }),
      );
      if (!response.data?.access_token) {
        throw new UnauthorizedException(
          'Não recebemos o access_token do gov.br',
        );
      }
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status ?? null;
      const data = this.sanitizeTokenErrorResponse(err?.response?.data);
      this.logger.error(
        `Falha ao trocar o code pelo token do gov.br (status=${status ?? 'n/a'}) body=${JSON.stringify(data)}`,
      );
      throw new UnauthorizedException('Falha ao autenticar no gov.br');
    }
  }

  private async resolveProfile(
    tokenSet: GovbrTokenResponse,
  ): Promise<GovbrProfile> {
    const decoded = tokenSet.id_token
      ? ((jwt.decode(tokenSet.id_token) as any) ?? {})
      : {};
    let userInfo: any = null;

    if (tokenSet.access_token) {
      try {
        const response = await firstValueFrom(
          this.http.get(this.userinfoUrl, {
            headers: { Authorization: `Bearer ${tokenSet.access_token}` },
          }),
        );
        userInfo = response.data;
      } catch (err) {
        this.logger.warn(
          'Não foi possível obter o userinfo do gov.br, tentando seguir com o id_token.',
        );
      }
    }

    const data = {
      ...(userInfo ?? {}),
      ...(decoded ?? {}),
    };

    const name =
      data?.name || data?.nome || data?.given_name || 'Usuário gov.br';
    const email = data?.email || data?.preferred_username || null;
    const socialNumber =
      this.formatCpf(data?.cpf || data?.social_number || data?.sub) ?? null;

    return {
      name,
      email,
      social_number: socialNumber,
      raw: { id_token: decoded, userinfo: userInfo },
    };
  }

  private async findOrCreateUser(
    profile: GovbrProfile,
  ): Promise<Administrador> {
    const qb = this.adminRepo.createQueryBuilder('adm');

    if (profile.social_number && profile.email) {
      qb.where('adm.social_number = :social_number OR adm.email = :email', {
        social_number: profile.social_number,
        email: profile.email,
      });
    } else if (profile.social_number) {
      qb.where('adm.social_number = :social_number', {
        social_number: profile.social_number,
      });
    } else if (profile.email) {
      qb.where('adm.email = :email', { email: profile.email });
    }

    const existing = await qb.getOne();

    if (existing) {
      await this.adminRepo.update(existing.id, {
        name: profile.name ?? existing.name,
        email: profile.email ?? existing.email,
        social_number: profile.social_number ?? existing.social_number,
      });
      const refreshed = await this.adminRepo.findOne({
        where: { id: existing.id },
      });
      return refreshed ?? existing;
    }

    const social_number =
      profile.social_number ?? this.generateFallbackSocialNumber();

    const newUser = this.adminRepo.create({
      name: profile.name ?? 'Usuário gov.br',
      email:
        profile.email ??
        `govbr-${Math.random().toString(36).substring(2, 8)}@placeholder.local`,
      social_number,
      position: 'gov.br',
      active: true,
      last_access: new Date(),
    });

    return this.adminRepo.save(newUser);
  }

  private formatCpf(value?: string | null) {
    if (!value) return null;
    const digits = value.replace(/\D/g, '');
    const trimmed = digits.slice(0, 14);
    if (digits.length !== 11) return trimmed || null;
    return digits.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      (_, p1, p2, p3, p4) => `${p1}.${p2}.${p3}-${p4}`,
    );
  }

  private generateFallbackSocialNumber() {
    const random = Math.floor(1e10 + Math.random() * 9e10)
      .toString()
      .slice(0, 11);
    return this.formatCpf(random) ?? random.padEnd(11, '0').slice(0, 11);
  }

  private storePkce(state: string, codeVerifier: string) {
    this.cleanupExpiredPkce();
    this.pkceStore.set(state, {
      codeVerifier,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
  }

  private consumePkce(state?: string) {
    if (!state) {
      throw new BadRequestException('State não recebido do gov.br');
    }
    this.cleanupExpiredPkce();
    const entry = this.pkceStore.get(state);
    if (!entry || entry.expiresAt < Date.now()) {
      this.pkceStore.delete(state);
      throw new BadRequestException(
        'Sessão PKCE não encontrada ou expirada. Inicie o login novamente.',
      );
    }
    this.pkceStore.delete(state);
    return entry.codeVerifier;
  }

  private cleanupExpiredPkce() {
    const now = Date.now();
    for (const [key, value] of this.pkceStore.entries()) {
      if (value.expiresAt < now) {
        this.pkceStore.delete(key);
      }
    }
  }

  private generateCodeVerifier() {
    return this.base64UrlEncode(crypto.randomBytes(32));
  }

  private toCodeChallenge(codeVerifier: string) {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    return this.base64UrlEncode(hash);
  }

  private base64UrlEncode(value: Buffer) {
    return value
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  private resolveBasicAuthorization(
    clientId: string,
    clientSecret: string,
    basicAuth?: string,
  ) {
    if (basicAuth) {
      return basicAuth.startsWith('Basic ') ? basicAuth : `Basic ${basicAuth}`;
    }

    const raw = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    return `Basic ${raw}`;
  }

  private sanitizeTokenErrorResponse(data: unknown) {
    if (!data || typeof data !== 'object') return data;
    const clone = { ...(data as Record<string, unknown>) };
    if ('access_token' in clone) clone.access_token = '[redacted]';
    if ('refresh_token' in clone) clone.refresh_token = '[redacted]';
    if ('id_token' in clone) clone.id_token = '[redacted]';
    if ('client_secret' in clone) clone.client_secret = '[redacted]';
    return clone;
  }
}
