import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('payroll')
export class PayrollProcessor {
  private readonly logger = new Logger(PayrollProcessor.name);

  constructor(
    private prisma: PrismaService,
    private razorpay: RazorpayService,
    private notifications: NotificationsService,
  ) {}

  @Process({ name: 'process-payment', concurrency: 5 })
  async handlePayment(job: Job) {
    const { paymentId } = job.data;
    this.logger.log(`Processing payment job: ${paymentId} (attempt ${job.attemptsMade + 1})`);

    try {
      const payment = await this.prisma.salaryPayment.findUnique({
        where: { id: paymentId },
        include: {
          employee: { include: { user: true } },
          salaryRun: true,
        },
      });

      if (!payment) {
        this.logger.warn(`Payment ${paymentId} not found. Skipping job.`);
        return;
      }
      if (!payment.employee) {
        throw new Error(`Employee data missing for payment ${paymentId}`);
      }

      await this.prisma.salaryPayment.update({
        where: { id: paymentId },
        data: { status: 'PROCESSING' },
      });

      // ── RazorpayX payout (demo simulation for academic project) ──
      // In production, replace simulateSalaryCredit() with real RazorpayX payout:
      // const payout = await razorpayClient.payouts.create({
      //   account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      //   fund_account_id: payment.employee.razorpayFundAccountId,
      //   amount: Math.round(payment.netSalary * 100),
      //   currency: 'INR',
      //   mode: payment.employee.upiId ? 'UPI' : 'NEFT',
      //   purpose: 'salary',
      //   queue_if_low_balance: true,
      //   reference_id: payment.id,
      //   narration: `Salary ${job.data.month}/${job.data.year}`,
      // });
      const result = await this.razorpay.simulateSalaryCredit(payment);

      await this.prisma.salaryPayment.update({
        where: { id: paymentId },
        data: {
          status: 'SUCCESS',
          razorpayPayoutId: result.payoutId,
          processedAt: new Date(),
        },
      });

      if (payment.employee.user?.email) {
        await this.notifications.sendSalaryCreditEmail(payment.employee.user.email, {
          firstName: payment.employee.firstName,
          month: payment.salaryRun.month,
          year: payment.salaryRun.year,
          netSalary: Number(payment.netSalary),
          grossSalary: Number(payment.grossSalary),
          deductions: Number(payment.totalDeductions),
        });
      } else {
        this.logger.warn(`Email not sent for payment ${paymentId}: missing employee user email`);
      }

      await this.updateSalaryRunStatusIfFinished(payment.salaryRunId);
      this.logger.log(`Payment ${paymentId} SUCCESS | UTR: ${result.utr}`);
    } catch (err) {
      const isFinal = job.attemptsMade >= 2;
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Payment ${paymentId} failed (attempt ${job.attemptsMade + 1}): ${errorMessage}`,
        errorStack,
      );

      await this.prisma.salaryPayment.update({
        where: { id: paymentId },
        data: {
          status: isFinal ? 'FAILED' : 'RETRYING',
          failureReason: errorMessage || 'Unknown error',
          retryCount: job.attemptsMade,
        },
      });

      if (isFinal) {
        const failedPayment = await this.prisma.salaryPayment.findUnique({
          where: { id: paymentId },
          include: {
            employee: { include: { user: true } },
            salaryRun: true,
          },
        });

        if (failedPayment?.employee?.user?.email && failedPayment.salaryRun) {
          await this.notifications.sendPaymentFailureAlert(failedPayment.employee.user.email, {
            firstName: failedPayment.employee.firstName,
            reason: errorMessage,
            month: failedPayment.salaryRun.month,
            year: failedPayment.salaryRun.year,
          });
        }

        if (failedPayment?.salaryRunId) await this.updateSalaryRunStatusIfFinished(failedPayment.salaryRunId);
      }
      throw err; // Re-throw so Bull handles retry with exponential backoff
    }
  }

  private async updateSalaryRunStatusIfFinished(runId: string) {
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
}
