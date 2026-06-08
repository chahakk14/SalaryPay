import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PayrollProcessor } from './payroll.processor';
import { PayrollScheduler } from './payroll.scheduler';
import { RazorpayService } from './razorpay.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'payroll' })],
  controllers: [PayrollController],
  providers: [PayrollService, PayrollProcessor, PayrollScheduler, RazorpayService],
  exports: [RazorpayService],
})
export class PayrollModule {}
