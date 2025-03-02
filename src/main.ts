import {
  setupFastify,
  setupFastifyRoutes,
  startFastify,
} from '@/modules/fastify';
import { setupJobs } from '@/modules/jobs';
import { setupMetrics } from '@/modules/metrics';
import { setupMikroORM } from '@/modules/mikro';
import { setupRatelimits } from '@/modules/ratelimits';
import { scopedLogger } from '@/services/logger';

const log = scopedLogger('mw-backend');

let app: any; // Store Fastify instance globally


export default async function handler(req: any, res: any) {
  if (!app) {
    log.info("Initializing Fastify for Vercel...");
    await setupRatelimits();
    app = await setupFastify();
    await setupMikroORM();
    await setupMetrics(app);
    await setupFastifyRoutes(app);
  }

  return app.ready().then(() => app.server.emit('request', req, res));
}


async function bootstrap(): Promise<void> {
  log.info(`App booting...`, {
    evt: 'setup',
  });

  await setupRatelimits();
  const app = await setupFastify();
  await setupMikroORM();
  await setupMetrics(app);
  await setupJobs();

  await setupFastifyRoutes(app);
  await startFastify(app);

  log.info(`App setup, ready to accept connections`, {
    evt: 'success',
  });
  log.info(`--------------------------------------`);
}

bootstrap().catch((err) => {
  log.error(err, {
    evt: 'setup-error',
  });
  process.exit(1);
});
