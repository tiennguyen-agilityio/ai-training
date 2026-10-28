import { VALIDATION_MESSAGES } from './validation-messages.js';

describe('VALIDATION_MESSAGES', () => {
  it.each([
    [
      'isNotEmpty',
      VALIDATION_MESSAGES.isNotEmpty('Name'),
      'Name should not be empty',
    ],
    [
      'isInt',
      VALIDATION_MESSAGES.isInt('Quantity'),
      'Quantity must be an integer number',
    ],
    [
      'isNumber',
      VALIDATION_MESSAGES.isNumber('Price'),
      'Price must be a number conforming to the specified constraints',
    ],
    [
      'isBoolean',
      VALIDATION_MESSAGES.isBoolean('IsOrganic'),
      'IsOrganic must be a boolean value',
    ],
    [
      'isArray',
      VALIDATION_MESSAGES.isArray('Images'),
      'Images must be an array',
    ],
    ['isString', VALIDATION_MESSAGES.isString('Name'), 'Name must be a string'],
    [
      'isPositive',
      VALIDATION_MESSAGES.isPositive('Price'),
      'Price must be a positive number',
    ],
    [
      'min',
      VALIDATION_MESSAGES.min('Price', 1),
      'Price must not be less than 1',
    ],
    [
      'max',
      VALIDATION_MESSAGES.max('Price', 99999999.99),
      'Price must not be greater than 99999999.99',
    ],
    [
      'max with a bound the caller formatted',
      VALIDATION_MESSAGES.max('Price', '99,999,999.99'),
      'Price must not be greater than 99,999,999.99',
    ],
    [
      'min with a bound the caller formatted',
      VALIDATION_MESSAGES.min('Price', '1,000'),
      'Price must not be less than 1,000',
    ],
    [
      'minLength',
      VALIDATION_MESSAGES.minLength('Name', 2),
      'Name must be longer than or equal to 2 characters',
    ],
    [
      'maxLength',
      VALIDATION_MESSAGES.maxLength('Name', 120),
      'Name must be shorter than or equal to 120 characters',
    ],
    [
      'arrayMinSize',
      VALIDATION_MESSAGES.arrayMinSize('Images', 2),
      'Images must contain at least 2 elements',
    ],
    [
      'arrayMaxSize',
      VALIDATION_MESSAGES.arrayMaxSize('Images', 6),
      'Images must contain no more than 6 elements',
    ],
    [
      'isUuid',
      VALIDATION_MESSAGES.isUuid('CategoryId'),
      'CategoryId must be a UUID',
    ],
    ['isUrl', VALIDATION_MESSAGES.isUrl('Url'), 'Url must be a URL address'],
    [
      'invalidFormat',
      VALIDATION_MESSAGES.invalidFormat('Phone'),
      'Phone has an invalid format',
    ],
    [
      'isEnum',
      VALIDATION_MESSAGES.isEnum('Unit', ['KG', 'G']),
      'Unit must be one of the following values: KG, G',
    ],
  ])('%s reads as the API message', (_key, actual, expected) => {
    expect(actual).toBe(expected);
  });
});
