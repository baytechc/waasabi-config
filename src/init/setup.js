import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

import { isEqual as _equal, cloneDeep as _clone } from 'lodash-es';

import { layout } from './content-formatter.js';
import { find as multipassFind } from './multipass.js';


const DEFAULT_STRAPI_VERSION = '3.4.6';



let setup = {};
export { setup as default };

// Reset the current setup
export function reset() {
  for (k in setup) {
    delete setup[k];
  }
}

// Initialize setup object
export function init() {
  // Random instance ID, used to expose the config logs from inside the instance
  setup.iid = randomBytes(32).toString('hex');

  // Default app name (e.g. home dir folder for Strapi install)
  setup.app = 'host';
  // Waasabi backend config file
  setup.app_config = `/home/waasabi/${setup.app}/.env`;

  // Default secret (e.g. for JWT encryption)
  setup.secret = randomBytes(32).toString('base64');

  // Strapi version to install
  setup.strapiVersion = `@${DEFAULT_STRAPI_VERSION || process.env.STRAPI_VERSION}`;

  // Instance-specific configuration
  setup.instance = {};
}

export async function list() {
  return await fs.promises.readdir(new URL(`../../instance/`, import.meta.url));
}

// Save configuration
export async function persist(filename = configfile()) {
  // TODO: ensure instance config directory exists
  try {
    await fs.promises.writeFile(filename, JSON.stringify(setup, null, 2));
  }
  catch(e) {
    // Ensure project dir exists
    const dir = dirname(filename instanceof URL ? fileURLToPath(filename) : filename);
    await fs.promises.mkdir(dir, { recursive: true });

    return persist(filename);
  }

  layout(`Configuration saved in: *${filename}*`);
}

// Load configuration
export async function restore(filename = configfile()) {
  const fileContents = await fs.promises.readFile(filename);
  const savedConfig = JSON.parse(fileContents.toString());

  Object.assign(setup, savedConfig);

  // Update local instance information
  await findinstance();

  layout(`Configuration restored from: *./instance/${setup.host}*`);
}


export function instancedir(host = setup.host) {
  // TODO: Should throw if the path is not valid (e.g. setup.host is unset)
  return 'instance/' + host;
}

export function configfile(host = setup.host) {
  // TODO: if instancedir() throws, should throw
  return new URL(`../../${instancedir(host)}/setup.json`, import.meta.url);
}

export function instancename(host = setup.host) {
  return 'waasabi-'+host.replace(/\./g,'-');
}

export async function findinstance(name = instancename()) {
  let instance;
  try {
    instance = await multipassFind(name);
  }
  catch(e) {
    console.error(e);
    throw e;
  }

  delete setup._instance;
  delete setup.instance;

  if (!instance) return;

  // Information returned from multipass find
  setup._instance = instance.info[name];

  setup.instance = {
    ip: setup._instance.ipv4[0],
    type: 'local',
  };

  return setup.instance;
}

// Makes a snapshot of the current setup and returns a function
// which can compare the snapshot with the current configuration
// and detect changes.
export function trackChanges() {
  const snapshot = _clone(setup);

  // The caller can use the .changed() method on the returned object
  // to check if the configuration has changed since the snapshot
  // was taken.
  return ({
    changed() {
      return _equal(setup, snapshot) === false;
    }
  });
}