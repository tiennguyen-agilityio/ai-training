import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient, getAuth, type ClerkClient } from '@clerk/express';
import type { IncomingHttpHeaders } from 'http';
import type { Request } from 'express';
import { Webhook, type WebhookRequiredHeaders } from 'svix';
import { AuthProvider, AuthWebhookEvent } from './auth.provider.js';
import { ERROR_MESSAGES } from '../constants/message.constant.js';
import { UserRole, UserStatus } from '../enums/user.enum.js';

function requiredHeader(
  headers: IncomingHttpHeaders,
  name: keyof WebhookRequiredHeaders,
): string {
  const value = headers[name];
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

@Injectable()
export class ClerkAuthProvider implements AuthProvider {
  private readonly clerkClient: ClerkClient;
  private readonly verifier: Webhook;

  constructor(configService: ConfigService) {
    this.clerkClient = createClerkClient({
      secretKey: configService.getOrThrow<string>('CLERK_SECRET_KEY'),
    });
    this.verifier = new Webhook(
      configService.getOrThrow<string>('CLERK_WEBHOOK_SECRET'),
    );
  }

  verifyWebhook(
    rawBody: Buffer | undefined,
    headers: IncomingHttpHeaders,
  ): AuthWebhookEvent {
    if (!rawBody) {
      throw new BadRequestException(ERROR_MESSAGES.WEBHOOK.INVALID_SIGNATURE);
    }

    const svixHeaders: WebhookRequiredHeaders = {
      'svix-id': requiredHeader(headers, 'svix-id'),
      'svix-timestamp': requiredHeader(headers, 'svix-timestamp'),
      'svix-signature': requiredHeader(headers, 'svix-signature'),
    };

    try {
      return this.verifier.verify(rawBody, svixHeaders) as AuthWebhookEvent;
    } catch {
      throw new BadRequestException(ERROR_MESSAGES.WEBHOOK.INVALID_SIGNATURE);
    }
  }

  async syncUserRole(providerId: string, role: UserRole): Promise<void> {
    await this.clerkClient.users.updateUserMetadata(providerId, {
      publicMetadata: { role },
    });
  }

  async syncUserStatus(providerId: string, status: UserStatus): Promise<void> {
    if (status === UserStatus.INACTIVE) {
      await this.clerkClient.users.banUser(providerId);
      return;
    }

    // A user may be blocked in Clerk by either ban or lock, and the webhook maps both to
    // INACTIVE, so re-activating has to clear both.
    await this.clerkClient.users.unbanUser(providerId);
    await this.clerkClient.users.unlockUser(providerId);
  }

  getSessionUserId(req: Request): string | null {
    return getAuth(req).userId ?? null;
  }
}
