import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { clerkMiddleware } from '@clerk/express';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class ClerkAuthMiddleware implements NestMiddleware {
  private readonly handler: ReturnType<typeof clerkMiddleware>;

  constructor(configService: ConfigService) {
    this.handler = clerkMiddleware({
      publishableKey: configService.getOrThrow<string>('CLERK_PUBLISHABLE_KEY'),
      secretKey: configService.getOrThrow<string>('CLERK_SECRET_KEY'),
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    this.handler(req, res, next);
  }
}
