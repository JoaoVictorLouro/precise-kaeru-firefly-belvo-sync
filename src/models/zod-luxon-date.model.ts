import { DateTime } from 'luxon';
import { z } from 'zod';

export const LuxonDateTimeSchema = z
  .string()
  .refine(
    value => {
      return DateTime.fromISO(value).isValid;
    },
    value => ({ message: `Invalid date: "${value}", expected date in ISO format` }),
  )
  .transform(r => DateTime.fromISO(r));
