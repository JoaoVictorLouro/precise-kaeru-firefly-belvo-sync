import { z } from 'zod';
import { LuxonDateTimeSchema } from './zod-luxon-date.model';
import {
  FireflyAccountCreateRequest,
  FireflyAccountCreditCardType,
  FireflyAccountLiabilityDirection,
  FireflyAccountLiabilityType,
  FireflyAccountRole,
  FireflyAccountType,
} from './firefly-account.model';

export enum BelvoAccountCategory {
  CREDIT_CARD = 'CREDIT_CARD',
  CHECKING_ACCOUNT = 'CHECKING_ACCOUNT',
  SAVINGS_ACCOUNT = 'SAVINGS_ACCOUNT',
}

export enum BelvoAccountType {
  CREDIT_CARD_PHYSICAL = 'credit_card_physical',
}

export enum BelvoAccountBalanceType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
}

export const BelvoAccountSchema = z.object({
  id: z.string(),
  link: z.string(),
  institution: z.object({
    name: z.string(),
    type: z.string(),
  }),
  created_at: LuxonDateTimeSchema,
  collected_at: LuxonDateTimeSchema,
  internal_identification: z.string(),
  name: z.string(),
  number: z.string().optional().nullable(),
  agency: z.string().optional().nullable(),
  type: z.nativeEnum(BelvoAccountType).optional().nullable(),
  category: z.nativeEnum(BelvoAccountCategory),
  bank_product_id: z.string().optional().nullable(),
  public_identification_name: z.string(),
  public_identification_value: z.string(),
  currency: z.string(),
  balance: z.object({
    current: z.number(),
    available: z.number(),
  }),
  credit_data: z
    .object({
      collected_at: LuxonDateTimeSchema,
      credit_limit: z.number(),
      cutting_date: LuxonDateTimeSchema,
      next_payment_date: LuxonDateTimeSchema,
      minimum_payment: z.number().optional().nullable(),
      monthly_payment: z.object({}).optional().nullable(),
      no_interest_payment: z.object({}).optional().nullable(),
      last_payment_date: LuxonDateTimeSchema.optional().nullable(),
      last_period_balance: z.number().optional().nullable(),
      interest_rate: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),
  loan_data: z.object({}).optional().nullable(),
  last_accessed_at: LuxonDateTimeSchema.optional().nullable(),
  balance_type: z.nativeEnum(BelvoAccountBalanceType),
});

export type BelvoAccount = z.infer<typeof BelvoAccountSchema>;

export function BelvoAccountTypeToFireflyAccountType(
  belvoAccount: BelvoAccount,
): Pick<
  FireflyAccountCreateRequest,
  'account_role' | 'type' | 'credit_card_type' | 'monthly_payment_date' | 'interest' | 'liability_direction' | 'liability_type'
> {
  switch (belvoAccount.category) {
    case BelvoAccountCategory.CREDIT_CARD:
      return {
        account_role: FireflyAccountRole.CREDIT_CARD,
        type: FireflyAccountType.ASSET,
        credit_card_type: FireflyAccountCreditCardType.MONTHLY_FULL,
        monthly_payment_date: belvoAccount.credit_data?.next_payment_date,
        interest: belvoAccount.credit_data?.interest_rate || 0,
        liability_direction: FireflyAccountLiabilityDirection.CREDIT,
        liability_type: FireflyAccountLiabilityType.DEBT,
      };
    case BelvoAccountCategory.CHECKING_ACCOUNT:
      return {
        account_role: FireflyAccountRole.DEFAULT_ASSET,
        type: FireflyAccountType.ASSET,
      };
    case BelvoAccountCategory.SAVINGS_ACCOUNT:
      return {
        account_role: FireflyAccountRole.SAVING_ASSET,
        type: FireflyAccountType.ASSET,
      };
    default:
      throw new Error(`Unknown Belvo account category: ${belvoAccount.category}`);
  }
}
