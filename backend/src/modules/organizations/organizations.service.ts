import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: any) {
    const exists = await this.prisma.organization.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Organization email already registered');

    const org = await this.prisma.organization.create({ data: {
      name: dto.name, email: dto.email, phone: dto.phone, address: dto.address, gstin: dto.gstin,
    }});

    // Create super admin user
    const passwordHash = await bcrypt.hash(dto.adminPassword || 'Admin@123', 10);
    await this.prisma.user.create({ data: {
      organizationId: org.id, email: dto.adminEmail, passwordHash, role: 'SUPER_ADMIN',
    }});

    return { organization: org, message: 'Organization onboarded. Admin credentials sent.' };
  }

  findAll() { return this.prisma.organization.findMany({ where: { isActive: true } }); }

  findOne(id: string) { return this.prisma.organization.findUnique({ where: { id }, include: { departments: true } }); }

  update(id: string, dto: any) { return this.prisma.organization.update({ where: { id }, data: dto }); }
}
