import { spawn } from 'child_process';
import { layout } from './content-formatter.js';

import setup, * as Setup from './setup.js';

import backendconfigsh from '../backend_config_sh.js';
import livepageconfigsh from '../livepage_config_sh.js';

import {writeFileSync} from 'fs';


export async function launch(instance, cloudinit) {
  // Launch a new multipass instance, pass cloud-init config via stdin
  // $> multipass launch --disk 10G --mem 2G --name waasabi lts --cloud-init -
  const multipass = spawn('multipass', ['launch', '-c','2', '-d','10G', '-m','2G', '-n',instance, '--cloud-init', '-', 'lts']);

  console.log('$>', multipass.spawnargs.join(' '));

  // Write cloudinit config string & close the stdin
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

    multipass.stderr.on('data', (data) => {
      console.log(data.toString());
    });

    multipass.on('exit', async (code) => {
      console.log('Multipass Launch finished with exit code #'+code);

      writeFileSync('multipasslaunch.log', Buffer.concat(outdata));

      // Also update the setup.instance with the instance info
      if (Setup.instancename() === instance) {
        try {
          const instanceInfo = await Setup.findinstance();
          console.log(instanceInfo);
          resolve(instanceInfo);
        }
        catch(e) {
          reject(e);
        }
      }

      reject(new Error('No instance was launched.'));
    });
  });
}

export async function find(instance) {
  const multipass = spawn('multipass', ['info', '--format', 'json', instance]);

  let outdata = [];

  return new Promise((resolve, reject) => {
    multipass.stdout.on('data', (data) => outdata.push(data));

    let err = '';
    multipass.stderr.on('data', (data) => err += data.toString());
    multipass.on('exit', (code) => {
      let res = void 0;

      // If the instance doesn't exist find resolves to 'undefined'
      if (err) {
        if (err.includes('does not exist')) {
          return resolve(res);
        }

        // Other error, reject
        if (code > 0) return reject(new Error(err));
      }

      // Try parsing the output JSON and use it as a result
      try {
        res = JSON.parse(Buffer.concat(outdata).toString());
      }
      catch(e) {}

      resolve(res);
    });
  });
}

export async function list() {
  const multipass = spawn('multipass', ['list', '--format', 'json']);

  let outdata = [];

  return new Promise((resolve, reject) => {
    multipass.stdout.on('data', (data) => outdata.push(data));

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

export async function exec(instance, command, commandInput) {
  const multipass = spawn('multipass', ['exec', instance, '--'].concat(command));

  let outdata = [];

  return new Promise((resolve, reject) => { 
    // Pass contents in on STDIN if requested
    if (commandInput) {
      //if (typeof commandInput == 'string') Readable.from([commandInput]).pipe(multipass.stdin);
      multipass.stdin.end(commandInput);
    }

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

export async function writeFile(instance, file, contents) {
  return await exec(instance, [ 'sudo', 'tee', file ], contents);
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


