import { longTextField, nameField, skuField } from './text.js';

describe('text fields', () => {
  it.each([
    ['nameField', nameField, 'ab', 'a'.repeat(120), 'a', 'a'.repeat(121)],
    ['skuField', skuField, 'a', 'a'.repeat(255), '', 'a'.repeat(256)],
  ])(
    '%s accepts its bounds and rejects one past them',
    (_name, field, min, max, tooShort, tooLong) => {
      expect(field.safeParse(min).success).toBe(true);
      expect(field.safeParse(max).success).toBe(true);
      expect(field.safeParse(tooShort).error?.issues[0]).toMatchObject({
        code: 'too_small',
        origin: 'string',
      });
      expect(field.safeParse(tooLong).error?.issues[0]).toMatchObject({
        code: 'too_big',
        origin: 'string',
      });
    },
  );

  it('longTextField needs 2 characters and has no maximum', () => {
    expect(longTextField.safeParse('ab').success).toBe(true);
    expect(longTextField.safeParse('a'.repeat(5000)).success).toBe(true);
    expect(longTextField.safeParse('a').error?.issues[0]).toMatchObject({
      code: 'too_small',
      origin: 'string',
    });
  });

  it("keeps Zod's default messages, which the API returns as description", () => {
    expect(nameField.safeParse('a').error?.issues[0].message).toBe(
      'Too small: expected string to have >=2 characters',
    );
    expect(skuField.safeParse('a'.repeat(256)).error?.issues[0].message).toBe(
      'Too big: expected string to have <=255 characters',
    );
  });
});
