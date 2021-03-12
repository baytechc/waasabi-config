import fs from 'fs';
import ngrok from 'ngrok';

import enquirer from 'enquirer';

import setup, * as Setup from './setup.js';
import * as Multipass from './multipass.js';

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

  // TODO: try connecting using special domains
  let url;
  if (authtoken) {
    layout(`Connecting using Ngrok authtoken.`);

    try {
      // TODO: make subdomain customizable
      url = await ngrok.connect({ addr, authtoken, subdomain: 'waasabi-dev' });
    }
    catch(e) {
      console.log('Failed connecting with a custom subdomain.');
    }

  }

  if (!url) {
    url = await ngrok.connect({ addr, authtoken });
  }

  layout(`
    The development server at *${addr}* is now accessible via:
  
    ${url}
  `);

  // If the Ngrok URL is the same (e.g. using a custom subdomain) as in
  // previous runs, no need to reconfigure incoming addresses, webhooks, etc.
  if (setup.instance.ngrokUrl === url) {
    layout(`Ngrok URL unchanged, skipped reconfiguring endpoints.`);
    return;
  }

  // TODO: create a separate "updateUrl" function?
  setup.instance.ngrokUrl = url;
  setup.instance.backendUrl = url+'/waasabi';
  setup.instance.adminUrl = setup.instance.backendUrl+'/admin';
  setup.instance.webhookUrl = setup.instance.backendUrl+'/event-manager/webhooks';
  
  await Multipass.configureBackend(
    setup.app_config,
    [
      [ 'BACKEND_URL', setup.instance.backendUrl ],
    ]
  );

  // TODO: move this to a separate Mux module?
  if (setup.backend.type == 'mux') {
    await muxWebhookConfig();
  }
}

async function muxWebhookConfig(){
  layout(`
    ## Webhook configuration
    
    When using the Mux streaming backend, the Waasabi server needs to receive 'calls from Mux.com in the form of webhooks.
    We use a tool called Ngrok to make the local Waasabi instance accessible for Mux's servers, but you need to manually configure Mux.com's webhooks at:
    
    https://dashboard.mux.com/settings/webhooks

    You will need to point the webhooks to this URL:
    
    ${setup.instance.webhookUrl}

    Once the webhook is configured, you will receive a Signing Secret from Mux.
    This is used to ensure noone else can fake these webhook requests.
    Please copy-paste the provided signing secret here:
  `);

  setup.backend.webhook_secret = await (new enquirer.Password({
    name: 'backend.mux_webhook_secret',
    message: 'Webhook Secret',
    initial: setup.backend.webhook_secret
  })).run();

  // Update local backend config
  if (setup.instance.type == 'local') {
    await Multipass.configureBackend(
      setup.app_config,
      [
        [ 'MUX_WEBHOOK_SECRET', setup.backend.webhook_secret ]
      ]
    );
  }
}