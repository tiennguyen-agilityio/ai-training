import { applyDecorators, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from './roles.decorator.js';
import { ApiErrorResponse } from './api-response.decorator.js';
import { UserRole } from '../enums/user.enum.js';
import { ERROR_MESSAGES } from '../constants/message.constant.js';

/**
 * Guards, roles, bearer auth and 401/403 docs for an admin-only route, in one
 * decorator. Route-specific error docs (400, 404, 409, ...) stay on the route.
 */
export const AdminOnly = (): MethodDecorator =>
  applyDecorators(
    UseGuards(AuthGuard, RolesGuard),
    Roles([UserRole.ADMIN]),
    ApiBearerAuth(),
    ApiErrorResponse(
      HttpStatus.UNAUTHORIZED,
      ERROR_MESSAGES.AUTH.UNAUTHENTICATED,
    ),
    ApiErrorResponse(HttpStatus.FORBIDDEN, ERROR_MESSAGES.AUTH.FORBIDDEN),
  );
