import { spawn } from 'child_process';
import { layout } from './content-formatter.js';

import setup, * as Setup from './setup.js';

import backendconfigsh from '../backend_config_sh.js';
import livepageconfigsh from '../livepage_config_sh.js';

import * as LXD from './lxd.js';

// Choose VM Driver
const VMD=LXD;

export async function providers() {
  const providers = new Set();

  if (await LXD.available()) providers.add('lxd')

  if (providers.size === 0) return null;
  return Array.from(providers);
}

export async function launch(instance, cloudinit) {
  return VMD.launch(instance, cloudinit);
}

export async function find(instance) {
  return VMD.find(instance);
}

export async function list(opts) {
  return VMD.list(...arguments);
}

export async function exec(instance, command, commandInput) {
  return VMD.exec(...arguments);
}

export async function writeFile(instance, file, contents) {
  return await exec(instance, [ 'sudo', 'tee', file ], contents);
}

export async function updateFile(instance, file, modFn) {
  // TODO:
  // rull file from instance
  // run modFn on contents
  // push results back
  return false;
}

export async function mount(options, instance = Setup.instancename()) {
  const { source, target, uid, gid } = options;
  const cmd = ['mount'];

  if (uid) cmd.push('-u', uid+':1000');
  if (gid) cmd.push('-g', gid+':1000');

  cmd.push(source);
  cmd.push(`${instance}:${target}`);

  const multipass = spawn('multipass', cmd);

  return new Promise((resolve, reject) => {
    if (!multipass) return reject('Failed multipass command: '+cmd.join(' '));

    multipass.stdout.pipe(process.stdout);
    multipass.stderr.pipe(process.stderr);

    multipass.on('exit', (code) => {
      if (code) return reject('Failed multipass command: '+cmd.join(' '));
      resolve();
    });
  });
}

export async function mountDevFolders(instance = Setup.instancename()) {
  const uid = process.getuid();
  const gid = process.getgid();

  const mounts = setup._instance.mounts;
  const folders = [
    {
      source: '/home/flaki/data/multipass-waasabi-host',
      target: `/home/waasabi/${setup.app}`,
      async after() {
        console.log('Reconfiguring backend…');
        await exec(instance, ['bash'], backendconfigsh(setup));
      }
    },
    {
      source: '/home/flaki/data/waasabi-live',
      target: '/home/waasabi/live',
      async after() {
        console.log('Reconfiguring live page…');
        await exec(instance, ['bash'], livepageconfigsh(setup));
      }
    }
  ];

  let changed = false;
 
  for (let { source, target, after } of folders) {
    // Already mounted? Don't remount
    // TODO: if current <source_path> is different source than remount
    if (mounts[target]) {
      source = mounts[target].source_path;

    } else {
      await mount({
        uid, gid,
        source, target
      }, instance);
//ARTIFICIAL DELAY
await new Promise(r => setTimeout(r, 3000))
 
      // Run hook after changing the mounted folder
      await after();

      changed = true;
    }

    layout(`*${source}* \u2192  *${target}*`);
  }

  // Reload instance info
  if (changed) {
    await Setup.findinstance(instance);
    return true;
  }
}

export async function configureBackend(configfile, envVars, instance = Setup.instancename()) {
  if (typeof envVars != 'object' || envVars instanceof Array === false) {
    return console.error('Failed to update server configuration.');
  }

  console.log('Updating server configuration…');

  // Ensure the config file exists
  await exec(instance, [ 'sudo', '-u', 'waasabi', 'touch', configfile ]);

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

    await exec(instance, command);    
  }

  // TODO: replicate locally
  await restartBackend(instance);
}

export async function restartBackend(instance = Setup.instancename()) {
  // Restart PM2
  console.log('Restarting backend…');

  return await exec(instance, [
    'sudo',
      '-u', 'waasabi',
    'bash',
      '-c', 'pm2 -m --update-env restart all'
  ]);
}

export async function rebuildBackend(instance = Setup.instancename()) {
  // Rebuild the admin UI after a config change
  return await exec(instance, [
    'sudo',
      '-u', 'waasabi',
    'bash',
      '-c', `cd ~/${setup.app} && ./node_modules/.bin/strapi build --no-optimization`
  ]);
}

export async function rebuildFrontend(instance = Setup.instancename()) {
  // Rebuild Live website
  return await exec(instance, [
    'sudo',
      '-u', 'waasabi',
    'bash',
      '-c', `cd ~/live && npm run build`
  ]);
}


export function extract(instance, prop) {
  if (prop == 'ipv4') {
    //DEPRECATED:multipass: return instance.ipv4[0];

    // network.eth0 is the primary network adapter, with ipv4/ipv6 addresses
    // We take the v4 address for simplicity
    return instance.network.eth0.addresses.filter(i => i.family == 'inet').pop()?.address;
  }

  if (prop == 'os') {
    //DEPRECATED:multipass: return `Ubuntu ${instance.release}`;

    return instance.config['image.os'] + ' ' + instance.config['image.release'];
  }

  if (prop == 'vmhost') {
    //DEPRECATED:multipass: return 'Multipass';

    return 'LXD '+instance.type;
  }

  if (prop == 'state') {
    //DEPRECATED:multipass: return instance.state;

    return instance.status;
  }
}