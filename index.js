import enquirer from 'enquirer';
import fs from 'fs';


import { generateYaml as generateCloudInitYml } from './src/cloud_init.js';
import generateLiveWebsiteConfig from './src/livepage_website_config.js';

import { generateYaml as generateWaasabiInitYml } from './src/waasabi_init.js';

const { Input, Toggle } = enquirer;

import setup, * as Setup from './src/init/setup.js';
import * as Multipass from './src/init/multipass.js';
import * as Ngrok from './src/init/ngrok.js';

import { layout, clear, loading } from './src/init/content-formatter.js';
import start from './src/flow/start.js';
import { configNew, configChange } from './src/flow/config.js';
import actions from './src/flow/actions.js';


(async () => {
  let selectedConfig = await start();

  // By default, we configure all options, but let users opt out of that
  // when restoring existing configurations
  let configure = true;

  // No existing config, or creating a new
  if (selectedConfig === 'new') {

    await configNew();
  
  // Load an existing config
  } else {
    // Load the selected config
    await Setup.restore(Setup.configfile(selectedConfig));
 
    configure = await (new Toggle({
      message: 'Would you like to change the existing configuration?',
      initial: false,
    })).run();

    if (configure) {
      await configChange();
    }
  }

  // Create a snapshot of the current config so we can track changes
  const snapshot = Setup.trackChanges();

  // Select action
  const mode = await actions();

  // Exit
  if (mode === 'exit') {
    return;
  }

  // Dump configuration and exit
  if (mode === 'export') {
    setup.prod = true;

    //TODO: switch backend urls to the production ones

    // Cloud Init YAML
    await fs.promises.writeFile(
      new URL(`${Setup.instancedir()}/cloud-init.yml`, import.meta.url),
      await generateCloudInitYml(setup)
    );

    const waasabiInitYaml = generateWaasabiInitYml(setup);
    
    // Waasabi Init YAML
    await fs.promises.writeFile(
      new URL(`${Setup.instancedir()}/waasabi-init.yml`, import.meta.url),
      waasabiInitYaml
    );


    // TODO: configure Mux webhooks
    layout(`
      ## Manual configuration

      Your will find your \`cloud-init\` configuration file in:

      \`./${Setup.instancedir()}/cloud-init.yml\`

      You can use it to configure any cloud provider that supports cloud-init, or by using cloud-init manually on your deployment server.
    `);

    process.exit(0);
  }

  // mode === 'launch' or 'develop'

  // Create a local instance using multipass
  if (!setup.instance) {
    layout(`## Launching new local Waasabi instance`);

    await Multipass.launch(
      Setup.instancename(),
      await generateCloudInitYml(setup),
    );  
  }

  // TODO: ensure the instance is actually running?

  layout(`
    Local Multipass instance running on *${setup.instance.ip}*
  `);

  // Configure development mount points
  // TODO: allow configuring
  // TODO: allow reconfiguration
  if (setup.mode === 'develop') {
    layout(`## Mounting development folders`);

    const changes = await Multipass.mountDevFolders();
  }


  // Local instance (launch/develop)
  layout(`## Configuring local Waasabi instance`);

  // TODO: when do we need to do this exactly?
  //await Multipass.configureBackend(setup.app_config, [
  //  [ 'ADMIN_JWT_SECRET', setup.secret ]
  //]);

  await Ngrok.connect();

  
  // Rebuild/restart the multipass backend & frontend when config changes
  if (snapshot.changed()) {
    await Setup.persist();

    // TODO: make this run parallel to the webhook prompt to save time to the user
    await Multipass.rebuildBackend();
    await Multipass.restartBackend();

    // Update frontend config & rebuild
    await Multipass.writeFile(
      Setup.instancename(),
      '/home/waasabi/live/website.config.js',
      generateLiveWebsiteConfig(setup)
    );
    await Multipass.rebuildFrontend();
  }

  layout(`
    ## Waasabi is up & running!

    You can access the administration interface on the link below:

    ${setup.backend.adminUrl}

    ## Waasabi commandline

    You can control the development instance using the Waasabi commandline. Type "exit" to stop. Type "help" to learn about the other commands.
  `);


  while (true) {
    let command;

    try {
      command = await (new Input({
        message: '$>',
      })).run();  
    }
    catch (e) {
      // Enquirer throws when it detects Ctrl+C
      console.log('Please type `exit` and press Enter to exit the Waasabi commandline!');
    }

    // Exit Waasabi commandline
    if (command === 'q' || command === 'exit') {
      process.exit(0);
    }

    // Restart backend
    if (command === 'r') {
      await Multipass.restartBackend();
    }
  }

})().catch(console.error);





function matrixBotBinary() {
  //curl -sSf https://github.com/baytechc/waasabi-matrix/releases/download/v0.1.0/ferris-bot-x86_64-pc-linux-gnu.tgz | tar -xz -C bin
  return 'curl -sSf https://waasabi.baytech.community/ferris-bot-x86_64-pc-linux-gnu.tgz | tar -xz -C bin';
}

