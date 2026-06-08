import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  verifySignature(payload: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return expected === signature;
  }

  async handlePayoutEvent(event: any) {
    this.logger.log(`Webhook received: ${event.event}`);
    const payout = event.payload?.payout?.entity;
    if (!payout) return;

    const payoutId = payout.id;
    const payment = await this.prisma.salaryPayment.findFirst({ where: { razorpayPayoutId: payoutId } });
    if (!payment) { this.logger.warn(`No payment found for payout ${payoutId}`); return; }

    switch (event.event) {
      case 'payout.processed':
        await this.prisma.salaryPayment.update({
          where: { id: payment.id },
          data: { status: 'SUCCESS', processedAt: new Date() },
        });
        this.logger.log(`Payment ${payment.id} marked SUCCESS via webhook`);
        break;

      case 'payout.failed':
      case 'payout.reversed':
        await this.prisma.salaryPayment.update({
          where: { id: payment.id },
          data: { status: 'FAILED', failureReason: payout.failure_reason || 'Payout reversed by bank' },
        });
        this.logger.warn(`Payment ${payment.id} marked FAILED via webhook`);
        break;

      default:
        this.logger.log(`Unhandled event: ${event.event}`);
    }

    await this.prisma.auditLog.create({
      data: {
        userId: (await this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } }))!.id,
        action: `WEBHOOK_${event.event.toUpperCase().replace('.', '_')}`,
        entity: 'SalaryPayment',
        entityId: payment.id,
        newData: { payoutId, status: payout.status },
      },
    });
  }
}
