import setup, * as Setup from '../../init/setup.js';
import { defaults } from './setup.js';

export function configure(settings = {}) {
  // Current configuration
  const config = setup.services.peertube ?? defaults();

  // Override the default entries with the passed-in settings
  Object.assign(config, settings);

  // Place the configuration back in the current setup & save
  setup.services.peertube = config;

  Setup.persist();
}
