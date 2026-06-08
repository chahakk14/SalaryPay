import { Controller, Get, Post, Param, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PayslipsService } from './payslips.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Payslips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payslips')
export class PayslipsController {
  constructor(private svc: PayslipsService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FINANCE_TEAM, Role.HR_MANAGER)
  @Get()
  findAll(@Request() req) { return this.svc.findAll(req.user.orgId); }

  // Employee can call this for their own employeeId; others get full access
  @Get('employee/:employeeId')
  findForEmployee(@Param('employeeId') id: string, @Request() req) {
    return this.svc.findForEmployee(id, req.user.userId, req.user.role);
  }

  @Get('download/:payslipId')
  async download(
    @Param('payslipId') id: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const { payslip, payment } = await this.svc.findOne(id, req.user.userId, req.user.role);
    const fileName = `payslip-${payslip.month}-${payslip.year}.pdf`;
    const pdfBuffer = await this.svc.generatePayslipPdf(payslip, payment);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FINANCE_TEAM)
  @Post('generate/:runId')
  generate(@Param('runId') id: string) { return this.svc.generate(id); }
}
