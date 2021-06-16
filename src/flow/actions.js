import setup, * as Setup from '../init/setup.js';
import { layout } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Select } = enquirer;

import { configChange } from './config.js';


export default async function() {

  layout(`##  Start Waasabi initialization

    *Launch* - Create a new server instance on your local machine to test-drive the Waasabi configuration. This option needs you to have a supported virtualization tool installed.

    *Review* - Display current configuration.
    \`Warning: this will display sensitive information on the screen, such as passwords and access tokens in plaintext!\`

    *Change* - Change configuration.

    *Deploy* - Generate configuration files that will let you deploy this Waasabi instance on any server you would like.

    *Publish* - [coming soon] Configure a server or cloud provider to directly publish the Waasabi instance on. This feature is not yet available in the current installer version.
  `);

  let mode;
  do {
    mode = await (new Select({
      name: 'mode',
      message: 'What would you like to do?',
      choices: [
        { name: 'launch', message: 'Launch in a local VM/container' },
        { name: 'review', message: 'Review configuration'},
        { name: 'change', message: 'Change configuration'},
        { name: 'deploy', message: 'Deploy configuration' },
        { name: 'deploy', message: 'Publish on: [not configured]' },
        { name: 'exit', message: 'Exit' },
      ]
    })).run();

    if (mode === 'launch') return mode;

    if (mode === 'change') {
      await configChange();
      continue;
    }

    if (mode === 'deploy') {
      console.log('Coming soon...');
      continue;
    }

    if (mode === 'review') {
      console.log(setup);
    }
  } while (mode !== 'exit');

  return mode;
}
