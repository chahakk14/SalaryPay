import { Injectable, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
    });
  }

  async createPayrollOrder(amount: number, salaryRunId: string) {
    try {
      const order = await this.razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `payroll_${salaryRunId.slice(0, 30)}`,
        notes: { salaryRunId, purpose: 'payroll_funding' },
      });
      this.logger.log(`Razorpay order created: ${order.id} for ₹${amount}`);
      return order;
    } catch (err) {
      this.logger.error(`Razorpay order creation failed: ${err.message}`);
      // Return a mock order for demo/test when Razorpay isn't configured
      return {
        id: `order_demo_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `payroll_${salaryRunId.slice(0, 30)}`,
        status: 'created',
        _demo: true,
      };
    }
  }

  verifyPayment(orderId: string, paymentId: string, signature: string): boolean {
    try {
      const body = `${orderId}|${paymentId}`;
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
        .update(body)
        .digest('hex');
      return expected === signature;
    } catch {
      return false;
    }
  }

  async simulateSalaryCredit(payment: any): Promise<{
    payoutId: string; status: string; utr: string;
  }> {
    // In production: replace with RazorpayX payout API call
    // const payout = await this.razorpay.payouts.create({ ... });
    this.logger.log(
      `[DEMO PAYOUT] ₹${payment.netSalary} → ${payment.employee?.firstName} ` +
      `${payment.employee?.lastName} | Bank: ${payment.employee?.bankName} ` +
      `| IFSC: ${payment.employee?.bankIfsc} | A/C: ${payment.employee?.bankAccountNo}`
    );
    await new Promise(r => setTimeout(r, 500));
    return {
      payoutId: `pout_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: 'SUCCESS',
      utr: `UTR${Date.now().toString().slice(-11)}`,
    };
  }

  getTestCards() {
    return {
      success: { number: '4111111111111111', cvv: '123', expiry: '12/26', name: 'Test Success' },
      failure: { number: '4000000000000002', cvv: '123', expiry: '12/26', name: 'Test Failure' },
      upi: 'success@razorpay',
      netbanking: 'Use any bank, any credentials in test mode',
    };
  }
}
