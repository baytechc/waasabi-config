import enquirer from 'enquirer';

import setup, * as Setup from './setup.js';
import { layout } from './content-formatter.js';

import * as Multipass from './multipass.js';


export async function webhookConfig(){
  layout(`
    ## Webhook configuration
    
    When using the Mux streaming backend, the Waasabi server needs to receive 'calls from Mux.com in the form of webhooks.
    We use a tool called Ngrok to make the local Waasabi instance accessible for Mux's servers, but you need to manually configure Mux.com's webhooks at:
    
    https://dashboard.mux.com/settings/webhooks

    You will need to point the webhooks to this URL:
    
    ${setup.backend.webhookUrl}

    Once the webhook is configured, you will receive a Signing Secret from Mux.
    This is used to ensure noone else can fake these webhook requests.

    Please copy-paste the provided signing secret here, or leave it empty if you would like to keep the current configuration:
  `);

  let secret;
  try {
    secret = await (new enquirer.Password({
      name: 'backend.mux_webhook_secret',
      message: 'Webhook Secret',
      initial: setup.backend.webhook_secret
    })).run();
  }
  // Handle Ctrl+C
  catch(e) { return false; }

  // Secret is unchanged
  if (secret === '') {
    return false;
  }

  // Update local backend config
  setup.backend.webhook_secret = secret;

  if (setup.instance.type == 'local') {
    await Multipass.configureBackend(
      setup.app_config,
      [
        [ 'MUX_WEBHOOK_SECRET', setup.backend.webhook_secret ]
      ]
    );
  }

  return true;
}
