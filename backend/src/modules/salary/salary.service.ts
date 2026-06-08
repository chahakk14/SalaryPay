import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SalaryService {
  constructor(private prisma: PrismaService) {}

  upsert(employeeId: string, dto: any) {
    return this.prisma.salaryStructure.upsert({
      where: { employeeId },
      update: { ...dto },
      create: { employeeId, ...dto },
    });
  }

  findByEmployee(employeeId: string) {
    return this.prisma.salaryStructure.findUnique({ where: { employeeId } });
  }

  computeNet(struct: any) {
    const gross = +struct.basicSalary + +struct.hra + +struct.da + +struct.ta + +struct.medicalAllow + +struct.otherAllow;
    const deductions = +struct.pfDeduction + +struct.esiDeduction + +struct.tdsDeduction + +struct.otherDeduct;
    return { gross, deductions, net: gross - deductions };
  }
}
