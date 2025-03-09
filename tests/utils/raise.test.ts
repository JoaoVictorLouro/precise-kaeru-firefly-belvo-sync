import { describe, expect, it } from 'bun:test';
import { raiseNil } from '../../src/utils/raise';

describe('raiseNil', () => {
  it('should raise exceptions when value is undefined', () => {
    expect(() => {
      raiseNil(undefined);
    }).toThrow();
  });
  it('should raise exceptions when value is null', () => {
    expect(() => {
      raiseNil(null);
    }).toThrow();
  });
  it('should not raise exceptions when value is truthy', () => {
    raiseNil({ a: 1 });
  });
  it('should raise exceptions with optional error message', () => {
    expect(() => {
      raiseNil(null, 'This is a custom error message');
    }).toThrow('This is a custom error message');
  });
});
