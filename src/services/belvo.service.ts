import { z } from 'zod';
import { ConfigService } from './config.service';
import { DateTime } from 'luxon';
import { BelvoTransactionSchema } from '../models/belvo-transaction.model';
import { BelvoAccount, BelvoAccountSchema } from '../models/belvo-account.model';
import { HttpError } from '../utils/http-error';
import { LogService } from './log.service';
import { retryPromise } from '../utils/retry-promise';
import { raiseNil } from '../utils/raise';

export class BelvoService {
  private static _instance: BelvoService;
  private constructor() {}

  static get instance() {
    return this._instance || (this._instance = new this());
  }

  private async fetch<T extends z.Schema>(endpoint: string, method: string, responseSchema: T, body?: unknown): Promise<z.infer<T>> {
    const configService = await ConfigService.getInstance();
    const response = await fetch(`https://development.belvo.com/api/${endpoint}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${configService.belvoApiAuthorizationHeader}`,
      },
    });

    if (!response.ok) {
      const responseBody = await response.text();
      const error = new HttpError(`Request failed with status: ${response.status}`, response, responseBody);
      LogService.instance.error(error);
      LogService.instance.warn(`RESPONSE BODY:\n\t${responseBody}`);
      throw error;
    }

    const responseBody = await response.json();

    try {
      return responseSchema.parse(responseBody);
    } catch (e) {
      const error = new Error(`Attempted to parse response body, got:\n${JSON.stringify(responseBody, null, 2)}`);
      LogService.instance.error(e);
      throw error;
    }
  }

  async getAccounts(link: string): Promise<BelvoAccount[]> {
    return this.fetch('accounts/', 'POST', z.array(BelvoAccountSchema), { save_data: true, link });
  }

  async getTransactions(link: string, startDate?: DateTime | null, endDate?: DateTime | null) {
    const configService = await ConfigService.getInstance();
    startDate = startDate || DateTime.now().minus({ days: configService.transactionsWithinDays });
    endDate = endDate || DateTime.now();

    return retryPromise(() => {
      return this.fetch('transactions/', 'POST', z.array(BelvoTransactionSchema), {
        link,
        save_data: true,
        date_from: raiseNil(startDate).toFormat('yyyy-MM-dd'),
        date_to: raiseNil(endDate).toFormat('yyyy-MM-dd'),
      });
    });
  }
}
