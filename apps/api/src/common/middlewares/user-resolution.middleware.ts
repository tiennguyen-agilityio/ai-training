import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { UserService } from '../../modules/user/services/user.service.js';
import { AuthProvider } from '../providers/auth.provider.js';
import { ItemNotFoundException } from '../exceptions/base.exception.js';

@Injectable()
export class UserResolutionMiddleware implements NestMiddleware {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly userService: UserService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const userId = this.authProvider.getSessionUserId(req);

    if (userId) {
      try {
        req.user = await this.userService.findByClerkId(userId);
      } catch (err) {
        if (!(err instanceof ItemNotFoundException)) {
          next(err as Error);
          return;
        }
      }
    }

    next();
  }
}
