import setup, * as Setup from '../init/setup.js';
import { layout } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Select } = enquirer;

import deployNginx from './deployment-nginx.js';
import deployPostgreSQL from './deployment-postgresql.js';


export default async function() {
  layout(`
    # Choose a deployment configuration

    *Standalone:* Every required service needed by Waasabi will be installed and configured by Waasabi Init. This is the Default setting.

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
  setup.services.deploy = [];

  if (setup.deployment === 'standalone') {
    // Avoid duplicating entries
    setup.services.deploy.push('nginx');
    setup.services.deploy.push('postgresql');
  } else {
    await deployNginx();
    await deployPostgreSQL();
  }

  await Setup.persist();
}