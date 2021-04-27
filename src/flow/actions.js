import setup, * as Setup from '../init/setup.js';
import { layout } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Select } = enquirer;


export default async function() {

  layout(`##  Start Waasabi initialization

    *Launch* - Create a new server instance on your local machine to test-drive the Waasabi configuration. This option needs you to have the \`multipass\` tool installed.

    *Export* - Generate configuration files that will let you deploy this Waasabi instance on any server you would like.

    *Review* - Display current configuration.
    \`Warning: this will display sensitive information on the screen, such as passwords and access tokens in plaintext!\`
  `);

  let mode;
  do {
    mode = await (new Select({
      name: 'mode',
      message: 'What would you like to do?',
      choices: [
        { name: 'launch', message: 'Launch locally using Multipass' },
        { name: 'export', message: 'Export configuration' },
        { name: 'review', message: 'Review configuration'},
        { name: 'exit', message: 'Exit' },
      ]
    })).run();

    if (mode === 'review') console.log(setup);
  } while (mode === 'review');

  return mode;
}
