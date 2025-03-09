import { z } from 'zod';
import { LuxonDateTimeSchema } from './zod-luxon-date.model';

export enum FireflyTransactionType {
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
}

export const FireflyTransactionAttributesSchema = z.object({
  user: z.string(),
  transaction_journal_id: z.string(),
  type: z.nativeEnum(FireflyTransactionType),
  date: LuxonDateTimeSchema,
  order: z.number().optional().nullable(),
  currency_id: z.string(),
  currency_code: z.string(),
  currency_symbol: z.string(),
  currency_name: z.string(),
  currency_decimal_places: z.number(),
  foreign_currency_id: z.string().optional().nullable(),
  foreign_currency_code: z.string().optional().nullable(),
  foreign_currency_symbol: z.string().optional().nullable(),
  foreign_currency_decimal_places: z.number().optional().nullable(),
  amount: z.coerce.number(),
  foreign_amount: z.coerce.number(),
  description: z.string(),
  source_id: z.string(),
  source_name: z.string(),
  source_iban: z.string().optional().nullable(),
  source_type: z.string(),
  destination_id: z.string(),
  destination_name: z.string(),
  destination_iban: z.string().optional().nullable(),
  destination_type: z.string(),
  budget_id: z.string().optional().nullable(),
  budget_name: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  category_name: z.string().optional().nullable(),
  bill_id: z.string().optional().nullable(),
  bill_name: z.string().optional().nullable(),
  reconciled: z.boolean(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  internal_reference: z.string().optional().nullable(),
  external_id: z.string().optional().nullable(),
  external_url: z.string().optional().nullable(),
  original_source: z.string(),
  recurrence_id: z.number().optional().nullable(),
  recurrence_total: z.number().optional().nullable(),
  recurrence_count: z.number().optional().nullable(),
  bunq_payment_id: z.string().optional().nullable(),
  import_hash_v2: z.string(),
  sepa_cc: z.string().optional().nullable(),
  sepa_ct_op: z.string().optional().nullable(),
  sepa_ct_id: z.string().optional().nullable(),
  sepa_db: z.string().optional().nullable(),
  sepa_country: z.string().optional().nullable(),
  sepa_ep: z.string().optional().nullable(),
  sepa_ci: z.string().optional().nullable(),
  sepa_batch_id: z.string().optional().nullable(),
  interest_date: LuxonDateTimeSchema.optional().nullable(),
  book_date: LuxonDateTimeSchema.optional().nullable(),
  process_date: LuxonDateTimeSchema.optional().nullable(),
  due_date: LuxonDateTimeSchema.optional().nullable(),
  payment_date: LuxonDateTimeSchema.optional().nullable(),
  invoice_date: LuxonDateTimeSchema.optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  zoom_level: z.number().optional().nullable(),
  has_attachments: z.boolean(),
});

export type FireflyTransactionAttributes = z.infer<typeof FireflyTransactionAttributesSchema>;

export const FireflyTransactionGroupAttributesSchema = z.object({
  created_at: LuxonDateTimeSchema,
  updated_at: LuxonDateTimeSchema,
  user: z.string(),
  group_title: z.string().optional().nullable(),
  transactions: z.array(FireflyTransactionAttributesSchema),
});

export const FireflyTransactionCreateSchema = z.object({
  type: z.nativeEnum(FireflyTransactionType),
  date: LuxonDateTimeSchema,
  amount: z.number(),
  description: z.string(),
  currency_code: z.string(),
  source_id: z.string().optional().nullable(),
  destination_id: z.string().optional().nullable(),
  external_id: z.string(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
});

export type FireflyTransactionCreate = z.infer<typeof FireflyTransactionCreateSchema>;

export const FireflyTransactionGroupSchema = z.object({
  type: z.literal('transactions'),
  id: z.string(),
  attributes: FireflyTransactionGroupAttributesSchema,
});

export type FireflyTransactionGroup = z.infer<typeof FireflyTransactionGroupSchema>;

export type FireflyTransactionGroupAttributes = z.infer<typeof FireflyTransactionGroupAttributesSchema>;
