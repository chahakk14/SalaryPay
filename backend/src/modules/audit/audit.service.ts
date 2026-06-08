import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  log(userId: string, action: string, entity: string, entityId?: string, oldData?: any, newData?: any, ipAddress?: string) {
    return this.prisma.auditLog.create({ data: { userId, action, entity, entityId, oldData, newData, ipAddress } });
  }

  findAll(orgId: string, filters?: { entity?: string; userId?: string }) {
    return this.prisma.auditLog.findMany({
      where: { user: { organizationId: orgId }, ...(filters?.entity && { entity: filters.entity }), ...(filters?.userId && { userId: filters.userId }) },
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }
}
