import { z } from 'zod';
import { VALIDATION_RULES } from '@repo/constants';

const { NAME, SKU } = VALIDATION_RULES;

// Bare rules: no custom messages, so the API's description stays Zod's own.
export const nameField = z.string().min(NAME.MIN_LENGTH).max(NAME.MAX_LENGTH);

export const skuField = z.string().min(SKU.MIN_LENGTH).max(SKU.MAX_LENGTH);

// Product description, origin and processing method.
export const longTextField = z.string().min(NAME.MIN_LENGTH);
