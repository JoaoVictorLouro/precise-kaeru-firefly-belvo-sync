import { config } from 'dotenv';
import { resolve } from 'path';
import { EnvConfig, EnvConfigSchema } from '../models/env-config.model';
import { raiseNil } from '../utils/raise';
import { deepFreeze } from '../utils/freeze';

export class EnvService {
  private static _instance: EnvService;

  private cachedConfig: EnvConfig | null;

  private constructor() {
    this.cachedConfig = null;
  }

  static get instance() {
    return this._instance || (this._instance = new this().initialize());
  }

  private initialize() {
    let overrides = {};
    try {
      overrides = config().parsed || {};
    } catch {
      console.warn('No .env file found, defaulting from environment variables');
    }
    this.cachedConfig = deepFreeze(
      EnvConfigSchema.parse({
        ...process.env,
        ...overrides,
      }),
    );
    return this;
  }

  private get config() {
    return raiseNil(this.cachedConfig, 'Config has not been loaded yet');
  }

  get sentryDsn() {
    return this.config.SENTRY_DSN;
  }

  get configFilePath() {
    return resolve(this.config.CONFIG_FILE);
  }

  get lockConfig() {
    return this.config.LOCK_CONFIG;
  }

  get appPort() {
    return this.config.APP_PORT;
  }

  get logFolder() {
    return this.config.LOG_FOLDER;
  }
}
