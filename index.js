import enquirer from 'enquirer';
import colors from 'ansi-colors';
import YAML from 'yaml';
import fs from 'fs';
import ngrok from 'ngrok';


import generateCloudInit from './src/cloud_init.js';
import generateLiveWebsiteConfig from './src/live_website_config.js';


const { Input, Snippet, Toggle, Select, Password } = enquirer;

import setup, * as Setup from './src/init/setup.js';
import * as Multipass from './src/init/multipass.js';



function fTitle(s) {
  return colors.bgGreen(' '+s+' ')+'\n'
}
function fHeading(s) {
  return '\n'+colors.green(s)+'\n'
}

(async () => {
  // Initialize setup
  Setup.reset();
  Setup.init();
  
  console.log(
    fTitle(' Welcome to the Waasabi installer! ')
    +'This interactive setup program will guide you through setting up '
    +'your very own customized video broadcast channel on your website. '
    +'For more details, refer to the documentation: '
    +colors.blueBright('https://waasabi.baytech.community/docs')
  );

  console.log(fHeading('Domain configuration'));

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

  if (fs.existsSync(Setup.configfile())) {
    const loadsettings = await (new Toggle({
      message: 'Load existing configuration?',
      initial: true,
    })).run();

    if (loadsettings) {
      setup = Object.assign({}, JSON.parse(fs.readFileSync(Setup.configfile()).toString()), setup);
    }
  }

  let localinstance = Setup.instancename();
  let localhost = await Multipass.find(localinstance);

  let reconfigure = true;
  if (localhost) {
    const localinfo = localhost.info[localinstance];
    console.log(
      fHeading('Found existing instance')
      +'\n'+colors.blueBright(`${localinfo.state}: ${localinfo.release} (${localinfo.ipv4})`)+'\n'
    );
    setup.local_server = { ip: localinfo.ipv4 };

    reconfigure = await (new Toggle({
      message: 'Reconfigure existing local server?',
      initial: false,
    })).run();
  
    if (!reconfigure) {
      console.log(
        '\nSkipping reconfiguration...\n'
      );  
    }
  }

  if (reconfigure) {
    console.log(
      fHeading('Administrator access')
      +'Please enter an e-mail address you would like to use for the administrator login. '
      +'You will also receive important information from LetsEncrypt and other services at this address.\n'
      +'Note: the e-mail address will not be displayed publicly anywhere',
    )
    setup.admin_email = await (new Input({
      name: 'admin_email',
      message: 'Admin email',
      initial: setup.admin_email ?? 'webmaster@'+setup.domain
    })).run();

    console.log('\n'
      +'Please provide a unique, secure password for accessing '
      +'the server and administrative interfaces:'
    )
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


    console.log(fHeading('Waasabi instance details'));

    setup.title = await (new Input({
      name: 'title',
      header: 'Choose a title for the Waasabi service (e.g. "My Cool Meetup", "Jane\'s Gaming Stream", etc.):',
      message: 'Title',
      initial: setup.title ?? 'My Waasabi'
    })).run();



    console.log(
      fHeading('Streaming backend')
      +'Please choose the video streaming provider you would like to use'
    )

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

      console.log('\n'
        +'Before using the Mux.com backend you need to sign up for the service at https://mux.com\n'
        +'Please configure the Access Token & Token Secret below, as provided by Mux. '
        +'You can create new credentials at https://dashboard.mux.com/settings/access-tokens'
      )

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


    console.log(
      fHeading('Instance type')
      +'Please choose the kind of Waasabi instance that will be created.'
    )

    setup.instance.type = await (new Select({
      name: 'instance_type',
      message: 'Where do you want to create the service?',
      choices: [
        { name: 'local',  message: '[LOCAL ] Local development server using Multipass' },
        { name: 'do',     message: '[ONLINE] Create a new Waasabi droplet on Digital Ocean' },
        { name: 'manual', message: '[CUSTOM] Manual setup (just generate the init scripts)' },
        { name: '-', message: 'Skip' }
      ]
    })).run();

    // Waasabi config file
    setup.app_config = `/home/waasabi/${setup.app}/.env`;

    // Ensure project dir exists
    await fs.promises.mkdir(new URL(Setup.instancedir(), import.meta.url), { recursive: true });

    // Cloud Init YAML
    const yaml = YAML.stringify(await generateCloudInit(setup));
    await fs.promises.writeFile(new URL(`${Setup.instancedir()}/cloud-init.yml`, import.meta.url), yaml);

    await Setup.persist();


    // Create a local development instance using multipass
    if (setup.instance.type == 'local') {
      console.log(fHeading('Creating Waasabi instance'));
      
      let mp = await Multipass.launch(localinstance, yaml);

      let localhost = await Multipass.find(localinstance);
      if (localhost) {
        const localinfo = localhost.info[localinstance];
        setup.local_server = { ip: localinfo.ipv4 };

        console.log('Local Multipass server launched on '+colors.blueBright(setup.local_server.ip));
      }

      console.log(fHeading('Configuring Waasabi instance'));
      await Multipass.updateStrapiConfig(localinstance, setup.app_config, [
        [ 'ADMIN_JWT_SECRET', setup.secret ]
      ]);

    // TODO: launch a new Digital Ocean droplet directly from the init script
    // } else if (setup.instance.type == 'do') {}
    //
    } else {
      console.log(
        fHeading('Manual configuration')
        +`Your will find your ${colors.magentaBright('cloud-init')} configuration file in:\n`
        +colors.blueBright(`./${Setup.instancedir()}/cloud-init.yaml`)
        +'\n\nYou can use it to configure any cloud provider that supports '
        +'cloud-init, or by using cloud-init manually on your deployment server.'
      );

      process.exit(0);
    }
  }


  // TODO: ngrok+mux.com webhooks
  // NOTE: ngrok http -host-header=myapp.dev 80
  // https://www.npmjs.com/package/ngrok
  // TODO: extract multipass ip first
  setup.instance.ngrokUrl = await ngrok.connect({addr:`${setup.local_server.ip}:80`});
  setup.instance.backendUrl = setup.instance.ngrokUrl+'/waasabi';
  setup.instance.adminUrl = setup.instance.backendUrl+'/admin';
  setup.instance.webhookUrl = setup.instance.backendUrl+'/event-manager/webhooks';

  await Multipass.updateStrapiConfig(localinstance, setup.app_config, [
    [ 'BACKEND_URL', setup.instance.backendUrl ]
  ]);

  console.log('Ngrok tunnel started: '+colors.blueBright(setup.instance.ngrokUrl));

  if (setup.instance.type == 'local' && setup.backend.type == 'mux') {
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
      +'from Mux, this is used to ensure noone else can fake these webhook '
      +'requests. Please copy-paste the value of the secret here:'
    );

    setup.backend.webhook_secret = await (new Password({
      name: 'backend.mux_webhook_secret',
      message: 'Webhook Secret',
      initial: setup.backend.webhook_secret
    })).run();

    await Multipass.updateStrapiConfig(localinstance, setup.app_config, [
      [ 'MUX_WEBHOOK_SECRET', setup.backend.webhook_secret ]
    ]);
  }

  // TODO: make this run parallel to the webhook prompt to save time to the user
  await Multipass.rebuildStrapi(localinstance);
  await Multipass.restartStrapi(localinstance);

  // Update Live website config & rebuild
  await Multipass.writeFile(
    localinstance,
    '/home/waasabi/live/website.config.js',
    generateLiveWebsiteConfig(setup)
  );
  await Multipass.rebuildLiveSite(localinstance);

  await Setup.persist();

  console.log(
    fHeading('Waasabi is up & running!')
    +'You can access the administration interface on the link below:\n'
    +colors.blueBright(setup.instance.adminUrl)

    +'\n'+fHeading('Waasabi commandline')
    +'You can control the development instance using the Waasabi commandline. '
    +'Type "exit" to stop. Type "help" to learn about the other commands.'
  );
  while (true) {
    let command = await (new Input({
      message: '$>',
    })).run();
    if (command === 'exit') process.exit(0);
  }

})().catch(console.error);







function matrixBotBinary() {
  //curl -sSf https://github.com/baytechc/waasabi-matrix/releases/download/v0.1.0/ferris-bot-x86_64-pc-linux-gnu.tgz | tar -xz -C bin
  return 'curl -sSf https://waasabi.baytech.community/ferris-bot-x86_64-pc-linux-gnu.tgz | tar -xz -C bin';
}

