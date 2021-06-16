import { layout, clear, pause } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Select } = enquirer;

import { configChange } from './config.js';

import dumpConfig from './dump-config.js';
import exportConfig from './export-config.js';

import { launchInVM } from './launch-vm.js';

const actions = {
  'help': actionsHelp,

  'dump-config': dumpConfig,
  'change-config': configChange,
  'export-config': exportConfig,

  'launch-vm': launchInVM,
};


export default async function() {
  let selection;

  do {
    clear();

    layout(`##  Deploy Waasabi

      Please choose how would you like to proceed with the configuration.
      You may review and change the configuration, as well as export it to create cloud services or test-drive it on your local machine.

      Choose the *More information about these options* menu item to learn more about the various options.
    `);

    selection = await (new Select({
      name: 'selection',
      message: 'What would you like to do?',
      choices: [
        { name: 'launch-vm', message: 'Launch in a VM or container' },
        { name: 'launch', message: 'Install & start on this machine' },
        { name: 'dump-config', message: 'Review configuration'},
        { name: 'change-config', message: 'Change configuration'},
        { name: 'export-config', message: 'Export configuration' },
        { name: 'deploy', message: 'Publish on: [not configured]' },
        { name: 'develop', message: 'Develop Waasabi components' },
        { name: 'help', message: 'More information about these options' },
        { name: 'exit', message: 'Exit' },
      ]
    })).run();

    if (selection in actions) {
      await actions[selection]();

    } else if (selection !== 'exit') {
      layout(`
      
      *Sorry, this feature is not available yet!*
      
      `);
      await pause();
    } else {
      break;

    }

  } while (1);

  return selection;
}

async function actionsHelp() {
  layout(`##  Deploy Waasabi

  *Launch in a VM* - Create a new server instance on your local machine to test-drive the Waasabi configuration. This option requires that you to have a supported virtualization tool installed.

  *Install & start* - On a supported operating system you can install and start up Waasabi as a local service. Currently only Ubuntu Focal (20.04 LTS) is supported.

  Note: please run the installer with \`sudo\` privileges so the required services could be installed.

  *Review config.* - Display the current configuration.  

  Warning: this may display sensitive information on the screen, such as passwords and access tokens in plaintext!

  *Change config.* - Change configuration.

  *Export config.* - Generate configuration files that will let you deploy this Waasabi instance on any server you would like.

  *Publish on…* - \`[coming soon]\` Configure a server or cloud provider to directly publish the Waasabi instance on. This feature is not yet available in the current installer version.

  *Develop Waasabi* - \`[coming soon]\` Develop Waasabi components or work on custom branding and see the changes instantly reflected on an instance running in a virtual machine.
`);

  await pause();
}
