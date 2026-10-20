import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WebhookController } from './webhook.controller.js';
import { ClerkWebhookService } from '../services/clerk-webhook.service.js';

import type { Mock } from 'vitest';
describe('WebhookController', () => {
  let controller: WebhookController;
  let clerkWebhookService: {
    verifyAndParse: Mock;
    handleEvent: Mock;
  };

  beforeEach(async () => {
    clerkWebhookService = {
      verifyAndParse: vi.fn(),
      handleEvent: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        { provide: ClerkWebhookService, useValue: clerkWebhookService },
      ],
    }).compile();

    controller = module.get(WebhookController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleClerkWebhook', () => {
    const rawBody = Buffer.from('{"type":"user.created"}');
    const headers = {
      'svix-id': 'msg-1',
      'svix-timestamp': '1700000000',
      'svix-signature': 'v1,abc',
    };
    const req = { rawBody, headers } as never;

    it('verifies then dispatches the event and returns { received: true }', async () => {
      const event = { type: 'user.created' };
      clerkWebhookService.verifyAndParse.mockReturnValue(event);
      clerkWebhookService.handleEvent.mockResolvedValue(undefined);

      const result = await controller.handleClerkWebhook(req);

      expect(clerkWebhookService.verifyAndParse).toHaveBeenCalledWith(
        rawBody,
        headers,
      );
      expect(clerkWebhookService.handleEvent).toHaveBeenCalledWith(event);
      expect(result).toEqual({ received: true });
    });

    it('propagates BadRequestException from verification without calling handleEvent', async () => {
      clerkWebhookService.verifyAndParse.mockImplementation(() => {
        throw new BadRequestException();
      });

      await expect(controller.handleClerkWebhook(req)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(clerkWebhookService.handleEvent).not.toHaveBeenCalled();
    });
  });
});
