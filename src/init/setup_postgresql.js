import setup, * as Setup from './setup.js';

import password from 'secure-random-password';
import { createHash } from 'crypto';

export function newPassword(opts = { length: 15 }) {
  return password.randomPassword(opts);
}

export function md5Password(password, username='waasabi') {
  if (password === undefined) throw new Error('Empty password supplied.');

  return createHash('md5').update(password + username).digest('hex');
}

export function configure(overrides = {}) {
  // Current configuration
  let config = setup.services?.postgresql.config ?? {};

  // Fill Default values for missing config entries, and apply any
  // manual override properties from the passed-in 'props'
  config = Object.assign({
    host: '127.0.0.1',
    port: '5432',
    name: 'waasabi',
    username: 'waasabi',
    password: undefined,
  }, config, overrides);

  // If there is no password defined yet, generate one randomly
  if (!config.password) {
    // Generate a new random password
    config.password = newPassword();
    console.log('New PostgreSQL password has been automatically generated.');
  }

  // Place the configuration back in the current setup & save
  setup.services.postgresql.config = config;

  Setup.persist();
}
