import setup, * as Setup from '../init/setup.js';
import { layout, pause } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Select } = enquirer;

import deployNginx from './deployment-nginx.js';
import deployPostgreSQL from './deployment-postgresql.js';

import * as pgSettings from '../init/setup_postgresql.js';


export default async function() {
  layout(`
    # Choose a deployment configuration

    *Standalone:* Every required service needed by Waasabi will be installed and configured by the Waasabi installer. This is the Default setting.

    *Customize:* You can choose which services you want Waasabi Init to install, and also provide your own. This is useful if you already have a database, or reverse proxy etc. configured and you'd like Waasabi to use them.
  `);

  setup.deployment = await (new Select({
    name: 'mode',
    message: 'How should Waasabi be deployed?',
    choices: [
      { name: 'standalone', message: 'Standalone' },
      { name: 'custom', message: 'Customize' },
    ]
  })).run();

  // Services to automatically deploy
  if (setup.deployment === 'standalone') {
    setup.services.nginx = { mode: 'standard' };
    setup.services.postgresql = { mode: 'standard' };
  } else {
    await deployNginx();
    await deployPostgreSQL();
  }

  // Persist PostgreSQL configuration
  pgSettings.configure();

  await pause();
}