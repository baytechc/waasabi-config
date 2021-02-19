import enquirer from 'enquirer';
import colors from 'ansi-colors';
import YAML from 'yaml';
import fs from 'fs';
import { randomBytes } from 'crypto';
import ngrok from 'ngrok';

import generateCloudInit from './src/cloud_init.js';

import { spawn } from 'child_process';

const { Input, Snippet, Toggle, Select, Password } = enquirer;


function fTitle(s) {
  return colors.bgGreen(' '+s+' ')+'\n'
}
function fHeading(s) {
  return '\n'+colors.green(s)+'\n'
}

(async () => {
  let setup = {
    // Instance-specific configuration
    instance: {},
    // Random instance ID, used to expose the config logs from inside the instance
    iid: randomBytes(32).toString('hex'),
    // Default app name (e.g. home dir folder for Strapi install)
    app: 'waa',
    // Default secret (e.g. for JWT encryption)
    secret: randomBytes(32).toString('base64'),
    // Strapi version to install
    strapiVersion: '@3.4.6' || process.env.STRAPI_VERSION,
  };

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

  const instancedir = 'instance/' + setup.host;
  const configfile = new URL(`${instancedir}/setup.json`, import.meta.url);

  if (fs.existsSync(configfile)) {
    const loadsettings = await (new Toggle({
      message: 'Load existing configuration?',
      initial: true,
    })).run();

    if (loadsettings) {
      setup = Object.assign({}, JSON.parse(fs.readFileSync(configfile).toString()), setup);
    }
  }

  let localinstance = 'waasabi-'+setup.host.replace(/\./g,'-');
  let localhost = await multipassFind(localinstance);

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
      message: 'Select video streaming backend',
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
    await fs.promises.mkdir(new URL(instancedir, import.meta.url), { recursive: true });

    // Cloud Init YAML
    const yaml = YAML.stringify(await generateCloudInit(setup));
    await fs.promises.writeFile(new URL(`${instancedir}/cloud-init.yml`, import.meta.url), yaml);

    await saveConfig(configfile, setup);


    if (setup.instance.type == 'local') {
      console.log(fHeading('Creating Waasabi instance'));
      
      let mp = await multipassLaunch(localinstance, yaml);

      let localhost = await multipassFind(localinstance);
      if (localhost) {
        const localinfo = localhost.info[localinstance];
        setup.local_server = { ip: localinfo.ipv4 };

        console.log('Local Multipass server launched on '+colors.blueBright(setup.local_server.ip));
      }

      console.log(fHeading('Configuring Waasabi instance'));
      await multipassUpdateStrapiConfig(localinstance, setup.app_config, [
        [ 'ADMIN_JWT_SECRET', setup.secret ]
      ]);
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

  await multipassUpdateStrapiConfig(localinstance, setup.app_config, [
    [ 'BACKEND_URL', setup.instance.backendUrl ]
  ]);
  // TODO: make this run parallel to the webhook prompt to save time to the user
  await multipassRebuildStrapi(localinstance);
  await multipassRestartStrapi(localinstance);

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
  }

  await saveConfig(configfile, setup);

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


function multipassLaunch(instance, cloudinit) {
  // multipass launch --disk 10G --mem 2G --name waasabi-dev lts --cloud-init -
  const multipass = spawn('multipass', ['launch', '-c','2', '-d','10G', '-m','2G', '-n',instance, '--cloud-init', '-', 'lts']);
  
  multipass.stdin.end(cloudinit);

  let outdata = [];

  return new Promise((resolve, reject) => {
    multipass.stdout.on('data', (data) => {
      outdata.push(data);

      //const str = data.toString().trim()
      //if ('\|/-'.includes(str) == false) {
      //  console.log(colors.magenta(str));
      //}
    });
    multipass.stdout.pipe(process.stdout);

    multipass.stderr.on('data', (data) => console.log(data.toString(), multipass.spawnargs.join(' ')));
    multipass.on('exit', (code) => {
      console.log(Buffer.concat(outdata).toString());
      //let res = JSON.parse(Buffer.concat(outdata).toString());
      //console.log(code, res);
      resolve(multipassFind(instance));
    });
  });
}

async function multipassFind(instance) {
  const multipass = spawn('multipass', ['info', '--format', 'json', instance]);

  let outdata = [];

  return new Promise((resolve, reject) => {
    multipass.stdout.on('data', (data) => outdata.push(data));
    multipass.stderr.on('data', (data) => console.log(data.toString()));
    multipass.on('exit', (code) => {
      let res = undefined;

      try {
        res = JSON.parse(Buffer.concat(outdata).toString());
      }
      catch(e) {}

      resolve(res);
    });
  });
}

async function multipassUpdateStrapiConfig(instance, configfile, envVars) {
  if (typeof envVars != 'object' || envVars instanceof Array === false) {
    return console.error('Failed to update server configuration.');
  }

  for (const [key,value] of envVars.values()) {
    let command = [ 
      'sudo', 'sed', '-in',
      `s/^${key}=.*$//; t set
$ { x; /^$/ {x; p; b set} ;d }
p;d
:set
s~.*~${key}=${value}~p; h; d`,
      configfile
    ];

    await multipassExec(instance, command);    
  }

  // TODO: replicate locally
  await multipassRestartStrapi(instance);
}

async function multipassRestartStrapi(instance) {
  // Restart PM2
  return await multipassExec(instance, [
    'sudo',
      '-u', 'waasabi',
    'bash',
      '-c', 'pm2 restart all'
  ]);
}

async function multipassRebuildStrapi(instance) {
  // Rebuild the admin UI after a config change
  return await multipassExec(instance, [
    'sudo',
      '-u', 'waasabi',
    'bash',
      '-c', 'cd ~/waa && ./node_modules/.bin/strapi build'
  ]);
}

async function multipassExec(instance, command) {
  const multipass = spawn('multipass', ['exec', instance, '--'].concat(command));

  let outdata = [];

  return new Promise((resolve, reject) => {
    multipass.stdout.on('data', (data) => outdata.push(data));
    multipass.stderr.pipe(process.stderr);
    multipass.on('exit', (code) => {
      let res = Buffer.concat(outdata).toString();

      if (code) return reject('Failed multipass command: '+command.join(' '));
      try {
        res = JSON.parse(res);
      }
      catch(e) {
        console.log(res);
      }

      resolve(res);
    });
  });
}

// Config settings
async function saveConfig(configfile, config) {
  await fs.promises.writeFile(configfile, JSON.stringify(config, null, 2));

  console.log(
    '\nConfiguration saved in: '
    +colors.blueBright(`instance/${config.host}`)
  );
}
