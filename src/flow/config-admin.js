import setup, * as Setup from '../init/setup.js';
import { layout } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Input, Password, Toggle, Select } = enquirer;


export default async function() {
  layout(`
    ## Administrator access

    Please enter an e-mail address you would like to use for the administrator login.
    You will also receive important information from Let's Encrypt and other services at this address.

    Note: the e-mail address will not be publicly displayed anywhere.
  `);
  setup.admin_email = await (new Input({
    name: 'admin_email',
    message: 'Admin email',
    initial: setup.admin_email ?? 'webmaster@'+setup.domain
  })).run();

  layout(`
    Please provide a unique, secure password for accessing the server and administrative interfaces:
  `);
  setup.admin_password = await (new Password({
    name: 'admin_password',
    message: 'Admin password',
    initial: setup.admin_password ?? ''
  })).run();

  setup.ssh = await (new Toggle({
    message: 'Configure SSH access?',
    initial: setup.ssh ?? true,
  })).run();

  if (setup.ssh) {
    setup.ssh = {};
    setup.ssh.access = await (new Select({
      name: 'ssh_access',
      message: 'Configure SSH:',
      choices: [
        { name: 'choose', message: 'Choose existing SSH key' },
        { name: 'new', message: 'Generate new SSH key' },
        { name: '-', message: 'Skip' }
      ]
    })).run();
  }
}
