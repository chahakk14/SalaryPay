import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../common/prisma/prisma.service';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

@Injectable()
export class PayslipsService {
  constructor(private prisma: PrismaService) {}

  async findForEmployee(employeeId: string, requestingUserId: string, role: string) {
    // Employees can only view their own payslips
    if (role === 'EMPLOYEE') {
      const emp = await this.prisma.employee.findUnique({ where: { id: employeeId } });
      const user = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
      if (emp.userId !== requestingUserId) throw new ForbiddenException('Access denied');
    }
    return this.prisma.payslip.findMany({
      where: { employeeId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { salaryRun: { select: { status: true } } },
    });
  }

  async findOne(id: string, requestingUserId: string, role: string) {
    const payslip = await this.prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: { include: { user: true } },
        salaryRun: true,
      },
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    if (role === 'EMPLOYEE' && payslip.employee.userId !== requestingUserId) {
      throw new ForbiddenException('Access denied');
    }

    const payment = await this.prisma.salaryPayment.findFirst({
      where: {
        salaryRunId: payslip.salaryRunId,
        employeeId: payslip.employeeId,
        status: 'SUCCESS',
      },
    });

    return { payslip, payment };
  }

  async generatePayslipPdf(payslip: any, payment: any) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));

    const generatedAt = payslip.generatedAt instanceof Date
      ? payslip.generatedAt
      : new Date(payslip.generatedAt);

    doc.fontSize(20).text('Payslip', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Period: ${MONTHS[payslip.month - 1]} ${payslip.year}`);
    doc.text(`Generated on: ${generatedAt.toLocaleDateString('en-IN')}`);
    doc.text(`Employee: ${payslip.employee.firstName} ${payslip.employee.lastName}`);
    doc.text(`Employee Code: ${payslip.employee.employeeCode}`);
    doc.moveDown();
    doc.fontSize(14).text('Salary Summary');
    doc.fontSize(12);

    if (payment) {
      doc.text(`Gross Salary: ₹${payment.grossSalary.toString()}`);
      doc.text(`Total Deductions: ₹${payment.totalDeductions.toString()}`);
      doc.text(`Net Salary: ₹${payment.netSalary.toString()}`);
      doc.text(`Payment Status: ${payment.status}`);
    } else {
      doc.text('Payment details are unavailable for this payslip.');
    }

    doc.end();

    return new Promise<Buffer>(resolve => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  findAll(orgId: string) {
    return this.prisma.payslip.findMany({
      where: { employee: { organizationId: orgId } },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
      orderBy: { generatedAt: 'desc' },
      take: 200,
    });
  }

  async generate(salaryRunId: string) {
    const run = await this.prisma.salaryRun.findUnique({
      where: { id: salaryRunId },
      include: { payments: { where: { status: 'SUCCESS' }, include: { employee: true } } },
    });
    const created = [];
    for (const payment of run.payments) {
      const payslip = await this.prisma.payslip.upsert({
        where: { id: `${salaryRunId}-${payment.employeeId}` },
        update: {},
        create: {
          id: `${salaryRunId}-${payment.employeeId}`,
          employeeId: payment.employeeId,
          salaryRunId,
          month: run.month,
          year: run.year,
        },
      });
      created.push(payslip);
    }
    return { generated: created.length, payslips: created };
  }
}
