import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = port === 465;

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port,
      secure,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.transporter.verify()
      .then(() => this.logger.log('SMTP connection successful'))
      .catch((err) => this.logger.error('SMTP connection failed', err));
  }

  async sendSalaryCreditEmail(to: string, data: {
    firstName: string; month: number | string; year: number;
    netSalary: number; grossSalary: number; deductions: number;
  }) {
    const html = `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#4f46e5;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:20px">₹ SalaryPay</h1>
          <p style="color:#c7d2fe;margin:4px 0 0">Salary Credit Notification</p>
        </div>
        <div style="padding:24px">
          <p style="color:#374151">Hi <strong>${data.firstName}</strong>,</p>
          <p style="color:#374151">Your salary for <strong>${data.month} ${data.year}</strong> has been credited.</p>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
            <table style="width:100%;font-size:14px">
              <tr><td style="color:#6b7280;padding:4px 0">Gross Salary</td><td style="text-align:right;font-weight:600">₹${Number(data.grossSalary).toLocaleString()}</td></tr>
              <tr><td style="color:#6b7280;padding:4px 0">Deductions</td><td style="text-align:right;color:#ef4444">-₹${Number(data.deductions).toLocaleString()}</td></tr>
              <tr style="border-top:1px solid #e5e7eb">
                <td style="padding:8px 0 4px;font-weight:600">Net Salary</td>
                <td style="text-align:right;font-weight:700;color:#4f46e5;font-size:16px">₹${Number(data.netSalary).toLocaleString()}</td>
              </tr>
            </table>
          </div>
          <p style="color:#6b7280;font-size:13px">Login to SalaryPay to view and download your payslip.</p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#9ca3af">
          This is an automated notification from SalaryPay. Do not reply.
        </div>
      </div>
    `;
    try {
      await this.transporter.sendMail({
        from: `"SalaryPay" <${process.env.SMTP_FROM || 'noreply@salarypay.com'}>`,
        to, subject: `Salary Credited — ${data.month} ${data.year}`, html,
      });
      this.logger.log(`Salary credit email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
    }
  }

  async sendPaymentFailureAlert(to: string, data: { firstName: string; reason: string; month: number | string; year: number }) {
    try {
      await this.transporter.sendMail({
        from: `"SalaryPay" <${process.env.SMTP_FROM || 'noreply@salarypay.com'}>`,
        to,
        subject: `Salary Payment Failed — ${data.month} ${data.year}`,
        html: `<p>Hi ${data.firstName}, your salary payment for ${data.month} ${data.year} failed.<br>Reason: ${data.reason}<br>Our team will retry shortly.</p>`,
      });
    } catch (err) {
      this.logger.error(`Failed to send failure alert to ${to}: ${err.message}`);
    }
  }

  async sendPasswordResetEmail(to: string, data: { firstName?: string; otp: string; ttlMinutes: number }) {
    const html = `<div style="font-family:sans-serif;max-width:500px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#4f46e5;padding:18px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:18px">SalaryPay</h1>
        <p style="color:#c7d2fe;margin:4px 0 0">Password Reset OTP</p>
      </div>
      <div style="padding:20px">
        <p style="color:#374151">Hi ${data.firstName || 'user'},</p>
        <p style="color:#374151">Use the following One Time Password (OTP) to reset your password. It will expire in ${data.ttlMinutes} minutes.</p>
        <div style="margin:18px 0;text-align:center">
          <span style="display:inline-block;padding:12px 18px;background:#f3f4f6;border-radius:8px;font-size:20px;letter-spacing:4px;font-weight:700;color:#111">${data.otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px">If you did not request this, ignore this email.</p>
      </div>
      <div style="background:#f9fafb;padding:12px;text-align:center;font-size:12px;color:#9ca3af">This is an automated message from SalaryPay. Do not reply.</div>
    </div>`;

    try {
      await this.transporter.sendMail({
        from: `"SalaryPay" <${process.env.SMTP_FROM || 'noreply@salarypay.com'}>`,
        to,
        subject: `Password Reset OTP`,
        html,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (err: any) {
      this.logger.error(`Failed to send password reset email to ${to}: ${err.message}`);
    }
  }
}
