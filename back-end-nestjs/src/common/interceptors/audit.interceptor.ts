/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { LogsService } from '../../modules/logs/logs.service';
import { Address4, Address6 } from 'ip-address';

// Função robusta pra extrair IP real
function resolveIp(req: any): string | null {
  const header = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];

  const rawIp = Array.isArray(header)
    ? header[0]
    : header?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress;

  if (!rawIp) return null;

  try {
    if (Address4.isValid(rawIp)) {
      return new Address4(rawIp).correctForm();
    } else if (Address6.isValid(rawIp)) {
      const addr6 = new Address6(rawIp);
      return addr6.is4() ? addr6.to4().correctForm() : addr6.correctForm();
    }
  } catch {
    /* ignore */
  }
  return rawIp;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly logs: LogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const method = (req.method || '').toUpperCase();
    const route: string = req.originalUrl || req.url || '';
    const ip = resolveIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const isLogin = route.includes('/auth/login') && method === 'POST';
    if (!isMutating && !isLogin) return next.handle();

    const moduleGuess = route.includes('/sessions')
      ? 'session'
      : route.includes('/questions')
        ? 'question'
        : route.includes('/admin')
          ? 'admin'
          : route.includes('/auth')
            ? 'auth'
            : 'unknown';

    const action = isLogin
      ? 'login'
      : method === 'POST'
        ? 'create'
        : method === 'PUT' || method === 'PATCH'
          ? 'update'
          : method === 'DELETE'
            ? 'delete'
            : 'other';

    const user = req.user || {};
    const base = {
      user_id: user?.sub ?? null,
      user_email: user?.email ?? null,
      ip,
      action: action as any,
      module: moduleGuess,
      route,
      method,
    };

    const body = req.body || {};
    const recordId = req.params?.id ? String(req.params.id) : null;

    return next.handle().pipe(
      tap(async (response) => {
        const responseId =
          response?.id || response?.user?.id
            ? String(response.id || response.user.id)
            : null;

        await this.logs.write({
          ...base,
          status: 'SUCCESS',
          record_id: responseId || recordId,
          user_agent: userAgent,
          detail: {
            user_agent: userAgent,
            request: { body },
            response: isLogin ? undefined : response,
          },
        });
      }),
      catchError((err) => {
        void this.logs.write({
          ...base,
          status: 'ERROR',
          record_id: recordId,
          user_agent: userAgent,
          detail: {
            user_agent: userAgent,
            request: { body },
            error: {
              message: err?.message,
              name: err?.name,
              stack: err?.stack,
            },
          },
        });
        return throwError(() => err);
      }),
    );
  }
}
