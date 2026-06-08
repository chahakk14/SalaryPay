import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll(orgId: string) {
    return this.prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true, email: true, role: true, isActive: true, createdAt: true, employee: { select: { firstName: true, lastName: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isActive: true, employee: true },
    });
  }

  async create(orgId: string, dto: any) {
    const hash = await bcrypt.hash(dto.password || 'Welcome@123', 10);
    return this.prisma.user.create({ data: { organizationId: orgId, email: dto.email, passwordHash: hash, role: dto.role } });
  }

  update(id: string, dto: any) {
    return this.prisma.user.update({ where: { id }, data: { role: dto.role, isActive: dto.isActive } });
  }
}
