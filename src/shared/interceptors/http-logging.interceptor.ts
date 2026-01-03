import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap, catchError, throwError } from 'rxjs';
import chalk from 'chalk';
import { AppLogger } from '../logger/app-logger.service';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request>();
    const response = httpCtx.getResponse<Response>();

    const { method, originalUrl, params, query, body, headers } = request;

    const ip =
      request.headers['x-forwarded-for'] ?? request.socket.remoteAddress;

    const userAgent = headers['user-agent'];

    const start = Date.now();

    console.log(
      chalk.blueBright(
        `[REQUEST] ${method} ${originalUrl} | ip=${ip} | agent="${userAgent}" | params=${this.stringify(
          params,
        )} | query=${this.stringify(query)} | body=${this.stringify(
          this.sanitize(body),
        )} | ts=${new Date().toISOString()}`,
      ),
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const statusCode = response.statusCode;

        console.log(
          chalk.greenBright(
            `[RESPONSE] ${method} ${originalUrl} | status=${statusCode} | duration=${duration}ms | ts=${new Date().toISOString()}`,
          ),
        );

        this.logger.info('HTTP_RESPONSE', {
          method,
          path: originalUrl,
          statusCode,
          durationMs: duration,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - start;
        const statusCode = error?.status ?? 500;

        console.log(
          chalk.redBright(
            `[ERROR] ${method} ${originalUrl} | status=${statusCode} | duration=${duration}ms | message="${error?.message}" | ts=${new Date().toISOString()}`,
          ),
        );

        this.logger.error('HTTP_ERROR', error, {
          method,
          path: originalUrl,
          statusCode,
          durationMs: duration,
        });

        return throwError(() => error);
      }),
    );
  }

  private sanitize(body: any) {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };

    if ('password' in sanitized) sanitized.password = '******';
    if ('token' in sanitized) sanitized.token = '******';

    return sanitized;
  }

  private stringify(value: any) {
    if (!value || Object.keys(value).length === 0) return '{}';

    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable]';
    }
  }
}
