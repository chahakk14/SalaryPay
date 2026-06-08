import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  findAll(orgId: string) {
    return this.prisma.employee.findMany({
      where: { organizationId: orgId, isActive: true },
      include: { department: true, salaryStructure: true, user: { select: { email: true, role: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: { department: true, salaryStructure: true, user: { select: { email: true } } },
    });
  }

  async create(orgId: string, dto: any) {
    const hash = await bcrypt.hash(dto.password || 'Welcome@123', 10);
    const user = await this.prisma.user.create({
      data: { organizationId: orgId, email: dto.email, passwordHash: hash, role: 'EMPLOYEE' },
    });
    const emp = await this.prisma.employee.create({
      data: {
        userId: user.id, organizationId: orgId,
        departmentId: dto.departmentId,
        employeeCode: dto.employeeCode, firstName: dto.firstName, lastName: dto.lastName,
        phone: dto.phone, dateOfJoining: new Date(dto.dateOfJoining), designation: dto.designation,
        bankAccountNo: dto.bankAccountNo, bankIfsc: dto.bankIfsc, bankName: dto.bankName,
        upiId: dto.upiId, panNumber: dto.panNumber, autoPayLimit: dto.autoPayLimit || 0,
      },
    });
    return { employee: emp, userId: user.id };
  }

  update(id: string, dto: any) {
    return this.prisma.employee.update({ where: { id }, data: dto });
  }

  updateAutoPayLimit(id: string, limit: number) {
    return this.prisma.employee.update({ where: { id }, data: { autoPayLimit: limit } });
  }

  deactivate(id: string) {
    return this.prisma.employee.update({ where: { id }, data: { isActive: false } });
  }
}
