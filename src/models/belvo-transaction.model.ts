import { z } from 'zod';
import { BelvoAccountSchema } from './belvo-account.model';
import { LuxonDateTimeSchema } from './zod-luxon-date.model';

export enum BelvoTransactionStatus {
  PROCESSED = 'PROCESSED',
}

export enum BelvoTransactionType {
  OUTFLOW = 'OUTFLOW',
  INFLOW = 'INFLOW',
  UNCATEGORIZED = 'UNCATEGORIZED',
}

export enum BelvoCreditCardBillStatus {
  OPEN = 'OPEN',
  PAID = 'PAID',
  CLOSED = 'CLOSED',
  FUTURE = 'FUTURE',
}

export const BelvoTransactionSchema = z.object({
  id: z.string(),
  account: BelvoAccountSchema,
  created_at: LuxonDateTimeSchema,
  category: z.string(),
  subcategory: z.string().optional().nullable(),
  merchant: z
    .object({
      merchant_name: z.string().optional().nullable(),
      logo: z.string().optional().nullable(),
      website: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  collected_at: LuxonDateTimeSchema,
  internal_identification: z.string().nullable(),
  value_date: LuxonDateTimeSchema,
  accounting_date: LuxonDateTimeSchema.optional().nullable(),
  amount: z.number(),
  currency: z.string(),
  reference: z.string().optional().nullable(),
  balance: z.object({}).optional().nullable(),
  status: z.nativeEnum(BelvoTransactionStatus),
  type: z.nativeEnum(BelvoTransactionType),
  description: z.string(),
  credit_card_data: z
    .object({
      collected_at: LuxonDateTimeSchema,
      bill_name: z.string(),
      previous_bill_total: z.coerce.number().optional().nullable(),
      bill_status: z.nativeEnum(BelvoCreditCardBillStatus),
      bill_amount: z.number(),
    })
    .optional()
    .nullable(),
});

export type BelvoTransaction = z.infer<typeof BelvoTransactionSchema>;
