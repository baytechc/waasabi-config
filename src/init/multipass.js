import { spawn } from 'child_process';
//import { Readable } from 'stream';

import setup, * as Setup from './setup.js';



export async function launch(instance, cloudinit) {
  // Launch a new multipass instance, pass cloud-init config via stdin
  // $> multipass launch --disk 10G --mem 2G --name waasabi lts --cloud-init -
  const multipass = spawn('multipass', ['launch', '-c','2', '-d','10G', '-m','2G', '-n',instance, '--cloud-init', '-', 'lts']);

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

    multipass.stderr.on('data', (data) => console.log(data.toString(), multipass.spawnargs.join(' ')));
    multipass.on('exit', (code) => {
      console.log(Buffer.concat(outdata).toString());
      // Also update the setup.instance with the instance info
      if (Setup.instancename() === instance) {
        return resolve(Setup.findinstance());
      }

      resolve();
    });
  });
}

export async function find(instance) {
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
      '-c', 'pm2 --update-env restart all'
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


