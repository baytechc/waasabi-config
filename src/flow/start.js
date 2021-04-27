import setup, * as Setup from '../init/setup.js';
import { layout, clear, loading } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Select } = enquirer;

import initCheck from './lib/init-check.js';


export default async function() {
  // Initialize setup
  Setup.reset();
  Setup.init();

  clear();
  layout(`
    # Welcome to the Waasabi installer!

    This interactive setup utility will guide you through setting up your very own customized video broadcast channel on your website.
    To learn more about the installation process, please refer to the documentation:

    https://waasabi.org/docs

    You can press \`Ctrl+C\` at any time to exit the configurator.
  `);

  // loading() returns when the list of configurations is available
  const configs = await loading('Checking existing configuration…', initCheck());

  const configOptions = configs.map(({ host, instance }) => {
    let message = host;

    if (instance) {
      message += `: local Ubuntu ${instance.release}`;
  
      if (instance.state == 'Running') {
        message += ` (${instance.state})`;
      }
    }
  
    return { name: host, message };
  });

  // "Create new configuration" is the defauly
  const newOption = { name: 'new', message: 'Create a new Waasabi configuration' };

  let selectedConfig = newOption.name;

  if (configOptions) {
    // Add 'create new' option
    configOptions.push(newOption);

    layout(`
      ## Existing configurations detected

      We have found existing Waasabi configurations on this device. You may continue by loading one of these settings, or create a new one.
    `);

    // Ask what the user is trying to achieve
    selectedConfig = await (new Select({
      name: 'select_config',
      message: 'Select configuration:',
      choices: configOptions
    })).run();
  }

  return selectedConfig;
}