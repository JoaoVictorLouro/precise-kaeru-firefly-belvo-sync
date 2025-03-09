import { z } from 'zod';

export const EnvConfigSchema = z.object({
  SENTRY_DSN: z.string().optional().nullable(),
  CONFIG_FILE: z.string().optional().default('/config/config.json'),
  LOG_FOLDER: z.string().optional().default('./log'),
  LOCK_CONFIG: z
    .any()
    .optional()
    .transform(r => (r || '').toString().toUpperCase() === 'TRUE'),
  APP_PORT: z.coerce.number().optional().default(5000),
});

export type EnvConfig = z.infer<typeof EnvConfigSchema>;
