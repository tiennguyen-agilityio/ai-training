// Keyed by the same errCode this project returns for each constraint.
// Consumed by validation-error.util.ts to describe a Standard Schema (Zod) issue.
export const VALIDATION_MESSAGES = {
  isNotEmpty: (label: string) => `${label} should not be empty`,
  isInt: (label: string) => `${label} must be an integer number`,
  isNumber: (label: string) =>
    `${label} must be a number conforming to the specified constraints`,
  isBoolean: (label: string) => `${label} must be a boolean value`,
  isArray: (label: string) => `${label} must be an array`,
  isString: (label: string) => `${label} must be a string`,
  isPositive: (label: string) => `${label} must be a positive number`,
  min: (label: string, minimum?: number | string) =>
    `${label} must not be less than ${minimum}`,
  minLength: (label: string, minimum?: number) =>
    `${label} must be longer than or equal to ${minimum} characters`,
  max: (label: string, maximum?: number | string) =>
    `${label} must not be greater than ${maximum}`,
  arrayMinSize: (label: string, minimum?: number) =>
    `${label} must contain at least ${minimum} elements`,
  arrayMaxSize: (label: string, maximum?: number) =>
    `${label} must contain no more than ${maximum} elements`,
  maxLength: (label: string, maximum?: number) =>
    `${label} must be shorter than or equal to ${maximum} characters`,
  isUuid: (label: string) => `${label} must be a UUID`,
  isUrl: (label: string) => `${label} must be a URL address`,
  invalidFormat: (label: string) => `${label} has an invalid format`,
  isEnum: (label: string, values: unknown[]) =>
    `${label} must be one of the following values: ${values.join(', ')}`,
} as const;
