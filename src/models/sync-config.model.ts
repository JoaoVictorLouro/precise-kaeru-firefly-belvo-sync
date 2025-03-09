import { z } from 'zod';

export const SyncLinkConfigSchema = z.object({
  link: z.string(),
  institution: z.string(),
  nickname: z.string().optional().nullable(),
  enabled: z.boolean().optional().default(true),
});

export type SyncLinkConfig = z.infer<typeof SyncLinkConfigSchema>;

export const SyncConfigSchema = z.object({
  dryRun: z.boolean().optional().default(false),
  belvo: z.object({
    keyID: z.string(),
    keySecret: z.string(),
    webhooksAuthorization: z.string().optional().default(''),
    links: z.array(SyncLinkConfigSchema),
  }),
  firefly: z.object({
    apiAddress: z.string(),
    apiKey: z.string(),
  }),
  transactionsWithinDays: z.number().default(35),
});

export type SyncConfig = z.infer<typeof SyncConfigSchema>;
