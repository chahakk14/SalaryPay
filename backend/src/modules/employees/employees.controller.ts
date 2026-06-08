import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private svc: EmployeesService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER, Role.FINANCE_TEAM)
  @Get()
  findAll(@Request() req) { return this.svc.findAll(req.user.orgId); }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER, Role.FINANCE_TEAM)
  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER)
  @Post()
  create(@Request() req, @Body() body: any) { return this.svc.create(req.user.orgId, body); }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FINANCE_TEAM)
  @Put(':id/auto-pay-limit')
  setLimit(@Param('id') id: string, @Body() body: { limit: number }) {
    return this.svc.updateAutoPayLimit(id, body.limit);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER)
  @Delete(':id')
  deactivate(@Param('id') id: string) { return this.svc.deactivate(id); }
}
