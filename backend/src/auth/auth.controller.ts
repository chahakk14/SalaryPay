import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Request() req, @Body() body: { oldPassword: string; newPassword: string }) {
    return this.auth.changePassword(req.user.userId, body.oldPassword, body.newPassword);
  }

  @Post('request-password-reset')
  requestPasswordReset(@Body() body: { email: string }) {
    return this.auth.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { email: string; otp: string; newPassword: string }) {
    return this.auth.resetPassword(body.email, body.otp, body.newPassword);
  }
}
