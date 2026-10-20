import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserStatus } from '../enums/user.enum.js';
import { ERROR_MESSAGES } from '../constants/message.constant.js';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    if (!req.user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.UNAUTHENTICATED);
    }

    if ((req.user.status as UserStatus) === UserStatus.INACTIVE) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.INACTIVE_ACCOUNT);
    }

    return true;
  }
}
