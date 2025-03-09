import { Router } from 'express';
import { ConnectRouter } from './connect.controller';
import { WebhooksRouter } from './webhooks.controller';
export const AppRouter: Router = Router();

AppRouter.use('/connect', ConnectRouter);
AppRouter.use('/webhooks', WebhooksRouter);
