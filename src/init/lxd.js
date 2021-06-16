import { spawn } from 'child_process';
import { join } from 'path';

import setup, * as Setup from './setup.js';


export async function available() {
  try {
    const proc = spawn('lxc', ['--version']);

    await new Promise((resolve, reject) => {
      proc.on('error', (err) => reject(err));
      proc.on('exit', (code) => (code === 0) ? resolve() : reject() );
    })

    return true;
  }
  catch (err) {
    return false;
  }
}

// https://askubuntu.com/a/701629
export async function launch(instance, cloudinit) {
  // // Launch a new instance, pass cloud-init config via config
  const proc = spawn('lxc', [
    'launch',
    'images:ubuntu/focal/cloud',
    instance,
    `--config=user.user-data=${cloudinit}`,
  ]);

  // Close the stdin, not needed for LXC (config passed in via args)
  proc.stdin.end();

  // Collect process output and also display it
  return new Promise((resolve, reject) => {
    //DEBUG:proc.on('spawn', () => console.log('$>', proc.spawnargs.join(' ').substr(0,300)+'\n...'));
    proc.on('error', (err) => reject(err));

    //TODO:timeout?

    // Collected output
    let outdata = [];

    // Collect stdout
    proc.stdout.on('data', (data) => {
      outdata.push(data);
    });

    // Also display stdout
    proc.stdout.pipe(process.stdout);

    // Display stderr messages
    proc.stderr.on('data', (data) => {
      console.log('E'+data.toString());
    });

    proc.on('exit', async (code) => {
      console.log('Launch finished with exit code #'+code);

      //TODO:
      //EError:
      // Failed instance creation:
      //  Failed creating instance record:
      //   Add instance info to the database:
      //    This instance already exists

      /*DEBUG*/await import('fs').then(fs => fs.writeFileSync(join(Setup.CONFIGDIR, 'vmlaunch.log'), Buffer.concat(outdata)));

      // Also update the setup.instance with the instance info
      if (Setup.instancename() === instance) {
        try {
          //On initial launch the instance doesn't instantly get an IPv4
          //address, we should wait until the IPv4 address is assigned
          //before proceeding here
          let retries = 5;

          while(--retries >= 0) {
            const instanceInfo = await Setup.findinstance();

            // No VM found
            if (!instanceInfo) throw(new Error('VM failed to launch!'));

            // The VM has a valid IPv4 address
            if (instanceInfo.ip) return resolve(instanceInfo);
            
            // No IP address yet, wait a little longer and try again
            console.log('The VM has launched, but no IP address available yet...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          return reject(new Error('Failed to detect a valid IP address on the VM!'));
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
  //console.error(`Stub:find("${instance}")`);
  
  // Query the state of the instance, if it doesn't exist we will get an error
  // Practically the same as calling "lxc info <instance>"
  const proc = spawn('lxc', [
    'query',
    `/1.0/instances/${instance}/state`
  ]);

  // Get instance state information
  return new Promise((resolve, reject) => {
    //DEBUG:proc.on('spawn', () => console.log('$>', proc.spawnargs.join(' ').substr(0,300)+'\n...'));
    proc.on('error', (err) => reject(err));

    let outdata = [];

    // Collect returned data
    proc.stdout.on('data', (data) => outdata.push(data));

    // Collect errors
    let err = '';
    proc.stderr.on('data', (data) => err += data.toString());

    proc.on('exit', (code) => {
      let res = void 0;

      // If the instance doesn't exist find resolves to 'undefined'
      if (err) {
        if (err.includes('not found')) {
          return resolve(void 0);
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

// lxc query /1.0/instances - just a list of instance names
// lxc query /1.0/instances?recursion=1 - includes instance config, but no state
// lxc query /1.0/instances?recursion=2 - incl. config & state, same as: lxc list --format json
export async function list(opts = { detail: 'basic' }) {
  // Configure listing detail - opts.detail: no|basic|full

  let recursion = 1;
  if (opts?.detail == 'no') recursion = false;
  if (opts?.detail == 'full') recursion = 2;

  const proc = spawn('lxc', [
    'query',
    `/1.0/instances${recursion ? '?recursion='+recursion : ''}`
  ]);

  let outdata = [];

  return new Promise((resolve, reject) => {
    //proc.on('spawn', () => console.log('$>', proc.spawnargs.join(' ').substr(0,300)+'\n...'));
    proc.on('error', (err) => reject(err));

    proc.stdout.on('data', (data) => outdata.push(data));

    proc.on('exit', (err) => {
      if (err) return reject(err);

      let res;
      try {
        res = JSON.parse(Buffer.concat(outdata).toString());
      }
      catch(e) { return reject(e) }

      resolve(res);
    });
  });
}

// lxc exec live-waasabi-org -T --user 1000 --group 1000 --cwd /home/ubuntu -- whoami
// -T: no terminal
export async function exec(instance, command, commandInput) {
  console.error(`Stub:exec("${instance}","${command}" [${commandInput?.length||0} bytes...])`);
  return false;

  // const multipass = spawn('multipass', ['exec', instance, '--'].concat(command));

  // let outdata = [];

  // return new Promise((resolve, reject) => { 
  //   // Pass contents in on STDIN if requested
  //   if (commandInput) {
  //     //if (typeof commandInput == 'string') Readable.from([commandInput]).pipe(multipass.stdin);
  //     multipass.stdin.end(commandInput);
  //   }

  //   multipass.stdout.on('data', (data) => outdata.push(data));
  //   multipass.stderr.pipe(process.stderr);
  //   multipass.on('exit', (code) => {
  //     let res = Buffer.concat(outdata).toString();

  //     if (code) return reject('Failed multipass command: '+command.join(' '));
  //     try {
  //       res = JSON.parse(res);
  //     }
  //     catch(e) {
  //       console.log(res);
  //     }
  //     resolve(res);
  //   });
  // });
}
