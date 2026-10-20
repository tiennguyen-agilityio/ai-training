import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module.js';
import { WebhookController } from './controllers/webhook.controller.js';
import { ClerkWebhookService } from './services/clerk-webhook.service.js';

@Module({
  imports: [UserModule],
  controllers: [WebhookController],
  providers: [ClerkWebhookService],
})
export class WebhookModule {}
