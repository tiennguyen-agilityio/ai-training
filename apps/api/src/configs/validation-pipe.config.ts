import { StandardSchemaValidationPipe } from '@nestjs/common';
import { toErrorDetailsFromStandardSchemaIssues } from '../common/utils/validation-error.util.js';
import { ValidationException } from '../common/exceptions/base.exception.js';

export function createStandardSchemaValidationPipe(): StandardSchemaValidationPipe {
  return new StandardSchemaValidationPipe({
    exceptionFactory: (issues) =>
      new ValidationException(toErrorDetailsFromStandardSchemaIssues(issues)),
  });
}
