import { ConfigService } from '@nestjs/config';
import { createObserveModule, ObserveOptions } from '@nestjs/observe';
import { OBSERVE_SERVICE_ID } from '../common/constants/env.constant.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

export function observeConfig(configService: ConfigService): ObserveOptions {
  return {
    appKey: configService.get<string>('APP_KEY', ''),
    appSecret: configService.get<string>('APP_SECRET', ''),
    serviceId: OBSERVE_SERVICE_ID,
  };
}
