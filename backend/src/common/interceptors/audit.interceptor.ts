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

    const path = (request as any).route?.path || request.path || request.url || '';
    const entity = this.getEntityFromPath(path);
    const action = this.getActionLabel(method, path);
    const entityId = request.params?.id || request.body?.id || null;

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditService
            .log(userId, action, entity, entityId, null, request.body, request.ip)
            .catch(() => null);
        },
      }),
    );
  }

  private getActionLabel(method: string, path: string): string {
    const segments = this.normalizePath(path);
    const action = this.getActionFromSegments(segments) || (method === 'POST' ? 'CREATE' : method === 'PUT' ? 'UPDATE' : 'DELETE');
    const entity = this.getEntityFromSegments(segments);
    return `${action}${entity ? ` ${entity}` : ''}`;
  }

  private normalizePath(path: string): string[] {
    const segments = path.split('/').filter(Boolean);
    const apiIndex = segments.indexOf('api');
    const startIndex = apiIndex >= 0 && segments[apiIndex + 1] === 'v1' ? apiIndex + 2 : 0;
    return segments.slice(startIndex).map(seg => seg.replace(/[^a-zA-Z0-9_-]/g, ''));
  }

  private getActionFromSegments(segments: string[]): string | null {
    const actionMap: Record<string, string> = {
      login: 'LOGIN',
      approve: 'APPROVE',
      execute: 'EXECUTE',
      'retry-pending': 'RETRY PENDING',
      'create-order': 'CREATE_ORDER',
      'verify-payment': 'VERIFY PAYMENT',
      generate: 'GENERATE',
      onboard: 'ONBOARD',
      download: 'DOWNLOAD',
      'change-password': 'CHANGE PASSWORD',
      'request-password-reset': 'PASSWORD RESET REQUEST',
      'reset-password': 'RESET PASSWORD',
    };

    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i].toLowerCase();
      if (actionMap[segment]) {
        return actionMap[segment];
      }
    }

    return null;
  }

  private getEntityFromPath(path: string): string {
    return this.getEntityFromSegments(this.normalizePath(path));
  }

  private getEntityFromSegments(segments: string[]): string {
    const actionKeywords = new Set([
      'login', 'approve', 'execute', 'retry-pending', 'create-order', 'verify-payment',
      'generate', 'onboard', 'download', 'change-password', 'request-password-reset', 'reset-password',
    ]);

    // Find first non-ID, non-action segment as main entity
    const mainEntity = segments.find(seg => 
      seg && !this.isIdSegment(seg) && !actionKeywords.has(seg.toLowerCase()) && seg.toLowerCase() !== 'me'
    );

    if (!mainEntity) {
      return 'UNKNOWN';
    }

    return this.normalizeEntitySegment(mainEntity);
  }

  private isIdSegment(segment: string): boolean {
    const lower = segment.toLowerCase();
    if (lower === 'me') {
      return true;
    }

    if (/^[0-9]+$/.test(segment)) {
      return true;
    }

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
      return true;
    }

    return false;
  }

  private normalizeEntitySegment(segment: string): string {
    const singular = segment.endsWith('s') ? segment.slice(0, -1) : segment;
    return singular.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  }
}
