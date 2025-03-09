import { Router } from 'express';
import { ConfigService } from '../services/config.service';
import { SyncService } from '../services/sync.service';
import { LogService } from '../services/log.service';
import { z } from 'zod';
import { LuxonDateTimeSchema } from '../models/zod-luxon-date.model';

export const WebhooksRouter: Router = Router();

const WebhooksBaseEventBody = z.object({
  webhook_type: z.string(),
  webhook_id: z.string(),
  webhook_code: z.string(),
  link_id: z.string(),
  data: z.object({
    first_transaction_date: LuxonDateTimeSchema.optional().nullable(),
    last_transaction_date: LuxonDateTimeSchema.optional().nullable(),
  }),
});

WebhooksRouter.post('/', async (req, res) => {
  const configService = await ConfigService.getInstance();
  const expectedAuthorization = configService.belvoWebhooksAuthorizationHeader;
  const receivedAuthorization = req.headers.authorization || '';

  if (expectedAuthorization !== receivedAuthorization) {
    res.status(403).send({ status: 'Invalid Authorization' });
    return;
  }

  try {
    const baseWebhookInfo = WebhooksBaseEventBody.parse(req.body);
    const processed = ['TRANSACTIONS', 'ACCOUNTS'].includes(baseWebhookInfo.webhook_type);
    if (processed) {
      const body = WebhooksBaseEventBody.parse(req.body);
      await SyncService.instance.syncLink(body.link_id, body.data.first_transaction_date, body.data.last_transaction_date);
    }
    res.status(200).send({ status: 'ok', processed });
  } catch (e) {
    LogService.instance.log('There was an error processing the webhook');
    LogService.instance.error(e);
    res.status(500).send({ status: 'error' });
  }
});
