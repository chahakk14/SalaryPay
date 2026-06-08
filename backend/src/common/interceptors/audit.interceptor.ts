import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../../modules/audit/audit.service';
import type { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method?.toUpperCase();
    const userId = (request as any).user?.userId;

    if (!['POST', 'PUT', 'DELETE'].includes(method) || !userId) {
      return next.handle();
    }

    const entity = this.getEntityFromPath(request.path || request.url);
    const action = method === 'POST' ? 'CREATE' : method === 'PUT' ? 'UPDATE' : 'DELETE';
    const entityId = request.params?.id || request.body?.id || null;

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditService
            .log(userId, `${action} ${entity}`, entity, entityId, null, request.body, request.ip)
            .catch(() => null);
        },
      }),
    );
  }

  private getEntityFromPath(path: string): string {
    const segments = path.split('/').filter(Boolean);
    const apiIndex = segments.indexOf('api');
    const startIndex = apiIndex >= 0 && segments[apiIndex + 1] === 'v1' ? apiIndex + 2 : 0;
    const entity = segments[startIndex] || 'unknown';
    return entity.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
  }
}
