import { z } from 'zod';
import { LuxonDateTimeSchema } from './zod-luxon-date.model';

export enum FireflyAccountType {
  ASSET = 'asset',
  CASH = 'cash',
  EXPENSE = 'expense',
  INITIAL_BALANCE = 'initial-balance',
  REVENUE = 'revenue',
}

export enum FireflyAccountRole {
  DEFAULT_ASSET = 'defaultAsset',
  SAVING_ASSET = 'savingAsset',
  SHARED_ASSET = 'sharedAsset',
  CREDIT_CARD = 'ccAsset',
  CASH = 'cashWalletAsset',
}

export enum FireflyAccountLiabilityType {
  LOAN = 'loan',
  DEBT = 'debt',
  MORTGAGE = 'mortgage',
}

export enum FireflyAccountCreditCardType {
  MONTHLY_FULL = 'monthlyFull',
}

export enum FireflyAccountLiabilityDirection {
  CREDIT = 'credit',
}

export enum FireflyAccountInterestPeriod {
  MONTHLY = 'monthly',
}

export const FireflyAccountAttributesSchema = z.object({
  created_at: LuxonDateTimeSchema,
  updated_at: LuxonDateTimeSchema,
  active: z.boolean(),
  order: z.number().optional().nullable(),
  name: z.string(),
  type: z.nativeEnum(FireflyAccountType),
  account_role: z.nativeEnum(FireflyAccountRole).optional().nullable(),
  currency_id: z.string(),
  currency_code: z.string(),
  currency_symbol: z.string(),
  currency_decimal_places: z.number(),
  current_balance: z.coerce.number(),
  current_balance_date: LuxonDateTimeSchema,
  iban: z.string().optional().nullable(),
  bic: z.string().optional().nullable(),
  account_number: z.string().optional().nullable(),
  opening_balance: z.coerce.number(),
  current_debt: z.coerce.number(),
  opening_balance_date: LuxonDateTimeSchema.optional().nullable(),
  virtual_balance: z.coerce.number(),
  include_net_worth: z.boolean(),
  credit_card_type: z.nativeEnum(FireflyAccountCreditCardType).optional().nullable(),
  monthly_payment_date: LuxonDateTimeSchema.optional().nullable(),
  liability_type: z.nativeEnum(FireflyAccountLiabilityType).optional().nullable(),
  liability_direction: z.nativeEnum(FireflyAccountLiabilityDirection).optional().nullable(),
  interest: z.number().optional().nullable(),
  interest_period: z.nativeEnum(FireflyAccountInterestPeriod).optional().nullable(),
  notes: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  zoom_level: z.number().optional().nullable(),
});

export const FireflyAccountSchema = z.object({
  type: z.literal('accounts'),
  id: z.string(),
  attributes: FireflyAccountAttributesSchema,
});

export type FireflyAccountAttributes = z.infer<typeof FireflyAccountAttributesSchema>;
export type FireflyAccount = z.infer<typeof FireflyAccountSchema>;

export type FireflyAccountCreateRequest = Pick<
  FireflyAccountAttributes,
  | 'name'
  | 'type'
  | 'account_number'
  | 'opening_balance'
  | 'opening_balance_date'
  | 'currency_code'
  | 'active'
  | 'account_role'
  | 'monthly_payment_date'
  | 'credit_card_type'
  | 'liability_type'
  | 'liability_direction'
  | 'interest'
  | 'interest_period'
>;
