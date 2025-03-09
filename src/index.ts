import { LogService } from './services/log.service';
import { createApp } from './app';
import { AddressInfo } from 'ws';
import { startScheduler } from './scheduler/scheduler';

async function start() {
  await LogService.initialize();
  const listener = await createApp();
  LogService.instance.log(`Firefly Belvo Sync running on port ${(listener.address() as AddressInfo).port}`);
  const schedulerConfig = await startScheduler();
  LogService.instance.log(`Scheduler started, running every ${schedulerConfig.runInterval} minutes`);
}

start().catch(err => {
  console.error('There was an error in the application:');
  console.error(err);
});
