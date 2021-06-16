import generateLiveWebsiteConfig from './src/livepage_website_config.js';

import setup, * as Setup from './src/init/setup.js';

import { layout, clear, loading } from './src/init/content-formatter.js';
import start from './src/flow/start.js';
import { configNew } from './src/flow/config.js';
import actionsMenu from './src/flow/actions.js';

(async () => {
  let selectedConfig = await start();

  // No existing config, or creating a new
  if (selectedConfig === 'new') {

    await configNew();
  
  // Load an existing config
  } else {

    await Setup.restore(Setup.configfile(selectedConfig));

  }

  // Select action
  const mode = await actionsMenu();

  // Exit
  if (mode === 'exit') {
    return;
  }

})().catch(console.error);





function matrixBotBinary() {
  //curl -sSf https://github.com/baytechc/waasabi-matrix/releases/download/v0.1.0/ferris-bot-x86_64-pc-linux-gnu.tgz | tar -xz -C bin
  return 'curl -sSf https://waasabi.baytech.community/ferris-bot-x86_64-pc-linux-gnu.tgz | tar -xz -C bin';
}

