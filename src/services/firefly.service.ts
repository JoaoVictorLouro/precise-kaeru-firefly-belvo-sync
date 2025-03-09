import { z } from 'zod';
import { ConfigService } from './config.service';
import { FireflyPaginationSchema } from '../models/firefly-pagination.model';
import { FireflyAccountCreateRequest, FireflyAccountSchema } from '../models/firefly-account.model';
import { LogService } from './log.service';
import { HttpError } from '../utils/http-error';
import {
  FireflyTransactionAttributes,
  FireflyTransactionCreate,
  FireflyTransactionGroup,
  FireflyTransactionGroupSchema,
} from '../models/firefly-transaction.model';
import { DateTime } from 'luxon';

export class FireflyService {
  private constructor() {}

  private static _instance: FireflyService;

  static get instance() {
    return this._instance || (this._instance = new this());
  }

  private async fetch<T extends z.Schema>(endpoint: string, method: string, responseSchema: T, body?: unknown): Promise<z.infer<T>> {
    const configService = await ConfigService.getInstance();
    const response = await fetch(`${configService.fireflyAddress}/api/${endpoint}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${configService.fireflyApiKey}`,
      },
    });

    if (!response.ok) {
      const responseBody = await response.text();
      const error = new HttpError(`Request failed with status: ${response.status}`, response, responseBody);
      LogService.instance.error(error);
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

  getAccounts() {
    return this.fetch(
      'v1/accounts',
      'GET',
      z.object({
        data: z.array(FireflyAccountSchema),
        meta: z.object({
          pagination: FireflyPaginationSchema,
        }),
      }),
    );
  }

  createAccount(createRequest: FireflyAccountCreateRequest) {
    return this.fetch('v1/accounts', 'POST', z.object({ data: FireflyAccountSchema }), createRequest);
  }

  async getTransactions(startDate?: DateTime | null, endDate?: DateTime | null) {
    const transactions: FireflyTransactionGroup[] = [];
    let shouldContinue = true;
    let page = 1;
    do {
      const {
        data,
        meta: { pagination },
      } = await this.fetch(
        `v1/transactions?limit=50&page=${page}${startDate ? `&start=${startDate.toString()}` : ''}${
          endDate ? `&end=${endDate.toString()}` : ''
        }`,
        'GET',
        z.object({
          data: z.array(FireflyTransactionGroupSchema),
          meta: z.object({
            pagination: FireflyPaginationSchema,
          }),
        }),
      );
      page++;
      shouldContinue = pagination.current_page < pagination.total_pages;
      transactions.push(...data);
      if (data.length < 50) {
        break;
      }
    } while (shouldContinue);

    return transactions;
  }

  createTransactions(title: string, transactions: FireflyTransactionCreate[]) {
    return this.fetch(
      'v1/transactions',
      'POST',
      z.object({
        data: FireflyTransactionGroupSchema,
      }),
      {
        error_if_duplicate_hash: false,
        apply_rules: true,
        fire_webhooks: true,
        group_title: title,
        transactions,
      },
    );
  }

  updateTransaction(id: string, title: string, transaction: FireflyTransactionAttributes) {
    return this.fetch(
      `v1/transactions/${id}`,
      'PUT',
      z.object({
        data: FireflyTransactionGroupSchema,
      }),
      {
        error_if_duplicate_hash: false,
        apply_rules: true,
        fire_webhooks: true,
        group_title: title,
        transactions: [transaction],
      },
    );
  }

  deleteTransaction(id: string) {
    return this.fetch(`v1/transactions/${id}`, 'DELETE', z.any());
  }
}
