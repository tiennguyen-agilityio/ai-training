import { Global, Module } from '@nestjs/common';
import { AuthProvider } from './auth.provider.js';
import { ClerkAuthProvider } from './clerk-auth.provider.js';

@Global()
@Module({
  providers: [{ provide: AuthProvider, useClass: ClerkAuthProvider }],
  exports: [AuthProvider],
})
export class AuthProviderModule {}
