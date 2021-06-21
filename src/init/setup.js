import OS from 'os';
import fs from 'fs-extra';

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

import { isEqual as _equal, cloneDeep as _clone } from 'lodash-es';

import { layout } from './content-formatter.js';
import * as VM from './vm.js';


export const DEFAULT_STRAPI_VERSION = '3.6.0';
export const DEFAULT_UI_VERSION = '0.2.1';
export const DEFAULT_MATRIXBOT_VERSION = 'v0.2.1';

export const CONFIGDIR = join(OS.homedir(), '.waasabi');
export const INSTANCEDIR = join(CONFIGDIR, 'instance');

fs.ensureDirSync(INSTANCEDIR);


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
  setup.app_dir = `/home/waasabi/${setup.app}`;

  // Waasabi backend config file
  setup.app_config = setup.app_dir + `/.env`;

  // Default livepage name (the folder for the waasabi-live installation)
  setup.ui = 'live';
  setup.ui_dir = `/home/waasabi/${setup.ui}`;

  // Livepage configuration file
  setup.ui_config = setup.ui_dir + `/website.config.js`;

  // Default secret (e.g. for JWT encryption)
  setup.secret = randomBytes(32).toString('base64');

  // Strapi version to install
  setup.strapi_version = process.env.STRAPI_VERSION || DEFAULT_STRAPI_VERSION;

  // Livepage version to install
  setup.ui_version = process.env.UI_VERSION || DEFAULT_UI_VERSION;

  // Instance-specific configuration
  setup.instance = {};

  // Services to deploy
  setup.services = {};
}

export async function list(opts) {
  const { sort } = opts;

  let files = await fs.promises.readdir(INSTANCEDIR);
  if (!sort) return files;

  if (sort === 'newest') {
    const filetimes = files.map(
      f => [fs.statSync(join(INSTANCEDIR, f)).mtimeMs, f]
    );

    filetimes.sort((a,b) => b[0]-a[0]);

    return filetimes.map(ft => ft[1]);
  }
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
  return join(INSTANCEDIR, host);
}

export function configfile(host = setup.host) {
  // TODO: if instancedir() throws, should throw
  return join(instancedir(host), '/setup.json');
}

export function instancename(host = setup.host) {
  return 'waasabi-'+host.replace(/\./g,'-');
}

export async function findinstance(name = instancename()) {
  let instance;
  try {
    const providers = await VM.providers();
    if (providers) {
      instance = await VM.find(name);
    }
  }
  catch(e) {
    console.error(e);
    throw e;
  }

  delete setup._instance;
  delete setup.instance;

  if (!instance) return;

  setup.instance = {
    ip: VM.extract(instance, 'ipv4'),
    type: 'local',
  };

  return setup.instance;
}

// Makes a snapshot of the current setup and returns a function
// which can compare the snapshot with the current configuration
// and detect changes.
export function trackChanges() {
  const snapshot = _clone(setup);

  fs.writeFileSync(join(CONFIGDIR, 'changes.log'),
    JSON.stringify(snapshot,null,2)+'\n\n\n'+JSON.stringify(setup,null,2)
  );

  // The caller can use the .changed() method on the returned object
  // to check if the configuration has changed since the snapshot
  // was taken.
  return ({
    changed() {
      return _equal(setup, snapshot) === false;
    }
  });
}