import setup, * as Setup from '../../init/setup.js';
import { newPassword } from './setup.js';

// TODO: configuration editor
export function configure(settings = {}) {
  // Current configuration
  const config = setup.services.postgresql ?? defaults();

  // Override the default entries with the passed-in settings
  Object.assign(config, settings);

  // If there is no password defined yet, generate one randomly
  if (!config.password) {
    // Generate a new random password
    config.password = newPassword();
    console.log('New PostgreSQL password has been automatically generated.');
  }

  // Place the configuration back in the current setup & save
  setup.services.postgresql = config;

  Setup.persist();
}
