import fs from 'fs';
import { randomBytes } from 'crypto';

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

// Config settings
export async function persist() {
  await fs.promises.writeFile(configfile(), JSON.stringify(setup, null, 2));

  console.log(
    `Configuration saved in: instance/${setup.host}`
  );
}

export function instancedir() {
  return 'instance/' + setup.host;
}

export function configfile() {
  return new URL(`../../${instancedir()}/setup.json`, import.meta.url);
}

export function instancename() {
  return 'waasabi-'+setup.host.replace(/\./g,'-')
}