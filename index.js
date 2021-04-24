import enquirer from 'enquirer';
import fs from 'fs';


import { generateYaml as generateCloudInitYml } from './src/cloud_init.js';
import generateLiveWebsiteConfig from './src/livepage_website_config.js';

import { generateYaml as generateWaasabiInitYml } from './src/waasabi_init.js';

const { Input, Snippet, Toggle, Select, Password } = enquirer;

import setup, * as Setup from './src/init/setup.js';
import * as Multipass from './src/init/multipass.js';
import * as Ngrok from './src/init/ngrok.js';

import { layout, clear, loading } from './src/init/content-formatter.js';


(async () => {
  // Initialize setup
  Setup.reset();
  Setup.init();

  clear();
  layout(`
    # Welcome to the Waasabi installer!

    This interactive setup utility will guide you through setting up your very own customized video broadcast channel on your website.
    To learn more about the installation process, please refer to the documentation:

    https://waasabi.org/docs

    You can press \`Ctrl+C\` at any time to exit the configurator.
  `);

  const startup = initCheck();
  await loading('Checking existing configuration…', startup);

  // loading() returns when the configs are available
  const configs = await startup;

  const configOptions = configs.map(({ host, instance }) => {
    let message = host;

    if (instance) {
      message += `: local Ubuntu ${instance.release}`;
  
      if (instance.state == 'Running') {
        message += ` (${instance.state})`;
      }
    }
  
    return { name: host, message };
  });

  let selectedConfig = undefined;
  if (configOptions) {
    // Add 'create new' option
    configOptions.push(
      { name: 'new', message: 'Create a new Waasabi configuration' }
    );

    layout(`
      ## Existing configurations detected

      We have found existing Waasabi configurations on this device. You may continue by loading one of these settings, or create a new one.
    `);

    // Ask what the user is trying to achieve
    selectedConfig = await (new Select({
      name: 'select_config',
      message: 'Select configuration:',
      choices: configOptions
    })).run();
  }

  // By default, we configure all options, but let users opt out of that
  // when restoring existing configurations
  let configure = true;

  // No existing config, or creating a new
  if (!configOptions || selectedConfig == 'new') {
    // Ask what the user is trying to achieve
    setup.mode = await (new Select({
      name: 'mode',
      message: 'What would you like to do?',
      choices: [
        { name: 'launch', message: 'Create a local Waasabi instance' },
        { name: 'export', message: 'Export configuration for a live installation' },
        { name: 'develop', message: 'Develop Waasabi components' },
      ]
    })).run();

    layout(`## Domain configuration`);

    setup.domain = await (new Input({
      name: 'domain',
      footer: 'Enter your website\'s domain name.',
      message: 'Domain name',
      initial: 'my-website.net'
    })).run();
  
    const host = await (new Snippet({
      name: 'host',
      footer:
        'Choose a subdomain for the Waasabi server. '
        +'Note: you nay need to manually configure the domain name at your provider.',
      message: 'Subdomain',
      required: true,
      fields: [
        {
          name: 'subdomain',
          message: 'Waasabi Subdomain'
        },
      ],
      template: `\${subdomain:waasabi}.${setup.domain}`
    })).run();
  
    setup.host = host.result;
    setup.subdomain = host.values.subdomain;
  
  // Load an existing config
  } else {
    // Load the selected config
    await Setup.restore(Setup.configfile(selectedConfig));

    setup.mode = await (new Select({
      name: 'mode',
      message: 'What would you like to do?',
      choices: [
        { name: 'launch', message: 'Launch' },
        { name: 'develop', message: 'Develop' },
        { name: 'export', message: 'Export' },
      ]
    })).run();
 
    configure = await (new Toggle({
      message: 'Would you like to change the existing configuration?',
      initial: false,
    })).run();
  }

  // Further configuration options
  if (configure) {
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


    layout(`##  Waasabi instance details`);

    setup.title = await (new Input({
      name: 'title',
      header: 'Choose a title for the Waasabi service (e.g. "My Cool Meetup", "Jane\'s Gaming Stream", etc.):',
      message: 'Title',
      initial: setup.title ?? 'My Waasabi'
    })).run();


    layout(`
      ## Streaming backend

      Please choose the video streaming provider you would like to use.
    `);

    const backend_options = [
      { name: 'Use Mux.com (HLS)', type: 'mux'},
      { name: 'Self-hosted WHIP (HLS over IPFS)', type: 'whip' },
    ];
    const BACKEND_MUX = 0;
    const BACKEND_WHIP = 1;

    setup.backend = setup.backend ?? {};
    const backend_type  = await (new Select({
      name: 'backend_type',
      message: 'Select video streaming backend',
      choices: [ ...backend_options, { name: '-', message: 'Skip' } ]
    })).run();

    if (backend_type === backend_options[BACKEND_MUX].name) {
      setup.backend.type = backend_options[BACKEND_MUX].type;

      layout(`
        Before you may start using the Mux.com backend you will need to sign up for the service at https://mux.com/.
        Please configure the Access Token & Token Secret below, as provided by Mux.
        
        You can create new credentials at https://dashboard.mux.com/settings/access-tokens
      `);

      setup.backend.token = await (new Input({
        name: 'backend.mux_token_id',
        message: 'Token ID',
        initial: setup.backend.token
      })).run();
    
      setup.backend.token_secret = await (new Password({
        name: 'backend.mux_token_secret',
        message: 'Token Secret',
        initial: setup.backend.token_secret
      })).run();
    }


    // Ensure project dir exists
    //await fs.promises.mkdir(new URL(Setup.instancedir(), import.meta.url), { recursive: true });
    //persist() should take care of this

    await Setup.persist();
  } // end of: configure?


  // Create a snapshot of the current config so we can track changes
  const snapshot = Setup.trackChanges();


  // Create a local development instance using multipass
  if (setup.mode !== 'export' && !setup.instance) {
    layout(`## Launching new local Waasabi instance`);

    await Multipass.launch(
      Setup.instancename(),
      await generateCloudInitYml(setup)
    );
  }


  // Export requested
  if (setup.mode === 'export') {
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
  

  layout(`
    Local Multipass instance running on *${setup.instance.ip}*
  `);

  // Configure development mount points
  // TODO: allow configuring
  // TODO: allow reconfiguration
  if (setup.mode === 'develop') {
    layout(`## Mounting development folders`);

    const changes = await Multipass.mountDevFolders();

    //TODO proper reconfiguration on first launch only
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


async function initCheck() {
  const instancelist = await Multipass.list();
  const configlist = await Setup.list();

  // Map the list of instances keyed by the instance names
  const instances = new Map(instancelist.list.map(i => [i.name, i]));

  // Find associated instances and for the respective saved configurations
  const configs = configlist.map(host => {
    const instancename = Setup.instancename(host);
    const instance = instances.get(instancename); 

    return { host, instancename, instance };
  });

  // TODO: ordering? latest-updated first? Running-instance-first?

  return configs;
}




function matrixBotBinary() {
  //curl -sSf https://github.com/baytechc/waasabi-matrix/releases/download/v0.1.0/ferris-bot-x86_64-pc-linux-gnu.tgz | tar -xz -C bin
  return 'curl -sSf https://waasabi.baytech.community/ferris-bot-x86_64-pc-linux-gnu.tgz | tar -xz -C bin';
}

