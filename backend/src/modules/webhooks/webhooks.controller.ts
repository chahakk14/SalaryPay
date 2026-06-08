import { Controller, Post, Req, Res, Headers, HttpCode } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { Request, Response } from 'express';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private svc: WebhooksService) {}

  @Post('razorpay')
  @HttpCode(200)
  async handleRazorpay(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = JSON.stringify(req.body);
    if (!this.svc.verifySignature(rawBody, signature)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    await this.svc.handlePayoutEvent(req.body);
    return res.json({ status: 'ok' });
  }
}
