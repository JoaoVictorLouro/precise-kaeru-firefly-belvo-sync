import { createLogger, format, Logger, transports } from 'winston';
import { captureException, getCurrentScope, init } from '@sentry/node';
import { EnvService } from './env.service';
import { SyncLinkConfig } from '../models/sync-config.model';
import { ConfigService } from './config.service';
import { raiseNil } from '../utils/raise';
import { resolve } from 'path';

export class LogService {
  private static _instance: LogService;
  private _stream: { write: (message: string) => void };
  private constructor() {
    this._logger = null;
    this._stream = Object.freeze({
      write: (message: string) => {
        this.log(message);
      },
    });
  }

  private _logger: Logger | null;

  static get instance() {
    return raiseNil(this._instance, 'Logger was not initialized');
  }

  private get logger() {
    return raiseNil(this._logger, 'Logger transport not created');
  }

  static async initialize() {
    this._instance = new this();

    if (EnvService.instance.sentryDsn) {
      init({
        dsn: EnvService.instance.sentryDsn,
      });

      const { fireflyAddress } = await ConfigService.getInstance();

      const scope = getCurrentScope();
      scope.setExtra('firefly_address', fireflyAddress);
    }

    this._instance._logger = createLogger({
      level: 'info',
      format: format.combine(
        format.label(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.colorize(),
        format.printf(info => `[${info.level} ${info.timestamp}] ${info.message}`),
      ),
      defaultMeta: {},
      transports: [
        new transports.Console({}),
        new transports.File({
          filename: resolve(EnvService.instance.logFolder, 'error.log'),
          level: 'error',
        }),
        new transports.File({ filename: resolve(EnvService.instance.logFolder, 'combined.log') }),
      ],
    });

    return this._instance;
  }

  setScopeForLink(linkConfig: SyncLinkConfig) {
    getCurrentScope().setUser({
      id: linkConfig.link,
      username: linkConfig.institution,
      nickname: linkConfig.nickname,
    });
  }

  log(message: string) {
    this.logger.log('info', message);
  }

  warn(message: string) {
    this.logger.log('warn', message);
  }

  error(message: string | Error | unknown) {
    if (message instanceof Error) {
      this.logger.log('error', `An error was thrown: [${message.message}]`);
      this.logger.log('error', `Stack:\n${message.stack}`);
      if (EnvService.instance.sentryDsn) {
        captureException(message);
      }
    } else if (typeof message === 'string') {
      this.logger.log('error', message);
    } else {
      this.logger.log('error', message?.toString?.() || JSON.stringify(message));
    }
  }

  get stream() {
    return this._stream;
  }
}
