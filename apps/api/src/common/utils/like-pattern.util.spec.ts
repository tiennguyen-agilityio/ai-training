import { escapeLikePattern } from './like-pattern.util.js';

describe('escapeLikePattern', () => {
  it('leaves text without LIKE special characters unchanged', () => {
    expect(escapeLikePattern('Espresso')).toBe('Espresso');
  });

  it('escapes the % wildcard', () => {
    expect(escapeLikePattern('50%')).toBe('50\\%');
  });

  it('escapes the _ wildcard', () => {
    expect(escapeLikePattern('cold_brew')).toBe('cold\\_brew');
  });

  it('escapes the backslash escape character', () => {
    expect(escapeLikePattern('C:\\beans')).toBe('C:\\\\beans');
  });

  it('escapes a backslash before a wildcard without unescaping the wildcard', () => {
    expect(escapeLikePattern('\\%')).toBe('\\\\\\%');
  });
});
