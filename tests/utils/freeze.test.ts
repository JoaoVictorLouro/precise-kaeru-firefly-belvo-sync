import { describe, expect, it } from 'bun:test';
import { deepFreeze } from '../../src/utils/freeze';

describe('deepFreeze', () => {
  it('freeze objects and not allow modifications', () => {
    const obj = {
      a: 1,
      b: {
        value: 2,
        c: {
          value: 3,
        },
      },
    };

    // Using any to test the read only properties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const frozen = deepFreeze(obj) as any;

    expect(frozen).toStrictEqual(obj);

    expect(() => {
      frozen.a = 2;
    }).toThrow();

    expect(() => {
      frozen.b.value = 2;
    }).toThrow();

    expect(() => {
      frozen.b.c.value = 2;
    }).toThrow();
  });
});
