import setup, * as Setup from '../init/setup.js';
import { layout } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Select } = enquirer;


export default async function() {

  layout(`
    ## Deployment: PostgreSQL

    Please choose whether you'd like to deploy a database server with Waasabi. The database server is used by the Waasabi backend API (Strapi) and certain video streaming backends, such as Peertube.

    *Default:* Installs the PostgreSQL server and configures it for all services that need it.

    *Custom:* You can enter the configuration of a PostgreSQL server which you already have access to and Waasabi will use this database for the API and services.
  `);

  const selection = await (new Select({
    name: 'mode',
    message: 'How should the database be deployed?',
    choices: [
      { name: 'standalone', message: 'Default: Deploy standalone PostgreSQL service' },
      { name: 'custom', message: 'Custom: Use existing database/configuration' },
      { name: 'disable', message: 'Disable: Don\'t install PostgreSQL' },
    ]
  })).run();

  // Keep existing settings in 'custom' mode
  if (mode == custom) {
    setup.services.postgresql = Object.assign(
      setup.services.postgresql ?? {},
      { mode: selection }
    );

  // Reset settings in other modes
  } else {
    setup.services.postgresql = { mode: selection };

  }

  // TODO: selection===custom configure config
}
