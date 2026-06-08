import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { NotificationsService } from '../modules/notifications/notifications.service';

@Injectable()
export class AuthService {
  private redis: Redis;
  private readonly otpTtlSeconds = 60 * 10; // 10 minutes

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private notifications: NotificationsService,
  ) {
    this.redis = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379', 10) });
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { organization: true, employee: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role, orgId: user.organizationId };
    return {
      access_token: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
        employeeId: user.employee?.id,
      },
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Old password is incorrect');
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return { message: 'Password updated successfully' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, include: { employee: true } });
    if (!user || !user.isActive) throw new BadRequestException('Email not registered');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(otp, 10);
    const key = `pwdreset:${user.id}`;
    await this.redis.set(key, hash, 'EX', this.otpTtlSeconds);

    try {
      await this.notifications.sendPasswordResetEmail(user.email, { firstName: user.employee?.firstName, otp, ttlMinutes: Math.floor(this.otpTtlSeconds / 60) });
    } catch (err) {
      // Log but do not fail the request
      console.error('Failed to send OTP email', err);
    }

    return { success: true };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, include: { employee: true } });
    if (!user) throw new BadRequestException('Invalid email or OTP');

    const key = `pwdreset:${user.id}`;
    const storedHash = await this.redis.get(key);
    if (!storedHash) throw new BadRequestException('OTP expired or invalid');

    const valid = await bcrypt.compare(otp, storedHash);
    if (!valid) throw new BadRequestException('OTP expired or invalid');

    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
    await this.redis.del(key);
    return { success: true };
  }
}
