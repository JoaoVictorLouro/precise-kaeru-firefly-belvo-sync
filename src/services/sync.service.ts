import { DateTime } from 'luxon';
import { BelvoAccountTypeToFireflyAccountType } from '../models/belvo-account.model';
import { BelvoTransaction, BelvoTransactionType } from '../models/belvo-transaction.model';
import { FireflyAccount, FireflyAccountCreateRequest } from '../models/firefly-account.model';
import { FireflyTransactionAttributes, FireflyTransactionType } from '../models/firefly-transaction.model';
import { raiseNil } from '../utils/raise';
import { taggifyString } from '../utils/taggify';
import { BelvoService } from './belvo.service';
import { ConfigService } from './config.service';
import { FireflyService } from './firefly.service';
import { LogService } from './log.service';
import { HttpError } from '../utils/http-error';
import { inspect } from 'util';

export class SyncService {
  private static _instance: SyncService;
  private syncQueue: {
    linkId: string;
    startDate?: DateTime | null;
    endDate?: DateTime | null;
    callback: (err?: unknown) => void;
  }[];

  private isSyncing: boolean;

  private constructor() {
    this.syncQueue = [];
    this.isSyncing = false;
  }

  static get instance() {
    return this._instance || (this._instance = new this());
  }

  async syncLink(linkId: string, startDate?: DateTime | null, endDate?: DateTime | null): Promise<void> {
    return new Promise((resolve, reject) => {
      this.syncQueue.push({
        linkId,
        startDate,
        endDate,
        callback: err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        },
      });
      if (!this.isSyncing) {
        this.processQueue();
      }
    });
  }

  private async processLinkFromQueue(linkId: string, startDate?: DateTime | null, endDate?: DateTime | null): Promise<void> {
    const configService = await ConfigService.getInstance();
    const link = raiseNil(
      configService.belvoLinks.find(r => r.link === linkId),
      'Invalid link id, link not in the sync config',
    );

    const LOG_PREFIX = `[🔗 ${link.nickname || `${link.link} - ${link.institution}`}]`;
    LogService.instance.log(`${LOG_PREFIX} Syncing started`);

    const [fireflyAccounts, fireflyTransactionsBags] = await Promise.all([
      FireflyService.instance.getAccounts().then(r => r.data),
      FireflyService.instance.getTransactions(startDate, endDate),
    ]);

    const fireflyTransactions = fireflyTransactionsBags
      .map(r => {
        return r.attributes.transactions.map(t => ({
          attributes: t,
          id: r.id,
        }));
      })
      .flat();

    const fireflyAccountsMap = new Map<string, FireflyAccount>(
      fireflyAccounts
        .filter(r => Boolean(r.attributes.account_number))
        .map(r => {
          return [raiseNil(r.attributes.account_number, 'All accounts must have an account number'), r];
        }),
    );

    const belvoAccounts = await BelvoService.instance.getAccounts(link.link);

    await Promise.all(
      belvoAccounts.map(async belvoAccount => {
        if (!fireflyAccountsMap.has(belvoAccount.id)) {
          const nicknamePrefix = link.nickname ? `${link.nickname} - ` : '';
          const accountName = `${nicknamePrefix}${belvoAccount.name}`.trim();
          LogService.instance.log(`${LOG_PREFIX} Creating firefly account "${accountName}" (${belvoAccount.id})`);
          const body: FireflyAccountCreateRequest = {
            name: accountName,
            account_number: belvoAccount.id,
            active: true,
            currency_code: belvoAccount.currency || 'USD',
            opening_balance: belvoAccount.balance.current,
            opening_balance_date: belvoAccount.created_at,
            ...BelvoAccountTypeToFireflyAccountType(belvoAccount),
          };
          try {
            const fireflyAccount = await FireflyService.instance.createAccount(body);
            fireflyAccountsMap.set(belvoAccount.id, fireflyAccount.data);
            LogService.instance.log(`${LOG_PREFIX} Firefly account created successfully "${accountName}" (${belvoAccount.id})`);
          } catch (e) {
            LogService.instance.error('Failed to create firefly account');
            LogService.instance.error('Sent body: ');
            LogService.instance.error(inspect(body, true, 3));
            LogService.instance.error('Received error: ');
            LogService.instance.error(e);
            if (e instanceof HttpError) {
              LogService.instance.error('Response body: ');
              LogService.instance.error(e.responseBody);
            }
          }
        }

        const fireflyAccount = raiseNil(
          fireflyAccountsMap.get(belvoAccount.id),
          `There is no firefly account with the account_number: "${belvoAccount.id}"`,
        );

        const transactionsFromSyncPeriod = (await BelvoService.instance.getTransactions(link.link, startDate, endDate)).filter(
          t => t.type !== BelvoTransactionType.UNCATEGORIZED,
        );

        const transactionsMatched: { id: string; attributes: FireflyTransactionAttributes }[] = [];

        await Promise.all(
          transactionsFromSyncPeriod.map(async transaction => {
            try {
              if (belvoAccount.id !== transaction.account.id) {
                return;
              }

              const transactionLogDescription = this.getTransactionLogDescription(transaction);

              const transactionIdentificationFromDescription = `${transaction.description}+${transaction.type}+${transaction.amount}+${transaction.currency}+${transaction.value_date}`;

              const matchedTransaction = fireflyTransactions.find(r => {
                return (
                  r.attributes.external_id === transaction.internal_identification ||
                  r.attributes.external_id === transactionIdentificationFromDescription
                );
              });

              if (matchedTransaction) {
                transactionsMatched.push(matchedTransaction);

                LogService.instance.log(
                  `${LOG_PREFIX} Transaction ${transactionLogDescription}: already exists with different external id, updating values...`,
                );

                if (!configService.dryRun) {
                  await FireflyService.instance.updateTransaction(matchedTransaction.id, transaction.description, {
                    ...matchedTransaction.attributes,
                    amount: transaction.amount,
                    tags: Array.from(
                      new Set([
                        'belvo',
                        ...(matchedTransaction.attributes.tags || []).filter(r => !r.startsWith(taggifyString('belvo', ''))),
                        ...([transaction.category, transaction.subcategory].filter(Boolean) as string[]).map(r =>
                          taggifyString('belvo', r),
                        ),
                      ]),
                    ).sort(),
                  });
                }

                return;
              } else {
                LogService.instance.log(
                  `${LOG_PREFIX} Creating firefly transaction ${transactionLogDescription} - ${transaction.amount}${transaction.currency}`,
                );

                const notes = this.getMerchantDescripton(transaction.merchant);

                if (!configService.dryRun) {
                  await FireflyService.instance.createTransactions(transaction.description, [
                    {
                      description: transaction.description,
                      amount: transaction.amount,
                      currency_code: transaction.currency,
                      date: transaction.value_date,
                      external_id: transaction.internal_identification || transactionIdentificationFromDescription,
                      source_id: transaction.type === BelvoTransactionType.OUTFLOW ? fireflyAccount.id : null,
                      destination_id: transaction.type === BelvoTransactionType.INFLOW ? fireflyAccount.id : null,
                      type:
                        transaction.type === BelvoTransactionType.INFLOW
                          ? FireflyTransactionType.DEPOSIT
                          : FireflyTransactionType.WITHDRAWAL,
                      notes,
                      tags: [
                        'belvo',
                        ...([transaction.category, transaction.subcategory].filter(Boolean) as string[]).map(r =>
                          taggifyString('belvo', r),
                        ),
                      ].sort(),
                    },
                  ]);
                }

                LogService.instance.log(
                  `${LOG_PREFIX} Created firefly transaction ${transactionLogDescription} - ${transaction.amount}${transaction.currency} successfully!`,
                );
              }
            } catch (e) {
              LogService.instance.log(`${LOG_PREFIX} Failed to create firefly transaction`);
              LogService.instance.error(e);
            }
          }),
        );

        const fireflyTransactionsToDelete = fireflyTransactions.filter(r => !transactionsMatched.find(t => t.id === r.id));

        await Promise.all(
          fireflyTransactionsToDelete.map(async r => {
            if (!r.attributes.tags?.includes?.('belvo')) {
              return;
            }

            if (r.attributes.type === FireflyTransactionType.WITHDRAWAL) {
              if (r.attributes.source_id !== fireflyAccount.id) {
                return;
              }
            }

            if (r.attributes.type === FireflyTransactionType.DEPOSIT) {
              if (r.attributes.destination_id !== fireflyAccount.id) {
                return;
              }
            }

            const transactionDescription = `"${r.attributes.description}" - ${r.attributes.amount}${r.attributes.currency_code}`;
            try {
              LogService.instance.log(`${LOG_PREFIX} Deleting outdated firefly transaction ${r.id} [${transactionDescription}]`);
              if (!configService.dryRun) {
                await FireflyService.instance.deleteTransaction(r.id);
              }
              LogService.instance.log(`${LOG_PREFIX} Deleted ${r.id} [${transactionDescription}]`);
            } catch (e) {
              LogService.instance.log(`${LOG_PREFIX} Failed to delete firefly transaction ${r.id} [${transactionDescription}]`);
              LogService.instance.error(e);
            }
          }),
        );
      }),
    );

    LogService.instance.log(`${LOG_PREFIX} Syncing completed with success!`);
  }

  private async processQueue(): Promise<void> {
    if (this.syncQueue.length === 0) {
      this.isSyncing = false;
      return;
    }

    this.isSyncing = true;

    const { callback, linkId, endDate, startDate } = this.syncQueue.splice(0, 1)[0];

    try {
      await this.processLinkFromQueue(linkId, startDate, endDate);
      callback();
    } catch (e: unknown) {
      callback(e);
    } finally {
      this.isSyncing = this.syncQueue.length > 0;
      if (this.isSyncing) {
        this.processQueue();
      }
    }
  }

  getMerchantDescripton(merchant: BelvoTransaction['merchant']) {
    let notes = '';

    if (merchant) {
      if (merchant.merchant_name) {
        notes += `MERCHANT: ${merchant.merchant_name} \n`;
      }

      if (merchant.website) {
        notes += `WEBSITE: ${merchant.website} \n`;
      }
    }

    return notes;
  }

  getTransactionLogDescription(transaction: BelvoTransaction): string {
    const idPart = transaction.id.split('-')[0];
    const descriptionPart = transaction.description;

    return `"${idPart}... [${descriptionPart}]"`;
  }
}
