import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SalaryService } from './salary.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Salary Structure')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('salary-structure')
export class SalaryController {
  constructor(private svc: SalaryService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER, Role.FINANCE_TEAM)
  @Get(':employeeId')
  findOne(@Param('employeeId') id: string) { return this.svc.findByEmployee(id); }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER)
  @Post(':employeeId')
  upsert(@Param('employeeId') id: string, @Body() body: any) { return this.svc.upsert(id, body); }
}
