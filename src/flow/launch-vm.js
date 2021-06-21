import setup, * as Setup from '../init/setup.js';
import { layout, pause } from '../init/content-formatter.js';

import * as VM from '../init/vm.js';
import * as Ngrok from '../init/ngrok.js';
import CLI from './commandline.js';

import { generateYaml as generateCloudInitYml } from '../cloud_init.js';
import generateLiveWebsiteConfig from '../livepage_website_config.js';


export async function launchInVM() {
  // Check if we can create VM-s
  if (await virtualizationEnabled() === false) return;

  // Create a snapshot of the current config so we can track changes
  const snapshot = Setup.trackChanges();

  // Launch an instance, or grab the already running instance
  await provisionInstance('test');

  // Start a public relay so we can receive webhooks
  await startRelay();

  // Update server configuration if the settings changed (e.g. URL)
  await rebuildIfConfigChanged(snapshot);

  layout(`
    ## Waasabi is up & running!

    You can access the administration interface on the link below:

    ${setup.backend.adminUrl}
  `);

  // Launch commandline to control the running VM
  await CLI();
}

export async function developInVM() {
  if (await virtualizationEnabled() === false) return;

  // TODO:
  // Ask for folders of the Waasabi backend/frontend and mount them directly
  // within the instance for easy access from outside development tools.

  await provisionInstance('dev');

  // Configure development mount points
  // TODO: allow configuring
  // TODO: allow reconfiguration
  if (setup.mode === 'develop') {
    layout(`## Mounting development folders`);

    //TODO:
    // mount 'host' and 'live' as external directories
    // lxc config device add waasabi-live-waasabi-org livepage disk source=/zpool/work/waasabi/waasabi-live path=/home/waasabi/live
    // echo "root:1000:1" | sudo tee -a /etc/subuid /etc/subgid
    // lxc config set waasabi-live-waasabi-org raw.idmap "both 1000 1000"
    await VM.mountDevFolders();
  }
}


// Make sure we have virtualization technology available
// TODO: maybe allow for installing it automatically in the future?
async function virtualizationEnabled() {
  const providers = await VM.providers();

  if (!providers) {
    layout(`
    
    Unfortunately virtualization technology is not available on this machine.

    Make sure you have a supported provider (e.g. \`LXD\`) installed and configured on this machine, and try again.
    
    On Ubuntu and similar Debian systems you can install and configure LXD/LXC using the following commands:

    \`sudo apt-get update\`
    \`sudo apt-get install -y lxd\`
    \`sudo service lxd start\`
    \`sudo lxd init\`
    `);

    await pause();

    return false;
  }

  return true;
}

// Ensure that we have a running instance, otherwise start it up now
async function provisionInstance(mode) {
  // Create a local instance using a VM or container
  if (!setup.instance) {
    layout(`## Launching new local Waasabi instance`);

    await VM.launch(
      Setup.instancename(),
      await generateCloudInitYml(setup),
    );
  }

  // TODO: ensure the instance is actually running?
  if (!setup.instance) {
    console.error(`Couldn't launch local instance.`);
    process.exit(1);
  }

  layout(`
    Local VM instance running on *${setup.instance.ip}*
  `);
}

async function startRelay() {
  // TODO: check if Ngrok is working?
  await Ngrok.connect();
}

async function rebuildIfConfigChanged(snapshot) {
  // Rebuild/restart the VM backend & frontend when config changes
  if (snapshot.changed()) {
    await Setup.persist();

    // Local instance (launch/develop)
    layout(`## Configuring local Waasabi instance`);

    // TODO: review which pieces are still needed for Ngrok

    // TODO: this needs to wait for the cloud-init to finish first

    // TODO: make this run parallel to the webhook prompt to save time to the user
    //await VM.rebuildBackend();
    //await VM.restartBackend();

    // Update frontend config & rebuild
    //await VM.writeFile(
    //  Setup.instancename(),
    //  '/home/waasabi/live/website.config.js',
    //  generateLiveWebsiteConfig(setup)
    //);
    //await VM.rebuildFrontend();
  }
}