import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export function rateLimitConfig(
  configService: ConfigService,
): ThrottlerModuleOptions {
  return {
    throttlers: [
      {
        ttl: configService.getOrThrow<number>('THROTTLE_TTL'),
        limit: configService.getOrThrow<number>('THROTTLE_LIMIT'),
      },
    ],
    errorMessage: 'Too many requests, please try again later.',
  };
}
