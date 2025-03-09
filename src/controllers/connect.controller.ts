import { Router, RequestHandler } from 'express';
import path from 'path';
import Fs from 'fs/promises';
import Handlebars from 'handlebars';
import { ConfigService } from '../services/config.service';
import { EnvService } from '../services/env.service';
import { SyncLinkConfigSchema } from '../models/sync-config.model';
import { SyncService } from '../services/sync.service';

const ConfigLockMiddleware: RequestHandler = (_req, res, next) => {
  if (EnvService.instance.lockConfig) {
    res.status(403).send({ status: 'Forbidden', error: 'Config is locked' });
    return;
  }

  next();
};

export const ConnectRouter: Router = Router().use(ConfigLockMiddleware);

ConnectRouter.post('/add', async (req, res) => {
  const configService = await ConfigService.getInstance();
  const newLink = SyncLinkConfigSchema.parse(req.body);
  await configService.addBelvoLink(newLink);

  SyncService.instance.syncLink(newLink.link);

  res.send({
    status: 'ok',
    message: 'Link added successfully, sync started',
  });
});

ConnectRouter.get('/remove/:link', async (req, res) => {
  const configService = await ConfigService.getInstance();
  await configService.removeBelvoLink(req.params.link);

  res.redirect('/connect');
});

ConnectRouter.get('/', async (_req, res) => {
  const configService = await ConfigService.getInstance();

  const [token, templateContent] = await Promise.all([
    fetch('https://development.belvo.com/api/token', {
      body: JSON.stringify({
        id: configService.belvoKeyID,
        password: configService.belvoKeySecret,
        scopes: 'read_institutions,write_links,read_consents,write_consents,write_consent_callback,delete_consents',

        widget: {
          openfinance_feature: 'consent_link_creation',
          consent: {
            terms_and_conditions_url: 'https://www.belvo.com',
            permissions: ['REGISTER', 'ACCOUNTS', 'CREDIT_CARDS', 'CREDIT_OPERATIONS'],
            // Belvo requires some identification here, using example from docs
            identification_info: [
              {
                type: 'CPF',
                number: '76109277673',
                name: 'Ralph Bragg',
              },
            ],
          },
        },
      }),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(r => r.json() as Promise<{ access: string }>),

    Fs.readFile(path.resolve('./public/connect.html')),
  ]);

  const template = Handlebars.compile(templateContent.toString());
  const links = configService.belvoLinks;

  res.send(
    template({
      BELVO_ACCESS: token.access,
      links,
      hasLinks: links.length > 0,
    }),
  );
});
