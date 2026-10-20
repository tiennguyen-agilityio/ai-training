import { ClerkAuthMiddleware } from './clerk-auth.middleware.js';
import { clerkMiddleware } from '@clerk/express';
import type { Mock } from 'vitest';

vi.mock('@clerk/express', () => ({
  clerkMiddleware: vi.fn(),
}));

describe('ClerkAuthMiddleware', () => {
  let configService: { getOrThrow: Mock };
  const handler = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (clerkMiddleware as Mock).mockReturnValue(handler);
    configService = {
      getOrThrow: vi.fn((key: string) => `${key}-value`),
    };
  });

  it('constructs clerkMiddleware with the publishable and secret keys from ConfigService', () => {
    new ClerkAuthMiddleware(configService as never);

    expect(configService.getOrThrow).toHaveBeenCalledWith(
      'CLERK_PUBLISHABLE_KEY',
    );
    expect(configService.getOrThrow).toHaveBeenCalledWith('CLERK_SECRET_KEY');
    expect(clerkMiddleware).toHaveBeenCalledWith({
      publishableKey: 'CLERK_PUBLISHABLE_KEY-value',
      secretKey: 'CLERK_SECRET_KEY-value',
    });
  });

  it('delegates use() to the constructed clerkMiddleware handler', () => {
    const middleware = new ClerkAuthMiddleware(configService as never);
    const req = {} as never;
    const res = {} as never;
    const next = vi.fn();

    middleware.use(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
  });
});
