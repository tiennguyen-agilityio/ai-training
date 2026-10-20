import { assignDefinedFields } from './object.util.js';

describe('assignDefinedFields', () => {
  it('assigns a defined value onto the target', () => {
    const target = { name: 'Espresso', price: 10 };

    assignDefinedFields(target, { name: 'Cold Brew' });

    expect(target).toEqual({ name: 'Cold Brew', price: 10 });
  });

  it('assigns null, clearing a nullable field', () => {
    const target: { description: string | null } = { description: 'Bold' };

    assignDefinedFields(target, { description: null });

    expect(target.description).toBeNull();
  });

  it('leaves a field untouched when the patch value is undefined', () => {
    const target = { name: 'Espresso', price: 10 };

    assignDefinedFields(target, { name: undefined, price: 12 });

    expect(target).toEqual({ name: 'Espresso', price: 12 });
  });
});
