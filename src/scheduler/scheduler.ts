import { schedule } from 'node-cron';
import { LogService } from '../services/log.service';
import { ConfigService } from '../services/config.service';
import { SyncService } from '../services/sync.service';

export async function startScheduler() {
  const task = schedule(
    '*/30 * * * *',
    async () => {
      try {
        LogService.instance.log('Running Belvo Firefly Sync');

        const configService = await ConfigService.getInstance();
        const links = configService.belvoLinks;

        await Promise.all(
          links.map(link =>
            SyncService.instance.syncLink(link.link).catch(err => {
              LogService.instance.log(`[🔗 ${link.nickname || link.link} - ${link.institution}] Failed to sync!`);
              LogService.instance.error(err);
            }),
          ),
        );
      } catch (e) {
        LogService.instance.log('There was an error running the sync scheduler');
        LogService.instance.error(e);
      }
    },
    {
      runOnInit: false,
      recoverMissedExecutions: false,
      name: 'Belvo Firefly Sync Scheduler',
    },
  );

  setImmediate(() => {
    task.now();
  });

  return {
    runInterval: 30,
    task,
  };
}
