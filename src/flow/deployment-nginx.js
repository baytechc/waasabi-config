import setup, * as Setup from '../init/setup.js';
import { layout } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Select } = enquirer;


export default async function() {

  layout(`
    ## Deployment: Nginx

    Please choose whether you'd like to deploy a reverse-proxy webserver with Waasabi.

    *Default:* Installs the Nginx web server as a reverse proxy and deploys HTTPS (SSL) certificates for securely connecting to Waasabi's domain.

    *Manual:* Generates the waasabi.conf configuration file that you can use to manually configure a reverse-proxy server and HTTPS access for Waasabi.
  `);

  const selection = await (new Select({
    name: 'mode',
    message: 'How should the webserver be deployed?',
    choices: [
      { name: 'standalone', message: 'Default: Deploy standalone Nginx service' },
      { name: 'custom', message: 'Custom: Export configuration file for manual deployment' },
      { name: 'disable', message: 'Disable: Don\'t install Nginx' },
    ]
  })).run();

  setup.services.nginx = { mode: selection };
}
