import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { ClerkWebhookService } from '../services/clerk-webhook.service.js';

@ApiExcludeController()
@Controller({ path: 'webhooks', version: VERSION_NEUTRAL })
export class WebhookController {
  constructor(private readonly clerkWebhookService: ClerkWebhookService) {}

  @Post('clerk')
  @HttpCode(HttpStatus.OK)
  async handleClerkWebhook(
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ received: true }> {
    const event = this.clerkWebhookService.verifyAndParse(
      req.rawBody,
      req.headers,
    );
    await this.clerkWebhookService.handleEvent(event);

    return { received: true };
  }
}
