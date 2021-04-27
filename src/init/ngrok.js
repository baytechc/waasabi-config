import fs from 'fs';
import ngrok from 'ngrok';

import setup, * as Setup from './setup.js';
import * as Multipass from './multipass.js';
import * as Mux from './backend-mux.js';

import YAML from 'yaml';

import { layout } from './content-formatter.js';


export async function connect() {
  const addr = `${setup.instance.ip}:80`;

  // Try loading the local ngrok.yml config file
  let ngrokYaml = {};
  try {
    const yamlContents = await fs.promises.readFile(new URL('../../ngrok.yml', import.meta.url));
    ngrokYaml = YAML.parse(yamlContents.toString());
  }
  catch (e) {
    console.log('error:', e);
  }

  const authtoken = ngrokYaml.authtoken || process.env.NGROK_AUTHTOKEN;
  const hostname = ngrokYaml.tunnels.waasabi.hostname || process.env.NGROK_HOST;

  // TODO: try connecting using special domains
  let config = { addr, authtoken };
  let url;
  if (authtoken) {
    layout(`Connecting using Ngrok authtoken.`);

    if (hostname) {
      config.hostname = hostname;

      if (hostname.includes('eu.ngrok.io')) config.region = 'eu';

      console.log(`Using custom host: ${config.hostname} (${config.region ?? 'us'})`);

    } else {
      config.subdomain = 'waasabi-dev';
      console.log(`Using custom subdomain: ${config.subdomain}.ngrok.io`);
    }

    try {
      // TODO: make subdomain customizable
      url = await ngrok.connect(config);
    }
    catch(e) {
      console.log('Failed connecting with a custom subdomain.');
      throw e;
    }

  }

  if (!url) {
    url = await ngrok.connect({ addr, authtoken });
  }

  // Ngrok config object
  if (!setup.ngrok) setup.ngrok = {};

  // If the Ngrok URL is the same (e.g. using a custom subdomain) as in
  // previous runs, no need to reconfigure incoming addresses, webhooks, etc.
  if (setup.ngrok.url === url) {
    layout(`Ngrok URL unchanged, skipped reconfiguring endpoints.`);
    return;
  }

  // TODO: create a separate "updateUrl" function?
  setup.ngrok.url = url;
  setup.backend.url = url+'/waasabi';
  setup.backend.gql = url.replace(/^http[s]?/,'wss')+'/graphql';
  setup.backend.adminUrl = setup.backend.url+'/admin';
  setup.backend.webhookUrl = setup.backend.url+'/event-manager/webhooks';

  layout(`
    The development server at *${addr}* is now accessible via:

    ${setup.backend.url}
  `);

  // TODO: move this to a separate Mux module?
  if (setup.backend.type == 'mux') {
    await Mux.webhookConfig();
  }

  await Multipass.configureBackend(
    setup.app_config,
    [
      [ 'BACKEND_URL', setup.backend.url ],
    ]
  );

}
