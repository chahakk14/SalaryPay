import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER)
  @Get()
  findAll(@Request() req) { return this.svc.findAll(req.user.orgId); }

  @Get('me')
  me(@Request() req) { return this.svc.findOne(req.user.userId); }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post()
  create(@Request() req, @Body() body: any) { return this.svc.create(req.user.orgId, body); }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }
}
