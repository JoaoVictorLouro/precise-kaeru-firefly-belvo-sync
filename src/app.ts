import express, { Express } from 'express';
import morgan from 'morgan';
import { AppRouter } from './controllers/controllers';
import { LogService } from './services/log.service';
import { EnvService } from './services/env.service';

export async function createApp() {
  const app = express();

  app.use(express.json());
  app.use(AppRouter);
  app.use(morgan('combined', { stream: LogService.instance.stream }));

  return new Promise<ReturnType<Express['listen']>>((resolve, reject) => {
    try {
      const listener = app.listen(EnvService.instance.appPort, () => {
        resolve(listener);
      });
    } catch (error) {
      reject(error);
    }
  });
}
