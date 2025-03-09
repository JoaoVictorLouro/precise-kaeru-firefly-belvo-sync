import { z } from 'zod';

export const FireflyPaginationSchema = z.object({
  total: z.number(),
  count: z.number(),
  per_page: z.number(),
  current_page: z.number(),
  total_pages: z.number(),
});

export type FireflyPagination = z.infer<typeof FireflyPaginationSchema>;
