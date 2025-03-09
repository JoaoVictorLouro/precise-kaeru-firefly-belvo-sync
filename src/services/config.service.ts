import { SyncConfig, SyncConfigSchema, SyncLinkConfig } from '../models/sync-config.model';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { DeepFrozen, deepFreeze } from '../utils/freeze';
import { raiseNil } from '../utils/raise';
import { EnvService } from './env.service';
import { cloneDeep } from 'lodash';
import { LogService } from './log.service';

export class ConfigService {
  private static _instance: ConfigService;
  private cachedConfig: DeepFrozen<SyncConfig> | null;
  private constructor() {
    this.cachedConfig = null;
  }

  static async getInstance(): Promise<ConfigService> {
    return this._instance || (this._instance = await new this().initialize());
  }

  async initialize(): Promise<ConfigService> {
    if (!existsSync(EnvService.instance.configFilePath)) {
      throw new Error(`Config file not found at "${EnvService.instance.configFilePath}"`);
    }
    const configFromFile = JSON.parse((await readFile(EnvService.instance.configFilePath)).toString());
    this.cachedConfig = deepFreeze(SyncConfigSchema.parse(configFromFile));
    return this;
  }

  async addBelvoLink(link: SyncLinkConfig) {
    const config = cloneDeep(raiseNil(this.cachedConfig, 'Config has not been initialized yet') as SyncConfig);
    config.belvo = config.belvo || { links: [] };
    config.belvo.links = (config.belvo.links || []).filter(r => r.link !== link.link);
    config.belvo.links.push(link);
    this.cachedConfig = deepFreeze(config);
    await writeFile(EnvService.instance.configFilePath, JSON.stringify(this.cachedConfig, undefined, 2));
    LogService.instance.log(`Added link ${link.nickname || link.link} - ${link.institution} to config`);
  }

  async removeBelvoLink(link: string) {
    const config = cloneDeep(raiseNil(this.cachedConfig, 'Config has not been initialized yet') as SyncConfig);
    config.belvo = config.belvo || { links: [] };
    config.belvo.links = (config.belvo.links || []).filter(r => r.link !== link);
    this.cachedConfig = deepFreeze(config);
    await writeFile(EnvService.instance.configFilePath, JSON.stringify(this.cachedConfig, undefined, 2));
    LogService.instance.log(`Removed link ${link} from the config`);
  }

  private get config() {
    return raiseNil(this.cachedConfig, 'Config has not been loaded yet');
  }

  get belvoKeyID() {
    return this.config.belvo.keyID;
  }

  get belvoKeySecret() {
    return this.config.belvo.keySecret;
  }

  get belvoApiAuthorizationHeader() {
    const authrStr = `${this.belvoKeyID}:${this.belvoKeySecret}`;
    return Buffer.from(authrStr).toString('base64');
  }

  get belvoWebhooksAuthorizationHeader() {
    return this.config.belvo.webhooksAuthorization;
  }

  get belvoLinks() {
    return this.config.belvo.links.filter(r => r.enabled !== false);
  }

  get fireflyAddress() {
    return this.config.firefly.apiAddress;
  }

  get fireflyApiKey() {
    return this.config.firefly.apiKey;
  }

  get transactionsWithinDays() {
    return this.config.transactionsWithinDays;
  }

  get dryRun() {
    return Boolean(this.config.dryRun);
  }
}
