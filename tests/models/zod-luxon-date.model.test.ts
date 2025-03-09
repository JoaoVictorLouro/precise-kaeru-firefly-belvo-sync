import { describe, expect, it } from 'bun:test';
import { LuxonDateTimeSchema } from '../../src/models/zod-luxon-date.model';
import { z } from 'zod';

describe('LuxonDateTimeSchema', () => {
  it('should create parse dates into a Luxon DateTime', () => {
    expect(LuxonDateTimeSchema.parse('2023-11-10').toObject()).toStrictEqual({
      day: 10,
      hour: 0,
      millisecond: 0,
      minute: 0,
      month: 11,
      second: 0,
      year: 2023,
    });
  });
  it('should create parse dates with time into a Luxon DateTime', () => {
    expect(LuxonDateTimeSchema.parse('2023-11-10T10:30:00.000+00:00').toObject()).toStrictEqual({
      day: 10,
      hour: 10,
      millisecond: 0,
      minute: 30,
      month: 11,
      second: 0,
      year: 2023,
    });
  });
  it('should support null', () => {
    expect(LuxonDateTimeSchema.nullable().parse(null)).toBe(null);
  });
  it('should support optional', () => {
    expect(z.object({ a: LuxonDateTimeSchema.nullable().optional() }).parse({})).toStrictEqual({});
  });
  it('should throw on bad value dates', () => {
    expect(() => LuxonDateTimeSchema.parse('2023-11-102').toObject()).toThrow();
  });
});
