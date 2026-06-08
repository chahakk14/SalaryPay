import {
  Controller, Get, Post, Param, Body, UseGuards, Request, BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { RazorpayService } from './razorpay.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payroll')
export class PayrollController {
  constructor(
    private svc: PayrollService,
    private razorpay: RazorpayService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FINANCE_TEAM)
  @Get('runs')
  findAll(@Request() req) { return this.svc.findAll(req.user.orgId); }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FINANCE_TEAM)
  @Get('runs/:id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FINANCE_TEAM)
  @Post('runs')
  create(@Request() req, @Body() body: { month: number; year: number }) {
    return this.svc.createSalaryRun(req.user.orgId, body.month, body.year);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FINANCE_TEAM)
  @Post('runs/:id/approve')
  approve(@Param('id') id: string, @Request() req) {
    return this.svc.approveSalaryRun(id, req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post('runs/:id/execute')
  execute(@Param('id') id: string) { return this.svc.executeSalaryRun(id); }

  // ── Razorpay: create payment order for payroll funding ──
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FINANCE_TEAM)
  @Post('runs/:id/create-order')
  async createOrder(@Param('id') id: string) {
    const run = await this.svc.findOne(id);
    if (!run) throw new BadRequestException('Salary run not found');
    if (run.status !== 'DRAFT' && run.status !== 'APPROVED') {
      throw new BadRequestException('Order can only be created for DRAFT or APPROVED runs');
    }
    return this.razorpay.createPayrollOrder(Number(run.totalAmount), run.id);
  }

  // ── Razorpay: verify payment and auto-approve the run ──
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FINANCE_TEAM)
  @Post('runs/:id/verify-payment')
  async verifyPayment(
    @Param('id') id: string,
    @Request() req,
    @Body() body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      demo?: boolean;
    },
  ) {
    // Allow demo mode (no real keys configured)
    const isDemo = body.demo || body.razorpay_order_id?.startsWith('order_demo_');
    if (!isDemo) {
      const valid = this.razorpay.verifyPayment(
        body.razorpay_order_id,
        body.razorpay_payment_id,
        body.razorpay_signature,
      );
      if (!valid) throw new BadRequestException('Payment signature verification failed');
    }
    await this.svc.approveSalaryRun(id, req.user.userId);
    return {
      success: true,
      message: isDemo
        ? 'Demo payment accepted — payroll approved'
        : 'Payment verified — payroll approved and ready to execute',
      paymentId: body.razorpay_payment_id || `demo_${Date.now()}`,
    };
  }

  // ── Test card info for academic demo ──
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FINANCE_TEAM)
  @Get('test-cards')
  getTestCards() { return this.razorpay.getTestCards(); }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FINANCE_TEAM)
  @Get('history')
  history(@Request() req) { return this.svc.getPaymentHistory(req.user.orgId); }
}
