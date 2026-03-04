import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IncomingHttpHeaders } from 'http';

interface RequestWithUser extends Request {
  user?: any;
  headers: IncomingHttpHeaders;
  cookies: { [key: string]: any };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('dlg.not_found');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ [key: string]: any }>(
        token,
      );
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('dlg.not_found');
    }
  }

  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
