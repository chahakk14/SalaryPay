import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('payroll') private payrollQueue: Queue,
  ) {}

  async createSalaryRun(orgId: string, month: number, year: number) {
    const existing = await this.prisma.salaryRun.findFirst({ where: { organizationId: orgId, month, year } });
    if (existing) throw new BadRequestException('Salary run already exists for this month');

    const payrollEndDate = new Date(year, month, 0);
    const employees = await this.prisma.employee.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
        dateOfJoining: { lte: payrollEndDate },
      },
      include: { salaryStructure: true },
    });

    const salaryRun = await this.prisma.salaryRun.create({
      data: { organizationId: orgId, month, year, status: 'DRAFT' },
    });

    let total = 0;
    for (const emp of employees) {
      if (!emp.salaryStructure) continue;
      const s = emp.salaryStructure;
      const gross = +s.basicSalary + +s.hra + +s.da + +s.ta + +s.medicalAllow + +s.otherAllow;
      const deductions = +s.pfDeduction + +s.esiDeduction + +s.tdsDeduction + +s.otherDeduct;
      const net = gross - deductions;
      total += net;
      await this.prisma.salaryPayment.create({
        data: { salaryRunId: salaryRun.id, employeeId: emp.id, grossSalary: gross, totalDeductions: deductions, netSalary: net },
      });
    }

    await this.prisma.salaryRun.update({ where: { id: salaryRun.id }, data: { totalAmount: total } });
    return this.prisma.salaryRun.findUnique({ where: { id: salaryRun.id }, include: { payments: true } });
  }

  async retryPendingPayments(runId: string) {
    const payments = await this.prisma.salaryPayment.findMany({
      where: {
        salaryRunId: runId,
        status: { in: ['PENDING', 'PROCESSING', 'RETRYING'] },
      },
      include: { employee: true },
    });

    if (payments.length === 0) {
      throw new BadRequestException('No pending or retrying payments found for this salary run');
    }

    const queuedPayments: string[] = [];
    for (const payment of payments) {
      await this.prisma.salaryPayment.update({
        where: { id: payment.id },
        data: { status: 'PENDING', failureReason: null },
      });

      await this.payrollQueue.add('process-payment', { paymentId: payment.id, runId }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: { count: 10 },
      });

      queuedPayments.push(payment.id);
    }

    await this.markRunCompletedIfFinished(runId);
    return { retried: queuedPayments.length, paymentIds: queuedPayments };
  }

  async approveSalaryRun(runId: string, userId: string) {
    return this.prisma.salaryRun.update({
      where: { id: runId },
      data: { status: 'APPROVED', approvedById: userId, approvedAt: new Date() },
    });
  }

  async executeSalaryRun(runId: string) {
    const run = await this.prisma.salaryRun.findUnique({ where: { id: runId }, include: { payments: { include: { employee: true } } } });
    if (run.status !== 'APPROVED') throw new BadRequestException('Salary run must be approved before execution');

    await this.prisma.salaryRun.update({ where: { id: runId }, data: { status: 'PROCESSING', executedAt: new Date() } });

    for (const payment of run.payments) {
      const withinLimit = +payment.netSalary <= +payment.employee.autoPayLimit;
      if (+payment.employee.autoPayLimit === 0 || withinLimit) {
        await this.payrollQueue.add('process-payment', { paymentId: payment.id, runId }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: { count: 10 },
        });
      } else {
        await this.prisma.salaryPayment.update({
          where: { id: payment.id },
          data: { status: 'FAILED', failureReason: 'Net salary exceeds auto-pay limit' },
        });
      }
    }

    await this.markRunCompletedIfFinished(runId);
    return { message: 'Salary run queued for processing', runId };
  }

  private async markRunCompletedIfFinished(runId: string) {
    const pendingCount = await this.prisma.salaryPayment.count({
      where: {
        salaryRunId: runId,
        status: { in: ['PENDING', 'PROCESSING', 'RETRYING'] },
      },
    });

    if (pendingCount === 0) {
      await this.prisma.salaryRun.update({ where: { id: runId }, data: { status: 'COMPLETED' } });
    }
  }

  findAll(orgId: string) {
    return this.prisma.salaryRun.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { payments: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.salaryRun.findUnique({
      where: { id },
      include: { payments: { include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } } } },
    });
  }

  getPaymentHistory(orgId: string) {
    return this.prisma.salaryPayment.findMany({
      where: { salaryRun: { organizationId: orgId } },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } }, salaryRun: { select: { month: true, year: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
