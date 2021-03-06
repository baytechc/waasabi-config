import ngrok from 'ngrok';

import enquirer from 'enquirer';

import setup, * as Setup from './setup.js';
import * as Multipass from './multipass.js';


// TODO: move these to separate module
import colors from 'ansi-colors';
function fHeading(s) {
  return '\n'+colors.green(s)+'\n'
}


export async function connect() {
  const addr = `${setup.instance.ip}:80`;
  const url = await ngrok.connect({addr});

  console.log(`Ngrok tunnel for [${addr}] started: `+colors.blueBright(setup.instance.ngrokUrl));
  
  // TODO: create a separate "updateUrl" function?
  setup.instance.ngrokUrl = url;
  setup.instance.backendUrl = url+'/waasabi';
  setup.instance.adminUrl = setup.instance.backendUrl+'/admin';
  setup.instance.webhookUrl = setup.instance.backendUrl+'/event-manager/webhooks';
  
  await Multipass.updateStrapiConfig(
    Setup.instancename(),
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
  console.log(
    fHeading('Webhook configuration')
    +'When using the Mux streaming backend, the Waasabi server needs to receive '
    +'calls from Mux.com in the form of webhooks. We use a tool called Ngrok to '
    +'make the local Waasabi instance accessible for Mux\'s servers, but you '
    +'need to manually configure Mux.com\'s webhooks at:\n'
    +'https://dashboard.mux.com/settings/webhooks'

    +'\n\nYou will need to point the webhooks to this URL:\n'
    +colors.blueBright(setup.instance.webhookUrl)
  );

  console.log(
    '\n'
    +'Once the webhook is configured, you will receive a Signing Secret '
    +'from Mux. This is used to ensure noone else can fake these webhook '
    +'requests. Please copy-paste the value of the secret here:'
  );

  setup.backend.webhook_secret = await (new enquirer.Password({
    name: 'backend.mux_webhook_secret',
    message: 'Webhook Secret',
    initial: setup.backend.webhook_secret
  })).run();

  // Update local backend config
  if (setup.instance.type == 'local') {
    await Multipass.updateStrapiConfig(
      Setup.instancename(),
      setup.app_config,
      [
        [ 'MUX_WEBHOOK_SECRET', setup.backend.webhook_secret ]
      ]
    );
  }
}
