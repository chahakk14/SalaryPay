import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PayrollScheduler {
  private readonly logger = new Logger(PayrollScheduler.name);

  constructor(private prisma: PrismaService) {}

  // Runs at 9 AM on the last day of every month
  @Cron('0 9 28-31 * *')
  async checkLastDayOfMonth() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (tomorrow.getMonth() !== now.getMonth()) {
      this.logger.log('Last day of month - auto salary runs would trigger here');
      // Add auto-trigger logic per org if needed
    }
  }
}
